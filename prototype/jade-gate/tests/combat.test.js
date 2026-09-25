import test from "node:test";
import assert from "node:assert/strict";
import { HEROES } from "../src/content/heroes.js";
import { inArc } from "../src/domain/math.js";
import { makePlayer, takeDamage } from "../src/domain/player.js";
import { session, clearEncounter } from "./helpers.js";
import { isInShallows, SHALLOWS_SPEED_FACTOR } from "../src/domain/combat.js";
import {
  createRoam,
  PLAYER_SPEED,
  SHALLOWS_ROAM_SPEED_FACTOR,
} from "../src/domain/roam.js";

const input = (actions = [], keys = []) => ({ actions, keys: new Set(keys) });

test("weapon hit geometry respects facing, reach, and angle wrapping", () => {
  const p = { x: 0, y: 0, facing: Math.PI - 0.1 };
  assert(inArc(p, { x: -100, y: -2, radius: 20 }, 120));
  assert(!inArc(p, { x: 100, y: 0, radius: 20 }, 120));
  assert(!inArc(p, { x: -200, y: 0, radius: 20 }, 120));
});

test("damage immunity prevents repeated damage and HP never becomes negative", () => {
  const p = makePlayer(HEROES[0]);
  p.invulnerable = 0.1;
  assert(!takeDamage(p, 20));
  assert.equal(p.hp, 120);
  p.invulnerable = 0;
  assert(takeDamage(p, 200));
  assert.equal(p.hp, 0);
  assert(!takeDamage(p, 20));
});

for (const hero of HEROES)
  test(`${hero.name}: technique spends Flow, damages, and respects cooldown`, () => {
    const game = session();
    game.start(hero.id, "quickplay");
    const p = game.g.p;
    game.g.enemies = [
      { ...game.g.enemies[0], x: p.x + 70, y: p.y, hp: 1000, maxHp: 1000 },
    ];
    game.step(1 / 60, input(["technique"]));
    assert(game.g.enemies[0].hp < 1000);
    assert(p.flow < 40);
    assert(p.specialCD > 0);
    const hp = game.g.enemies[0].hp;
    game.combat.special();
    assert.equal(game.g.enemies[0].hp, hp);
  });

test("low Flow blocks techniques without applying damage or cooldown", () => {
  const game = session();
  game.start("zhao-yun", "quickplay");
  game.g.p.flow = 0;
  const hp = game.g.enemies[0].hp;
  game.combat.special();
  assert.equal(game.g.enemies[0].hp, hp);
  assert.equal(game.g.p.specialCD, 0);
});

test("third swing is a finisher regardless of how many enemies the prior swing hit", () => {
  const game = session();
  game.start("hu-sanniang", "quickplay");
  const g = game.g;
  g.enemies = [{ ...g.enemies[0], x: 690, y: 500, hp: 1000 }];
  const damage = [];
  game.bus.on("combat:hit", (e) => damage.push(e.damage));
  for (let i = 0; i < 3; i++) {
    g.p.attackCD = 0;
    g.enemies[0].x = 690;
    game.combat.attack();
  }
  assert.deepEqual(damage, [19, 19, 25]);
});

test("perfect evades grant Flow once per attack; damage immunity alone does not", () => {
  const game = session();
  game.start("zhao-yun", "quickplay");
  game.combat.dodge();
  game.combat.hurt(30, "one");
  game.combat.hurt(30, "one");
  assert.equal(game.g.p.hp, 120);
  assert.equal(game.g.p.flow, 50);
  game.g.p.perfectWindow = 0;
  game.combat.hurt(30, "two");
  assert.equal(game.g.p.flow, 50);
});

test("boss transitions phase once, resists light interruption, and accepts technique interruption", () => {
  const game = session();
  game.start("lu-zhishen", "quickplay");
  clearEncounter(game);
  game.chooseDiscipline("power");
  clearEncounter(game);
  game.chooseDiscipline("power");
  const boss = game.g.enemies.find((e) => e.type === "boss");
  let phases = 0;
  game.bus.on("boss:phase", () => phases++);
  boss.hp = boss.maxHp * 0.49;
  game.step(1 / 60, input());
  game.step(1 / 60, input());
  assert.equal(boss.phase, 1);
  assert.equal(phases, 1);
  boss.wind = 0.8;
  boss.target = { x: 640, y: 500, r: 80 };
  game.combat.hit(boss, 1);
  assert.equal(boss.wind, 0.8);
  game.combat.hit(boss, 1, 40, 0.8);
  assert.equal(boss.wind, 0);
  assert.equal(boss.burst, 0);
});

test("enemy telegraphs inflict damage and arrows resolve collisions", () => {
  const game = session();
  game.start("zhao-yun", "quickplay");
  const e = game.g.enemies[0];
  e.wind = 0.001;
  e.target = { x: 640, y: 500, r: 64 };
  game.step(1 / 60, input());
  assert.equal(game.g.p.hp, 106);
  game.g.p.invulnerable = 0;
  game.g.shots = [
    { id: "arrow", x: 640, y: 500, vx: 0, vy: 0, life: 1, damage: 12 },
  ];
  game.step(1 / 60, input());
  assert.equal(game.g.p.hp, 94);
  assert.equal(game.g.shots.length, 0);
});

test("pause stops simulation and defeat can restart cleanly", () => {
  const game = session();
  game.start("zhao-yun", "quickplay");
  game.pause();
  const time = game.g.time;
  game.step(1, input(["technique"]));
  assert.equal(game.g.time, time);
  assert.equal(game.g.p.flow, 40);
  game.resume();
  game.combat.hurt(500);
  game.step(1 / 60, input());
  assert.equal(game.mode, "defeat");
  game.start("zhao-yun", "quickplay");
  assert.equal(game.g.p.hp, 120);
  assert.equal(game.g.score, 0);
});

test("dodge input survives hit-stop but does not leak across pause", () => {
  const game = session();
  game.start("zhao-yun", "quickplay");
  game.g.hitStop = 0.025;
  game.step(1 / 60, input(["dodge"]));
  game.step(1 / 60, input());
  game.step(1 / 60, input());
  assert(game.g.p.dodgeCD > 0);
  game.g.p.dodgeCD = 0;
  game.g.hitStop = 0.025;
  game.step(1 / 60, input(["dodge"]));
  game.pause();
  game.resume();
  for (let i = 0; i < 3; i++) game.step(1 / 60, input());
  assert.equal(game.g.p.dodgeCD, 0);
});

test("water-shallows movement impedance: domain-side movement slowdown and zone detection", () => {
  // Test 1: Normal surface vs shallows slowdown
  const normalGame = session();
  normalGame.start("zhao-yun", "quickplay");
  normalGame.g.p.x = 500;
  normalGame.g.p.y = 500;
  normalGame.g.shallows = false;
  normalGame.step(0.5, input([], ["KeyD"]));
  const normalDist = normalGame.g.p.x - 500;

  const shallowGame = session();
  shallowGame.start("zhao-yun", "quickplay");
  shallowGame.g.p.x = 500;
  shallowGame.g.p.y = 500;
  shallowGame.g.shallows = true;
  shallowGame.step(0.5, input([], ["KeyD"]));
  const shallowDist = shallowGame.g.p.x - 500;

  assert(shallowGame.g.p.inShallows, "Player should be flagged as inShallows");
  assert(!normalGame.g.p.inShallows, "Player on dry ground should not be inShallows");
  assert(shallowDist < normalDist, "Movement in shallows must be slower than normal");
  const expectedDist = normalDist * SHALLOWS_SPEED_FACTOR;
  assert(Math.abs(shallowDist - expectedDist) < 1e-4, `Expected dist ${expectedDist}, got ${shallowDist}`);

  // Test 2: Spatial shallows zone
  const zoneGame = session();
  zoneGame.start("zhao-yun", "quickplay");
  zoneGame.g.shallowsZone = { minY: 450 };

  // Position above water zone (y = 400)
  zoneGame.g.p.x = 500;
  zoneGame.g.p.y = 400;
  assert(!isInShallows(zoneGame.g, zoneGame.g.p));
  zoneGame.step(0.1, input([], ["KeyD"]));
  assert(!zoneGame.g.p.inShallows);

  // Position inside water zone (y = 500)
  zoneGame.g.p.x = 500;
  zoneGame.g.p.y = 500;
  assert(isInShallows(zoneGame.g, zoneGame.g.p));
  zoneGame.step(0.1, input([], ["KeyD"]));
  assert(zoneGame.g.p.inShallows);

  // Test 3: Hazards list tag "shallows" activates impedance
  const hazardGame = session();
  hazardGame.start("zhao-yun", "quickplay");
  hazardGame.g.hazards = ["shallows", "razor-wire"];
  assert(isInShallows(hazardGame.g, hazardGame.g.p));

  // Test 4: Evasive dash maintains burst displacement
  shallowGame.combat.dodge();
  assert(shallowGame.g.p.dash > 0);
  const preX = shallowGame.g.p.x;
  shallowGame.step(1 / 60, input());
  assert(shallowGame.g.p.x > preX + 10, "Dash should maintain evasive velocity through shallows");
});

test("roam shallows impedance: hero movement speed reduced to 60-70% of PLAYER_SPEED with deterministic fixed-step", () => {
  // 1. Dry ground roaming displacement
  const dryRoam = createRoam("vanguard", "zhao-yun", { shallows: false, heroX: 500, heroY: 500 });
  assert.equal(dryRoam.shallows, false);
  assert.equal(dryRoam.hero.speed, PLAYER_SPEED);

  const dt = 1 / 60;
  const inputRight = { keys: new Set(["KeyD"]) };

  // Step for 1 second (60 frames)
  for (let i = 0; i < 60; i++) {
    dryRoam.step(dt, inputRight);
  }
  const dryDisplacement = dryRoam.hero.x - 500;
  assert.equal(Math.round(dryDisplacement), PLAYER_SPEED); // 240 pixels in 1 second

  // 2. Shallows roaming displacement (bamboo-ambush has shallows hazard)
  const shallowRoam = createRoam("bamboo-ambush", "zhao-yun", { heroX: 500, heroY: 500 });
  assert.equal(shallowRoam.shallows, true);
  assert.equal(shallowRoam.hero.speed, PLAYER_SPEED * SHALLOWS_ROAM_SPEED_FACTOR);

  for (let i = 0; i < 60; i++) {
    shallowRoam.step(dt, inputRight);
  }
  const shallowDisplacement = shallowRoam.hero.x - 500;

  // Tests prove smaller displacement with shallows
  assert(shallowDisplacement < dryDisplacement, "Shallows displacement must be smaller than dry ground");
  const ratio = shallowDisplacement / dryDisplacement;
  assert(ratio >= 0.60 && ratio <= 0.70, `Ratio ${ratio} must be between 60% and 70% of PLAYER_SPEED`);
  assert.equal(ratio, SHALLOWS_ROAM_SPEED_FACTOR);

  // 3. Hazard inspection: g.shallows activates impedance
  const gShallowRoam = createRoam("vanguard", "zhao-yun", { g: { shallows: true }, heroX: 500, heroY: 500 });
  assert.equal(gShallowRoam.shallows, true);
  for (let i = 0; i < 60; i++) {
    gShallowRoam.step(dt, inputRight);
  }
  assert.equal(gShallowRoam.hero.x - 500, shallowDisplacement);

  // 4. Deterministic fixed-step proof: 30 steps @ 1/30s vs 60 steps @ 1/60s
  const roam30 = createRoam("river-skiff", "zhao-yun", { heroX: 200, heroY: 300 });
  for (let i = 0; i < 30; i++) {
    roam30.step(1 / 30, inputRight);
  }

  const roam60 = createRoam("river-skiff", "zhao-yun", { heroX: 200, heroY: 300 });
  for (let i = 0; i < 60; i++) {
    roam60.step(1 / 60, inputRight);
  }

  assert.equal(Math.round(roam30.hero.x * 100), Math.round(roam60.hero.x * 100), "Deterministic fixed-step displacement must match across framerates");
  assert.equal(Math.round(roam30.hero.y * 100), Math.round(roam60.hero.y * 100));
});
