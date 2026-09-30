import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { GameView } from '../src/presentation/view.js';
import { GameSession } from '../src/domain/session.js';
import { createCardCombat } from '../src/domain/card-combat.js';
import { SaveStore } from '../src/platform/save-store.js';
import { HEROES } from '../src/content/heroes.js';
import { memoryStorage, quickParty } from './helpers.js';

// Minimal injected document adapter. IDs come from the shipped HTML, so stale
// selectors fail here too. Layout, focus traversal and real clicks are browser-checked.
function fixture(storage = memoryStorage()) {
  const elements = new Map();
  const document = {
    getElementById: id => elements.get(id) || null,
    documentElement: {},
    querySelectorAll: selector => selector === '[data-hero]' ? cards : selector === '[data-mode]' ? modes : [],
    createElement: () => element(),
  };
  function element() {
    return {
      children: [], textContent: '', hidden: false, inert: false, disabled: false,
      classList: { add() {}, toggle() {}, remove() {} }, style: {},
      set innerHTML(value) { this.children = []; },
      setAttribute() {}, addEventListener() {}, scrollIntoView() {},
      appendChild(child) { this.children.push(child); },
      focus() { document.activeElement = this; },
      querySelector() { return elements.get('modal-actions').children.find(b => !b.disabled); },
      querySelectorAll: () => [],
    };
  }
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  for (const match of html.matchAll(/\bid="([^"]+)"/g)) elements.set(match[1], element());
  const cards = HEROES.map(hero => {
    const card = element(), parts = new Map();
    card.dataset = {hero: hero.id};
    card.querySelector = selector => { if (!parts.has(selector)) parts.set(selector, element()); return parts.get(selector); };
    return card;
  });
  const modes = ['campaign','quickplay'].map(mode => Object.assign(element(), {dataset:{mode}}));
  document.body = element();
  const session = new GameSession(new SaveStore(storage), { combatFactory: createCardCombat });
  const view = new GameView(session, document);
  view.setReady(true);
  return { session, view, cards, modes, document, $: document.getElementById };
}

function pickQuickParty(cards, modes, ids = ['zhao-yun', 'hu-sanniang', 'lu-zhishen']) {
  modes[1].onclick();
  for (const id of ids) cards.find(card => card.dataset.hero === id).onclick();
}

test('fresh menu is unobstructed and Quick play opens the pass, not the duel table', () => {
  const { session, cards, modes, $ } = fixture();
  assert.equal($('overlay').hidden, true); assert.equal($('selection').hidden, false);
  assert.equal($('selection').inert, false);
  pickQuickParty(cards, modes);
  $('start').onclick();
  assert.equal(session.mode, 'exploring');
  assert.deepEqual(session.g.party, { lead: 'zhao-yun', followers: ['hu-sanniang', 'lu-zhishen'] });
  assert.equal($('roam').hidden, false); assert.equal($('roam').inert, false);
  assert.equal($('play').hidden, true); assert.equal($('play').inert, true);
  assert.equal($('selection').hidden, true);
  assert.equal($('overlay').hidden, true); assert.equal($('app-status').textContent, '');
});
test('Quick play can launch Acts II and III without changing campaign progress', () => {
  for (const actId of ['bamboo-crossing', 'mount-canglan']) {
    const { session, cards, modes, $ } = fixture();
    pickQuickParty(cards, modes);
    assert.equal($('quick-act-picker').hidden, false);
    $('quick-act').onchange({ target: { value: actId } });
    $('start').onclick();
    assert.equal(session.mode, 'exploring');
    assert.equal(session.act.id, actId);
    assert.deepEqual(session.profile.completedActs, []);
  }
});
test('campaign dialogue buttons work against actual HTML IDs and reach the pass and the duel', () => {
  const { session, $ } = fixture(); $('start').onclick();
  assert.equal(session.mode, 'dialogue'); assert.equal($('overlay').hidden, false);
  assert.equal($('modal-actions').children.length, 2);
  $('modal-actions').children[0].onclick();
  assert.equal($('modal-title').textContent, '趙雲');
  $('modal-actions').children[0].onclick();
  assert.equal(session.mode, 'exploring'); assert.equal($('overlay').hidden, true);
  assert.equal($('roam').hidden, false); assert.equal($('play').hidden, true);
  session.beginDuel(0);
  assert.equal(session.mode, 'playing'); assert.equal($('play').hidden, false);
  assert.equal($('roam').hidden, true); assert.equal($('app-status').textContent, '');
});
test('pause, resume, and return to roster restore visibility and interaction', () => {
  const { session, cards, modes, $ } = fixture();
  pickQuickParty(cards, modes);
  $('start').onclick();
  $('roam-pause').onclick(); assert.equal(session.mode, 'paused'); assert.equal($('roam').inert, true);
  $('modal-actions').children[0].onclick(); assert.equal(session.mode, 'exploring');
  assert.equal($('roam').inert, false); assert.equal($('overlay').hidden, true);
  $('roam-pause').onclick(); $('modal-actions').children[1].onclick();
  assert.equal(session.mode, 'menu'); assert.equal($('selection').inert, false);
  assert.equal($('selection').hidden, false); assert.equal($('roam').hidden, true);
  assert.equal($('play').hidden, true); assert.equal($('overlay').hidden, true);
});

test('bonus heroes only appear in Quick play and switching back selects a campaign hero', () => {
  const {view, cards, modes, $} = fixture();
  assert.equal(cards.filter(card => !card.hidden).length, 4);
  assert.equal(cards[3].disabled, true);
  modes[1].onclick();
  assert.equal(cards.filter(card => !card.hidden && !card.disabled).length, 15);
  cards[4].onclick();
  assert.equal(view.heroId, 'guan-yu');
  assert.deepEqual(view.partyIds, ['guan-yu']);
  assert.match($('selected-hero-name').textContent, /関羽/);
  assert.match($('hero-description').textContent, /青龍偃月刀/);
  modes[0].onclick();
  assert.equal(view.heroId, 'zhao-yun');
  assert.deepEqual(view.partyIds, []);
  assert.equal(cards.filter(card => !card.hidden).length, 4);
});
test('language selector updates biographies and current story without advancing it', () => {
  const {session, document, $} = fixture();
  assert.equal(document.documentElement.lang, 'ja');
  $('language').onchange({target:{value:'en'}});
  assert.equal(document.documentElement.lang, 'en');
  assert.equal($('hero-description').textContent, HEROES[0].description);
  $('start').onclick();
  const index = session.dialogue.index;
  $('language').onchange({target:{value:'ja'}});
  assert.equal(session.dialogue.index, index);
  assert.match($('modal-copy').textContent, /灰旗軍/);
  assert.equal($('modal-title').textContent, '翠門関');
});

test('Quick play requires exactly three distinct heroes before start', () => {
  const { session, cards, modes, view, $ } = fixture();
  modes[1].onclick();
  assert.equal($('start').disabled, true);
  cards[0].onclick();
  cards[1].onclick();
  assert.equal(view.partyIds.length, 2);
  assert.equal($('start').disabled, true);
  $('start').onclick();
  assert.equal(session.mode, 'menu');
  assert.match($('app-status').textContent, /three distinct heroes|3人/);
  cards[2].onclick();
  assert.equal(view.partyIds.length, 3);
  assert.equal($('start').disabled, false);
  cards[3].onclick(); // fourth ignored
  assert.equal(view.partyIds.length, 3);
  $('start').onclick();
  assert.equal(session.mode, 'exploring');
  assert.equal(session.g.p.id, view.partyIds[0]);
  assert.deepEqual(session.g.party.followers, view.partyIds.slice(1));
});

test('Quick play restart preserves the ordered party', () => {
  const { session, cards, modes, $ } = fixture();
  pickQuickParty(cards, modes, ['guan-yu', 'zhao-yun', 'hu-sanniang']);
  $('start').onclick();
  assert.deepEqual(session.g.party, { lead: 'guan-yu', followers: ['zhao-yun', 'hu-sanniang'] });
  session.transition('victory');
  session.bus.emit('state:changed');
  // Render victory UI then click Walk the path again
  const viewSession = session;
  // Direct domain restart path used by the victory button.
  viewSession.start(viewSession.g.p.id, viewSession.g.runMode, viewSession.g.actId, viewSession.g.party);
  assert.equal(session.mode, 'exploring');
  assert.deepEqual(session.g.party, { lead: 'guan-yu', followers: ['zhao-yun', 'hu-sanniang'] });
});

test('last Quick Play party of three persists and preselects on the next Quick Play', () => {
  const storage = memoryStorage();
  const party = { lead: 'guan-yu', followers: ['zhao-yun', 'hu-sanniang'] };
  const first = fixture(storage);
  const unlocks = [...first.session.profile.unlockedHeroes];
  const acts = [...first.session.profile.completedActs];
  pickQuickParty(first.cards, first.modes, [party.lead, ...party.followers]);
  first.$('start').onclick();
  assert.equal(first.session.mode, 'exploring');
  assert.equal(first.session.g.p.id, party.lead);
  assert.deepEqual(first.session.g.party, party);
  assert.deepEqual(first.session.profile.lastQuickParty, party);
  assert.deepEqual(first.session.profile.unlockedHeroes, unlocks);
  assert.deepEqual(first.session.profile.completedActs, acts);
  assert.equal(first.session.profile.wallet, 0);
  assert.equal(first.session.profile.checkpoint, null);

  const next = fixture(storage);
  assert.deepEqual(next.session.profile.lastQuickParty, party);
  assert.deepEqual(next.session.profile.unlockedHeroes, unlocks);
  assert.deepEqual(next.session.profile.completedActs, acts);
  assert.deepEqual(next.view.partyIds, []);
  next.modes[1].onclick();
  assert.deepEqual(next.view.partyIds, [party.lead, ...party.followers]);
  assert.equal(next.view.heroId, party.lead);
  assert.equal(next.$('start').disabled, false);
  next.$('start').onclick();
  assert.equal(next.session.mode, 'exploring');
  assert.equal(next.session.g.p.id, party.lead);
  assert.deepEqual(next.session.g.party, party);
  assert.deepEqual(next.session.profile.completedActs, acts);
  assert(!next.session.profile.unlockedHeroes.includes('guan-yu'));
});
