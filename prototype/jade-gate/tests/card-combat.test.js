import test from 'node:test';
import assert from 'node:assert/strict';
import { GameSession } from '../src/domain/session.js';
import { createCardCombat, ASSIST_DAMAGE } from '../src/domain/card-combat.js';
import { SaveStore } from '../src/platform/save-store.js';
import { memoryStorage, duelPolicy, engageRival, playCampaign, quickParty } from './helpers.js';
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
  const g = game(); g.start('zhao-yun', 'quickplay', 'jade-gate', quickParty('zhao-yun')); g.beginDuel(0);
  assert.equal(g.mode, 'playing');
  const before = JSON.stringify(g.g);
  for (let i = 0; i < 600; i++) g.step(1, {});
  assert.equal(JSON.stringify(g.g), before);
  g.pause(); assert.equal(g.combat.act('attack'), false);
  g.resume(); assert(g.combat.act('attack'));
  assert.equal(g.g.turns, 1); assert.equal(g.g.p.hp, 108); assert.equal(g.g.enemies[0].hp, 41);
});
test('guard reduces the displayed incoming attack by 80% and builds Flow', () => {
  const g = game(); g.start('zhao-yun', 'quickplay', 'jade-gate', quickParty('zhao-yun')); g.beginDuel(0); g.combat.act('attack');
  const before = g.g.p.hp, intent = g.combat.intent();
  assert.equal(intent.kind, 'heavy'); g.combat.act('guard');
  assert.equal(before - g.g.p.hp, Math.round(intent.damage * .2)); assert.equal(g.g.p.flow, 72);
});
test('unaffordable techniques, invalid actions, and exhausted tea cannot consume a turn', () => {
  const g = game(); g.start('zhao-yun', 'quickplay', 'jade-gate', quickParty('zhao-yun')); g.beginDuel(0); g.g.p.flow = 0;
  const before = JSON.stringify(g.g);
  for (const action of ['technique', 'invalid', 'tea']) assert.equal(g.combat.act(action), false);
  assert.equal(JSON.stringify(g.g), before);
  g.g.p.hp = 50; assert(g.combat.act('tea'));
  assert.equal(g.g.duel.tea, 0); assert.equal(g.g.p.hp, 68);
  assert.equal(g.combat.act('tea'), false); assert.equal(g.g.turns, 1);
});
test('a defeated rival leaves the pass; the hero returns to exploring', () => {
  const g = game(); g.start('lu-bu', 'quickplay', 'jade-gate', quickParty('lu-bu')); g.beginDuel(0);
  const id = g.g.enemies[0].id;
  g.combat.act('technique');
  assert.equal(g.mode, 'exploring'); assert.equal(g.g.roam.field.length, 1);
  assert.equal(g.g.totalKills, 1); assert.equal(g.g.score, 120);
  assert(g.beginDuel(0));
  assert.equal(g.mode, 'playing'); assert.notEqual(g.g.enemies[0].id, id);
  assert.equal(g.g.duel.defeated, 1); assert.equal(g.g.duel.tea, 1);
});
test('Mountain Bell stuns the reply and Dragon Rush pierces enemy guard', () => {
  const g = game(); g.start('lu-zhishen', 'quickplay', 'jade-gate', quickParty('lu-zhishen')); g.beginDuel(0); g.combat.act('technique');
  assert.equal(g.g.p.hp, g.g.p.maxHp); assert.equal(g.g.enemies[0].hp, 17);
  const z = game(); z.start('zhao-yun', 'quickplay', 'jade-gate', quickParty('zhao-yun')); z.beginDuel(0); z.g.enemies[0].move = 2;
  z.combat.act('technique'); assert.equal(z.g.enemies[0].hp, 14);
});
for (const hero of ['zhao-yun', 'lu-zhishen', 'hu-sanniang', 'lu-bu',
  'guan-yu', 'wu-song', 'mu-guiying', 'liang-hongyu', 'nie-yinniang',
  'sun-shangxiang', 'gu-dasao', 'qin-liangyu', 'bao-sanniang', 'dian-wei', 'yang-zhi']) {
  test(`${hero} can roam and win all card encounters with deliberate choices`, () => {
    const g = game(); g.start(hero, 'quickplay', 'jade-gate', quickParty(hero)); finishRun(g);
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
  const g = game(); g.start('zhao-yun', 'quickplay', 'jade-gate', quickParty('zhao-yun')); g.beginDuel(0);
  g.g.p.hp = 1; g.combat.act('attack');
  assert.equal(g.mode, 'defeat'); assert.equal(g.combat.act('attack'), false);
  g.start('zhao-yun', 'quickplay', 'jade-gate', quickParty('zhao-yun'));
  assert.equal(g.mode, 'exploring'); assert.equal(g.g.p.hp, 120); assert.equal(g.g.turns, 0);
  g.beginDuel(0); assert.equal(g.g.duel.round, 1); assert.equal(g.g.duel.tea, 1);
});

test('WU-PARTY-09I: assist strike once per duel after lead damage; free; no Flow spend', () => {
  const g = game();
  g.start('zhao-yun', 'quickplay', 'jade-gate', quickParty('zhao-yun', 'hu-sanniang', 'lu-zhishen'));
  g.beginDuel(0);
  assert.equal(g.g.duel.assistUsed, false);
  assert.equal(g.g.duel.assistReady, false);
  assert.equal(g.combat.assistStrike(), false); // not ready yet
  const enemy = g.g.enemies[0];
  const hpBefore = enemy.hp;
  const flowBefore = g.g.p.flow;
  assert(g.combat.act('attack'));
  assert.equal(g.g.duel.assistReady, true);
  assert.equal(g.g.duel.assistUsed, false);
  const afterLead = g.g.enemies[0].hp;
  assert(afterLead < hpBefore);
  const result = g.combat.assistStrike();
  assert.equal(result.followerId, 'hu-sanniang');
  assert.equal(result.damage, ASSIST_DAMAGE);
  assert.equal(g.g.enemies[0].hp, afterLead - ASSIST_DAMAGE);
  assert.equal(g.g.p.flow, flowBefore + 12 + g.g.p.flowBonus); // no extra Flow from assist
  assert.equal(g.g.duel.assistUsed, true);
  assert.equal(g.combat.assistStrike(), false); // second press no-op
  assert(g.g.duel.log.some((line) => line.includes('Hu Sanniang assists')));
});

test('WU-PARTY-09I: assist hidden/no-op without followers; resets on new duel', () => {
  const g = game();
  g.start('zhao-yun', 'campaign'); // campaign party has no followers
  g.advanceDialogue(true);
  g.beginDuel(0);
  assert.deepEqual(g.g.party.followers, []);
  g.combat.act('attack');
  assert.equal(g.combat.assistStrike(), false);
  // Quick play with followers: new duel resets assist
  const q = game();
  q.start('zhao-yun', 'quickplay', 'jade-gate', quickParty('zhao-yun'));
  q.beginDuel(0);
  q.combat.act('attack');
  assert(q.combat.assistStrike());
  assert.equal(q.g.duel.assistUsed, true);
  // Finish rival quickly then open next duel
  while (q.mode === 'playing') assert(q.combat.act(duelPolicy(q)));
  assert.equal(q.mode, 'exploring');
  assert(q.beginDuel(0));
  assert.equal(q.g.duel.assistUsed, false);
  assert.equal(q.g.duel.assistReady, false);
  assert.equal(q.combat.assistStrike(), false);
  q.combat.act('attack');
  assert(q.combat.assistStrike());
});

test('WU-PARTY-09I: mid-roam assistStrike is a no-op; HUD swapLead still between-encounter only', () => {
  const g = game();
  g.start('zhao-yun', 'quickplay', 'jade-gate', quickParty('zhao-yun', 'hu-sanniang', 'lu-zhishen'));
  assert.equal(g.mode, 'exploring');
  assert.equal(g.combat?.assistStrike?.() ?? false, false);
  g.beginDuel(0);
  g.combat.act('attack');
  assert(g.combat.assistStrike());
  while (g.mode === 'playing') assert(g.combat.act(duelPolicy(g)));
  assert.equal(g.mode, 'exploring');
  assert.equal(g.g.roam.swapCue, true);
  assert.equal(g.swapLead('hu-sanniang'), true);
  assert.equal(g.g.party.lead, 'hu-sanniang');
});
