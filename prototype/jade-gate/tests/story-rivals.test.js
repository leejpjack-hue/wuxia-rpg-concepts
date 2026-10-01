import test from "node:test";
import assert from "node:assert/strict";
import { HEROES } from "../src/content/heroes.js";
import { ACTS } from "../src/content/campaign.js";
import { DUEL_ENEMIES, DUEL_ROSTERS, rosterForEncounter } from "../src/content/duels.js";
import { STORY_HERO_IDS, isStoryHero } from "../src/content/story-rivals.js";
import { campaignHeroUnlocked } from "../src/domain/unlocks.js";
import { specialFor } from "../src/content/expansion.js";
import { session, memoryStorage, playCampaign, quickParty, clearEncounter, walkMap } from "./helpers.js";
import { SAVE_KEY } from "../src/platform/save-store.js";

test("every non-protagonist hero appears as an illustrated named Story rival", () => {
  const kinds = new Set(ACTS.flatMap(act => act.encounters.flatMap(encounter => rosterForEncounter(encounter.id, "campaign"))));
  const rivals = [...kinds].map(kind => ({ ...DUEL_ENEMIES[kind], kind }));
  for (const hero of HEROES.filter(hero => !isStoryHero(hero.id))) {
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
  assert.deepEqual(game.g.roam.field.map(rival => rival.kind), ["hero-guan-yu", "hero-gu-dasao"]);
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
  for (const hero of HEROES.filter(hero => !isStoryHero(hero.id)))
    assert.throws(() => game.start(hero.id, "campaign"), /Quick play only|Story rival/);
  game.profile.checkpoint = { heroId: "guan-yu", actId: "jade-gate" };
  assert.equal(game.continueCheckpoint(), false);
  assert.equal(game.mode, "menu");
});
