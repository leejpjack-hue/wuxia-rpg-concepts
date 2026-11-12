import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DuelView } from "../src/presentation/duel-view.js";
import { translate } from "../src/locales/i18n.js";
import { DUEL_ENEMIES } from "../src/content/duels.js";
import { session, quickParty } from "./helpers.js";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const css = readFileSync(new URL("../duel.css", import.meta.url), "utf8");

test("the first-duel readout is the existing telegraph, placed on the choice", () => {
  const rival = html.slice(html.indexOf('id="enemy-card"'), html.indexOf('class="turn-panel"'));
  const choice = html.slice(html.indexOf('id="tutor-duel"'), html.indexOf('class="duel-actions"'));
  assert.equal(rival.includes('id="enemy-intent"'), false);
  assert.equal(rival.includes('id="card-assist"'), true);
  assert.match(choice, /id="intent-badge"/);
  assert.match(choice, /id="enemy-intent"/);
  assert.match(choice, /id="intent-detail"/);
  assert.match(choice, /id="intent-next"/);
  assert.match(choice, /id="tutor-duel-done"/);
  assert.match(choice, /id="tutor-skip-duel"/);
  assert.match(html, /href="trailer\.html"/);
  assert.match(css, /#play\[data-telegraph="first"\] \.intent-badge strong/);
  assert.equal(/\.intent-badge[\s\S]*?animation/.test(css.slice(css.indexOf(".intent-badge"), css.indexOf(".duel-versus"))), false);
});

test("a fresh first duel shows the engine move and exact damage before a choice", () => {
  const game = session();
  game.start("zhao-yun", "quickplay", "jade-gate", quickParty("zhao-yun"));
  const index = meleeIndex(game);
  assert.equal(game.beginDuel(index), true);
  const { nodes, view } = mount(game);
  const intent = game.combat.intent();
  assert.equal(game.g.encounterIndex, 0);
  assert.equal(game.g.duel.defeated, 0);
  assert.equal(game.g.duel.openingStun, false);
  assert.ok(intent.damage > 0);
  assert.equal(nodes["play"].dataset.telegraph, "first");
  assert.equal(nodes["intent-badge"].dataset.intent, intent.kind);
  assert.equal(nodes["enemy-intent"].textContent, translate(`${intent.name} · ${intent.damage} damage`));
  assert.equal(nodes["intent-detail"].textContent, translate(intent.description));
  assert.match(nodes["enemy-intent"].textContent, new RegExp(String(intent.damage)));
  assert.match(nodes["intent-detail"].textContent, new RegExp(String(intent.damage)));
  const enemy = game.g.enemies[0];
  assert.equal(nodes["enemy-focus"].textContent, translate(`Focus ${enemy.focus || 0}/${enemy.specialAt}`));
  assert.equal(nodes["enemy-focus"].textContent, `気勢 ${enemy.focus || 0}/${enemy.specialAt}`);
  assert.equal(game.profile.settings.language, "ja");
  assert.equal(game.profile.settings.tutorSeenDuel, false);

  game.setSetting("language", "en");
  assert.equal(nodes["enemy-intent"].textContent, `${intent.name} · ${intent.damage} damage`);
  assert.equal(nodes["intent-detail"].textContent, intent.description);
  assert.equal(view.busy, false);
});

test("guard still resolves from the telegraphed damage, and reduced motion matches", () => {
  const plain = openFirstDuel(false);
  const reduced = openFirstDuel(true);
  const plainIntent = plain.game.combat.intent();
  const reducedIntent = reduced.game.combat.intent();
  assert.deepEqual(reduced.game.combat.preview("guard"), plain.game.combat.preview("guard"));
  assert.deepEqual(reduced.game.combat.preview("attack"), plain.game.combat.preview("attack"));
  assert.equal(reducedIntent.damage, plainIntent.damage);
  assert.equal(reducedIntent.kind, plainIntent.kind);

  const before = plain.game.g.p.hp;
  const expected = plainIntent.hits * Math.round(plainIntent.each * 0.2);
  assert.equal(plain.game.combat.act("guard"), true);
  assert.equal(reduced.game.combat.act("guard"), true);
  assert.equal(before - plain.game.g.p.hp, expected);
  assert.equal(plain.game.g.duel.lastIncoming, expected);
  assert.equal(reduced.game.g.p.hp, plain.game.g.p.hp);
  assert.equal(reduced.game.g.duel.lastIncoming, plain.game.g.duel.lastIncoming);
  assert.equal(reduced.game.g.duel.round, plain.game.g.duel.round);
  assert.equal(plain.game.g.enemies[0].hp, reduced.game.g.enemies[0].hp);

  const next = plain.game.combat.intent();
  assert.equal(plain.nodes["play"].dataset.telegraph, "first");
  assert.equal(plain.nodes["enemy-intent"].textContent, translate(`${next.name} · ${next.damage} damage`, "en"));
  assert.match(plain.nodes["enemy-intent"].textContent, new RegExp(String(next.damage)));
  assert.equal(reduced.nodes["enemy-intent"].textContent, plain.nodes["enemy-intent"].textContent);
  assert.equal(reduced.nodes["intent-detail"].textContent, plain.nodes["intent-detail"].textContent);
});

test("later duels keep the same readout without the opening emphasis", () => {
  const { game, nodes } = openFirstDuel(false);
  game.g.duel.defeated = 1;
  game.bus.emit("card:changed");
  const intent = game.combat.intent();
  assert.equal(nodes["play"].dataset.telegraph, "ready");
  assert.equal(nodes["enemy-intent"].textContent, `${intent.name} · ${intent.damage} damage`);
  assert.match(nodes["intent-detail"].textContent, new RegExp(String(intent.damage)));
});

function openFirstDuel(reducedMotion) {
  const game = session();
  game.setSetting("reducedMotion", reducedMotion);
  game.setSetting("language", "en");
  game.start("zhao-yun", "quickplay", "jade-gate", quickParty("zhao-yun"));
  assert.equal(game.beginDuel(meleeIndex(game)), true);
  const mounted = mount(game);
  return { game, ...mounted };
}

function meleeIndex(game) {
  const index = game.g.roam.field.findIndex((rival) => !rival.ranged && !DUEL_ENEMIES[rival.kind]?.boss);
  assert.ok(index >= 0);
  return index;
}

function mount(game) {
  const nodes = new Map();
  const element = () => ({
    children: [], textContent: "", hidden: false, disabled: false, dataset: {},
    style: { setProperty() {} },
    classList: { add() {}, remove() {}, toggle() {} },
    setAttribute() {}, getAttribute() { return null; }, addEventListener() {},
    replaceChildren() {}, appendChild(child) { this.children.push(child); },
    querySelector() { return null; }, querySelectorAll() { return []; },
    focus() {}, scrollIntoView() {},
  });
  const document = {
    getElementById: (id) => nodes.get(id) || null,
    querySelectorAll: () => [],
    addEventListener() {}, removeEventListener() {},
    createElement: element,
  };
  for (const match of html.matchAll(/\bid="([^"]+)"/g)) nodes.set(match[1], element());
  const view = new DuelView(game, document);
  return { nodes: Object.fromEntries(nodes), view };
}
