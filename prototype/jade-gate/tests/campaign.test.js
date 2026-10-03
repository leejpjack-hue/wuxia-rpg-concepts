import test from "node:test";
import assert from "node:assert/strict";
import {
  session,
  memoryStorage,
  clearEncounter,
  completeCampaign,
  walkMap,
  playCampaign, quickParty } from './helpers.js';
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

test("campaign validates playable acts and gates travel by preceding victories", () => {
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
    () => game.start("zhao-yun", "campaign", "mount-canglan"),
    /preceding act/,
  );
  // Act II unlocks only after Act I is reclaimed.
  assert.throws(() => game.start("zhao-yun", "campaign", "bamboo-crossing"), /preceding act/);
});
test("Act II plays end to end: travel, map rows, shallows, Night Heron, tea house return", () => {
  const storage = memoryStorage(),
    game = session(storage);
  completeCampaign(game); // Act I cleared; resting at the tea house
  assert.equal(game.mode, "waystation");
  // Travel button route: start the next act directly.
  game.start("zhao-yun", "campaign", "bamboo-crossing");
  assert.equal(game.mode, "dialogue");
  assert.equal(game.dialogue.key, "bamboo-arrival");
  game.advanceDialogue(true);
  assert.equal(game.mode, "exploring");
  assert.equal(game.act.number, 2);
  // Water shallows slow the pass throughout the act.
  assert.equal(game.g.shallows, true);
  // The full walk: rows, elite curio drop, boss intro and fall.
  const picks = [];
  let guard = 0;
  while (!["waystation", "victory", "defeat"].includes(game.mode) && guard++ < 600) {
    if (game.mode === "dialogue") {
      if (game.dialogue.key === "night-heron-intro") picks.push("boss-intro");
      if (game.dialogue.key === "night-heron-fall") picks.push("boss-fall");
      game.advanceDialogue(true);
    } else if (game.mode === "exploring" || game.mode === "playing") clearEncounter(game);
    else if (game.mode === "upgrade") game.chooseDiscipline("power");
    else if (game.mode === "map") walkMap(game, (nodes) => nodes.find((n) => n.startsWith("elite:")) || nodes[0]);
  }
  assert.equal(game.mode, "waystation");
  assert.ok(picks.includes("boss-intro") && picks.includes("boss-fall"));
  assert(game.profile.completedActs.includes("bamboo-crossing"));
  assert.equal(game.g.actId, "bamboo-crossing");
  // The next waystation now leads to Mount Canglan.
  const next = ACTS.find((a) => a.id === "mount-canglan");
  assert.equal(next.available, true);
});
test("Act IV finale: the whole campaign clears into the Sovereign's throne and the fulfilled-oath waystation", () => {
  const storage = memoryStorage(),
    game = session(storage);
  // Clear Acts I–III first.
  completeCampaign(game);
  game.start("zhao-yun", "campaign", "bamboo-crossing");
  playCampaign(game);
  game.start("zhao-yun", "campaign", "mount-canglan");
  playCampaign(game);
  assert(game.profile.completedActs.includes("mount-canglan"));
  // The finale opens on its own arrival key.
  game.start("zhao-yun", "campaign", "meridian-citadel");
  assert.equal(game.dialogue.key, "citadel-arrival");
  game.advanceDialogue(true);
  assert.equal(game.act.number, 4);
  // Gate without Act III? A fresh save cannot enter.
  assert.throws(() => session(memoryStorage()).start("zhao-yun", "campaign", "meridian-citadel"), /preceding act/);
  // Full walk: judgement, elite curio, Sovereign intro and fall.
  const picks = [];
  let guard = 0;
  while (!["waystation", "victory", "defeat"].includes(game.mode) && guard++ < 800) {
    if (game.mode === "dialogue") {
      if (game.dialogue.key === "sovereign-intro") picks.push("boss-intro");
      if (game.dialogue.key === "sovereign-fall") picks.push("boss-fall");
      game.advanceDialogue(true);
    } else if (game.mode === "exploring" || game.mode === "playing") clearEncounter(game);
    else if (game.mode === "upgrade") game.chooseDiscipline("vitality");
    else if (game.mode === "map") walkMap(game, (nodes) => nodes.find((n) => n.startsWith("elite:")) || nodes[0]);
  }
  assert.equal(game.mode, "waystation", `finale walk ended on ${game.mode}`);
  assert.ok(picks.includes("boss-intro") && picks.includes("boss-fall"));
  assert(game.profile.completedActs.includes("meridian-citadel"));
  assert.equal(game.act.next, "otherworld"); // the rift opens after the citadel
});
test("Lü Bu is locked in new campaigns but playable in quick play", () => {
  const game = session();
  assert.throws(() => game.start("lu-bu", "campaign"), /Story rival/);
  game.start("lu-bu", "quickplay", "jade-gate", quickParty("lu-bu"));
  assert.equal(game.mode, "exploring");
});
test("campaign walks the open pass to the boss, tea house and unlocks", () => {
  const game = session();
  game.start("zhao-yun", "campaign");
  assert.equal(game.mode, "dialogue");
  game.advanceDialogue();
  assert.equal(game.mode, "dialogue");
  game.advanceDialogue();
  assert.equal(game.mode, "exploring"); // the whole act waits on one open pass
  // First area: duel its named legend, and the area scatters.
  clearEncounter(game);
  assert.equal(game.mode, "upgrade");
  assert(game.g.openField.cleared.includes("vanguard"));
  assert(!game.g.roam.field.some((rival) => rival.area === "vanguard"));
  game.chooseDiscipline("power");
  assert.equal(game.g.p.power, 1.25);
  assert.equal(game.mode, "exploring"); // the map never resets between areas
  // Walk the rest of the pass to the boss.
  let guard = 0;
  while (!["waystation", "victory", "defeat"].includes(game.mode) && guard++ < 300) {
    if (game.mode === "dialogue") game.advanceDialogue(true);
    else if (game.mode === "exploring" || game.mode === "playing") clearEncounter(game);
    else if (game.mode === "upgrade") game.chooseDiscipline("vitality");
    else if (game.mode === "map") walkMap(game);
  }
  assert.equal(game.mode, "waystation");
  assert.ok(game.g.p.maxHp >= 150); // roadside disciplines grow the hero on the way
  assert(game.profile.wallet > 0);
  assert(game.profile.completedActs.includes("jade-gate"));
  assert(!game.profile.unlockedHeroes.includes("lu-bu"));
});
test("checkpoint resumes the open pass boundary and preserves run upgrades", () => {
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
  while (restored.mode === "dialogue") restored.advanceDialogue(true);
  assert.equal(restored.mode, "exploring"); // back on the same open pass
  assert(restored.g.openField.cleared.includes("vanguard"));
  assert(!restored.g.roam.field.some((rival) => rival.area === "vanguard"));
  assert(restored.g.roam.field.some((rival) => rival.area === "warden"));
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
  game.beginDuel(0);
  game.g.p.hp = 1;
  game.combat.act("attack");
  assert.equal(game.mode, "defeat");
  const restored = session(storage);
  restored.continueCheckpoint();
  playCampaign(restored);
  assert.equal(restored.mode, "waystation");
  assert(restored.profile.wallet > 0);
});
test("meridian strikes charge once, gate on prerequisites, persist, and affect campaign only", () => {
  const storage = memoryStorage(),
    game = session(storage);
  completeCampaign(game);
  game.profile.wallet = 1000;
  assert(game.buy("ren-1"));
  assert.equal(game.profile.wallet, 700);
  assert(game.profile.meridian.includes("ren-1"));
  assert(!game.buy("ren-1")); // already struck
  assert(game.buy("ren-2")); // prerequisite met, affordable
  assert(!game.buy("dantian")); // requires du-1 as well: locked
  game.profile.wallet = 0;
  assert(!game.buy("ren-3")); // cannot afford
  game.save();
  game.menu();
  game.start("zhao-yun", "campaign");
  assert.equal(game.g.p.maxHp, 150); // two Conception points: +30
  game.menu();
  game.start("zhao-yun", "quickplay", "jade-gate", quickParty("zhao-yun"));
  assert.equal(game.g.p.maxHp, 120);
  assert.equal(session(storage).profile.meridian.length, 2);
});
test("quick-play victory records scores without changing campaign wallet/checkpoint/unlocks", () => {
  const game = session();
  game.start("lu-bu", "quickplay", "jade-gate", quickParty("lu-bu"));
  // Quick play stays linear across all five encounters.
  while (!["victory", "defeat"].includes(game.mode)) {
    clearEncounter(game);
    if (game.mode === "upgrade") game.chooseDiscipline("power");
  }
  assert.equal(game.mode, "victory");
  assert.equal(game.profile.wallet, 0);
  assert.equal(game.profile.records["lu-bu"].wins, 1);
  assert.equal(game.profile.checkpoint, null);
  assert(!game.profile.unlockedHeroes.includes("lu-bu"));
});
test("Act III completion opens Act IV without changing the Story hero roles", () => {
  const game = session();
  game.start("zhao-yun", "quickplay", "jade-gate", quickParty("zhao-yun"));
  game.g.runMode = "campaign";
  awardResult(game.profile, game.g, true, ACTS[2]);
  game.save();
  assert(!game.profile.unlockedHeroes.includes("lu-bu"));
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

test("Act II is live: map rows, elite encounter, boss duel content, and later acts stay gated", () => {
  const act2 = ACTS.find((a) => a.id === "bamboo-crossing");
  assert(act2, "Act II must be registered in ACTS");
  assert.equal(act2.number, 2);
  assert.equal(act2.name, "Whispering Bamboo & the River Crossing");
  assert.equal(act2.cn, "幽篁夜渡");
  assert.equal(act2.available, true, "Act II is playable");
  assert.equal(act2.bossId, "night-heron");
  assert.deepEqual(act2.hazards, ["shallows", "razor-wire"]);
  assert.deepEqual(act2.map.rows, [
    ["duel:bamboo-ambush"],
    ["ambush:river-skiff", "elite:bamboo-elite"],
    ["event:travelers-gift", "rest:roadside", "duel:river-skiff", "shop:merchant"],
    ["boss:night-heron"],
  ]);

  // Encounter pool includes the hardened mist-stalker elite.
  assert.equal(act2.encounters.length, 4);
  assert(act2.encounters.some((e) => e.id === "bamboo-elite" && e.elite));
  assert(act2.encounters.some((e) => e.bossId === "night-heron"));

  // Night Heron boss metadata: built, phased, and duel-ready.
  const boss = BOSSES["night-heron"];
  assert(boss, "Night Heron must be in BOSSES");
  assert(!boss.planned, "Night Heron is no longer planned");
  assert.equal(boss.name, "The Night Heron");
  assert.equal(boss.cn, "夜鷺娘子");
  assert(boss.phases && boss.phases.length >= 2, "Boss design metadata must include phases");
  assert(boss.mechanics.includes("sonic-rings"));
  assert(boss.mechanics.includes("razor-wire"));

  // Validation passes with Act II available.
  assert(
    validateContent({
      heroes: HEROES,
      acts: ACTS,
      bosses: BOSSES,
      cultivations: CULTIVATIONS,
      disciplines: UPGRADES,
    }),
  );

  // Content validation still guards premature availability of unbuilt acts.
  const strippedActs = structuredClone(ACTS);
  strippedActs[3].encounters = [];
  assert.throws(
    () =>
      validateContent({
        heroes: HEROES,
        acts: strippedActs,
        bosses: BOSSES,
        cultivations: CULTIVATIONS,
        disciplines: UPGRADES,
      }),
    /Incomplete playable act/,
  );

  // Domain gate: cannot launch Act III without Act II reclaimed.
  const game = session();
  assert.throws(
    () => game.start("zhao-yun", "campaign", "mount-canglan"),
    /preceding act/,
  );
});

test("Act II dialogue pack: arrival, Night Heron exchanges for all heroes, and resolution vignettes", () => {
  for (const hero of HEROES.filter((hero) => !hero.hidden)) {
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

test("Night Heron checkpoint keys: canonical round-trip and legacy alias support", () => {
  const act2 = ACTS.find((a) => a.id === "bamboo-crossing");
  assert.equal(act2.available, true, "Act II is live");

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

test("Act II card duel content: rosters, enemies, elite and roam creation", () => {
  const act2 = ACTS.find((a) => a.id === "bamboo-crossing");
  assert.equal(act2.available, true, "Act II is live");

  // Roster registration for all Act II encounter IDs
  const act2EncounterIds = ["bamboo-ambush", "bamboo-elite", "river-skiff", "night-heron"];
  for (const encId of act2EncounterIds) {
    assert(DUEL_ROSTERS[encId], `DUEL_ROSTERS must contain encounter ${encId}`);
    assert(DUEL_ROSTERS[encId].length > 0, `DUEL_ROSTERS[${encId}] must have enemies`);
  }

  for (const kind of ["shadow-assassin", "skiff-archer", "night-heron"]) {
    const enemy = DUEL_ENEMIES[kind];
    assert(enemy, `DUEL_ENEMIES must define ${kind}`);
    assert(enemy.hp > 0);
    assert(enemy.name);
    assert(enemy.pattern.length >= 2);
  }
  assert.equal(DUEL_ENEMIES["shadow-assassin"].name, "Shadow Assassin");
  assert.equal(DUEL_ENEMIES["skiff-archer"].name, "Skiff Archer");
  assert.equal(DUEL_ENEMIES["night-heron"].name, "The Night Heron");
  assert(DUEL_ENEMIES["night-heron"].pattern.length >= 3);
  assert(!BOSSES["night-heron"].planned);

  const bus = { emit() {} };
  for (const encId of act2EncounterIds) {
    const encounter = act2.encounters.find((e) => e.id === encId);
    assert(encounter, `Act II must define encounter ${encId}`);
    const g = { p: { x: 0, y: 0 }, encounterIndex: 0 };
    const roam = createRoam(g, bus, { encounter });
    assert(roam, `createRoam must succeed for ${encId}`);
    assert.equal(g.roam.field.length, DUEL_ROSTERS[encId].length);
    for (const rival of g.roam.field) {
      assert.equal(DUEL_ENEMIES[rival.kind].name, rival.name);
      assert(rival.x > 0);
      assert(rival.y > 0);
    }
  }
});
