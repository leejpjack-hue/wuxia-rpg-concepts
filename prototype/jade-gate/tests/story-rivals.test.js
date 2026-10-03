import test from "node:test";
import assert from "node:assert/strict";
import { HEROES } from "../src/content/heroes.js";
import { ACTS } from "../src/content/campaign.js";
import { DUEL_ENEMIES, DUEL_ROSTERS, rosterForEncounter, escortSquadFor } from "../src/content/duels.js";
import { STORY_HERO_IDS, isStoryHero, STORY_RIVALS } from "../src/content/story-rivals.js";
import { campaignHeroUnlocked } from "../src/domain/unlocks.js";
import { specialFor } from "../src/content/expansion.js";
import { session, memoryStorage, playCampaign, quickParty, clearEncounter, walkMap } from "./helpers.js";
import { SAVE_KEY } from "../src/platform/save-store.js";

test("every non-protagonist hero appears as an illustrated named Story rival", () => {
  const kinds = new Set(ACTS.flatMap(act => act.encounters.flatMap(encounter => rosterForEncounter(encounter.id, "campaign"))));
  const rivals = [...kinds].map(kind => ({ ...DUEL_ENEMIES[kind], kind }));
  for (const hero of HEROES.filter(hero => !hero.hidden && !isStoryHero(hero.id))) {
    const rival = rivals.find(rival => rival.heroId === hero.id);
    assert(rival, `No Story rival for ${hero.id}`);
    assert.equal(rival.name, hero.name);
    assert(rival.art.endsWith("-sprite"));
    assert(rival.pattern.length > 1);
    assert(specialFor(rival.kind));
  }
  assert(!rivals.some(rival => STORY_HERO_IDS.includes(rival.heroId)));
});

test("exploration and duel share the Story roster while Quick Play keeps its encounters", () => {
  const game = session(); game.start("zhao-yun", "campaign"); game.advanceDialogue(true);
  // Open field: every encounter of the act deploys at once, escorts included —
  // then the ranks triple with act grunts (the story roster leads the column).
  const fullAct = ACTS.find(act => act.id === "jade-gate").encounters
    .flatMap(encounter => rosterForEncounter(encounter.id, "campaign"));
  const kinds = game.g.roam.field.map(rival => rival.kind);
  assert.equal(kinds.length, fullAct.length * 3);
  assert.deepEqual(kinds.slice(0, fullAct.length), fullAct);
  assert(game.beginDuel(0));
  assert.equal(game.g.enemies[0].name, "Guan Yu");
  assert.equal(game.g.enemies[0].art, "guan-yu-sprite");
  assert.equal(game.g.duel.total, game.g.roam.field.length);
  const quick = session(); quick.start("guan-yu", "quickplay", "jade-gate", quickParty("guan-yu"));
  assert.deepEqual(quick.g.roam.field.map(rival => rival.kind), DUEL_ROSTERS.vanguard);
});

for (const heroId of STORY_HERO_IDS) test(`${heroId} can clear all four Story acts with earned cultivation`, () => {
  const game = session();
  for (const act of ACTS) {
    game.start(heroId, "campaign", act.id);
    let turns = 0;
    while (!["waystation", "defeat"].includes(game.mode) && turns++ < 400) {
      if (game.mode === "dialogue") game.advanceDialogue(true);
      else if (["exploring", "playing"].includes(game.mode)) clearEncounter(game);
      else if (game.mode === "upgrade") game.chooseDiscipline("power");
      else if (game.mode === "map") walkMap(game);
    }
    assert.equal(game.mode, "waystation");
    for (const id of ["ren-1", "ren-2", "ren-3"]) game.buy(id);
  }
  assert.deepEqual(game.profile.completedActs, ACTS.map(act => act.id));
  assert.deepEqual(game.profile.unlockedHeroes, STORY_HERO_IDS);
});

test("old unlocks and recruits cannot change Story roles or resume a rival checkpoint", () => {
  const game = session();
  game.profile.completedActs = ACTS.map(act => act.id);
  game.profile.unlockedHeroes = HEROES.map(hero => hero.id);
  game.profile.earnedHeroes = ["mu-guiying", "liang-hongyu", "nie-yinniang"];
  game.profile.recruits = ["venom-adept"];
  for (const hero of HEROES) assert.equal(campaignHeroUnlocked(game.profile, hero.id), isStoryHero(hero.id));
  for (const hero of HEROES.filter(hero => !hero.hidden && !isStoryHero(hero.id)))
    assert.throws(() => game.start(hero.id, "campaign"), /Quick play only|Story rival/);
  game.profile.checkpoint = { heroId: "guan-yu", actId: "jade-gate" };
  assert.equal(game.continueCheckpoint(), false);
  assert.equal(game.mode, "menu");
});

test("named legends anchor their areas: tougher than the grunts, special due sooner", () => {
  // Legends clear the toughest Act-I grunt band (pugilist 78 hp, 13 damage).
  for (const [kind, def] of Object.entries(STORY_RIVALS)) {
    assert(def.hp > 78, `${kind} (${def.hp} hp) out-healths the grunt band`);
    assert(def.damage >= 11, `${kind} (${def.damage} damage) hits like a leader`);
    assert(def.hp < 210, `${kind} stays below the boss tier`);
  }
  // The art opens half-gathered: one unanswered exchange brings the special due,
  // and the next reply unleashes it.
  const game = session();
  game.start("zhao-yun", "campaign");
  game.advanceDialogue(true);
  const leader = game.g.roam.field.findIndex(rival => rival.kind.startsWith("hero-"));
  game.beginDuel(leader);
  assert.equal(game.g.enemies[0].focus, 1);
  assert(!game.combat.intent().special);
  game.combat.act("attack");
  assert(!game.combat.intent().special);
  game.combat.act("attack");
  assert.equal(game.combat.intent().special, true); // due on the third exchange
  game.combat.act("attack");
  assert(game.g.duel.log.some(text => text.includes("unleashes")), "the legend unleashed the special");
});

test("hidden novel heroes stay off the selectable roster until the flag flips", () => {
  const hidden = HEROES.filter(hero => hero.hidden);
  assert.equal(hidden.length, 20);
  assert.equal(hidden.filter(hero => hero.keyArt?.endsWith(".jpg")).length, 20);
  const game = session();
  assert.equal(HEROES.filter(hero => !hero.hidden && !hero.recruitedOnly).length, 15);
  for (const hero of hidden) {
    assert.equal(game.profile.unlockedHeroes.includes(hero.id), false);
    assert.equal(isStoryHero(hero.id), false);
    assert.throws(() => game.start(hero.id, "campaign"), /hidden until unlocked/);
    assert.throws(() => game.start(hero.id, "quickplay", "jade-gate", quickParty(hero.id)), /hidden until unlocked/);
  }
  const shown = { ...hidden[0], hidden: false };
  assert.equal(shown.hidden, false);
});
