import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { GameSession } from "../src/domain/session.js";
import { createCardCombat } from "../src/domain/card-combat.js";
import { createRoam } from "../src/domain/roam.js";
import { SaveStore } from "../src/platform/save-store.js";
import { WORLD, BLOCKERS, onGround } from "../src/domain/ground.js";
import { ROAM_SCENES } from "../src/content/roam-scenes.js";
import { RoamView } from "../src/presentation/roam-view.js";
import { routeMapModel } from "../src/presentation/route-map.js";
import { loadSheetManifest } from "../src/platform/sheet-anim.js";
import { memoryStorage, quickParty } from "./helpers.js";
import manifest from "../docs/asset-manifest.json" with { type: "json" };

test("the merged route retains the south spur and reaches the distant Warden without wall clipping", () => {
  const session = new GameSession(new SaveStore(memoryStorage()), { combatFactory: createCardCombat });
  session.start("zhao-yun", "quickplay", "jade-gate", quickParty("zhao-yun"));
  const contacts = [];
  const roam = createRoam(session.g, { emit: (type, payload) => {
    if (type === "roam:contact") contacts.push(payload);
  } }, { encounter: { id: "warden" } });
  assert.equal(WORLD.width, 10240);
  assert(roam.field[0].x > WORLD.width * .9);
  const route = [[1800, 500], [1900, 1050], [1900, 500], [3100, 500],
    [3200, 695], [3700, 695], [4900, 695], [5000, 545], [5500, 545],
    [6700, 545], [6800, 705], [7400, 705], [8500, 705], [8600, 590],
    [9250, 590], [9650, 650]];
  let total = 0;
  for (const [x, y] of route) {
    let steps = 0;
    while (!contacts.length && Math.hypot(x - session.g.p.x, y - session.g.p.y) > 8 && steps++ < 1000) {
      const dx = x - session.g.p.x, dy = y - session.g.p.y, len = Math.hypot(dx, dy);
      roam.step(1 / 60, { dx: dx / len, dy: dy / len }); total++;
      for (const point of [session.g.p, ...session.g.roam.followers]) {
        assert(onGround(point));
        for (const wall of BLOCKERS) assert(!(point.x > wall.x - 18 && point.x < wall.x + wall.w + 18 &&
          point.y > wall.y - 18 && point.y < wall.y + wall.h + 18), `clipped wall at ${point.x},${point.y}`);
      }
    }
    assert(steps < 1000, `route blocked at ${session.g.p.x},${session.g.p.y}`);
  }
  for (let step = 0; !contacts.length && step < 300; step++) {
    const enemy = roam.field[0];
    const dx = enemy.x - session.g.p.x, dy = enemy.y - session.g.p.y, len = Math.hypot(dx, dy);
    roam.step(1 / 60, { dx: dx / len, dy: dy / len });
  }
  assert.deepEqual(contacts.map(c => c.kind), ["warden"]);
  assert(session.g.p.x > 9000);
  assert(total > 1500);
});

test("all playable acts switch to their own existing ground art at a constant scale while scrolling", () => {
  const arena = { style: {}, dataset: {} };
  const view = Object.create(RoamView.prototype);
  view.$ = () => arena;
  for (const [actId, scene] of Object.entries(ROAM_SCENES)) {
    for (const id of [scene.art, scene.blocker]) {
      const row = manifest.find(row => row.id === id);
      assert(row, `manifest lacks ${id}`);
      const png = readFileSync(new URL(`../${row.file}`, import.meta.url));
      assert.equal(png.subarray(1, 4).toString(), "PNG");
    }
    view.session = { act: { id: actId } };
    view.applyCamera({ x: 0, y: 0 });
    assert.equal(arena.dataset.stage, `assets/${scene.art}.png`);
    const scale = arena.style.backgroundSize;
    const start = arena.style.backgroundPosition;
    view.applyCamera({ x: 8500, y: 600 });
    assert.equal(arena.style.backgroundSize, scale);
    assert.notEqual(arena.style.backgroundPosition, start);
    assert.equal(arena.style.backgroundRepeat, "repeat-x");
  }
  assert.equal(new Set(Object.values(ROAM_SCENES).map(s => s.art)).size, 4);
});

test("route map follows the hero and remaining enemies without changing encounter state", () => {
  const g = { p: { x: 640, y: 500 }, roam: {
    followers: [{ x: 592, y: 510 }], field: [{ x: 9650, y: 650, boss: true }, { x: 880, y: 400 }],
  } };
  const before = JSON.stringify(g);
  const start = routeMapModel(g);
  assert.equal(JSON.stringify(g), before);
  assert.equal(start.rivals.length, 2);
  assert.equal(start.followers.length, 1);
  assert(start.rivals[0].boss);
  g.p.x = 5000; g.roam.field.pop();
  const next = routeMapModel(g, { x: 4500, y: 300 });
  assert(next.player.x > start.player.x);
  assert(next.camera.x > start.camera.x);
  assert.equal(next.rivals.length, 1);
});

test("restored character approval keeps clean Zhao Yun and Hu Sanniang sprites while walking", () => {
  for (const id of ["zhao-yun", "hu-sanniang"]) {
    assert.equal(loadSheetManifest(manifest, id), null);
    const classes = new Set();
    const node = { src: `assets/${id}-sprite.png`, style: {}, classList: {
      toggle: (name, active) => active ? classes.add(name) : classes.delete(name), remove: name => classes.delete(name),
    } };
    const view = Object.create(RoamView.prototype);
    view.manifest = manifest; view.sheetByHero = new Map();
    view.applyActorSheet(node, id, true);
    assert.equal(node.src, `assets/${id}-sprite.png`);
    assert(classes.has("original-walk"));
    view.applyActorSheet(node, id, false);
    assert(!classes.has("original-walk"));
  }
});
