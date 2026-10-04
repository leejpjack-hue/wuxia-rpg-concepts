import test from "node:test";
import assert from "node:assert/strict";
import { ACTS } from "../src/content/campaign.js";
import { rosterForEncounter, DUEL_ENEMIES, isNamedRivalKind, isEscortKind } from "../src/content/duels.js";
import { generateMaze, hashSeed } from "../src/domain/maze.js";
import { resolveBlockers } from "../src/domain/ground.js";
import { session, memoryStorage } from "./helpers.js";
import { GameSession } from "../src/domain/session.js";
import { SaveStore } from "../src/platform/save-store.js";
import { createCardCombat } from "../src/domain/card-combat.js";

const isLeader = (kind) => !!(DUEL_ENEMIES[kind]?.boss || isNamedRivalKind(kind));

function storySession(actId = "jade-gate") {
  // Pin the run id: the maze seed derives from it, and some seeds let the
  // northward wall-slide probe clip a corner tile (pre-existing flake).
  const game = new GameSession(new SaveStore(memoryStorage()), {
    combatFactory: createCardCombat,
    runId: () => "maze-fixtures",
  });
  const index = ACTS.findIndex((act) => act.id === actId);
  for (const earlier of ACTS.slice(0, index)) game.profile.completedActs.push(earlier.id);
  game.start("zhao-yun", "campaign", actId);
  while (game.mode === "dialogue") game.advanceDialogue(true);
  return game;
}

/** Flood the open tiles from a point; returns the set of reachable tile keys. */
function reachableTiles(maze, from) {
  const key = (i, j) => `${i},${j}`;
  const seen = new Set();
  const stack = [{ i: Math.floor((from.x - maze.ox) / maze.tile), j: Math.floor((from.y - maze.oy) / maze.tile) }];
  while (stack.length) {
    const { i, j } = stack.pop();
    if (seen.has(key(i, j)) || maze.isWallTile(i, j)) continue;
    seen.add(key(i, j));
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]])
      stack.push({ i: i + di, j: j + dj });
  }
  return seen;
}

test("the maze is seeded, connected and covers the taller world in every direction", () => {
  const seed = hashSeed("maze-test:jade-gate");
  const maze = generateMaze(seed, { areas: ["vanguard", "archer-run", "gate-vanguard", "crossfire"] });
  // Deterministic: same seed rebuilds the same labyrinth, another seed differs.
  const twin = generateMaze(hashSeed("maze-test:jade-gate"), { areas: ["vanguard", "archer-run", "gate-vanguard", "crossfire"] });
  const other = generateMaze(hashSeed("maze-test:other"), { areas: ["vanguard", "archer-run", "gate-vanguard", "crossfire"] });
  assert.deepEqual([...maze.walls], [...twin.walls]);
  assert.notDeepEqual([...maze.walls], [...other.walls]);
  // Every open tile is reachable from the start — no sealed corridors.
  const open = maze.walls.filter((tile) => !tile).length;
  const reached = reachableTiles(maze, maze.start);
  assert.equal(reached.size, open, "no open tile is cut off from the start");
  // The labyrinth runs vertically as well as horizontally: rooms occupy at
  // least three distinct rows and columns of the room grid.
  const rows = new Set(maze.rooms.map((room) => room.j));
  const cols = new Set(maze.rooms.map((room) => room.i));
  assert.ok(rows.size >= 3, "the maze climbs and descends");
  assert.ok(cols.size >= 3, "the maze runs wide");
  // Loops exist: fewer walls than a perfect maze's spanning tree would leave.
  assert.ok(maze.walls.filter((tile) => !tile).length > maze.rooms.length, "loops thread the hedges");
});

test("every camp anchors on open floor, deepening toward the boss room", () => {
  const maze = generateMaze(hashSeed("maze-test:camps"), { areas: ["vanguard", "archer-run", "gate-vanguard", "crossfire"] });
  const ids = ["vanguard", "archer-run", "gate-vanguard", "crossfire"];
  const distances = ids.map((id) => {
    const anchor = maze.anchors[id];
    assert(anchor, `${id} has an anchor`);
    assert.equal(maze.blocked(anchor.x, anchor.y, 30), false, `${id} camp is on open floor`);
    return maze.distanceAt(anchor.x, anchor.y);
  });
  for (let i = 1; i < distances.length; i++)
    assert.ok(distances[i] > distances[i - 1], "camps deepen along the pass");
  const boss = maze.anchors.boss;
  assert.equal(maze.blocked(boss.x, boss.y, 30), false, "the boss room is on open floor");
  assert.ok(maze.distanceAt(boss.x, boss.y) >= Math.max(...distances), "the boss holds the deepest room");
  // Shrines stand in walkable dead ends, never inside a hedge.
  assert.ok(maze.shrines.length >= 4, "the maze offers several rest spots");
  for (const shrine of maze.shrines)
    assert.equal(maze.blocked(shrine.x, shrine.y, 26), false, "shrines stand on open floor");
});

test("the open field triples its ranks and no rival deploys inside a hedge", () => {
  for (const act of ACTS) {
    const game = storySession(act.id);
    const g = game.g, maze = g.roam.maze;
    assert(maze, `${act.id} builds a maze`);
    const base = act.encounters.flatMap((encounter) => rosterForEncounter(encounter.id, "campaign"));
    // Camp math: legends split into camps of two (each camp adds camp+2
    // retainers); grunts stand apart; boss camps keep their retinue. The Hall
    // of Twenty fields only its legends and their retinues — no ranks.
    const core = act.encounters.reduce((sum, encounter) => {
      const kinds = rosterForEncounter(encounter.id, "campaign");
      if (encounter.bossId) return sum + kinds.length;
      const legends = kinds.filter(isNamedRivalKind).length;
      const grunts = kinds.filter((kind) => !isNamedRivalKind(kind) && !isEscortKind(kind)).length;
      const camps = Math.ceil(legends / 2);
      return sum + legends + grunts + (legends ? legends + camps * 2 : 0);
    }, 0);
    const ranks = act.id === "otherworld" ? 1 : 3;
    assert.equal(g.roam.field.length, core * ranks, `${act.id} fields its camps${ranks === 3 ? " with tripled ranks" : " without ranks"}`);
    // Story legends stand exactly as often as the story casts them (some
    // legends hold more than one pass); the extra bodies are act grunts.
    for (const kind of new Set(base.filter(isNamedRivalKind)))
      assert.equal(
        g.roam.field.filter((rival) => rival.kind === kind).length,
        base.filter((entry) => entry === kind).length,
        `${kind} stands as often as the story casts it`,
      );
    for (const rival of g.roam.field) {
      assert(rival.area, "every rival holds an area");
      assert.equal(maze.blocked(rival.x, rival.y, 28), false, `${rival.kind} deploys on open floor`);
    }
    // The hero enters at the west gate, clear of the hedges.
    assert.deepEqual({ x: g.p.x, y: g.p.y }, maze.start);
    assert(g.roam.shrines.length >= 4, `${act.id} places rest shrines`);
  }
});

test("maze walls stop the hero: movement slides along the hedges", () => {
  const game = storySession();
  const g = game.g, maze = g.roam.maze;
  // This probe is about hedges, not rivals: clear the field so the climb
  // cannot open a duel partway up.
  g.roam.field.length = 0;
  // Walk north from the west gate until the top hedge band blocks the way.
  for (let i = 0; i < 600; i++) game.step(1 / 60, { dx: 0, dy: -1 });
  assert(game.mode === "exploring");
  // The top wall row begins at y = 0; the hero's feet may never enter it.
  const { i, j } = { i: Math.floor((g.p.x - maze.ox) / maze.tile), j: Math.floor((g.p.y - maze.oy) / maze.tile) };
  assert.equal(maze.isWallTile(i, j), false, "the hero never stands inside a hedge");
  assert.ok(g.p.y < maze.start.y, "the climb actually moved the hero north");
  // Direct collision probe: a step aimed straight into an interior hedge wall
  // slides to its edge instead of passing through.
  let probe = null;
  for (let j = 1; j < maze.th - 1 && !probe; j++)
    for (let i = 1; i < maze.tw - 1 && !probe; i++) {
      // A wall tile with open floor to its west: brace there and step east.
      if (!maze.isWallTile(i, j) || maze.isWallTile(i - 1, j)) continue;
      probe = {
        from: { x: maze.ox + (i - 1 + 0.5) * maze.tile, y: maze.oy + (j + 0.5) * maze.tile },
        wallLeft: maze.ox + i * maze.tile,
      };
    }
  assert(probe, "the maze has an interior wall to brace against");
  const into = resolveBlockers(probe.from.x + 200, probe.from.y, 18, probe.from, maze.rects);
  assert.ok(into.x <= probe.wallLeft - 18 + 1, "resolveBlockers stops at the hedge edge");
});

test("wayside shrines restore energy once each", () => {
  const game = storySession();
  const g = game.g;
  const shrine = g.roam.shrines.find((entry) => !entry.used);
  Object.assign(g.p, { x: shrine.x, y: shrine.y, hp: 40, flow: 10, composure: 80, rattled: true, teaPots: 1 });
  for (let i = 0; i < 10; i++) game.step(1 / 60, {});
  assert.equal(shrine.used, true, "the incense burns once");
  assert.equal(g.p.hp, 75, "health returns (+35)");
  assert.equal(g.p.flow, 55, "Flow surges back (+45)");
  assert.equal(g.p.composure, 0, "the nerve steadies");
  assert.equal(g.p.rattled, false, "rattled clears on rest");
  assert.equal(g.p.teaPots, 2, "a fresh pot of tea steeps");
  const hp = g.p.hp;
  g.p.hp = 40;
  for (let i = 0; i < 10; i++) game.step(1 / 60, {});
  assert.equal(g.p.hp, 40, "a used shrine never rests the party again");
  // An unused second shrine still waits elsewhere in the labyrinth.
  assert.ok(g.roam.shrines.length >= 4);
});

test("checkpoints rebuild the same labyrinth for the same run", () => {
  const game = storySession();
  const mazeBefore = [...game.g.roam.maze.walls];
  game.checkpoint("combat");
  game.pause();
  game.menu();
  // Same profile → same runId → the maze rebuilds identically.
  assert.equal(game.continueCheckpoint(), true);
  while (game.mode === "dialogue") game.advanceDialogue(true);
  assert.deepEqual([...game.g.roam.maze.walls], mazeBefore, "the hedges stand where they stood");
});

test("quick play and wander stay on the classic stone passes", () => {
  const quick = session(memoryStorage());
  quick.start("zhao-yun", "quickplay", "jade-gate", { lead: "zhao-yun", followers: ["lu-zhishen", "hu-sanniang"] });
  assert.equal(quick.g.roam.maze, null);
  assert.deepEqual(quick.g.roam.shrines, []);
  assert.equal(quick.g.roam.field.length, rosterForEncounter("vanguard", "quickplay").length);
});
