import test from "node:test";
import assert from "node:assert/strict";
import { session, memoryStorage, clearEncounter, walkMap, quickParty, duelPolicy } from './helpers.js';
import { CURIOS } from "../src/content/curios.js";

test("the open pass supersedes the branching map: nodes are inert, the front moves east", () => {
  const game = session();
  game.start("zhao-yun", "campaign");
  game.advanceDialogue(true);
  assert.equal(game.mode, "exploring"); // the whole act waits on one open pass
  assert.equal(game.g.map.row, 0);
  // Row nodes no longer gate travel — every rival already stands on the field.
  assert.equal(game.chooseNode("ambush:archer-run"), false);
  assert.equal(game.chooseNode("elite:gate-vanguard"), false);
  assert.equal(game.chooseNode("duel:crossfire"), false);
  assert.equal(game.encounter.id, "vanguard");
  clearEncounter(game);
  game.chooseDiscipline("power");
  assert.equal(game.mode, "exploring"); // no map scene between areas
  assert.equal(game.encounter.id, "archer-run"); // the front moved east
});

test("elite area victory drafts three curios; the pick is carried and applied in duels", () => {
  const game = session();
  game.start("zhao-yun", "campaign");
  game.advanceDialogue(true);
  // Vanguard falls to its leader; the leaderless archer-run must be wiped.
  clearEncounter(game);
  game.chooseDiscipline("power");
  clearEncounter(game);
  game.chooseDiscipline("power");
  clearEncounter(game); // gate-vanguard is the Act I elite
  assert.equal(game.mode, "map");
  const draft = game.g.map.pendingCurios;
  assert.equal(draft.length, 3);
  assert.equal(new Set(draft).size, 3);
  assert(game.g.totalKills >= 3);
  if (game.g.map.judgement) game.resolveJudgement(true);
  game.chooseCurio(draft[0]);
  assert.deepEqual(game.g.curios, [draft[0]]);
  assert.equal(game.g.map.pendingCurios.length, 0); // unchosen drafts are lost
  assert.equal(game.mode, "upgrade"); // offers settle into the discipline
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

test("a cleared pass grants a roadside breather to the wounded hero", () => {
  const game = session();
  game.start("zhao-yun", "campaign");
  game.advanceDialogue(true);
  const leader = game.g.roam.field.findIndex((rival) => rival.kind.startsWith("hero-"));
  game.beginDuel(leader);
  // A lethal technique takes no reply, so the breather is the only healing.
  game.g.enemies[0].hp = 1;
  game.g.p.hp = 50;
  game.g.p.flow = 100;
  const flow = game.g.p.flow;
  game.combat.act("technique");
  assert.equal(game.mode, "upgrade");
  assert.equal(game.g.p.hp, 87); // +12 rival-defeat restore, +25 breather with the pass
  assert.equal(game.g.p.flow, flow - game.g.p.cost + 8 + 10); // technique cost, +8 defeat, +10 breather
});

test("roadside content of the old branching map is gone with its nodes", () => {
  // Event, rest and shop nodes traveled with the branching map; the open pass
  // replaces them with the per-area breather (covered above) and elite offers.
  const game = session();
  game.start("zhao-yun", "campaign");
  game.advanceDialogue(true);
  assert.equal(game.g.map.event, null);
  assert(!game.g.map.shop);
  assert.equal(game.chooseNode("rest:roadside"), false);
  assert.equal(game.chooseNode("event:travelers-gift"), false);
  assert.equal(game.chooseNode("shop:merchant"), false);
  // The shop machinery itself still serves future touchpoints.
  assert(game.openShop("shop:merchant"));
  assert(game.g.map.shop, "the shop can still open");
  game.g.map.shop = null;
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

test("checkpoint at the elite offers recovers as the pending discipline", () => {
  const storage = memoryStorage();
  const game = session(storage);
  game.start("zhao-yun", "campaign");
  game.advanceDialogue(true);
  // Vanguard falls, archer-run is wiped, then the elite offers open.
  clearEncounter(game);
  game.chooseDiscipline("power");
  clearEncounter(game);
  game.chooseDiscipline("power");
  clearEncounter(game);
  assert.equal(game.mode, "map");
  // Reload before resolving the offers: the draft is lost, the discipline waits.
  // (A private snapshot: this branch keeps saving, and must not clobber the shared save.)
  const midOffer = session(memoryStorage(Object.fromEntries(storage.data)));
  assert(midOffer.continueCheckpoint());
  assert.equal(midOffer.mode, "upgrade");
  midOffer.chooseDiscipline("power");
  assert.equal(midOffer.mode, "exploring");

  // Reload after taking the curio: the pick is carried, the run still finishes.
  if (game.g.map.judgement) game.resolveJudgement(true);
  game.chooseCurio(game.g.map.pendingCurios[0]);
  assert.equal(game.mode, "upgrade");
  const carried = [...game.g.curios];
  const restored = session(storage);
  assert(restored.continueCheckpoint());
  assert.equal(restored.mode, "upgrade"); // checkpoint saved as the pending discipline
  restored.chooseDiscipline("power");
  assert.deepEqual(restored.g.curios, carried);
  assert(restored.g.openField.cleared.includes("gate-vanguard"));
  assert(restored.g.roam.field.some((rival) => rival.area === "warden"));
  // The restored run can still finish the act.
  let guard = 0;
  while (!["waystation", "victory", "defeat"].includes(restored.mode) && guard++ < 200) {
    if (restored.mode === "dialogue") restored.advanceDialogue(true);
    else if (restored.mode === "exploring" || restored.mode === "playing")
      clearEncounter(restored);
    else if (restored.mode === "upgrade") restored.chooseDiscipline("power");
    else if (restored.mode === "map") walkMap(restored);
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
