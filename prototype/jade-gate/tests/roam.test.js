import { BLOCKERS, resolveBlockers, groundEdges, WORLD, VIEWPORT, cameraFocus, smoothCamera, DEADZONE, CAMERA_LERP_RATE, onGround, groundPoint } from "../src/domain/ground.js";
import test from "node:test";
import assert from "node:assert/strict";
import { createRoam } from "../src/domain/roam.js";
import { createCardCombat } from "../src/domain/card-combat.js";
import { GameSession } from "../src/domain/session.js";
import { SaveStore } from "../src/platform/save-store.js";
import { memoryStorage, duelPolicy, quickParty } from './helpers.js';

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
    g.start("zhao-yun", "quickplay", "jade-gate", quickParty("zhao-yun"));
    g.g.roam.field.length = 0; // locomotion clamp only — contact covered elsewhere
    // Walk long enough to hit the expanded world edge (WORLD ≥2× viewport).
    for (let i = 0; i < fps * 8; i++) g.step(1 / fps, { dx: 1, dy: 0 });
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
  assert.equal(a.p.x, groundEdges(a.p.y).right); // expanded courtyard edge
});

test("roam requires a statted encounter and parks the hero away from rivals", () => {
  const g = game();
  g.start("zhao-yun", "quickplay", "jade-gate", quickParty("zhao-yun"));
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
  g.start("zhao-yun", "quickplay", "jade-gate", quickParty("zhao-yun"));
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
  g.start("zhao-yun", "quickplay", "jade-gate", quickParty("zhao-yun"));
  assert(pursue(g));
  g.g.p.hp = 40;
  assert(g.combat.act("tea"));
  assert.equal(g.g.duel.tea, 0);
  while (g.mode === "playing") assert(g.combat.act(duelPolicy(g)));
  assert(pursue(g));
  assert.equal(g.g.duel.tea, 0); // carried into the second duel
  g.menu(); g.start("zhao-yun", "quickplay", "jade-gate", quickParty("zhao-yun")); // fresh encounter resets the pot
  assert(pursue(g));
  assert.equal(g.g.duel.tea, 1);
});

test("clearing every rival on the pass completes the encounter", () => {
  const g = game();
  g.start("zhao-yun", "quickplay", "jade-gate", quickParty("zhao-yun"));
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
  g.start("zhao-yun", "quickplay", "jade-gate", quickParty("zhao-yun"));
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
  g.start("zhao-yun", "quickplay", "jade-gate", quickParty("zhao-yun"));
  const roam = g.roam;
  assert.equal(roam.removeContacted(), null); // no contact yet
  g.g.roam.contact = 1;
  const removed = roam.removeContacted();
  assert.equal(removed.kind, "bandit"); // vanguard's second rival is the brigand
  assert.equal(g.g.roam.field.length, 1);
  assert.equal(g.g.roam.contact, -1);
});


test("Quick play rejects missing, duplicate, mismatched and unknown party heroes", () => {
  const g = game();
  assert.throws(() => g.start("zhao-yun", "quickplay"), /three distinct heroes/);
  assert.throws(() => g.start("zhao-yun", "quickplay", "jade-gate", { lead: "hu-sanniang", followers: ["lu-zhishen", "guan-yu"] }), /three distinct heroes/);
  assert.throws(() => g.start("zhao-yun", "quickplay", "jade-gate", { lead: "zhao-yun", followers: ["zhao-yun", "hu-sanniang"] }), /distinct/);
  assert.throws(() => g.start("zhao-yun", "quickplay", "jade-gate", { lead: "zhao-yun", followers: ["hu-sanniang"] }), /three distinct heroes/);
  assert.throws(() => g.start("zhao-yun", "quickplay", "jade-gate", { lead: "zhao-yun", followers: ["hu-sanniang", "no-such-hero"] }), /not available/);
});

test("party sprites trail the lead and never create contact or join a duel", () => {
  const g = game();
  const party = quickParty("zhao-yun", "hu-sanniang", "lu-zhishen");
  g.start("zhao-yun", "quickplay", "jade-gate", party);
  assert.deepEqual(g.g.party, party);
  assert.equal(g.g.roam.followers.length, 2);
  assert.equal(g.g.p.id, "zhao-yun");
  const before = g.g.roam.followers.map((f) => ({ id: f.id, x: f.x, y: f.y }));
  for (let i = 0; i < 90; i++) g.step(1 / 60, { dx: 1, dy: 0 });
  for (let i = 0; i < before.length; i++) {
    assert.equal(g.g.roam.followers[i].id, before[i].id);
    assert(Math.hypot(g.g.roam.followers[i].x - before[i].x, g.g.roam.followers[i].y - before[i].y) > 5);
  }
  assert(pursue(g));
  assert.equal(g.mode, "playing");
  assert.equal(g.g.p.id, "zhao-yun");
  assert.equal(g.g.enemies.length, 1);
  assert.equal(g.g.enemies[0].id.startsWith("zhao-yun"), false);
  assert.ok(!g.g.enemies.some((enemy) => party.followers.includes(enemy.id)));
});

test("roam world exceeds one viewport and camera follows the hero", () => {
  assert(WORLD.width >= VIEWPORT.width * 2 || WORLD.height >= VIEWPORT.height * 2);
  assert(WORLD.width > VIEWPORT.width && WORLD.height > VIEWPORT.height);
  const center = cameraFocus({ x: WORLD.width / 2, y: WORLD.height / 2 });
  assert.equal(center.x, (WORLD.width - VIEWPORT.width) / 2);
  assert.equal(center.y, (WORLD.height - VIEWPORT.height) / 2);
  assert.deepEqual(cameraFocus({ x: 0, y: 0 }), { x: 0, y: 0 });
  assert.deepEqual(cameraFocus({ x: WORLD.width, y: WORLD.height }), {
    x: WORLD.width - VIEWPORT.width,
    y: WORLD.height - VIEWPORT.height,
  });
  const pastOldEdge = cameraFocus({ x: 1600, y: 500 });
  assert(pastOldEdge.x > 0, "camera scrolls once the hero leaves the first screen");
  assert.equal(pastOldEdge.x, 1600 - VIEWPORT.width / 2);
});

test("hero can walk past the old single-screen courtyard edges", () => {
  const g = game();
  g.start("zhao-yun", "quickplay", "jade-gate", quickParty("zhao-yun"));
  assert.equal(g.g.p.x, 640);
  assert.equal(g.g.p.y, 500);
  g.g.roam.field.length = 0; // pure locomotion — rivals tested separately via pursue
  for (let i = 0; i < 60 * 5; i++) g.step(1 / 60, { dx: 1, dy: 0 });
  assert(g.g.p.x > 1145, `expected past old right edge, got ${g.g.p.x}`);
  assert(onGround(g.g.p));
  for (let i = 0; i < 60 * 4; i++) g.step(1 / 60, { dx: 0, dy: 1 });
  assert(g.g.p.y > 630, `expected past old bottom edge, got ${g.g.p.y}`);
  assert(onGround(g.g.p));
  assert(onGround(groundPoint(-999, -999)));
  assert(onGround(groundPoint(9999, 9999)));
});

test("followers remain on ground while camera would scroll with the lead", () => {
  const g = game();
  g.start("zhao-yun", "quickplay", "jade-gate", quickParty("zhao-yun", "hu-sanniang", "lu-zhishen"));
  assert.equal(g.g.roam.followers.length, 2);
  g.g.roam.field.length = 0;
  for (let i = 0; i < 60 * 5; i++) g.step(1 / 60, { dx: 1, dy: 0 });
  assert(g.g.p.x > 1145);
  const cam = cameraFocus(g.g.p);
  assert(cam.x > 0, "lead past old edge scrolls camera");
  for (const follower of g.g.roam.followers) {
    assert(onGround(follower));
    // Followers trail in world space; same camera would place them on-screen.
    assert(Math.abs(follower.x - g.g.p.x) < 400);
  }
});


test("soft camera deadzone holds when lead fidgets inside", () => {
  const focus0 = { x: WORLD.width / 2, y: WORLD.height / 2 };
  const cam0 = cameraFocus(focus0);
  // Fidget well inside the deadzone (half of DEADZONE half-size).
  const fidget = {
    x: focus0.x + DEADZONE.halfW * 0.4,
    y: focus0.y - DEADZONE.halfH * 0.4,
  };
  const held = smoothCamera(cam0, fidget, 1 / 60);
  assert.deepEqual(held, cam0);
  // Still held after several frames.
  let cam = cam0;
  for (let i = 0; i < 30; i++) cam = smoothCamera(cam, fidget, 1 / 60);
  assert.deepEqual(cam, cam0);
});

test("soft camera lerps toward cameraFocus ideal when outside deadzone", () => {
  const startFocus = { x: WORLD.width / 2, y: WORLD.height / 2 };
  let cam = cameraFocus(startFocus);
  // Jump far outside deadzone so chase engages.
  const targetFocus = { x: startFocus.x + DEADZONE.halfW + 220, y: startFocus.y };
  const ideal = cameraFocus(targetFocus);
  assert(Math.abs(ideal.x - cam.x) > 1, "ideal must differ from start cam");

  const dt = 1 / 60;
  const stepped = smoothCamera(cam, targetFocus, dt);
  // One frame moves toward ideal but does not snap (rate ~6 ⇒ ~0.1 of gap).
  const expectedT = Math.min(1, CAMERA_LERP_RATE * dt);
  assert.ok(Math.abs(stepped.x - (cam.x + (ideal.x - cam.x) * expectedT)) < 1e-9);
  assert.ok(stepped.x !== cam.x);
  assert.ok(stepped.x !== ideal.x);

  // Chase until lead re-enters the deadzone (residual ≤ halfW/halfH of ideal).
  for (let i = 0; i < 300; i++) cam = smoothCamera(cam, targetFocus, dt);
  assert.ok(Math.abs(cam.x - ideal.x) <= DEADZONE.halfW + 1e-6);
  assert.ok(Math.abs(cam.y - ideal.y) <= DEADZONE.halfH + 1e-6);
  assert.ok(Math.abs(cam.x - ideal.x) < Math.abs(cameraFocus(startFocus).x - ideal.x));
});

test("soft camera clamps to WORLD edges like cameraFocus", () => {
  const cornerFocus = { x: WORLD.width, y: WORLD.height };
  const ideal = cameraFocus(cornerFocus);
  assert.deepEqual(ideal, {
    x: WORLD.width - VIEWPORT.width,
    y: WORLD.height - VIEWPORT.height,
  });
  // Corner focus sits at viewport edge vs clamped cam → always outside deadzone,
  // so high-rate lerp reaches the clamped ideal without overshoot.
  let cam = cameraFocus({ x: WORLD.width / 2, y: WORLD.height / 2 });
  for (let i = 0; i < 60; i++) cam = smoothCamera(cam, cornerFocus, 1 / 30, { rate: 20 });
  assert.ok(Math.abs(cam.x - ideal.x) < 1e-6);
  assert.ok(Math.abs(cam.y - ideal.y) < 1e-6);
  assert.ok(cam.x <= ideal.x + 1e-9 && cam.y <= ideal.y + 1e-9);
  // Null prev snaps to ideal (also clamped).
  assert.deepEqual(smoothCamera(null, { x: 0, y: 0 }, 0), cameraFocus({ x: 0, y: 0 }));
});

test("smoothCamera uses cameraFocus as the chase target", () => {
  const focus = { x: 1600, y: 500 };
  const ideal = cameraFocus(focus);
  // Far previous cam forces chase; large dt with high rate snaps to ideal.
  const prev = { x: 0, y: 0 };
  const snapped = smoothCamera(prev, focus, 10, { rate: 100 });
  assert.deepEqual(snapped, ideal);
});

function assertClear(point) {
  assert(onGround(point));
  for (const b of BLOCKERS)
    assert(!(point.x > b.x-18 && point.x < b.x+b.w+18 &&
      point.y > b.y-18 && point.y < b.y+b.h+18), `wall penetration at ${point.x},${point.y}`);
}

function emptyPass() {
  const g = game();
  g.start("zhao-yun", "quickplay", "jade-gate", quickParty("zhao-yun"));
  g.g.roam.field.length = 0;
  return g;
}

function walk(g, seconds, input) {
  for (let i = 0; i < seconds * 60; i++) {
    g.step(1/60, input);
    for (const point of [g.g.p, ...g.g.roam.followers]) assertClear(point);
  }
}

test("world AABBs block wall bodies but leave a traversable corridor", () => {
  assert(BLOCKERS.length >= 2);
  for (const b of BLOCKERS) {
    for (const key of ['x', 'y', 'w', 'h']) assert(Number.isFinite(b[key]));
    assert(b.w > 0 && b.h > 0);
  }
  assert(BLOCKERS[0].y + BLOCKERS[0].h + 36 < BLOCKERS[1].y);
  assertClear(resolveBlockers(1450, 700));
  assert.notDeepEqual(resolveBlockers(1450, 700), { x: 1450, y: 700 });
  assert.deepEqual(resolveBlockers(1450, 500), { x: 1450, y: 500 });
  // A long move cannot skip the entire wall, including for follower steps.
  assert.equal(resolveBlockers(1800, 700, 18, { x: 1300, y: 700 }).x, 1382);
  assert.equal(resolveBlockers(1200, 700, 18, { x: 1600, y: 700 }).x, 1518);
  assert.equal(resolveBlockers(1450, 900, 18, { x: 1450, y: 500 }).y, 542);
});

test("lead stops at walls, slides, and dash and wind cannot cross", () => {
  const g = emptyPass();
  walk(g, 2/3, { dy: 1 }); // y=700, below the opening
  walk(g, 4, { dx: 1 });
  assert.equal(g.g.p.x, 1382);
  g.roam.act('dodge');
  walk(g, 1, { dx: 1 });
  assert.equal(g.g.p.x, 1382);
  g.g.hazards = ['wind-gust'];
  walk(g, 2, {});
  assert(g.g.p.x <= 1382);
  g.g.hazards = [];
  const before = g.g.p.y;
  walk(g, .5, { dx: 1, dy: 1 });
  assert.equal(g.g.p.x, 1382);
  assert(g.g.p.y > before);
});

test("lead and cosmetic followers route through the gap past the barrier", () => {
  const g = emptyPass();
  walk(g, 2/3, { dy: 1 });
  walk(g, 4, { dx: 1 });
  assert.equal(g.g.p.x, 1382); // straight through the wall fails
  walk(g, 2/3, { dy: -1 }); // return to the corridor
  walk(g, 2, { dx: 1 });
  assert(g.g.p.x > 1800); // passage through the gap succeeds
  walk(g, 2, {}); // let the trail catch up
  assert.equal(g.g.roam.followers.length, 2);
  for (const follower of g.g.roam.followers) assert(follower.x > 1518);
});
