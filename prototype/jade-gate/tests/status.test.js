import test from "node:test";
import assert from "node:assert/strict";
import { session, quickParty } from './helpers.js';

/** Duel a specific rival kind directly on a quick-play field. */
function rivalOf(kind, curios = []) {
  const game = session();
  game.start("zhao-yun", "quickplay", "jade-gate", quickParty("zhao-yun"));
  game.beginDuel(0);
  game.combat.begin(kind, `test-${kind}`);
  game.g.enemies[0].pattern = PATTERN[kind];
  game.g.curios = curios;
  return game;
}
const PATTERN = {
  bandit: ["bleed", "strike", "double"],
  "venom-adept": ["poison", "drain", "guard"],
  pugilist: ["concuss", "strike", "heavy"],
  "ashen-priest": ["mend", "poison", "strike"],
};

test("Rending Slash bleeds the hero for two ticks that ignore guard", () => {
  const game = rivalOf("bandit");
  game.g.p.hp = 200;
  game.g.p.maxHp = 200;
  game.combat.act("guard"); // guard the slash: direct damage cut 80%
  const direct = game.g.duel.lastIncoming;
  assert.equal(game.g.duel.status.hero.bleed.turns, 2); // fresh: ticks start next turn
  assert.equal(game.g.p.hp, 200 - direct);
  game.combat.act("attack"); // strike reply + first bleed tick
  assert.equal(game.g.p.hp, 200 - direct - game.g.duel.lastIncoming - 3);
  assert.equal(game.g.duel.status.hero.bleed.turns, 1);
  game.combat.act("attack"); // double reply + second tick, expired
  assert.equal(game.g.duel.status.hero.bleed, null);
  assert.ok(game.g.p.hp < 200 - direct - 11 - 3);
});

test("Envenomed Dart poisons for three ticks and tea clears it", () => {
  const game = rivalOf("venom-adept");
  game.g.p.hp = 100;
  game.combat.act("attack");
  assert.equal(game.g.duel.status.hero.poison.turns, 3);
  game.g.p.hp = 40; // low enough for the policy-style tea use
  game.combat.act("tea");
  assert.equal(game.g.duel.status.hero.poison, null, "tea cleanses poison");
  assert.ok(game.g.p.hp > 40);
});

test("Qi Siphon drains Flow on top of its damage", () => {
  const game = rivalOf("venom-adept");
  game.g.enemies[0].move = 1; // drain is the second pattern slot
  game.g.p.flow = 50;
  game.combat.act("attack");
  assert.equal(game.g.p.flow, 50 + 12 - 10);
});

test("Pommel Smash stuns the hero: the next action is lost and the rival hits freely", () => {
  const game = rivalOf("pugilist");
  game.g.p.hp = 100;
  game.combat.act("guard"); // the smash lands through the guard
  assert.equal(game.g.duel.status.hero.stunned, true);
  assert.equal(game.g.turns, 1);
  const hpBeforeLost = game.g.p.hp;
  game.combat.act("guard"); // consumed: the rival strikes at full
  assert.equal(game.g.duel.status.hero.stunned, false);
  assert.equal(game.g.turns, 2);
  assert.ok(game.g.p.hp < hpBeforeLost, "the free strike lands");
});

test("Ashen Resolve mends the rival and washes away hero-inflicted statuses", () => {
  const game = rivalOf("ashen-priest");
  game.g.enemies[0].hp = 30;
  game.g.duel.status.enemy.poison = { turns: 3, amount: 3 };
  game.combat.act("attack"); // priest's mend turn
  assert.equal(game.g.enemies[0].hp, 30 - 27 + 12); // struck, then mended 12
  assert.equal(game.g.duel.status.enemy.poison, null);
  assert.equal(game.g.duel.lastIncoming, 0, "mend never damages the hero");
});

test("Twin Strike lands two hits; guard blunts each", () => {
  const game = rivalOf("bandit");
  game.g.enemies[0].move = 2; // double is the third pattern slot
  const intent = game.combat.intent();
  assert.equal(intent.hits, 2);
  game.g.p.hp = 200;
  game.g.p.maxHp = 200;
  game.combat.act("guard");
  const expected = Math.round(intent.each * 0.2) * 2;
  assert.equal(game.g.duel.lastIncoming, expected);
});

test("status ticks can finish a wounded rival", () => {
  const game = rivalOf("bandit");
  game.g.duel.status.enemy.poison = { turns: 1, amount: 5 };
  game.g.enemies[0].hp = 29; // the strike (27) leaves 2; the tick closes it
  game.combat.act("attack");
  assert.equal(game.mode, "exploring"); // duel won via poison
  assert.ok(game.g.duel.log.some((line) => line.includes("falls")));
});

test("Venom Vial poisons the rival through techniques", () => {
  const game = rivalOf("bandit", ["venom-vial"]);
  game.g.enemies[0].hp = game.g.enemies[0].maxHp = 200;
  game.g.p.flow = 60;
  game.combat.act("technique");
  assert.equal(game.g.duel.status.enemy.poison.turns, 3); // fresh this turn
  const afterTechnique = game.g.enemies[0].hp;
  game.combat.act("attack"); // next turn: strike lands, then the poison tick
  assert.equal(game.g.enemies[0].hp, afterTechnique - game.g.duel.lastDamage - 3);
  assert.ok(game.g.duel.log.some((line) => line.includes("poison damage")));
});

test("Rending Fang opens a bleed on every fourth strike", () => {
  const game = rivalOf("bandit", ["rending-fang"]);
  game.g.enemies[0].hp = game.g.enemies[0].maxHp = 1000;
  for (let i = 1; i <= 4; i++) {
    game.combat.act("attack");
    if (i < 4) assert.equal(game.g.duel.status.enemy.bleed, null);
  }
  assert.equal(game.g.duel.status.enemy.bleed.turns, 2);
});

test("every hero still clears quick play against the wider rival pool", () => {
  for (const hero of ["zhao-yun", "lu-zhishen", "hu-sanniang", "lu-bu", "guan-yu",
    "wu-song", "mu-guiying", "liang-hongyu", "nie-yinniang",
    "sun-shangxiang", "gu-dasao", "qin-liangyu", "bao-sanniang", "dian-wei", "yang-zhi"]) {
    const game = session();
    game.start(hero, "quickplay", "jade-gate", quickParty(hero));
    let guard = 0;
    while (!["victory", "defeat", "menu"].includes(game.mode)) {
      if (game.mode === "upgrade") { game.chooseDiscipline("power"); continue; }
      if (game.mode === "exploring") {
        const melee = game.g.roam.field.findIndex((e) => !e.ranged);
        if (melee >= 0 && game.beginDuel(melee)) continue;
        // Only archers remain: walk in and strike in real time.
        const archer = game.g.roam.field[0];
        Object.assign(game.g.p, { x: archer.x + 80, y: archer.y });
        game.roam.act(game.g.p.flow >= game.g.p.cost ? "technique" : "strike");
        for (let i = 0; i < 50 && game.mode === "exploring"; i++) game.step(1 / 60, {});
        continue;
      }
      if (game.mode === "playing") {
        const p = game.g.p, d = game.g.duel, intent = game.combat.intent();
        const afflicted = d.status.hero.bleed || d.status.hero.poison;
        const action = d.tea && (afflicted || p.hp < p.maxHp - 35) ? "tea"
          : p.flow >= p.cost ? "technique"
          : ["heavy", "guard"].includes(intent.kind) ? "guard" : "attack";
        if (!game.combat.act(action)) break;
        continue;
      }
      break;
      if (++guard > 1200) throw new Error(`${hero} stalled`);
    }
    assert.equal(game.mode, "victory", `${hero} clears the run`);
  }
});
