import test from "node:test";
import assert from "node:assert/strict";
import { session, memoryStorage } from "./helpers.js";
import { applyCultivation, hasPerk, strikeNode } from "../src/domain/progression.js";
import { MERIDIAN_NODES, migrateRanks } from "../src/content/meridians.js";
import { makePlayer } from "../src/domain/player.js";
import { HEROES } from "../src/content/heroes.js";

test("legacy flat ranks migrate onto their vessel points", () => {
  assert.deepEqual(migrateRanks({ "iron-vessel": 2, "flow-retention": 1, "keen-edge": 3 }),
    ["ren-1", "ren-2", "du-1", "dai-1", "dai-2", "dai-3"]);
  assert.deepEqual(migrateRanks(undefined), []);
  const storage = memoryStorage({ "blades-profile-v2": JSON.stringify({
    version: 2, wallet: 0, ranks: { "iron-vessel": 1 }, settings: {},
  }) });
  const game = session(storage);
  assert.deepEqual(game.profile.meridian, ["ren-1"]);
  game.menu();
  game.start("zhao-yun", "campaign");
  game.advanceDialogue(true);
  assert.equal(game.g.p.maxHp, 135); // migrated point applies
});

test("crossing cavities gate on vessels and apply their perks", () => {
  const profile = { wallet: 5000, meridian: [], ranks: {} };
  assert(strikeNode(profile, "ren-1"));
  assert(strikeNode(profile, "du-1"));
  assert(strikeNode(profile, "dantian"));
  assert(hasPerk(profile, "dantian"));
  assert(!hasPerk(profile, "dragons-cavity"));
  const player = makePlayer(HEROES[0]);
  applyCultivation(player, profile);
  assert.equal(player.cost, 35); // 40 − Dantian Core
  assert.equal(player.teaPots, 1); // Dragon's Cavity not struck

  const cavity = { wallet: 5000, meridian: ["ren-1", "ren-2", "dai-1", "dragons-cavity"], ranks: {} };
  const second = makePlayer(HEROES[0]);
  applyCultivation(second, cavity);
  assert.equal(second.teaPots, 2);
});

test("Dragon's Cavity gives a second tea pot every encounter", () => {
  const storage = memoryStorage();
  const game = session(storage);
  game.profile.meridian = ["ren-1", "ren-2", "dai-1", "dragons-cavity"];
  game.save();
  game.start("zhao-yun", "campaign"); // cultivation applies on campaign runs
  game.advanceDialogue(true);
  game.beginDuel(0);
  assert.equal(game.g.duel.tea, 2);
  game.g.p.hp = 60; // tea needs a wound to close
  assert(game.combat.act("tea"));
  assert.equal(game.g.duel.tea, 1);
});

test("Phoenix Eye widens curio drafts to four choices", () => {
  const storage = memoryStorage();
  const game = session(storage);
  game.profile.meridian = ["du-1", "du-2", "phoenix-eye"];
  game.save();
  game.start("zhao-yun", "campaign");
  game.advanceDialogue(true);
  // Clear row 0, choose a discipline, take the elite for a draft.
  let guard = 0;
  while (game.mode !== "map" && guard++ < 100) {
    if (game.mode === "exploring" || game.mode === "playing") {
      if (game.mode === "exploring") { game.beginDuel(0); continue; }
      const p = game.g.p, intent = game.combat.intent();
      const action = game.g.duel.tea && p.hp < p.maxHp - 35 ? "tea"
        : p.flow >= p.cost ? "technique"
        : ["heavy", "guard"].includes(intent.kind) ? "guard" : "attack";
      game.combat.act(action);
    } else if (game.mode === "upgrade") game.chooseDiscipline("power");
    else if (game.mode === "dialogue") game.advanceDialogue(true);
  }
  game.chooseNode("elite:gate-vanguard");
  guard = 0;
  while (game.mode !== "upgrade" && guard++ < 300) {
    if (game.mode === "exploring") { game.beginDuel(0); continue; }
    if (game.mode === "playing") {
      const p = game.g.p, intent = game.combat.intent();
      game.combat.act(p.flow >= p.cost ? "technique" : ["heavy", "guard"].includes(intent.kind) ? "guard" : "attack");
    }
  }
  game.chooseDiscipline("power");
  assert.equal(game.g.map.pendingCurios.length, 4);
});

test("every meridian node has resolvable requirements and unique ids", () => {
  const ids = MERIDIAN_NODES.map((node) => node.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const node of MERIDIAN_NODES)
    for (const need of node.requires)
      assert(ids.includes(need), `${node.id} requires unknown ${need}`);
});

test("sneaking halves movement speed and shrinks archer aggro", () => {
  const game = session();
  game.start("zhao-yun", "quickplay");
  const startX = game.g.p.x;
  for (let i = 0; i < 60; i++) game.step(1 / 60, { dx: 1, dy: 0 });
  const walkDist = game.g.p.x - startX;
  game.g.p.x = 640; game.g.p.y = 500;
  assert(game.roam.act("sneak"));
  assert.equal(game.g.roam.sneaking, true);
  for (let i = 0; i < 60; i++) game.step(1 / 60, { dx: 1, dy: 0 });
  const sneakDist = game.g.p.x - 640;
  assert.ok(sneakDist < walkDist * 0.6, `sneak ${sneakDist} vs walk ${walkDist}`);
  // A distant archer holds fire while sneaking (aggro 420 < distance).
  const archer = game.g.roam.field.find((e) => e.ranged);
  if (archer) {
    Object.assign(game.g.p, { x: archer.x - 600, y: archer.y });
    game.g.roam.field.forEach((e) => { e.cooldown = 0; e.windup = 0; });
    for (let i = 0; i < 120; i++) game.step(1 / 60, {});
    assert.equal(archer.windup, 0, "sneaking keeps the distant archer calm");
    game.roam.act("sneak"); // stand up
    for (let i = 0; i < 120; i++) game.step(1 / 60, {});
    assert.ok(archer.windup > 0 || game.g.roam.shots.length > 0, "standing up draws the aim");
  }
});

test("the Hidden Blade sneaks closer than the others", () => {
  const game = session();
  game.start("nie-yinniang", "quickplay");
  assert.equal(game.g.roam.sneakMaster, true);
});

test("first blood on the pass opens the duel with the rival reeling", () => {
  const game = session();
  game.start("zhao-yun", "quickplay");
  const melee = game.g.roam.field.find((e) => !e.ranged);
  const hpBefore = melee.hp;
  Object.assign(game.g.p, { x: melee.x + 80, y: melee.y });
  game.roam.strikeCD = 0;
  assert(game.roam.act("strike"));
  assert.equal(melee.hp, hpBefore, "melee rivals take no real-time damage");
  assert.equal(melee.firstBlood, true);
  // Contact now opens with the ambush reel.
  Object.assign(game.g.p, { x: melee.x, y: melee.y });
  let guard = 0;
  while (game.mode === "exploring" && guard++ < 600) game.step(1 / 60, {});
  assert.equal(game.mode, "playing");
  const hp = game.g.p.hp;
  game.combat.act("attack"); // the reeling rival skips its reply
  assert.equal(game.g.p.hp, hp, "no reply on the opening turn");
  assert.ok(game.g.duel.log.some((line) => line.includes("ambush")));
});

test("sneaking into a rival ambushes the duel even without first blood", () => {
  const game = session();
  game.start("zhao-yun", "quickplay");
  assert(game.roam.act("sneak"));
  const melee = game.g.roam.field.find((e) => !e.ranged);
  Object.assign(game.g.p, { x: melee.x, y: melee.y });
  let guard = 0;
  while (game.mode === "exploring" && guard++ < 600) game.step(1 / 60, {});
  assert.equal(game.mode, "playing");
  const hp = game.g.p.hp;
  game.combat.act("guard");
  assert.equal(game.g.p.hp, hp, "the ambushed rival cannot reply");
});
