import test from "node:test";
import assert from "node:assert/strict";
import { ACTS } from "../src/content/campaign.js";
import { rosterForEncounter, isNamedRivalKind, DUEL_ENEMIES } from "../src/content/duels.js";
import { session, quickParty, duelPolicy } from "./helpers.js";

const actOne = ACTS.find((act) => act.id === "jade-gate");
const isLeader = (kind) => !!(DUEL_ENEMIES[kind]?.boss || isNamedRivalKind(kind));

function storySession(actId = "jade-gate") {
  const game = session();
  game.start("zhao-yun", "campaign", actId);
  while (game.mode === "dialogue") game.advanceDialogue(true);
  return game;
}

/** Win the current duel outright; returns the defeated rival kind. */
function winDuel(game) {
  const kind = game.g.enemies[0]?.kind;
  let guard = 0;
  while (game.mode === "playing" && guard++ < 80)
    game.combat.act(duelPolicy(game));
  return kind;
}

test("campaign deploys every rival of the act on one open map; Quick Play stays linear", () => {
  const game = storySession();
  const expected = actOne.encounters.flatMap((encounter) => rosterForEncounter(encounter.id, "campaign"));
  assert.deepEqual(game.g.roam.field.map((rival) => rival.kind), expected);
  // Areas tag every rival, areas spread west → east, and the boss anchors deepest.
  for (const rival of game.g.roam.field) assert(rival.area, `${rival.kind} carries its area`);
  const areas = [...new Set(game.g.roam.field.map((rival) => rival.area))];
  assert.deepEqual(areas, actOne.encounters.map((encounter) => encounter.id));
  const anchors = areas.map((id) => game.g.roam.field.find((rival) => rival.area === id).x);
  anchors.slice(1).forEach((x, i) => assert(x >= anchors[i] - 200, "areas never fold backwards"));
  const boss = game.g.roam.field.find((rival) => DUEL_ENEMIES[rival.kind]?.boss);
  assert(boss.x > 9000, "the act boss holds the far clearing");
  const quick = session();
  quick.start("zhao-yun", "quickplay", "jade-gate", quickParty("zhao-yun"));
  assert.equal(quick.g.openField, null);
  assert.deepEqual(quick.g.roam.field.map((rival) => rival.kind), rosterForEncounter("vanguard", "quickplay"));
});

test("a fallen leader scatters their area and the map never resets between areas", () => {
  const game = storySession();
  const roam = game.roam;
  const before = game.g.roam.field.map((rival) => rival.id);
  const playerAt = { x: game.g.p.x, y: game.g.p.y };
  // Duel the vanguard area's first named legend directly.
  const leaderIndex = game.g.roam.field.findIndex((rival) => isLeader(rival.kind));
  assert(leaderIndex >= 0);
  assert(game.beginDuel(leaderIndex));
  assert.equal(winDuel(game), game.g.lastDefeatedKind);
  assert.equal(game.mode, "upgrade");
  assert(game.g.openField.cleared.includes("vanguard"));
  // The whole vanguard area scattered — no duels owed there anymore.
  assert(!game.g.roam.field.some((rival) => rival.area === "vanguard"));
  // Choose the discipline: the SAME roam persists, positions intact.
  game.chooseDiscipline("power");
  assert(game.mode === "exploring");
  assert.equal(game.roam, roam, "the open map is not rebuilt between areas");
  const after = game.g.roam.field.map((rival) => rival.id);
  assert(after.length < before.length);
  for (const id of after) assert(before.includes(id), `survivor ${id} already stood on this map`);
  assert.equal(game.g.p.x, playerAt.x);
  // A fresh pot of tea came with the cleared pass.
  assert.equal(game.g.duel.tea >= 1, true);
});

test("grunts alone never clear an area; the act is won only by the biggest boss", () => {
  const game = storySession();
  // Cut down one escort of the vanguard area: the area must still stand.
  const escort = game.g.roam.field.find((rival) => rival.kind && !isLeader(rival.kind) && rival.area === "vanguard");
  assert(game.beginDuel(game.g.roam.field.indexOf(escort)));
  winDuel(game);
  assert.equal(game.mode, "exploring", "a guard's fall does not clear the pass");
  assert(game.g.roam.field.some((rival) => rival.area === "vanguard"));
  // Duel through every remaining area leader west → east; only the boss ends the act.
  let guard = 0;
  while (game.mode !== "waystation" && guard++ < 60) {
    if (game.mode === "dialogue") { game.advanceDialogue(true); continue; }
    if (game.mode === "map") {
      if (game.g.map.judgement) { game.resolveJudgement(true); continue; }
      if (game.g.map.pendingCurios.length) { game.chooseCurio(game.g.map.pendingCurios[0]); continue; }
    }
    if (game.mode === "upgrade") { game.chooseDiscipline("power"); continue; }
    if (game.mode === "playing") { winDuel(game); continue; }
    if (game.mode !== "exploring") break;
    const leader = game.g.roam.field.find((rival) => isLeader(rival.kind) && !game.g.openField.cleared.includes(rival.area));
    if (!leader) break;
    game.beginDuel(game.g.roam.field.indexOf(leader));
    // A boss bars the way with words first; the duel follows the dialogue.
    if (game.mode === "playing") winDuel(game);
  }
  assert.equal(game.mode, "waystation", "the act is won exactly when the big boss falls");
  assert(game.g.openField.cleared.includes("warden"));
});

test("cleared areas persist through a checkpoint save and continue", () => {
  const game = storySession();
  const leaderIndex = game.g.roam.field.findIndex((rival) => isLeader(rival.kind));
  game.beginDuel(leaderIndex);
  winDuel(game);
  game.chooseDiscipline("power");
  game.pause();
  game.menu();
  const resumed = game; // same profile store
  assert.equal(resumed.continueCheckpoint(), true);
  while (resumed.mode === "dialogue") resumed.advanceDialogue(true);
  assert.equal(resumed.mode, "exploring");
  assert(!resumed.g.roam.field.some((rival) => rival.area === "vanguard"));
  assert(resumed.g.roam.field.some((rival) => rival.area === "warden"));
});

test("resolving an elite offer on the live map scene notifies the view (no stuck judgement)", () => {
  const game = storySession();
  // gate-vanguard is the Act I elite: its leader's fall opens the judgement
  // plus a curio draft on the map scene.
  const eliteLeader = game.g.roam.field.find(
    (rival) => isLeader(rival.kind) && rival.area === "gate-vanguard");
  assert(eliteLeader, "the elite area has a leader");
  assert(game.beginDuel(game.g.roam.field.indexOf(eliteLeader)));
  winDuel(game);
  assert.equal(game.mode, "map");
  assert(game.g.map.judgement, "the elite faces the judgement");
  assert(game.g.map.pendingCurios.length >= 1, "the elite recovers a curio draft");
  // Regression: with the map scene already up, resolving one offer must emit
  // state:changed, or the browser keeps showing the resolved judgement modal
  // and every further click no-ops (the reported stuck screen).
  let renders = 0;
  const off = game.bus.on("state:changed", (event) => {
    if (event.current === "map") renders++;
  });
  game.resolveJudgement(true);
  assert.equal(game.g.map.judgement, null);
  assert.equal(renders, 1, "the view re-renders to show the curio draft");
  // The whole offer chain still walks: curio → discipline → back to the pass.
  game.chooseCurio(game.g.map.pendingCurios[0]);
  assert.equal(game.mode, "upgrade");
  game.chooseDiscipline("power");
  assert.equal(game.mode, "exploring");
  assert(game.g.openField.cleared.includes("gate-vanguard"));
  off();
});
