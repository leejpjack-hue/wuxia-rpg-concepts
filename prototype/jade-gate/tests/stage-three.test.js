import test from 'node:test';
import assert from 'node:assert/strict';
import { memoryStorage, session, completeCampaign, playCampaign, clearEncounter, walkMap, quickParty } from './helpers.js';
import { SaveStore, SAVE_KEY } from '../src/platform/save-store.js';
import { ACTS } from '../src/content/campaign.js';
import { DUEL_ENEMIES, DUEL_ROSTERS } from '../src/content/duels.js';
import { dialogueFor } from '../src/content/dialogue.js';
import { HEROES } from '../src/content/heroes.js';
import { translate } from '../src/locales/i18n.js';
import { resolveMusicMode } from '../src/platform/audio-director.js';
import { musicStepCount, scoreStep } from '../src/content/music-score.js';
import { onGround } from '../src/domain/ground.js';

test('four-act Story keeps its three heroes across milestones, checkpoints and reloads', () => {
  const storage = memoryStorage();
  let game = session(storage);
  completeCampaign(game);
  for (const act of ACTS.slice(1)) {
    game.start('zhao-yun', 'campaign', act.id);
    assert.equal(playCampaign(game), 'waystation');
  }
  const profile = new SaveStore(storage).load();
  assert.deepEqual(profile.completedActs, ACTS.map(act => act.id));
  assert.deepEqual(profile.unlockedHeroes, ['zhao-yun', 'lu-zhishen', 'hu-sanniang']);
  assert.deepEqual(profile.earnedHeroes, []);
  game = session(storage);
  assert.throws(() => game.start('lu-bu', 'campaign'), /Story rival/);
});

test('legacy unlocked heroes never become Story protagonists and records remain intact', () => {
  const raw = {version:2, completedActs:['jade-gate','bamboo-crossing'],
    unlockedHeroes:HEROES.map(h=>h.id), earnedHeroes:['mu-guiying'],
    records:{'guan-yu':{best:950,wins:3}}, wallet:1234, settings:{language:'ja'}};
  const game=session(memoryStorage({[SAVE_KEY]:JSON.stringify(raw)}));
  assert.equal(game.profile.wallet,1234);
  assert.equal(game.profile.records['guan-yu'].wins,3);
  assert.deepEqual(game.profile.completedActs,['jade-gate','bamboo-crossing']);
  for (const hero of HEROES.slice(3).filter(h=>!h.recruitedOnly))
    assert.throws(() => game.start(hero.id,'campaign'), /Quick play only|Story rival/);
});

test('Acts II and III use their own illustrated enemies, translated story and long procedural themes', () => {
  assert.equal(ACTS[1].arena,'bamboo-roam');
  assert.equal(ACTS[2].arena,'mount-canglan');
  for (const kind of ['shadow-assassin','skiff-archer','night-heron','canglan-monk','lu-bu-rival'])
    assert.notEqual(DUEL_ENEMIES[kind].art, 'guard-sprite');
  assert.deepEqual(DUEL_ROSTERS['lu-bu-rival'],['lu-bu-rival']);
  for (const mode of ['battle-bamboo','boss-heron','battle-canglan','boss-lubu']) {
    assert.equal(musicStepCount(mode),512);
    const first=scoreStep(mode,0), middle=scoreStep(mode,240);
    assert(first.length>0 && middle.length>0);
    assert.notDeepEqual(first,middle);
  }
  assert.notDeepEqual(scoreStep('battle-bamboo',0),scoreStep('battle-canglan',0));
  assert.equal(resolveMusicMode({current:'exploring',actId:'mount-canglan',boss:false}),'battle-canglan');
  assert.equal(resolveMusicMode({current:'playing',actId:'mount-canglan',boss:true}),'boss-lubu');
  for (const hero of HEROES) for (const key of ['canglan-arrival','lu-bu-rival-intro','lu-bu-rival-fall'])
    for (const line of dialogueFor(key,hero)) assert.notEqual(translate(line.text,'ja'),line.text);
});

test('mountain wind stays on the ground and a telegraphed pillar respects dodge invulnerability', () => {
  const game=session();game.start('zhao-yun', 'quickplay', 'mount-canglan', quickParty('zhao-yun'));
  game.g.roam.field.length=0;
  const startX=game.g.p.x;
  for(let i=0;i<60;i++) game.step(1/60,{});
  assert.notEqual(game.g.p.x,startX);
  assert(onGround(game.g.p));
  game.g.roam.pillar={x:game.g.p.x,y:game.g.p.y,time:.01};
  const hp=game.g.p.hp;
  game.step(1/60,{});
  assert.equal(game.g.p.hp,hp-18);
  game.g.roam.pillar={x:game.g.p.x,y:game.g.p.y,time:.01};
  game.g.roam.invulnerable=.2;
  game.step(1/60,{});
  assert.equal(game.g.p.hp,hp-18);
});
