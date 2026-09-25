import test from "node:test";
import assert from "node:assert/strict";
import {
  session,
  memoryStorage,
  clearEncounter,
  completeCampaign,
} from "./helpers.js";
import { SaveStore, SAVE_KEY } from "../src/platform/save-store.js";
import { HEROES } from "../src/content/heroes.js";
import { ACTS, BOSSES, CULTIVATIONS } from "../src/content/campaign.js";
import { UPGRADES } from "../src/content/disciplines.js";
import { dialogueFor } from "../src/content/dialogue.js";
import { validateContent } from "../src/content/validate.js";
import { awardResult } from "../src/domain/progression.js";
import { resolveMusicMode } from "../src/platform/audio-director.js";
import { DUEL_ROSTERS, DUEL_ENEMIES } from "../src/content/duels.js";
import { createRoam } from "../src/domain/roam.js";

test("campaign validates and incomplete future acts cannot be launched", () => {
  assert(
    validateContent({
      heroes: HEROES,
      acts: ACTS,
      bosses: BOSSES,
      cultivations: CULTIVATIONS,
      disciplines: UPGRADES,
    }),
  );
  const game = session();
  assert.throws(
    () => game.start("zhao-yun", "campaign", "bamboo-crossing"),
    /not available/,
  );
});
test("Lü Bu is locked in new campaigns but playable in quick play", () => {
  const game = session();
  assert.throws(() => game.start("lu-bu", "campaign"), /Act III/);
  game.start("lu-bu", "quickplay");
  assert.equal(game.mode, "playing");
});
test("campaign includes arrival, two disciplines, boss dialogue, resolution and tea house", () => {
  const game = session();
  game.start("zhao-yun", "campaign");
  assert.equal(game.mode, "dialogue");
  game.advanceDialogue();
  assert.equal(game.mode, "dialogue");
  game.advanceDialogue();
  assert.equal(game.mode, "playing");
  clearEncounter(game);
  assert.equal(game.mode, "upgrade");
  game.chooseDiscipline("power");
  assert.equal(game.g.p.power, 1.25);
  clearEncounter(game);
  game.chooseDiscipline("vitality");
  assert.equal(game.mode, "dialogue");
  assert.equal(game.dialogue.key, "warden-intro");
  assert.equal(game.g.p.maxHp, 150);
  game.advanceDialogue(true);
  clearEncounter(game);
  assert.equal(game.dialogue.key, "warden-fall");
  game.advanceDialogue(true);
  assert.equal(game.mode, "waystation");
  assert(game.profile.wallet > 0);
  assert(game.profile.completedActs.includes("jade-gate"));
  assert(!game.profile.unlockedHeroes.includes("lu-bu"));
});
test("checkpoint resumes encounter boundary and preserves run upgrades", () => {
  const storage = memoryStorage(),
    game = session(storage);
  game.start("zhao-yun", "campaign");
  game.advanceDialogue(true);
  clearEncounter(game);
  game.chooseDiscipline("power");
  game.g.p.hp = 3;
  game.g.score = 99999;
  const restored = session(storage);
  assert(restored.continueCheckpoint());
  assert.equal(restored.mode, "playing");
  assert.equal(restored.g.encounterIndex, 1);
  assert.equal(restored.g.p.power, 1.25);
  assert.equal(restored.g.p.hp, 120);
  assert.notEqual(restored.g.score, 99999);
});
test("reload during discipline choice remains a choice, not a combat restart", () => {
  const storage = memoryStorage(),
    game = session(storage);
  game.start("zhao-yun", "campaign");
  game.advanceDialogue(true);
  clearEncounter(game);
  const restored = session(storage);
  restored.continueCheckpoint();
  assert.equal(restored.mode, "upgrade");
  restored.chooseDiscipline("flow");
  assert.equal(restored.g.p.cost, 30);
  assert.equal(restored.g.p.flowBonus, 8);
});
test("reloading tea house does not grant duplicate rewards", () => {
  const storage = memoryStorage(),
    game = session(storage);
  completeCampaign(game);
  const wallet = game.profile.wallet;
  const restored = session(storage);
  restored.continueCheckpoint();
  assert.equal(restored.mode, "waystation");
  assert.equal(restored.profile.wallet, wallet);
  assert.equal(awardResult(restored.profile, restored.g, true, ACTS[0]), false);
});
test("a failed attempt does not prevent a continued checkpoint from earning victory rewards", () => {
  const storage = memoryStorage(),
    game = session(storage);
  game.start("zhao-yun", "campaign");
  game.advanceDialogue(true);
  game.combat.hurt(500);
  game.step(1 / 60, {});
  const restored = session(storage);
  restored.continueCheckpoint();
  clearEncounter(restored);
  restored.chooseDiscipline("power");
  clearEncounter(restored);
  restored.chooseDiscipline("power");
  restored.advanceDialogue(true);
  clearEncounter(restored);
  assert(restored.profile.wallet > 0);
});
test("cultivation charges once, cannot overspend, persists, and affects campaign only", () => {
  const storage = memoryStorage(),
    game = session(storage);
  completeCampaign(game);
  game.profile.wallet = 1000;
  assert(game.buy("iron-vessel"));
  assert.equal(game.profile.wallet, 700);
  assert.equal(game.profile.ranks["iron-vessel"], 1);
  game.profile.wallet = 0;
  assert(!game.buy("iron-vessel"));
  game.save();
  game.menu();
  game.start("zhao-yun", "campaign");
  assert.equal(game.g.p.maxHp, 135);
  game.menu();
  game.start("zhao-yun", "quickplay");
  assert.equal(game.g.p.maxHp, 120);
  assert.equal(session(storage).profile.ranks["iron-vessel"], 1);
});
test("quick-play victory records scores without changing campaign wallet/checkpoint/unlocks", () => {
  const game = session();
  game.start("lu-bu", "quickplay");
  for (let i = 0; i < 3; i++) {
    clearEncounter(game);
    if (i < 2) game.chooseDiscipline("power");
  }
  assert.equal(game.mode, "victory");
  assert.equal(game.profile.wallet, 0);
  assert.equal(game.profile.records["lu-bu"].wins, 1);
  assert.equal(game.profile.checkpoint, null);
  assert(!game.profile.unlockedHeroes.includes("lu-bu"));
});
test("Act III completion is the declarative campaign unlock boundary", () => {
  const game = session();
  game.start("zhao-yun", "quickplay");
  game.g.runMode = "campaign";
  awardResult(game.profile, game.g, true, ACTS[2]);
  game.save();
  assert(game.profile.unlockedHeroes.includes("lu-bu"));
});
test("invalid content references fail before launching", () => {
  const acts = structuredClone(ACTS);
  acts[0].next = "missing";
  assert.throws(
    () =>
      validateContent({
        heroes: HEROES,
        acts,
        bosses: BOSSES,
        cultivations: CULTIVATIONS,
        disciplines: UPGRADES,
      }),
    /Broken campaign/,
  );
});

test("Act II campaign scaffolding: identity, encounter stubs, boss metadata, and availability gates", () => {
  const act2 = ACTS.find((a) => a.id === "bamboo-crossing");
  assert(act2, "Act II must be registered in ACTS");
  assert.equal(act2.number, 2);
  assert.equal(act2.name, "Whispering Bamboo & the River Crossing");
  assert.equal(act2.cn, "幽篁夜渡");
  assert.equal(act2.available, false, "Act II must be gated (available: false)");
  assert.equal(act2.bossId, "night-heron");
  assert.deepEqual(act2.hazards, ["shallows", "razor-wire"]);

  // Encounter roster stubs
  assert.equal(act2.encounters.length, 3, "Act II must have 3 encounter stubs");
  assert(act2.encounters.every((e) => e.enemies.length > 0));
  assert(act2.encounters.some((e) => e.bossId === "night-heron"));

  // Night Heron boss design metadata
  const boss = BOSSES["night-heron"];
  assert(boss, "Night Heron must be in BOSSES");
  assert(!boss.planned, "Night Heron card boss is fully wired, planned flag cleared");
  assert.equal(boss.name, "The Night Heron");
  assert.equal(boss.cn, "夜鷺娘子");
  assert(boss.phases && boss.phases.length >= 2, "Boss design metadata must include phases");
  assert(boss.mechanics.includes("sonic-rings"));
  assert(boss.mechanics.includes("razor-wire"));

  // Validation passes with available: false
  assert(
    validateContent({
      heroes: HEROES,
      acts: ACTS,
      bosses: BOSSES,
      cultivations: CULTIVATIONS,
      disciplines: UPGRADES,
    }),
  );

  // Content validation fails if prematurely marked available without playable boss implementation
  const unbuiltActs = structuredClone(ACTS);
  unbuiltActs[1].available = true;
  assert.throws(
    () =>
      validateContent({
        heroes: HEROES,
        acts: unbuiltActs,
        bosses: BOSSES,
        cultivations: CULTIVATIONS,
        disciplines: UPGRADES,
      }),
    /Incomplete playable act/,
  );

  // Domain gate: cannot launch unbuilt act or boss
  const game = session();
  assert.throws(
    () => game.start("zhao-yun", "campaign", "bamboo-crossing"),
    /not available/,
  );
});

test("Act II dialogue pack: arrival, Night Heron exchanges for all heroes, and resolution vignettes", () => {
  for (const hero of HEROES) {
    // Arrival vignette
    const arrival = dialogueFor("bamboo-arrival", hero);
    assert.equal(arrival.length, 2);
    assert.equal(arrival[0].speaker, "Whispering Bamboo");
    assert.match(arrival[0].text, /bamboo/i);
    assert.equal(arrival[1].speaker, hero.name);

    // Night Heron boss confrontation exchange (canonical + legacy alias)
    const canonicalIntro = dialogueFor("night-heron-intro", hero);
    const legacyIntro = dialogueFor("heron-intro", hero);
    assert.deepEqual(canonicalIntro, legacyIntro);
    assert.equal(canonicalIntro.length, 2);
    assert.equal(canonicalIntro[0].speaker, "The Night Heron");
    assert.equal(canonicalIntro[1].speaker, hero.name);
    assert(canonicalIntro[0].text.length > 10);
    assert(canonicalIntro[1].text.length > 10);

    // Night Heron defeat / resolution vignette (canonical + legacy alias)
    const canonicalResolution = dialogueFor("night-heron-fall", hero);
    const legacyResolution = dialogueFor("heron-fall", hero);
    assert.deepEqual(canonicalResolution, legacyResolution);
    assert.equal(canonicalResolution.length, 2);
    assert.equal(canonicalResolution[0].speaker, "The Night Heron");
    assert.match(canonicalResolution[0].text, /strings snap/i);
    assert.equal(canonicalResolution[1].speaker, "The road ahead");
  }

  // Audio director resolves Act II dialogue states (canonical and legacy)
  assert.equal(resolveMusicMode({ current: "dialogue", dialogueKey: "bamboo-arrival" }), "select");
  assert.equal(resolveMusicMode({ current: "dialogue", dialogueKey: "night-heron-intro" }), "boss");
  assert.equal(resolveMusicMode({ current: "dialogue", dialogueKey: "night-heron-fall" }), "victory");
  assert.equal(resolveMusicMode({ current: "dialogue", dialogueKey: "heron-intro" }), "boss");
  assert.equal(resolveMusicMode({ current: "dialogue", dialogueKey: "heron-fall" }), "victory");
});

test("Night Heron checkpoint keys: canonical round-trip and legacy alias support without unlocking Act II", () => {
  const act2 = ACTS.find((a) => a.id === "bamboo-crossing");
  assert.equal(act2.available, false, "Act II must remain gated");

  // Verify runtime derived keys
  assert.equal(`${act2.bossId}-intro`, "night-heron-intro");
  assert.equal(`${act2.bossId}-fall`, "night-heron-fall");

  // Round-trip checkpoint restoration with canonical night-heron-intro
  const storageCanonical = memoryStorage({
    [SAVE_KEY]: JSON.stringify({
      version: 2,
      wallet: 50,
      records: {},
      ranks: {},
      unlockedHeroes: ["zhao-yun"],
      completedActs: [],
      completedRuns: [],
      settings: { sound: true, music: true, motion: true },
      checkpoint: {
        stage: "night-heron-intro",
        runId: "test-run-canonical",
        heroId: "zhao-yun",
        actId: "jade-gate",
        encounterIndex: 2,
        player: { hp: 120, maxHp: 120, flow: 50, power: 1, flowBonus: 0, cost: 40, kills: 5, damageTaken: 0 },
        score: 100,
        time: 60,
        totalKills: 5,
      },
    }),
  });
  const gameCanonical = session(storageCanonical);
  assert(gameCanonical.continueCheckpoint());
  assert.equal(gameCanonical.mode, "dialogue");
  assert.equal(gameCanonical.dialogue.key, "night-heron-intro");
  assert.equal(gameCanonical.dialogue.lines[0].speaker, "The Night Heron");

  // Legacy alias checkpoint restoration with heron-intro
  const storageLegacy = memoryStorage({
    [SAVE_KEY]: JSON.stringify({
      version: 2,
      wallet: 50,
      records: {},
      ranks: {},
      unlockedHeroes: ["zhao-yun"],
      completedActs: [],
      completedRuns: [],
      settings: { sound: true, music: true, motion: true },
      checkpoint: {
        stage: "heron-intro",
        runId: "test-run-legacy",
        heroId: "zhao-yun",
        actId: "jade-gate",
        encounterIndex: 2,
        player: { hp: 120, maxHp: 120, flow: 50, power: 1, flowBonus: 0, cost: 40, kills: 5, damageTaken: 0 },
        score: 100,
        time: 60,
        totalKills: 5,
      },
    }),
  });
  const gameLegacy = session(storageLegacy);
  assert(gameLegacy.continueCheckpoint());
  assert.equal(gameLegacy.mode, "dialogue");
  assert.equal(gameLegacy.dialogue.key, "heron-intro");
  assert.equal(gameLegacy.dialogue.lines[0].speaker, "The Night Heron");

  // Round-trip checkpoint restoration with canonical night-heron-fall
  const storageFall = memoryStorage({
    [SAVE_KEY]: JSON.stringify({
      version: 2,
      wallet: 50,
      records: {},
      ranks: {},
      unlockedHeroes: ["zhao-yun"],
      completedActs: [],
      completedRuns: [],
      settings: { sound: true, music: true, motion: true },
      checkpoint: {
        stage: "night-heron-fall",
        runId: "test-run-fall",
        heroId: "zhao-yun",
        actId: "jade-gate",
        encounterIndex: 2,
        player: { hp: 120, maxHp: 120, flow: 50, power: 1, flowBonus: 0, cost: 40, kills: 5, damageTaken: 0 },
        score: 100,
        time: 60,
        totalKills: 5,
      },
    }),
  });
  const gameFall = session(storageFall);
  assert(gameFall.continueCheckpoint());
  assert.equal(gameFall.mode, "dialogue");
  assert.equal(gameFall.dialogue.key, "night-heron-fall");
  // Completing the dialogue transitions to waystation
  gameFall.advanceDialogue(true);
  assert.equal(gameFall.mode, "waystation");

  // Legacy alias fall restoration with heron-fall
  const storageLegacyFall = memoryStorage({
    [SAVE_KEY]: JSON.stringify({
      version: 2,
      wallet: 50,
      records: {},
      ranks: {},
      unlockedHeroes: ["zhao-yun"],
      completedActs: [],
      completedRuns: [],
      settings: { sound: true, music: true, motion: true },
      checkpoint: {
        stage: "heron-fall",
        runId: "test-run-legacy-fall",
        heroId: "zhao-yun",
        actId: "jade-gate",
        encounterIndex: 2,
        player: { hp: 120, maxHp: 120, flow: 50, power: 1, flowBonus: 0, cost: 40, kills: 5, damageTaken: 0 },
        score: 100,
        time: 60,
        totalKills: 5,
      },
    }),
  });
  const gameLegacyFall = session(storageLegacyFall);
  assert(gameLegacyFall.continueCheckpoint());
  assert.equal(gameLegacyFall.mode, "dialogue");
  assert.equal(gameLegacyFall.dialogue.key, "heron-fall");
  gameLegacyFall.advanceDialogue(true);
  assert.equal(gameLegacyFall.mode, "waystation");
});

test("Act II card duel content: DUEL_ROSTERS, DUEL_ENEMIES behind the gate and roam creation", () => {
  const act2 = ACTS.find((a) => a.id === "bamboo-crossing");
  assert.equal(act2.available, false, "Act II bamboo-crossing must remain available: false");

  // Roster registration for all Act II encounter IDs
  const act2EncounterIds = ["bamboo-ambush", "river-skiff", "night-heron"];
  for (const encId of act2EncounterIds) {
    assert(DUEL_ROSTERS[encId], `DUEL_ROSTERS must contain encounter ${encId}`);
    assert(DUEL_ROSTERS[encId].length > 0, `DUEL_ROSTERS[${encId}] must have enemies`);
  }

  // DUEL_ENEMIES stats for Act II rivals
  assert(DUEL_ENEMIES["shadow-assassin"], "DUEL_ENEMIES must define shadow assassin");
  assert.equal(DUEL_ENEMIES["shadow-assassin"].name, "Shadow Assassin");
  assert(DUEL_ENEMIES["shadow-assassin"].hp > 0);
  assert(DUEL_ENEMIES["shadow-assassin"].moves.length >= 2);

  assert(DUEL_ENEMIES["skiff-archer"], "DUEL_ENEMIES must define skiff archer");
  assert.equal(DUEL_ENEMIES["skiff-archer"].name, "Skiff Archer");
  assert(DUEL_ENEMIES["skiff-archer"].hp > 0);
  assert(DUEL_ENEMIES["skiff-archer"].moves.length >= 2);

  assert(DUEL_ENEMIES["night-heron"], "DUEL_ENEMIES must define Night Heron");
  assert.equal(DUEL_ENEMIES["night-heron"].name, "The Night Heron");
  assert.equal(DUEL_ENEMIES["night-heron"].boss, true);
  assert(DUEL_ENEMIES["night-heron"].hp > 0);
  assert(DUEL_ENEMIES["night-heron"].moves.length >= 3);

  // Night Heron planned flag is cleared so later unlock won't throw
  const boss = BOSSES["night-heron"];
  assert(!boss.planned, "Night Heron boss planned flag must be cleared once card boss is fully wired");
  assert(boss.phases && boss.phases.length >= 2);

  // Roam creation for all three Act II encounter IDs
  for (const encId of act2EncounterIds) {
    const encounter = act2.encounters.find((e) => e.id === encId);
    assert(encounter, `Act II must define encounter ${encId}`);

    const roam = createRoam(encounter, HEROES[0]);
    assert(roam, `createRoam must succeed for ${encId}`);
    assert.equal(roam.encounterId, encId);
    assert(roam.rivals.length > 0, `Roam for ${encId} must instantiate rivals`);
    for (const rival of roam.rivals) {
      assert(rival.hp > 0);
      assert(rival.name);
      assert(rival.originX > 0);
      assert(rival.originY > 0);
    }
  }

  // Hazards properly set shallows on bamboo-ambush and river-skiff
  const ambushRoam = createRoam(act2.encounters[0], "zhao-yun");
  assert.equal(ambushRoam.shallows, true);
  const skiffRoam = createRoam(act2.encounters[1], "zhao-yun");
  assert.equal(skiffRoam.shallows, true);
});
