import test from 'node:test';
import assert from 'node:assert/strict';
import manifest from '../docs/asset-manifest.json' with { type: 'json' };
import { ACTS, BOSSES } from '../src/content/campaign.js';
import { HEROES } from '../src/content/heroes.js';
import { STORY_ROSTERS, OTHERWORLD_HERO_IDS, OTHERWORLD_RIVALS } from '../src/content/story-rivals.js';
import { DUEL_ENEMIES } from '../src/content/duels.js';
import { specialFor } from '../src/content/expansion.js';
import { dialogueFor } from '../src/content/dialogue.js';
import { translate } from '../src/locales/i18n.js';
import { rosterForEncounter, isEscortKind, isNamedRivalKind } from '../src/content/duels.js';
import { session, memoryStorage, playCampaign } from './helpers.js';

const act = () => ACTS.find((entry) => entry.id === 'otherworld');
const manifestIds = new Set(manifest.map((entry) => entry.id));
const heroKindsOf = (encounterId) =>
  STORY_ROSTERS[encounterId].filter((kind) => kind.startsWith('hero-'));

function riftSession() {
  const game = session(memoryStorage());
  for (const earlier of ACTS.slice(0, 4)) game.profile.completedActs.push(earlier.id);
  game.start('zhao-yun', 'campaign', 'otherworld');
  return game;
}

test('Act V chains after the citadel, ends the campaign, and validates its boss', () => {
  assert.equal(ACTS.length, 5);
  assert.equal(ACTS[3].next, 'otherworld');
  assert.equal(act().next, null);
  assert.equal(act().bossId, 'zhao-min-rival');
  assert.ok(BOSSES['zhao-min-rival'].phases.length >= 2, 'the bridge keeper has phases');
  assert.ok(manifestIds.has(act().arena), 'the act arena art exists');
  for (const encounter of act().encounters) {
    assert.ok(encounter.title && encounter.tip, `${encounter.id} reads`);
    assert.ok(rosterForEncounter(encounter.id, 'campaign').length, `${encounter.id} has a roster`);
  }
});

test('all twenty hidden legends stand exactly once across the act', () => {
  const standing = [];
  for (const encounter of act().encounters) {
    if (encounter.bossId) {
      assert.equal(DUEL_ENEMIES['zhao-min-rival'].heroId, 'zhao-min');
      standing.push('zhao-min');
    } else for (const kind of heroKindsOf(encounter.id)) standing.push(kind.slice('hero-'.length));
  }
  assert.equal(standing.length, 20, 'twenty legends hold the otherworld');
  assert.deepEqual([...standing].sort(), [...OTHERWORLD_HERO_IDS].sort());
  assert.equal(OTHERWORLD_HERO_IDS.length, HEROES.filter((hero) => hero.hidden).length);
});

test('every otherworld rival has a manifest sprite and a telegraphed special', () => {
  for (const id of OTHERWORLD_HERO_IDS) {
    const rival = DUEL_ENEMIES[`hero-${id}`];
    assert(rival, `hero-${id} duels`);
    assert(manifestIds.has(rival.art), `${id} sprite is in the manifest`);
    assert(rival.hp > 0 && rival.damage > 0 && rival.pattern?.length, `${id} is statted`);
    const special = specialFor(`hero-${id}`);
    assert(special?.name && special.focus > 0, `${id} gathers a named special`);
  }
  assert.equal(DUEL_ENEMIES['zhao-min-rival'].boss, true);
  assert(manifestIds.has(DUEL_ENEMIES['zhao-min-rival'].art));
  assert(specialFor('zhao-min-rival').name, 'the keeper gathers her verdict');
});

test('scenes four to eight speak in English and Japanese', () => {
  const keys = ['rift-arrival', 'hall-reveal', 'first-round', 'zhao-min-rival-intro', 'zhao-min-rival-fall'];
  for (const heroId of ['zhao-yun', 'lu-zhishen', 'hu-sanniang']) {
    const hero = HEROES.find((entry) => entry.id === heroId);
    for (const key of keys) {
      const lines = dialogueFor(key, hero);
      assert(lines.length >= 2, `${key} speaks`);
      for (const line of lines) {
        assert.notEqual(translate(line.speaker), line.speaker, `${key} speaker localizes`);
        assert.notEqual(translate(line.text), line.text, `${key} text localizes`);
        assert.equal(translate(line.text, 'en'), line.text);
      }
    }
  }
  assert.notEqual(translate(act().name), act().name, 'the act name localizes');
  for (const encounter of act().encounters)
    for (const text of [encounter.title, encounter.tip]) {
      assert.notEqual(translate(text), text, `${text} localizes`);
      assert.equal(translate(text, 'en'), text);
    }
});

test('Act V is gated behind the citadel and opens on the rift arrival', () => {
  assert.throws(() => session(memoryStorage()).start('zhao-yun', 'campaign', 'otherworld'), /preceding act/);
  const game = riftSession();
  assert.equal(game.dialogue.key, 'rift-arrival');
  game.advanceDialogue(true);
  assert.equal(game.mode, 'exploring');
  assert.ok(game.g.roam.maze, 'the otherworld builds its labyrinth');
  // The Hall of Twenty fields only the twenty legends and their retinues:
  // no rank grunts, no camp holds more than two legends.
  const legends = game.g.roam.field.filter((rival) => isNamedRivalKind(rival.kind) || rival.kind === 'zhao-min-rival');
  assert.equal(legends.length, 20, 'exactly the twenty legends stand');
  const camps = new Map();
  for (const rival of game.g.roam.field) {
    if (isNamedRivalKind(rival.kind) || rival.kind === 'zhao-min-rival')
      camps.set(rival.area, (camps.get(rival.area) || 0) + 1);
    else
      assert(isEscortKind(rival.kind), `${rival.kind} is a retainer, not a rank grunt`);
  }
  for (const [area, count] of camps) assert.ok(count <= 2, `camp ${area} holds ${count} legends at most`);
  assert.ok(camps.size >= 10, 'the legends spread across many camps');
  // Every retinue numbers two to three per legend.
  for (const [area, legendsInCamp] of camps) {
    const retinue = game.g.roam.field.filter((rival) => rival.area === area && isEscortKind(rival.kind)).length;
    if (area !== 'zhao-min-rival')
      assert.ok(retinue >= legendsInCamp * 2 && retinue <= legendsInCamp * 3,
        `camp ${area} keeps ${retinue} retainers for ${legendsInCamp} legends`);
  }
});

test('the hall reveal and the first round speak once when their areas are engaged', () => {
  for (const [areaId, key] of [['hall-of-twenty', 'hall-reveal'], ['lattice-first-round', 'first-round']]) {
    const game = riftSession();
    game.advanceDialogue(true);
    const rival = game.g.roam.field.find((entry) => String(entry.area).startsWith(areaId) && !entry.ranged);
    assert(rival, `${areaId} holds rivals`);
    assert.equal(game.beginDuel(game.g.roam.field.indexOf(rival)), true);
    assert.equal(game.dialogue.key, key, `${areaId} opens on ${key}`);
    game.advanceDialogue(true);
    assert.equal(game.mode, 'playing', 'the duel resumes after the beat');
    assert.equal(game.g.openField.areaIntros[areaId], true);
  }
});

test('the last keeper bars the bridge with words before blades', () => {
  const game = riftSession();
  game.advanceDialogue(true);
  const keeper = game.g.roam.field.findIndex((entry) => entry.kind === 'zhao-min-rival');
  assert.ok(keeper >= 0, 'Zhao Min holds the field');
  game.beginDuel(keeper);
  assert.equal(game.dialogue.key, 'zhao-min-rival-intro');
});

test('the trio cuts through all twenty and the waystation opens past the bridge', () => {
  const game = riftSession();
  assert.equal(playCampaign(game), 'waystation');
  assert(game.profile.completedActs.includes('otherworld'), 'the otherworld is reclaimed');
  assert.equal(game.act.next, null, 'the story folds shut on the bridge');
});
