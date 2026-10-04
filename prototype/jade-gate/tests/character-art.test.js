import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { HEROES } from "../src/content/heroes.js";
import { characterArt } from "../src/presentation/character-art.js";
import { DuelView } from "../src/presentation/duel-view.js";
import { session, quickParty } from "./helpers.js";

test("every hero resolves an existing selection and duel portrait", () => {
  for (const hero of HEROES) for (const surface of ["selection", "duel"]) {
    const art = characterArt(hero, surface);
    assert.ok(existsSync(new URL(`../${art.src}`, import.meta.url)), `${hero.id}: ${surface} portrait missing`);
    if (hero.cinematicArt && surface === "duel") {
      assert.equal(art.fit, "contain");
      assert.equal(art.position, "50% 50%");
    }
  }
});

test("selection crop offsets stay separate from transparent duel bodies", () => {
  for (const id of ["diaochan", "yang-yuhuan", "empress-yixiu", "wang-xifeng"]) {
    const hero = HEROES.find(h => h.id === id);
    const art = characterArt(hero);
    assert.equal(art.src, hero.keyArt);
    assert.notEqual(art.position, "50% 18%");
    assert.equal(characterArt(hero, "duel").position, "50% 50%");
  }
});

test("actual duel render displays every new hero and restores the image after a failed old source", () => {
  const elements = new Map();
  const node = () => ({ hidden: false, dataset: {}, style: { setProperty() {} },
    setAttribute() {}, replaceChildren() {}, getAttribute(name) { return this[name]; } });
  const view = Object.create(DuelView.prototype);
  view.$ = id => { if (!elements.has(id)) elements.set(id, node()); return elements.get(id); };
  view.document = { createElement: node, querySelectorAll: () => [] };
  view.t = text => text;
  for (const hero of HEROES.filter(h => h.hidden)) {
    view.session = session();
    view.session.start(hero.id, "quickplay", "jade-gate", quickParty(hero.id));
    view.session.beginDuel(0);
    const img = view.$("hero-image");
    img.src = `assets/${hero.id}.png`; img.hidden = true;
    view.render();
    assert.equal(img.src, hero.cinematicArt);
    assert.equal(img.hidden, false, hero.id);
    assert.equal(img.style.objectFit, "contain");
    assert.equal(img.style.objectPosition, "50% 50%");
    assert.ok(existsSync(new URL(`../${view.$("enemy-image").src}`, import.meta.url)));
  }
});
