import test from "node:test";
import assert from "node:assert/strict";
import {
  SaveStore,
  SAVE_KEY,
  SAVE_VERSION,
  sanitizeProfile,
  sanitizeQuickParty,
} from "../src/platform/save-store.js";
import { memoryStorage, session, clearEncounter, walkMap, quickParty } from './helpers.js';
import { GameSession } from "../src/domain/session.js";
import { createCardCombat } from "../src/domain/card-combat.js";
import { FixedClock } from "../src/engine/clock.js";
import { StateMachine } from "../src/engine/state-machine.js";
import { EventBus } from "../src/engine/events.js";
import { AssetStore } from "../src/platform/assets.js";
import { scheduleWindow } from "../src/platform/audio-schedule.js";
import { AudioDirector, resolveMusicMode } from "../src/platform/audio-director.js";
test("legacy score migration preserves records but grants no campaign progress", () => {
  const store = new SaveStore(
    memoryStorage({
      "blades-records": JSON.stringify({
        "zhao-yun": { best: 1200, wins: 4 },
        "lu-bu": { best: 900, wins: 1 },
      }),
    }),
  );
  const p = store.load();
  assert.equal(p.records["zhao-yun"].best, 1200);
  assert.equal(p.wallet, 0);
  assert(!p.unlockedHeroes.includes("lu-bu"));
  assert(store.save(p));
});
test("corrupt and future saves are not overwritten", () => {
  for (const value of ["{broken", JSON.stringify({ version: 99 })]) {
    const storage = memoryStorage({ [SAVE_KEY]: value }),
      store = new SaveStore(storage);
    const profile = store.load();
    assert(store.warning);
    assert(!store.save(profile));
    assert.equal(storage.getItem(SAVE_KEY), value);
  }
});
test("unavailable storage reports session-only persistence without crashing", () => {
  const store = new SaveStore(null);
  assert(!store.save(store.load()));
  assert.match(store.warning, /session only/);
});
test("settings survive reload, malformed numbers and checkpoint are sanitized", () => {
  const storage = memoryStorage(),
    game = session(storage);
  game.setSetting("sound", false);
  game.setSetting("musicVolume", 0.25);
  const again = session(storage);
  assert.equal(again.profile.settings.sound, false);
  assert.equal(again.profile.settings.musicVolume, 0.25);
  const p = sanitizeProfile({
    wallet: -20,
    ranks: { "iron-vessel": 999 },
    settings: { masterVolume: Infinity },
    checkpoint: { heroId: "evil", stage: "combat" },
  });
  assert.equal(p.wallet, 0);
  assert.equal(p.ranks["iron-vessel"], 3);
  assert.equal(p.settings.masterVolume, 0.75);
  assert.equal(p.checkpoint, null);
});
test("version 1 structured profiles migrate to current schema", () => {
  const store = new SaveStore(
    memoryStorage({
      [SAVE_KEY]: JSON.stringify({
        version: 1,
        wallet: 123,
        records: { "zhao-yun": { best: 55, wins: 1 } },
      }),
    }),
  );
  assert.equal(store.load().version, SAVE_VERSION);
  assert.equal(store.load().wallet, 123);
});
test("fixed simulation is identical at 30 and 120 render FPS", () => {
  function run(fps) {
    const game = new GameSession(new SaveStore(memoryStorage()), { combatFactory: createCardCombat, runId: () => "fps-parity" });
    game.start("zhao-yun", "quickplay", "jade-gate", quickParty("zhao-yun"));
    const clock = new FixedClock();
    for (let n = 0; n < fps * 2; n++)
      clock.advance(1 / fps, (dt) => game.step(dt, { dx: 1, dy: 0 }));
    // JSON drops the seeded rng functions, which never compare by reference.
    return JSON.stringify({
      p: { x: game.g.p.x, y: game.g.p.y },
      roam: game.g.roam,
    });
  }
  assert.deepEqual(JSON.parse(run(30)), JSON.parse(run(120)));
});
test("fixed clock bounds catch-up and safely resets inside scene transitions", () => {
  const clock = new FixedClock();
  let count = 0;
  clock.advance(10, () => count++);
  assert.equal(count, 8);
  clock.advance(0.1, () => clock.reset());
  assert(clock.accumulator >= 0);
});
test("state machine rejects impossible scene transitions", () => {
  const machine = new StateMachine();
  assert.throws(() => machine.transition("upgrade"), /Illegal/);
  machine.transition("exploring");
  machine.transition("paused");
  assert.equal(machine.value, "paused");
});
test("event subscriptions clean up without stale callbacks", () => {
  const bus = new EventBus();
  let count = 0;
  const off = bus.on("x", () => count++);
  bus.emit("x");
  off();
  bus.emit("x");
  assert.equal(count, 1);
});
test("asset errors reject explicitly and can be retried", async () => {
  let fail = true,
    calls = 0;
  const store = new AssetStore(() => ({
    set src(value) {
      calls++;
      queueMicrotask(() => (fail ? this.onerror() : this.onload()));
    },
  }));
  await assert.rejects(store.preload(["arena"]), /Could not load/);
  fail = false;
  await store.preload(["arena", "arena"]);
  assert(store.images.arena);
  assert.equal(calls, 2);
});
test("music scheduler drops muted/backlogged beats and bounds notes per tick", () => {
  const result = scheduleWindow(0, 3600, 0.12);
  assert(result.times.length <= 2);
  assert(result.times.every((time) => time >= 3600));
  assert.equal(scheduleWindow(0, 0, 0.0001).times.length, 8);
});
test("audio director maps scenes, persists mixer values and disposes subscriptions", () => {
  const bus = new EventBus(),
    calls = [];
  const backend = Object.fromEntries(
    [
      "setAudioSettings",
      "playSfx",
      "setMusicMode",
      "resumeAudio",
      "suspendAudio",
      "disposeAudio",
    ].map((key) => [key, (...args) => calls.push([key, ...args])]),
  );
  backend.audioStatus = () => ({ state: "running" });
  const director = new AudioDirector(bus, backend, { sound: false });
  bus.emit("state:changed", { current: "playing", boss: true });
  assert(calls.some((c) => c[0] === "setMusicMode" && c[1] === "boss"));
  const n = calls.length;
  director.unlock();
  assert.equal(calls.length, n);
  director.dispose();
  const after = calls.length;
  bus.emit("audio:sfx", { type: "hit" });
  assert.equal(calls.length, after);
});
test("last Quick Play party round-trips and a bad party does not unlock anyone", () => {
  const party = { lead: "nie-yinniang", followers: ["bao-sanniang", "yang-zhi"] };
  const storage = memoryStorage();
  const game = session(storage);
  const unlocks = [...game.profile.unlockedHeroes];
  game.start(party.lead, "quickplay", "jade-gate", party);
  game.menu();
  game.start("zhao-yun", "campaign");
  const again = session(storage);
  assert.deepEqual(again.profile.lastQuickParty, party);
  assert.deepEqual(again.profile.unlockedHeroes, unlocks);
  assert.deepEqual(again.profile.completedActs, []);
  assert.equal(again.profile.wallet, 0);
  assert.equal(again.profile.checkpoint.heroId, "zhao-yun");
  assert.equal(sanitizeQuickParty({ lead: "lu-bu", followers: ["zhao-yun"] }), null);
  assert.equal(sanitizeQuickParty({ lead: "lu-bu", followers: ["lu-bu", "zhao-yun"] }), null);
  assert.equal(sanitizeQuickParty({ lead: "no-such", followers: ["zhao-yun", "hu-sanniang"] }), null);
  const dirty = sanitizeProfile({
    wallet: 40,
    completedActs: ["jade-gate"],
    lastQuickParty: { lead: "lu-bu", followers: ["zhao-yun", "not-a-hero"] },
  });
  assert.equal(dirty.lastQuickParty, null);
  assert.equal(dirty.wallet, 40);
  assert.deepEqual(dirty.completedActs, ["jade-gate"]);
  assert.ok(!dirty.unlockedHeroes.includes("lu-bu"));
});
test("two tabs cannot silently overwrite a newer campaign save", () => {
  const storage = memoryStorage(),
    a = new SaveStore(storage),
    b = new SaveStore(storage);
  const pa = a.load(),
    pb = b.load();
  pa.wallet = 500;
  assert(a.save(pa));
  pb.wallet = 10;
  assert(!b.save(pb));
  assert.match(b.warning, /Another tab/);
  assert.equal(new SaveStore(storage).load().wallet, 500);
});

test("audio director resolves all story-state transitions to procedural audio modes", () => {
  const bus = new EventBus(),
    modes = [];
  const backend = Object.fromEntries(
    [
      "setAudioSettings",
      "playSfx",
      "setMusicMode",
      "resumeAudio",
      "suspendAudio",
      "disposeAudio",
    ].map((key) => [
      key,
      (...args) => {
        if (key === "setMusicMode") modes.push(args[0]);
      },
    ]),
  );
  backend.audioStatus = () => ({ state: "running" });
  const director = new AudioDirector(bus, backend, { sound: true });

  // 1. Menu and Waystation -> select
  bus.emit("state:changed", { current: "menu" });
  assert.equal(modes.at(-1), "select");
  bus.emit("state:changed", { current: "waystation" });
  assert.equal(modes.at(-1), "select");

  // 2. Story arrival dialogue -> select
  bus.emit("state:changed", {
    current: "dialogue",
    dialogueKey: "arrival",
    stage: "arrival",
  });
  assert.equal(modes.at(-1), "select");

  // 3. Regular combat battle (non-boss) -> battle
  bus.emit("state:changed", {
    current: "playing",
    boss: false,
    stage: "battle",
  });
  assert.equal(modes.at(-1), "battle");

  // 4. Combat pause -> paused
  bus.emit("state:changed", { current: "paused", stage: "paused" });
  assert.equal(modes.at(-1), "paused");

  // 5. Resume battle -> battle
  bus.emit("state:changed", {
    previous: "paused",
    current: "playing",
    boss: false,
  });
  assert.equal(modes.at(-1), "battle");

  // 6. Encounter clear discipline upgrade -> upgrade
  bus.emit("state:changed", { current: "upgrade", stage: "upgrade" });
  assert.equal(modes.at(-1), "upgrade");

  // 7. Boss intro dialogue -> boss
  bus.emit("state:changed", {
    current: "dialogue",
    dialogueKey: "warden-intro",
    stage: "warden-intro",
    boss: true,
  });
  assert.equal(modes.at(-1), "boss");

  // 8. Boss duel combat -> boss
  bus.emit("state:changed", {
    current: "playing",
    boss: true,
    stage: "boss",
  });
  assert.equal(modes.at(-1), "boss");

  // 9. Pause during boss duel -> paused
  bus.emit("state:changed", { current: "paused", boss: true });
  assert.equal(modes.at(-1), "paused");

  // 10. Resume boss duel -> boss
  bus.emit("state:changed", {
    previous: "paused",
    current: "playing",
    boss: true,
  });
  assert.equal(modes.at(-1), "boss");

  // 11. Boss defeat / victory resolution dialogue (warden-fall) -> victory
  bus.emit("state:changed", {
    current: "dialogue",
    dialogueKey: "warden-fall",
    stage: "warden-fall",
  });
  assert.equal(modes.at(-1), "victory");

  // 12. Quick-play victory -> victory
  bus.emit("state:changed", { current: "victory", stage: "victory" });
  assert.equal(modes.at(-1), "victory");

  // 13. Combat defeat -> defeat
  bus.emit("state:changed", { current: "defeat", stage: "defeat" });
  assert.equal(modes.at(-1), "defeat");

  // 14. Static and instance resolver methods
  assert.equal(AudioDirector.resolveMusicMode({ current: "menu" }), "select");
  assert.equal(director.resolveMusicMode({ current: "playing", boss: true }), "boss");
  assert.equal(resolveMusicMode({ current: "dialogue", dialogueKey: "warden-fall" }), "victory");

  // Act II dialogue modes
  assert.equal(resolveMusicMode({ current: "dialogue", dialogueKey: "bamboo-arrival" }), "select");
  assert.equal(resolveMusicMode({ current: "dialogue", dialogueKey: "heron-intro" }), "boss");
  assert.equal(resolveMusicMode({ current: "dialogue", dialogueKey: "heron-fall" }), "victory");

  director.dispose();
});

test("full campaign story progression drives AudioDirector transitions seamlessly", () => {
  const modes = [],
    sfx = [];
  const backend = {
    setAudioSettings: () => {},
    playSfx: (type, param) => sfx.push({ type, param }),
    setMusicMode: (m) => modes.push(m),
    resumeAudio: () => {},
    suspendAudio: () => {},
    disposeAudio: () => {},
    audioStatus: () => ({ state: "running" }),
  };
  const storage = memoryStorage();
  const game = session(storage);
  const director = new AudioDirector(game.bus, backend, { sound: true });

  // Start campaign: arrival dialogue
  game.start("zhao-yun", "campaign");
  assert.equal(modes.at(-1), "select");

  // Advance dialogue to encounter 1 (patrol)
  game.advanceDialogue(true);
  assert.equal(modes.at(-1), "battle");

  // Clear encounter 1: discipline upgrade
  clearEncounter(game);
  assert.equal(modes.at(-1), "upgrade");
  assert(sfx.some((s) => s.type === "upgrade"));

  // Choose discipline: the pass forks (map scene)
  game.chooseDiscipline("power");
  assert.equal(modes.at(-1), "select");
  walkMap(game, (nodes) => nodes.find((node) => node.startsWith("ambush:")));
  assert.equal(modes.at(-1), "battle");

  // Clear encounter 2: discipline upgrade
  clearEncounter(game);
  assert.equal(modes.at(-1), "upgrade");

  // Choose discipline: row 2 map, march into the crossfire duel
  game.chooseDiscipline("vitality");
  assert.equal(modes.at(-1), "select");
  walkMap(game, (nodes) => nodes.find((node) => node.startsWith("duel:")));
  assert.equal(modes.at(-1), "battle");

  // Clear encounter 3, then the final discipline auto-marches to the boss intro
  clearEncounter(game);
  assert.equal(modes.at(-1), "upgrade");
  game.chooseDiscipline("vitality");
  assert.equal(modes.at(-1), "boss");

  // Advance dialogue into boss combat
  game.advanceDialogue(true);
  assert.equal(modes.at(-1), "boss");

  // Pause and resume boss combat
  game.pause();
  assert.equal(modes.at(-1), "paused");
  game.resume();
  assert.equal(modes.at(-1), "boss");

  // Clear boss encounter (victory): warden-fall dialogue
  clearEncounter(game);
  assert.equal(modes.at(-1), "victory");
  assert(sfx.some((s) => s.type === "victory"));

  // Advance warden-fall dialogue into waystation tea house
  game.advanceDialogue(true);
  assert.equal(modes.at(-1), "select");
  assert.equal(game.mode, "waystation");

  director.dispose();
});
