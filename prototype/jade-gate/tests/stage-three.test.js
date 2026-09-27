import test from 'node:test';
import assert from 'node:assert/strict';
import { memoryStorage, session, completeCampaign, playCampaign, clearEncounter, walkMap } from './helpers.js';
import { SaveStore, SAVE_KEY } from '../src/platform/save-store.js';
import { ACTS } from '../src/content/campaign.js';
import { DUEL_ENEMIES, DUEL_ROSTERS } from '../src/content/duels.js';
import { dialogueFor } from '../src/content/dialogue.js';
import { HEROES } from '../src/content/heroes.js';
import { translate } from '../src/locales/i18n.js';
import { resolveMusicMode } from '../src/platform/audio-director.js';
import { musicStepCount, scoreStep } from '../src/content/music-score.js';
import { onGround } from '../src/domain/ground.js';

test('five allies join one at a time through the three-act story, survive reload, and cannot be forged', () => {
  const storage = memoryStorage();
  let game = session(storage);
  assert.throws(() => game.start('mu-guiying', 'campaign'), /Quick play only/);
  completeCampaign(game);
  assert(game.profile.unlockedHeroes.includes('guan-yu'));
  assert(!game.profile.unlockedHeroes.includes('wu-song'));
  game.start('zhao-yun', 'campaign', 'bamboo-crossing');
  assert.equal(playCampaign(game), 'waystation');
  assert(game.profile.unlockedHeroes.includes('wu-song'));
  game.start('zhao-yun', 'campaign', 'mount-canglan');
  assert.equal(game.dialogue.key, 'canglan-arrival');
  game.advanceDialogue(true);
  clearEncounter(game);
  assert.equal(game.mode, 'upgrade');
  assert.deepEqual(game.profile.earnedHeroes, ['mu-guiying']);
  assert(!game.profile.unlockedHeroes.includes('liang-hongyu'));
  game = session(storage);
  assert.deepEqual(game.profile.earnedHeroes, ['mu-guiying']);
  assert(game.continueCheckpoint());
  assert.equal(game.mode, 'upgrade');
  game.chooseDiscipline('power');
  walkMap(game, nodes => nodes.find(n => n.startsWith('elite:')) || nodes[0]);
  clearEncounter(game);
  assert.deepEqual(game.profile.earnedHeroes, ['mu-guiying', 'liang-hongyu']);
  game.chooseDiscipline('power');
  if (game.mode === 'map') walkMap(game);
  clearEncounter(game);
  assert.deepEqual(game.profile.earnedHeroes, ['mu-guiying', 'liang-hongyu', 'nie-yinniang']);
  assert(!game.profile.unlockedHeroes.includes('lu-bu'));
  game.chooseDiscipline('power');
  assert.equal(game.dialogue.key, 'lu-bu-rival-intro');
  game.advanceDialogue(true);
  assert.equal(game.g.enemies[0].type, 'boss');
  clearEncounter(game);
  assert.equal(game.dialogue.key, 'lu-bu-rival-fall');
  game.advanceDialogue(true);
  assert.equal(game.mode, 'waystation');
  assert(game.profile.unlockedHeroes.includes('lu-bu'));
  const reloaded = new SaveStore(storage).load();
  assert.deepEqual(reloaded.earnedHeroes, ['mu-guiying', 'liang-hongyu', 'nie-yinniang']);
  assert.equal(new Set(reloaded.unlockedHeroes).size, 9);
  game.menu(); game.start('nie-yinniang', 'campaign');
  assert.equal(game.hero.id, 'nie-yinniang');
  const forged = session(); forged.profile.unlockedHeroes.push('mu-guiying');
  assert.throws(() => forged.start('mu-guiying', 'campaign'), /Quick play only/);
});

test('older saves earn completed-act allies without accepting old quick-play unlocks', () => {
  const raw = {version:2,completedActs:['jade-gate','bamboo-crossing'],unlockedHeroes:HEROES.map(h=>h.id),settings:{language:'ja'}};
  const storage=memoryStorage({[SAVE_KEY]:JSON.stringify(raw)});
  const game=session(storage);
  assert.deepEqual(game.profile.unlockedHeroes.sort(), ['zhao-yun','lu-zhishen','hu-sanniang','guan-yu','wu-song'].sort());
  assert.deepEqual(game.profile.earnedHeroes, []);
});

test('Acts II and III use their own illustrated enemies, translated story and long procedural themes', () => {
  assert.equal(ACTS[1].arena,'bamboo-river');
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
  const game=session();game.start('zhao-yun','quickplay','mount-canglan');
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
