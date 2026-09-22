import test from "node:test";
import assert from "node:assert/strict";
import {
  SaveStore,
  SAVE_KEY,
  SAVE_VERSION,
  sanitizeProfile,
} from "../src/platform/save-store.js";
import { memoryStorage, session } from "./helpers.js";
import { FixedClock } from "../src/engine/clock.js";
import { StateMachine } from "../src/engine/state-machine.js";
import { EventBus } from "../src/engine/events.js";
import { AssetStore } from "../src/platform/assets.js";
import { scheduleWindow } from "../src/platform/audio-schedule.js";
import { AudioDirector } from "../src/platform/audio-director.js";
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
    const game = session();
    game.start("zhao-yun", "quickplay");
    const clock = new FixedClock();
    for (let n = 0; n < fps * 2; n++)
      clock.advance(1 / fps, (dt) =>
        game.step(dt, { keys: new Set(["KeyD"]), actions: [] }),
      );
    return { p: game.g.p, enemies: game.g.enemies, time: game.g.time };
  }
  assert.deepEqual(run(30), run(120));
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
  machine.transition("playing");
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
