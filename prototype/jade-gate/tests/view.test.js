import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { GameView } from '../src/presentation/view.js';
import { GameSession } from '../src/domain/session.js';
import { createCardCombat } from '../src/domain/card-combat.js';
import { SaveStore } from '../src/platform/save-store.js';
import { memoryStorage } from './helpers.js';

// Minimal injected document adapter. IDs come from the shipped HTML, so stale
// selectors fail here too. Layout, focus traversal and real clicks are browser-checked.
function fixture() {
  const elements = new Map();
  const document = {
    getElementById: id => elements.get(id) || null,
    querySelectorAll: () => [],
    createElement: () => element(),
  };
  function element() {
    return {
      children: [], textContent: '', hidden: false, inert: false, disabled: false,
      classList: { add() {}, toggle() {} }, style: {},
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
  document.body = element();
  const session = new GameSession(new SaveStore(memoryStorage()), { combatFactory: createCardCombat });
  const view = new GameView(session, document);
  view.setReady(true);
  return { session, view, $: document.getElementById };
}
test('fresh menu is unobstructed and Quick play shows the battle instead of a defeat modal', () => {
  const { session, view, $ } = fixture();
  assert.equal($('overlay').hidden, true); assert.equal($('selection').hidden, false);
  assert.equal($('selection').inert, false);
  view.runMode = 'quickplay'; $('start').onclick();
  assert.equal(session.mode, 'playing'); assert.equal($('play').hidden, false);
  assert.equal($('play').inert, false); assert.equal($('selection').hidden, true);
  assert.equal($('overlay').hidden, true); assert.equal($('app-status').textContent, '');
});
test('campaign dialogue buttons work against actual HTML IDs and enter the card battle', () => {
  const { session, $ } = fixture(); $('start').onclick();
  assert.equal(session.mode, 'dialogue'); assert.equal($('overlay').hidden, false);
  assert.equal($('modal-actions').children.length, 2);
  $('modal-actions').children[0].onclick();
  assert.equal($('modal-title').textContent, 'Zhao Yun');
  $('modal-actions').children[0].onclick();
  assert.equal(session.mode, 'playing'); assert.equal($('overlay').hidden, true);
  assert.equal($('play').hidden, false); assert.equal($('app-status').textContent, '');
});
test('pause, resume, and return to roster restore visibility and interaction', () => {
  const { session, view, $ } = fixture(); view.runMode = 'quickplay'; $('start').onclick();
  $('pause').onclick(); assert.equal(session.mode, 'paused'); assert.equal($('play').inert, true);
  $('modal-actions').children[0].onclick(); assert.equal(session.mode, 'playing');
  assert.equal($('play').inert, false); assert.equal($('overlay').hidden, true);
  $('pause').onclick(); $('modal-actions').children[1].onclick();
  assert.equal(session.mode, 'menu'); assert.equal($('selection').inert, false);
  assert.equal($('selection').hidden, false); assert.equal($('play').hidden, true);
  assert.equal($('overlay').hidden, true);
});
