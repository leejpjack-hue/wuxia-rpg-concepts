import { groundEdges } from "../src/domain/ground.js";
import test from "node:test";
import assert from "node:assert/strict";
import { createRoam } from "../src/domain/roam.js";
import { createCardCombat } from "../src/domain/card-combat.js";
import { GameSession } from "../src/domain/session.js";
import { SaveStore } from "../src/platform/save-store.js";
import { memoryStorage, duelPolicy } from "./helpers.js";

const game = (storage = memoryStorage()) =>
  new GameSession(new SaveStore(storage), { combatFactory: createCardCombat });

/** Chase the nearest rival until contact starts the duel. */
function pursue(g, limit = 2400) {
  let steps = 0;
  while (g.mode === "exploring" && steps++ < limit) {
    const p = g.g.p;
    let target = null;
    for (const enemy of g.g.roam.field) {
      const d = Math.hypot(enemy.x - p.x, enemy.y - p.y);
      if (!target || d < target.d) target = { enemy, d };
    }
    if (!target) break;
    const dx = target.enemy.x - p.x,
      dy = target.enemy.y - p.y,
      len = Math.hypot(dx, dy) || 1;
    g.step(1 / 60, { dx: dx / len, dy: dy / len });
  }
  return steps < limit;
}

test("roaming simulation is identical at 30 and 120 FPS and clamps to the pass", () => {
  function run(fps) {
    const g = game();
    g.start("zhao-yun", "quickplay");
    for (let i = 0; i < fps * 2; i++) g.step(1 / fps, { dx: 1, dy: 0 });
    // JSON drops the seeded rng functions, which never compare by reference.
    return JSON.stringify({
      p: { x: g.g.p.x, y: g.g.p.y, dx: g.g.p.dx },
      field: g.g.roam.field,
      contact: g.g.roam.contact,
      mode: g.mode,
    });
  }
  const a = JSON.parse(run(30)),
    b = JSON.parse(run(120));
  assert.deepEqual(a, b);
  assert.equal(a.mode, "exploring");
  assert.equal(a.p.x, groundEdges(a.p.y).right); // painted courtyard edge
});

test("roam requires a statted encounter and parks the hero away from rivals", () => {
  const g = game();
  g.start("zhao-yun", "quickplay");
  assert.equal(g.g.roam.field.length, 2);
  assert.equal(g.g.p.x, 640);
  assert.equal(g.g.p.y, 500);
  for (const enemy of g.g.roam.field)
    assert(Math.hypot(enemy.x - g.g.p.x, enemy.y - g.g.p.y) > 200);
  assert.throws(
    () => createRoam(g.g, g.bus, { encounter: { id: "unknown" } }),
    /no arena rivals/,
  );
});

test("walking into a rival begins that duel; winning returns to the pass", () => {
  const g = game();
  g.start("zhao-yun", "quickplay");
  assert(pursue(g));
  assert.equal(g.mode, "playing");
  const kind = g.g.roam.field[g.g.roam.contact].kind;
  assert.equal(g.g.enemies[0].kind, kind);
  let turns = 0;
  while (g.mode === "playing" && turns++ < 100)
    assert(g.combat.act(duelPolicy(g)));
  assert.equal(g.mode, "exploring");
  assert.equal(g.g.roam.field.length, 1);
  assert.equal(g.g.duel.defeated, 1);
});

test("tea persists across duels within one encounter", () => {
  const g = game();
  g.start("zhao-yun", "quickplay");
  assert(pursue(g));
  g.g.p.hp = 40;
  assert(g.combat.act("tea"));
  assert.equal(g.g.duel.tea, 0);
  while (g.mode === "playing") assert(g.combat.act(duelPolicy(g)));
  assert(pursue(g));
  assert.equal(g.g.duel.tea, 0); // carried into the second duel
  g.menu(); g.start("zhao-yun", "quickplay"); // fresh encounter resets the pot
  assert(pursue(g));
  assert.equal(g.g.duel.tea, 1);
});

test("clearing every rival on the pass completes the encounter", () => {
  const g = game();
  g.start("zhao-yun", "quickplay");
  let guard = 0;
  while (!["upgrade", "victory", "defeat"].includes(g.mode) && guard++ < 4000) {
    if (g.mode === "exploring") assert(pursue(g), "pursuit stalled");
    else if (g.mode === "playing") assert(g.combat.act(duelPolicy(g)));
  }
  assert.equal(g.mode, "upgrade"); // vanguard is not the final encounter
  assert.equal(g.g.encounterIndex, 0);
  assert.equal(g.g.roam.field.length, 0);
});

test("pausing from the pass freezes roaming and returns to the pass", () => {
  const g = game();
  g.start("zhao-yun", "quickplay");
  g.pause();
  assert.equal(g.mode, "paused");
  const frozen = JSON.stringify(g.g.roam);
  for (let i = 0; i < 120; i++) g.step(1 / 60, { dx: 1, dy: 1 });
  assert.equal(JSON.stringify(g.g.roam), frozen);
  g.resume();
  assert.equal(g.mode, "exploring");
  g.pause(); g.pause(); // paused toggles back
  assert.equal(g.mode, "exploring");
});

test("removeContacted only removes the contacted rival", () => {
  const g = game();
  g.start("zhao-yun", "quickplay");
  const roam = g.roam;
  assert.equal(roam.removeContacted(), null); // no contact yet
  g.g.roam.contact = 1;
  const removed = roam.removeContacted();
  assert.equal(removed.kind, "guard");
  assert.equal(g.g.roam.field.length, 1);
  assert.equal(g.g.roam.contact, -1);
});
