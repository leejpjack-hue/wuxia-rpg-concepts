import test from "node:test";
import assert from "node:assert/strict";
import { RoamView } from "../src/presentation/roam-view.js";

function fakeView(mode, score) {
  const els = { roam: {}, "roam-score": {} };
  return {
    els,
    view: {
      session: { mode, g: score === null ? {} : { roam: { field: [] }, score } },
      $: (id) => els[id] ?? {},
      t: (x) => x,
    },
  };
}

test("the roam renown HUD keeps step with a duel won under a modal screen", () => {
  // Regression: a duel won during the upgrade/map/waystation screen used to
  // leave the roam HUD one fight behind the duel HUD (it read like a renown
  // drop when the two displays were compared). sync() must update the renown
  // even when the roam screen itself is inactive.
  const { els, view } = fakeView("upgrade", 540);
  RoamView.prototype.sync.call(view);
  assert.equal(els.roam.hidden, true, "roam screen stays hidden under the modal");
  assert.equal(els["roam-score"].textContent, 540, "renown HUD shows the won duel's score");
});

test("the renown HUD also syncs on the map and waystation screens", () => {
  for (const mode of ["map", "waystation", "paused", "menu"]) {
    const { els, view } = fakeView(mode, 2580);
    RoamView.prototype.sync.call(view);
    assert.equal(els["roam-score"].textContent, 2580, `${mode} keeps the renown in step`);
  }
});

test("without a run the inactive screen updates nothing and throws nothing", () => {
  const { els, view } = fakeView("menu", null);
  RoamView.prototype.sync.call(view);
  assert.equal(els.roam.hidden, true);
  assert.equal(els["roam-score"].textContent, undefined);
});
