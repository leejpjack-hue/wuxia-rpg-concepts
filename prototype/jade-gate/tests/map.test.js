import test from "node:test";
import assert from "node:assert/strict";
import { session, memoryStorage, clearEncounter, walkMap, quickParty } from './helpers.js';
import { CURIOS } from "../src/content/curios.js";

test("campaign map: auto rows march, choice rows offer their nodes, boss closes the act", () => {
  const game = session();
  game.start("zhao-yun", "campaign");
  game.advanceDialogue(true);
  assert.equal(game.mode, "exploring"); // row 0 (single node) never shows the map
  assert.equal(game.g.map.row, 0);
  clearEncounter(game);
  game.chooseDiscipline("power");
  assert.equal(game.mode, "map");
  assert.equal(game.g.map.row, 1);
  // Row 1: ambush or elite; row 2: event, rest or duel; row 3: boss.
  const rows = game.act.map.rows;
  assert.deepEqual(rows[1], ["ambush:archer-run", "elite:gate-vanguard"]);
  assert.equal(game.chooseNode("duel:crossfire"), false); // not in this row
  game.chooseNode("ambush:archer-run");
  assert.equal(game.mode, "exploring");
  assert.equal(game.encounter.id, "archer-run");
});

test("elite victory drafts three curios; the pick is carried and applied in duels", () => {
  const game = session();
  game.start("zhao-yun", "campaign");
  game.advanceDialogue(true);
  clearEncounter(game);
  game.chooseDiscipline("power");
  game.chooseNode("elite:gate-vanguard");
  clearEncounter(game);
  game.chooseDiscipline("power");
  assert.equal(game.mode, "map");
  const draft = game.g.map.pendingCurios;
  assert.equal(draft.length, 3);
  assert.equal(new Set(draft).size, 3);
  assert(game.g.totalKills >= 3);
  game.chooseCurio(draft[0]);
  assert.deepEqual(game.g.curios, [draft[0]]);
  assert.equal(game.g.map.pendingCurios.length, 0); // unchosen drafts are lost
  assert.equal(game.mode, "map"); // still choosing row 2's node
  // The carried curio changes duel rules: Jade Pendant heals on first guard.
  // Use a plain guard (quick play vanguard) so no status effects disturb the math.
  const pendant = session();
  pendant.start("zhao-yun", "quickplay", "jade-gate", quickParty("zhao-yun"));
  pendant.beginDuel(0);
  pendant.g.curios = ["jade-pendant"];
  pendant.g.p.hp = 60;
  const before = pendant.g.p.hp;
  pendant.combat.act("guard");
  const afterFirst = pendant.g.p.hp;
  assert.equal(afterFirst, before - pendant.g.duel.lastIncoming + 6);
  pendant.combat.act("guard");
  assert.equal(pendant.g.p.hp, afterFirst - pendant.g.duel.lastIncoming); // pendant is once per duel
});

test("event and rest nodes resolve without combat and advance the map", () => {
  const game = session();
  game.start("zhao-yun", "campaign");
  game.advanceDialogue(true);
  clearEncounter(game);
  game.chooseDiscipline("power");
  game.chooseNode("elite:gate-vanguard");
  clearEncounter(game);
  game.chooseDiscipline("power");
  if (game.g.map.judgement) game.resolveJudgement(true);
  if (game.g.map.pendingCurios.length) game.chooseCurio(game.g.map.pendingCurios[0]);
  assert.equal(game.mode, "upgrade"); // judgement + draft settle into the discipline
  game.chooseDiscipline("power");
  assert.equal(game.mode, "map");
  game.g.p.hp = 50;
  game.chooseNode("rest:roadside");
  assert.ok(game.g.p.hp > 50, "roadside rest heals");
  // Row 3 is a single boss node: the rest auto-marches straight into the intro.
  assert.equal(game.mode, "dialogue");
  assert.equal(game.dialogue.key, "warden-intro");

  const eventGame = session();
  eventGame.start("zhao-yun", "campaign");
  eventGame.advanceDialogue(true);
  clearEncounter(eventGame);
  eventGame.chooseDiscipline("power");
  eventGame.chooseNode("ambush:archer-run");
  clearEncounter(eventGame);
  eventGame.chooseDiscipline("power");
  assert.equal(eventGame.mode, "map");
  eventGame.g.p.hp = 60; // wounded before accepting the tea
  const hp = eventGame.g.p.hp;
  eventGame.chooseNode("event:travelers-gift");
  assert.equal(eventGame.mode, "map");
  eventGame.resolveEvent(0);
  assert.ok(eventGame.g.p.hp > hp); // shared tea heals
  // The event row ends the choices; row 3's boss auto-marches into its intro.
  assert.equal(eventGame.mode, "dialogue");
  assert.equal(eventGame.dialogue.key, "warden-intro");

  const trapGame = session();
  trapGame.start("zhao-yun", "campaign");
  trapGame.advanceDialogue(true);
  clearEncounter(trapGame);
  trapGame.chooseDiscipline("power");
  trapGame.chooseNode("ambush:archer-run");
  clearEncounter(trapGame);
  trapGame.chooseDiscipline("power");
  trapGame.chooseNode("event:travelers-gift");
  const trapHp = trapGame.g.p.hp;
  trapGame.resolveEvent(1);
  assert.equal(trapGame.g.p.hp, trapHp - 8); // needle trap
  assert.equal(trapGame.g.curios.length, 0); // drafted, not yet taken
  assert.equal(trapGame.g.map.pendingCurios.length, 1); // the sealed box offers one
  assert.equal(trapGame.mode, "map");
  trapGame.chooseCurio(trapGame.g.map.pendingCurios[0]);
  assert.equal(trapGame.g.curios.length, 1);
  // With the box emptied, row 3's boss auto-marches.
  assert.equal(trapGame.mode, "dialogue");
});

test("curio effects: twin irons cadence, feather cost, sash protect, tally renown", () => {
  const game = session();
  game.start("zhao-yun", "quickplay", "jade-gate", quickParty("zhao-yun"));
  game.beginDuel(0);
  game.g.curios = ["twin-irons"];
  game.g.enemies[0].pattern = ["strike"]; // constant base damage per strike
  game.g.enemies[0].hp = game.g.enemies[0].maxHp = 1000; // outlive the cadence
  const hp1 = game.g.enemies[0].hp;
  game.combat.act("attack");
  const hp2 = game.g.enemies[0].hp;
  game.combat.act("attack");
  const hp3 = game.g.enemies[0].hp;
  game.combat.act("attack");
  const hp4 = game.g.enemies[0].hp;
  assert.equal(hp1 - hp2, hp2 - hp3);
  assert.equal(hp3 - hp4, Math.round((hp1 - hp2) * 1.5));

  const feather = session();
  feather.start("zhao-yun", "quickplay", "jade-gate", quickParty("zhao-yun"));
  feather.beginDuel(0);
  feather.g.curios = ["qiang-feather"];
  feather.g.p.flow = 30; // below the base 40 cost, enough with the feather
  assert.equal(feather.combat.act("technique"), true);
  assert.equal(feather.g.p.flow, 0);

  const sash = session();
  sash.start("guan-yu", "quickplay", "jade-gate", quickParty("guan-yu"));
  sash.beginDuel(0);
  sash.g.enemies[0].hp = sash.g.enemies[0].maxHp = 500; // survive to reply
  const intent = sash.combat.intent();
  sash.g.curios = ["shadow-sash"];
  sash.combat.act("technique");
  assert.equal(sash.g.duel.lastIncoming, Math.round(intent.damage * 0.5)); // sash halves the reply
  sash.combat.act("attack");
  const intent2 = sash.combat.intent();
  sash.g.p.flow = 100; // refuel for the second technique
  sash.combat.act("technique");
  // The sash is spent: Guan Yu's technique carries no protect of its own.
  if (sash.mode === "playing")
    assert.equal(sash.g.duel.lastIncoming, intent2.damage);

  const tally = session();
  tally.start("zhao-yun", "quickplay", "jade-gate", quickParty("zhao-yun"));
  tally.beginDuel(0);
  tally.g.curios = ["ashen-tally"];
  const before = tally.g.score;
  tally.combat.act("technique");
  tally.combat.act("attack"); // finish the wounded guard for the reward
  assert.equal(tally.g.score, before + 120 + 30); // guard reward + tally

  // Night-Eye Charm: intents peek one move ahead (guard opens strike, then heavy).
  const eye = session();
  eye.start("zhao-yun", "quickplay", "jade-gate", quickParty("zhao-yun"));
  eye.beginDuel(0);
  eye.g.curios = ["night-eye"];
  assert.equal(eye.combat.intent().kind, "strike");
  assert.equal(eye.combat.intent(eye.g.enemies[0], 1).kind, "heavy");
});

test("checkpoint at the map restores row, cleared nodes and carried curios", () => {
  const storage = memoryStorage();
  const game = session(storage);
  game.start("zhao-yun", "campaign");
  game.advanceDialogue(true);
  clearEncounter(game);
  game.chooseDiscipline("power");
  game.chooseNode("elite:gate-vanguard");
  clearEncounter(game);
  game.chooseDiscipline("power");
  if (game.g.map.judgement) game.resolveJudgement(true);
  game.chooseCurio(game.g.map.pendingCurios[0]);
  assert.equal(game.mode, "upgrade");
  const carried = [...game.g.curios];
  const restored = session(storage);
  assert(restored.continueCheckpoint());
  assert.equal(restored.mode, "upgrade"); // checkpoint saved as the pending discipline
  restored.chooseDiscipline("power");
  assert.equal(restored.g.map.row, 2);
  assert.deepEqual(restored.g.curios, carried);
  assert(restored.g.map.cleared.includes("elite:gate-vanguard"));
  // The restored run can still finish the act.
  walkMap(restored, (nodes) => nodes.find((n) => n.startsWith("duel:")) || nodes[0]);
  let guard = 0;
  while (!["waystation", "victory", "defeat"].includes(restored.mode) && guard++ < 200) {
    if (restored.mode === "dialogue") restored.advanceDialogue(true);
    else if (restored.mode === "exploring" || restored.mode === "playing")
      clearEncounter(restored);
    else if (restored.mode === "upgrade") restored.chooseDiscipline("power");
    else if (restored.mode === "map")
      walkMap(restored, (nodes) => nodes.find((n) => n.startsWith("duel:")) || nodes[0]);
  }
  assert.equal(restored.mode, "waystation");
});

test("quick play stays linear: no map, no curios, five encounters", () => {
  const game = session();
  game.start("zhao-yun", "quickplay", "jade-gate", quickParty("zhao-yun"));
  assert.equal(game.g.map, null);
  assert.equal(game.g.curios.length, 0);
  let encounters = 0;
  while (!["victory", "defeat"].includes(game.mode)) {
    clearEncounter(game);
    if (game.mode === "upgrade") { game.chooseDiscipline("power"); encounters++; }
  }
  assert.equal(encounters, 4); // disciplines between the five linear encounters
  assert.equal(game.g.map, null);
});
