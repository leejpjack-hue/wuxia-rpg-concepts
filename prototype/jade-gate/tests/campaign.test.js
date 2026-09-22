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
import { validateContent } from "../src/content/validate.js";
import { awardResult } from "../src/domain/progression.js";
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
