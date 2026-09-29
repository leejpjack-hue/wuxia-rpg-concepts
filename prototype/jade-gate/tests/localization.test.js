import test from 'node:test';
import assert from 'node:assert/strict';
import { HEROES } from '../src/content/heroes.js';
import { dialogueFor } from '../src/content/dialogue.js';
import { translate } from '../src/locales/i18n.js';
import { SaveStore, SAVE_KEY, defaultProfile, sanitizeProfile } from '../src/platform/save-store.js';
import { session, memoryStorage } from './helpers.js';

test('Japanese defaults on fresh and older saves; a language choice persists without losing progress', () => {
  assert.equal(defaultProfile().settings.language, 'ja');
  const old = {version:2, settings:{music:false}, wallet:950, records:{'guan-yu':{best:900,wins:2}}, unlockedHeroes:HEROES.map(h=>h.id)};
  const storage = memoryStorage({[SAVE_KEY]: JSON.stringify(old)});
  const game = session(storage);
  assert.equal(game.profile.settings.language, 'ja');
  assert.equal(game.profile.settings.music, false);
  game.setSetting('language', 'en');
  const reloaded = new SaveStore(storage).load();
  assert.equal(reloaded.settings.language, 'en');
  assert.equal(reloaded.wallet, 950);
  assert.equal(reloaded.records['guan-yu'].wins, 2);
  assert(!reloaded.unlockedHeroes.includes('guan-yu'));
  game.setSetting('language', 'unsupported');
  assert.equal(game.profile.settings.language, 'en');
  assert.equal(sanitizeProfile({settings:{language:'unsupported'}}).settings.language, 'ja');
});

test('bonus heroes cannot enter the campaign even through a forged unlock list', () => {
  for (const hero of HEROES.filter(h => h.quickPlayOnly)) {
    const game = session();
    game.profile.unlockedHeroes.push(hero.id);
    assert.throws(() => game.start(hero.id, 'campaign'), /Quick play only/);
    game.start(hero.id, 'quickplay');
    assert.equal(game.mode, 'exploring');
  }
});

test('every hero has a roughly 30-word biography and translated display content', () => {
  for (const hero of HEROES) {
    const words = hero.description.split(/\s+/).length;
    assert(words >= 28 && words <= 35, `${hero.id}: ${words} words`);
    for (const text of [hero.name, hero.title, hero.weapon, hero.style, hero.skill, hero.description]) {
      assert.notEqual(translate(text), text, `Missing hero translation: ${text}`);
      assert.equal(translate(text, 'en'), text);
    }
    for (const key of ['arrival','warden-intro','warden-fall','bamboo-arrival','heron-intro','heron-fall']) {
      for (const line of dialogueFor(key, hero)) {
        assert.notEqual(translate(line.speaker), line.speaker);
        assert.notEqual(translate(line.text), line.text);
      }
    }
  }
});

test('combat messages translate names and values while retaining English logs for switching', () => {
  const game = session(); game.start('wu-song', 'quickplay'); game.beginDuel(0);
  game.combat.act('guard'); game.combat.act('attack');
  for (const message of game.g.duel.log) {
    assert.notEqual(translate(message), message);
    assert.equal(translate(message, 'en'), message);
  }
  assert.equal(translate('Ashen Swordsman uses heavy strike: 12 damage.'), '灰旗の剣士の強攻撃：12ダメージ。');
  assert.equal(translate('ACT 1 · THE JADE GATE'), '第1章 · 翠門関');
  assert.equal(translate('Personal best: 850 renown · 3 victories'), '最高記録：名声850 · 3勝');
});
