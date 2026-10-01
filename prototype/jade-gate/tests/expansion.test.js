import test from "node:test";
import assert from "node:assert/strict";
import { session, memoryStorage, quickParty, clearEncounter, walkMap } from "./helpers.js";
import { GameSession } from "../src/domain/session.js";
import { createCardCombat } from "../src/domain/card-combat.js";
import { SaveStore } from "../src/platform/save-store.js";
import {
  SIGNATURES, OATHS, oathFor, WEATHERS, weatherForRun, SHOP_STOCK, specialFor,
} from "../src/content/expansion.js";
import { HEROES } from "../src/content/heroes.js";

const game = (storage = memoryStorage()) =>
  new GameSession(new SaveStore(storage), { combatFactory: createCardCombat });

test("every hero (and the recruit) carries a signature action", () => {
  for (const hero of HEROES)
    assert(SIGNATURES[hero.id], `${hero.id} lacks a signature`);
  for (const signature of Object.values(SIGNATURES)) {
    assert(signature.flow >= 15 && signature.flow <= 35);
    assert(signature.description.length > 20);
    assert(signature.archetype);
  }
});

test("signature actions resolve: counter, execute, charged, cleanse, vanish", () => {
  // Counter: Zhao Yun braces and cuts back.
  const counter = game();
  counter.start("zhao-yun", "quickplay", "jade-gate", quickParty("zhao-yun"));
  counter.beginDuel(0);
  counter.g.p.flow = 60;
  const intent = counter.combat.intent();
  const counterDamage = Math.round(counter.g.p.damage * counter.g.p.power * 0.6);
  const counterReply = Math.round(intent.each * (1 - 0.85));
  assert(counter.combat.act("signature"));
  assert.equal(counter.g.duel.lastDamage, counterDamage);
  assert.equal(counter.g.duel.lastIncoming, counterReply);

  // Execute: Lü Bu punishes wounded rivals.
  const execute = game();
  execute.start("lu-bu", "quickplay", "jade-gate", quickParty("lu-bu"));
  execute.beginDuel(0);
  execute.g.p.flow = 60;
  execute.g.enemies[0].hp = execute.g.enemies[0].maxHp = 500; // survive the mark
  execute.g.duel.status.enemy.bleed = { turns: 2, amount: 3 };
  const base = Math.round(execute.g.p.damage * execute.g.p.power * 1.1);
  execute.combat.act("signature");
  assert.equal(execute.g.duel.lastDamage, Math.round(base * 1.8));

  // Charged: Guan Yu winds, the next strike lands harder.
  const charged = game();
  charged.start("guan-yu", "quickplay", "jade-gate", quickParty("guan-yu"));
  charged.beginDuel(0);
  charged.g.p.flow = 60;
  assert(charged.combat.act("signature"));
  assert.equal(charged.g.duel.lastDamage, 0); // stance turn deals nothing
  const plain = Math.round(charged.g.p.damage * charged.g.p.power);
  charged.combat.act("attack");
  assert.equal(charged.g.duel.lastDamage, Math.round(plain * 1.6));

  // Cleanse: Mu Guiying clears statuses and re-readies the assist.
  const cleanse = game();
  cleanse.start("mu-guiying", "quickplay", "jade-gate", quickParty("mu-guiying"));
  cleanse.beginDuel(0);
  cleanse.g.duel.status.hero.poison = { turns: 3, amount: 3 };
  cleanse.g.duel.assistUsed = true;
  cleanse.g.duel.assistReady = true;
  cleanse.g.p.hp = 50;
  cleanse.g.p.flow = 60;
  assert(cleanse.combat.act("signature"));
  assert.equal(cleanse.g.duel.status.hero.poison, null);
  assert.equal(cleanse.g.duel.assistUsed, false, "rally re-readies the assist");

  // Vanish: Nie Yinniang takes no reply damage and leaves a bleed.
  const vanish = game();
  vanish.start("nie-yinniang", "quickplay", "jade-gate", quickParty("nie-yinniang"));
  vanish.beginDuel(0);
  vanish.g.p.hp = 80;
  vanish.g.p.flow = 60;
  vanish.combat.act("signature");
  assert.equal(vanish.g.duel.status.enemy.bleed.amount, 3);
  assert.equal(vanish.g.duel.status.enemy.bleed.turns, 2);
  vanish.combat.act("guard"); // fresh flag consumed, tick lands next turn
  vanish.combat.act("guard");
  vanish.combat.act("guard");
  assert.equal(vanish.g.duel.status.enemy.bleed, null);
});

test("rivals gather focus and unleash telegraphed specials; techniques break them", () => {
  const g = game();
  g.start("zhao-yun", "quickplay", "jade-gate", quickParty("zhao-yun"));
  g.beginDuel(0);
  const enemy = g.g.enemies[0];
  assert(specialFor(enemy.kind), "guard carries a special");
  // Burn turns without techniques: focus climbs to the threshold.
  for (let i = 0; i < 6 && !g.combat.intent().special; i++) {
    g.g.p.hp = g.g.p.maxHp; // stay alive
    g.combat.act("guard");
  }
  assert(g.combat.intent().special, "special is telegraphed when focus fills");
  assert.match(g.combat.intent().description, /SPECIAL/);
  // A technique resets the gathering.
  g.g.p.flow = 100;
  g.combat.act("technique");
  if (g.g.enemies.length) assert.equal(g.g.enemies[0].focus, 0);
});

test("oath pairs double assist damage and grant Flow", () => {
  const oath = oathFor(["zhao-yun", "guan-yu", "wu-song"]);
  assert(oath && oath.heroes.includes("zhao-yun") && oath.heroes.includes("guan-yu"));
  const g = game();
  g.start("zhao-yun", "quickplay", "jade-gate", quickParty("zhao-yun", "guan-yu", "wu-song"));
  g.beginDuel(0);
  g.combat.act("attack"); // lead damage readies the assist
  const flowBefore = g.g.p.flow;
  const result = g.combat.assistStrike();
  assert(result.oath, "the oath fired");
  assert.equal(result.damage, 16); // 8 × 2
  assert.equal(g.g.p.flow, Math.min(100, flowBefore + 10));
});

test("weather is run-seeded and bends the pass", () => {
  const a = weatherForRun("run-alpha"), b = weatherForRun("run-alpha");
  assert.equal(a.id, b.id);
  assert(WEATHERS.some((weather) => weather.id === "rain" && weather.aggroMultiplier === 0.7));
  // Night narrows the sneak aggro bands.
  const night = WEATHERS.find((weather) => weather.id === "night");
  assert.equal(night.sneakAggro, 180);
});

test("composure accrues from real-time wounds and rattles the hero", () => {
  const g = game();
  g.start("zhao-yun", "quickplay", "jade-gate", quickParty("zhao-yun"));
  g.g.roam.shots = [{ id: 1, owner: "x", x: g.g.p.x + 8, y: g.g.p.y, vx: -400, vy: 0, damage: 12, life: 1 }];
  g.g.roam.invulnerable = 0;
  g.step(1 / 60, {});
  assert.ok(g.g.p.composure >= 18, "an arrow wound wears composure");
  g.g.p.composure = 100;
  g.g.roam.invulnerable = 0;
  g.g.roam.shots = [{ id: 2, owner: "x", x: g.g.p.x + 8, y: g.g.p.y, vx: -400, vy: 0, damage: 12, life: 1 }];
  g.step(1 / 60, {});
  assert.equal(g.g.p.rattled, true);
});

test("the merchant trades run renown for run goods", () => {
  const g = game();
  g.start("zhao-yun", "campaign");
  g.advanceDialogue(true);
  clearEncounter(g);
  g.chooseDiscipline("power");
  g.chooseNode("ambush:archer-run");
  clearEncounter(g);
  g.chooseDiscipline("power");
  g.chooseNode("shop:merchant");
  assert.equal(g.mode, "map");
  assert(g.g.map.shop, "the shop is open");
  g.g.score = 500;
  assert(g.buyShopItem("vitality"));
  assert.equal(g.g.p.maxHp, 140); // 120 + 20
  assert.equal(g.g.score, 300); // 500 - 200
  assert(!g.buyShopItem("vitality"), "each good is bought once");
  assert(g.buyShopItem("incense"));
  assert.equal(g.g.assistLimitBonus, 1, "oath incense readies two assists per duel");
  g.combat.begin("guard", "shop-check", false);
  assert.equal(g.g.duel.assistLimit, 2);
  assert(g.leaveShop());
});

test("judgement: sparing an elite gains the people's favor and can recruit the adder", () => {
  const storage = memoryStorage();
  const g = game(storage);
  g.start("zhao-yun", "campaign");
  g.advanceDialogue(true);
  clearEncounter(g);
  g.chooseDiscipline("power");
  // Route to the Act I elite and force the adder to fall there.
  g.chooseNode("elite:gate-vanguard");
  clearEncounter(g);
  g.g.map.judgement = { kind: "venom-adept", name: "The Venom Adept" };
  g.resolveJudgement(true);
  assert.equal(g.profile.reputation.people, 10);
  assert.deepEqual(g.profile.recruits, ["venom-adept"]);
  // The recruit is hidden until spared — and joins quick play parties after.
  const fresh = game(memoryStorage());
  assert.throws(() => fresh.start("venom-adept", "quickplay", "jade-gate", quickParty("venom-adept")), /Spare this rival/);
  const spared = game(storage);
  spared.start("venom-adept", "quickplay", "jade-gate", quickParty("venom-adept"));
  assert.equal(spared.g.p.id, "venom-adept");
  // Finishing pays the Banner instead.
  const other = game(memoryStorage());
  other.start("zhao-yun", "campaign");
  other.advanceDialogue(true);
  clearEncounter(other);
  other.chooseDiscipline("power");
  other.chooseNode("elite:gate-vanguard");
  clearEncounter(other);
  other.g.map.judgement = { kind: "pugilist", name: "Iron Pugilist" };
  const scoreBefore = other.g.score;
  other.resolveJudgement(false);
  assert.equal(other.profile.reputation.ashen, 10);
  assert.equal(other.g.score, scoreBefore + 50);
});

test("the endless wander escalates stages and records the best run", () => {
  const storage = memoryStorage();
  const g = game(storage);
  g.startWander(quickParty("zhao-yun"));
  assert.equal(g.mode, "exploring");
  assert.equal(g.g.wander.stage, 1);
  const first = g.g.wanderEncounter.scale;
  g.g.roam.field = [];
  g.bus.emit("roam:rival-defeated", { id: "stage-clear" });
  assert.equal(g.g.wander.stage, 2);
  assert.ok(g.g.wanderEncounter.scale > first, "stages harden");
  assert.equal(g.g.wanderEncounter.title, "Wander · stage 2");
  // Defeat records the run.
  g.g.p.hp = 1;
  g.bus.emit("combat:defeat");
  assert.equal(g.mode, "defeat");
  assert.equal(g.profile.wander.bestStage, 2);
  assert.equal(g.profile.wander.runs, 1);
});

test("the codex records rivals, heroes and curios as they are met", () => {
  const g = game();
  g.start("zhao-yun", "quickplay", "jade-gate", quickParty("zhao-yun", "guan-yu", "hu-sanniang"));
  assert.equal(g.profile.codex.heroes["zhao-yun"], true);
  assert.equal(g.profile.codex.heroes["guan-yu"], true);
  g.beginDuel(0);
  assert.equal(g.profile.codex.rivals["guard"], true);
  g.g.map = null; // quickplay: no map
  const curated = g.unlockCodex("curios", "jade-pendant");
  assert(curated);
  assert(!g.unlockCodex("curios", "jade-pendant"), "sightings are once-only");
});
