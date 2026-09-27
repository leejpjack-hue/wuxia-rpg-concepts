import test from 'node:test';
import assert from 'node:assert/strict';
import { GameSession } from '../src/domain/session.js';
import { createCardCombat } from '../src/domain/card-combat.js';
import { SaveStore } from '../src/platform/save-store.js';
import { memoryStorage, duelPolicy, engageRival, playCampaign } from './helpers.js';
const game = (storage = memoryStorage()) => new GameSession(new SaveStore(storage), { combatFactory: createCardCombat });
function finishRun(g) {
  let steps = 0;
  while (['playing', 'exploring', 'dialogue', 'upgrade'].includes(g.mode) && steps++ < 150) {
    if (g.mode === 'dialogue') g.advanceDialogue(true);
    else if (g.mode === 'upgrade') g.chooseDiscipline('vitality');
    else if (g.mode === 'exploring') assert(engageRival(g));
    else assert(g.combat.act(duelPolicy(g)));
  }
  assert(steps < 150);
}
test('card duels never advance while waiting; pause rejects commands', () => {
  const g = game(); g.start('zhao-yun', 'quickplay'); g.beginDuel(0);
  assert.equal(g.mode, 'playing');
  const before = JSON.stringify(g.g);
  for (let i = 0; i < 600; i++) g.step(1, {});
  assert.equal(JSON.stringify(g.g), before);
  g.pause(); assert.equal(g.combat.act('attack'), false);
  g.resume(); assert(g.combat.act('attack'));
  assert.equal(g.g.turns, 1); assert.equal(g.g.p.hp, 108); assert.equal(g.g.enemies[0].hp, 41);
});
test('guard reduces the displayed incoming attack by 80% and builds Flow', () => {
  const g = game(); g.start('zhao-yun', 'quickplay'); g.beginDuel(0); g.combat.act('attack');
  const before = g.g.p.hp, intent = g.combat.intent();
  assert.equal(intent.kind, 'heavy'); g.combat.act('guard');
  assert.equal(before - g.g.p.hp, Math.round(intent.damage * .2)); assert.equal(g.g.p.flow, 72);
});
test('unaffordable techniques, invalid actions, and exhausted tea cannot consume a turn', () => {
  const g = game(); g.start('zhao-yun', 'quickplay'); g.beginDuel(0); g.g.p.flow = 0;
  const before = JSON.stringify(g.g);
  for (const action of ['technique', 'invalid', 'tea']) assert.equal(g.combat.act(action), false);
  assert.equal(JSON.stringify(g.g), before);
  g.g.p.hp = 50; assert(g.combat.act('tea'));
  assert.equal(g.g.duel.tea, 0); assert.equal(g.g.p.hp, 68);
  assert.equal(g.combat.act('tea'), false); assert.equal(g.g.turns, 1);
});
test('a defeated rival leaves the pass; the hero returns to exploring', () => {
  const g = game(); g.start('lu-bu', 'quickplay'); g.beginDuel(0);
  const id = g.g.enemies[0].id;
  g.combat.act('technique');
  assert.equal(g.mode, 'exploring'); assert.equal(g.g.roam.field.length, 1);
  assert.equal(g.g.totalKills, 1); assert.equal(g.g.score, 120);
  assert(g.beginDuel(0));
  assert.equal(g.mode, 'playing'); assert.notEqual(g.g.enemies[0].id, id);
  assert.equal(g.g.duel.defeated, 1); assert.equal(g.g.duel.tea, 1);
});
test('Mountain Bell stuns the reply and Dragon Rush pierces enemy guard', () => {
  const g = game(); g.start('lu-zhishen', 'quickplay'); g.beginDuel(0); g.combat.act('technique');
  assert.equal(g.g.p.hp, g.g.p.maxHp); assert.equal(g.g.enemies[0].hp, 17);
  const z = game(); z.start('zhao-yun', 'quickplay'); z.beginDuel(0); z.g.enemies[0].move = 2;
  z.combat.act('technique'); assert.equal(z.g.enemies[0].hp, 14);
});
for (const hero of ['zhao-yun', 'lu-zhishen', 'hu-sanniang', 'lu-bu',
  'guan-yu', 'wu-song', 'mu-guiying', 'liang-hongyu', 'nie-yinniang']) {
  test(`${hero} can roam and win all card encounters with deliberate choices`, () => {
    const g = game(); g.start(hero, 'quickplay'); finishRun(g);
    assert.equal(g.mode, 'victory'); assert(g.g.p.hp > 0); assert.equal(g.g.totalKills, 11);
    assert.equal(g.profile.wallet, 0); assert.equal(g.profile.checkpoint, null);
  });
}
test('card campaign restores checkpoints, reaches tea house, buys cultivation, and awards once', () => {
  const storage = memoryStorage(), g = game(storage);
  g.start('zhao-yun', 'campaign'); g.advanceDialogue(true); g.beginDuel(0); g.combat.act('technique');
  const saved = game(storage); saved.continueCheckpoint();
  assert.equal(saved.mode, 'exploring'); saved.beginDuel(0);
  assert.equal(saved.g.enemies[0].hp, saved.g.enemies[0].maxHp);
  finishRun(saved); playCampaign(saved); assert.equal(saved.mode, 'waystation');
  const wallet = saved.profile.wallet; assert(wallet > 0); assert(saved.buy('du-1'));
  assert(saved.profile.wallet < wallet);
  const again = game(storage); again.continueCheckpoint();
  assert.equal(again.mode, 'waystation'); assert.equal(again.profile.wallet, saved.profile.wallet);
  assert.equal(again.profile.records['zhao-yun'].wins, 1); assert(again.g.turns > 0);
});
test('defeat rejects extra turns and retry starts a fresh card encounter', () => {
  const g = game(); g.start('zhao-yun', 'quickplay'); g.beginDuel(0);
  g.g.p.hp = 1; g.combat.act('attack');
  assert.equal(g.mode, 'defeat'); assert.equal(g.combat.act('attack'), false);
  g.start('zhao-yun', 'quickplay');
  assert.equal(g.mode, 'exploring'); assert.equal(g.g.p.hp, 120); assert.equal(g.g.turns, 0);
  g.beginDuel(0); assert.equal(g.g.duel.round, 1); assert.equal(g.g.duel.tea, 1);
});
