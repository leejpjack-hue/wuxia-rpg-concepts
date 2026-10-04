import test from "node:test";
import assert from "node:assert/strict";
import { ACTS } from "../src/content/campaign.js";
import { rosterForEncounter, isNamedRivalKind, isEscortKind, DUEL_ENEMIES } from "../src/content/duels.js";
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
  // Every story rival still deploys, plus retinues and tripled rank bodies.
  for (const kind of expected)
    assert(game.g.roam.field.some((rival) => rival.kind === kind), `${kind} still deploys`);
  const maze = game.g.roam.maze;
  assert(maze, "the open field is a hedge maze");
  // Legends never pile up: each camp holds at most two named legends, each
  // with two or three retainers of its own.
  const camps = new Map();
  for (const rival of game.g.roam.field) {
    assert(rival.area, `${rival.kind} carries its camp`);
    const camp = camps.get(rival.area) || { legends: 0, retinue: 0 };
    if (isLeader(rival.kind) && !DUEL_ENEMIES[rival.kind]?.boss) camp.legends++;
    else if (isEscortKind(rival.kind)) camp.retinue++;
    camps.set(rival.area, camp);
  }
  for (const [area, camp] of camps) {
    if (!camp.legends) continue;
    assert.ok(camp.legends <= 2, `camp ${area} holds ${camp.legends} legends at most`);
    assert.ok(camp.retinue >= camp.legends * 2 && camp.retinue <= camp.legends * 3,
      `camp ${area} keeps ${camp.retinue} retainers for ${camp.legends} legends`);
  }
  // The boss encounter anchors at the maze's dedicated deepest room, behind a retinue.
  const boss = game.g.roam.field.find((rival) => DUEL_ENEMIES[rival.kind]?.boss);
  assert(boss, "the act boss deploys");
  const bossRetinue = game.g.roam.field.filter((rival) => rival.area === boss.area && isEscortKind(rival.kind));
  assert.ok(bossRetinue.length >= 2, "the boss camp keeps a retinue — no walking straight to the keeper");
  let maxDepth = 0;
  for (const rival of game.g.roam.field) {
    const depth = maze.distanceAt(rival.x, rival.y);
    if (depth > maxDepth) maxDepth = depth;
  }
  assert.equal(maze.distanceAt(boss.x, boss.y), maxDepth, "the act boss holds the deepest room");
  const quick = session();
  quick.start("zhao-yun", "quickplay", "jade-gate", quickParty("zhao-yun"));
  assert.equal(quick.g.openField, null);
  assert.equal(quick.g.roam.maze, null);
  assert.deepEqual(quick.g.roam.field.map((rival) => rival.kind), rosterForEncounter("vanguard", "quickplay"));
});

test("a fallen legend routs the camp retinue; the partner legend stands and the map never resets", () => {
  const game = storySession();
  const roam = game.roam;
  const before = game.g.roam.field.map((rival) => rival.id);
  const playerAt = { x: game.g.p.x, y: game.g.p.y };
  // Duel the vanguard camp's first named legend directly.
  const leaderIndex = game.g.roam.field.findIndex((rival) => isLeader(rival.kind));
  assert(leaderIndex >= 0);
  const camp = game.g.roam.field[leaderIndex].area;
  assert(game.beginDuel(leaderIndex));
  assert.equal(winDuel(game), game.g.lastDefeatedKind);
  // Legends fight to the last: the partner still holds the camp, so no
  // discipline yet — but the retinue has routed and the payout landed.
  assert.equal(game.mode, "exploring");
  const campLeft = game.g.roam.field.filter((rival) => rival.area === camp);
  assert.equal(campLeft.length, 1, "only the partner legend remains");
  assert(isLeader(campLeft[0].kind));
  assert.equal(game.g.duel.tea >= 1, true, "a fresh pot came with the rout");
  // Fell the partner: the camp settles into the discipline.
  assert(game.beginDuel(game.g.roam.field.indexOf(campLeft[0])));
  winDuel(game);
  assert.equal(game.mode, "upgrade");
  assert(game.g.openField.cleared.includes(camp));
  game.chooseDiscipline("power");
  assert(game.mode === "exploring");
  assert.equal(game.roam, roam, "the open map is not rebuilt between areas");
  const after = game.g.roam.field.map((rival) => rival.id);
  assert(after.length < before.length);
  for (const id of after) assert(before.includes(id), `survivor ${id} already stood on this map`);
  assert.equal(game.g.p.x, playerAt.x);
});

test("grunts alone never clear an area; the act is won only by the biggest boss", () => {
  const game = storySession();
  // Cut down one retainer of the vanguard camp: the camp must still stand.
  const escort = game.g.roam.field.find((rival) => isEscortKind(rival.kind) && rival.area.startsWith("vanguard"));
  assert(game.beginDuel(game.g.roam.field.indexOf(escort)));
  winDuel(game);
  assert.equal(game.mode, "exploring", "a guard's fall does not clear the pass");
  assert(game.g.roam.field.some((rival) => rival.area.startsWith("vanguard")));
  // Duel through every remaining camp leader west → east; only the boss ends the act.
  let guard = 0;
  while (game.mode !== "waystation" && guard++ < 80) {
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
  // Fell the whole vanguard camp (both legends) and take the discipline.
  let guard = 0;
  while (game.mode !== "upgrade" && guard++ < 30) {
    if (game.mode === "dialogue") game.advanceDialogue(true);
    else if (game.mode === "exploring") {
      const leader = game.g.roam.field.find((rival) => isLeader(rival.kind) && rival.area.startsWith("vanguard"));
      game.beginDuel(game.g.roam.field.indexOf(leader));
      if (game.mode === "playing") winDuel(game);
    } else if (game.mode === "playing") winDuel(game);
  }
  game.chooseDiscipline("power");
  game.pause();
  game.menu();
  const resumed = game; // same profile store
  assert.equal(resumed.continueCheckpoint(), true);
  while (resumed.mode === "dialogue") resumed.advanceDialogue(true);
  assert.equal(resumed.mode, "exploring");
  assert(!resumed.g.roam.field.some((rival) => String(rival.area).startsWith("vanguard")));
  assert(resumed.g.roam.field.some((rival) => rival.area === "warden"));
});

test("resolving an elite offer on the live map scene notifies the view (no stuck judgement)", () => {
  const game = storySession();
  // gate-vanguard is the Act I elite: its legend's fall opens the judgement
  // plus a curio draft on the map scene.
  const eliteLeader = game.g.roam.field.find(
    (rival) => isLeader(rival.kind) && String(rival.area).startsWith("gate-vanguard"));
  assert(eliteLeader, "the elite camp has a leader");
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
  assert(game.g.openField.cleared.some((id) => String(id).startsWith("gate-vanguard")));
  off();
});
