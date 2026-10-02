import { seededRandom } from '../engine/clock.js';
import { WORLD } from './ground.js';

/** Open-field maze: a thick-wall tile grid carved by a seeded backtracker.
 *  Odd tiles are rooms; even rows/columns are walls. The same seed always
 *  rebuilds the same labyrinth, so checkpoints restore it exactly. */
export const TILE = 320;
/** Share of interior walls knocked out after carving so the labyrinth has
 *  loops (several routes to a camp) instead of one frustrating path. */
const LOOP_CHANCE = 0.16;

const oddBelow = (n) => (n % 2 ? n : n - 1);

export function hashSeed(text) {
  let hash = 2166136261;
  for (const ch of String(text)) hash = Math.imul(hash ^ ch.charCodeAt(0), 16777619) >>> 0;
  return hash;
}

/**
 * Build the maze for one open-field act.
 * @param {number} seed deterministic seed (hash of runId + actId)
 * @param {{areas?: string[], bossId?: string}} [opts] encounter ids to anchor
 */
export function generateMaze(seed, opts = {}) {
  const rng = seededRandom(seed);
  const tw = oddBelow(Math.floor(WORLD.width / TILE));   // 31
  const th = oddBelow(Math.floor(WORLD.height / TILE));  // 11
  const ox = Math.round((WORLD.width - tw * TILE) / 2);
  const oy = Math.round((WORLD.height - th * TILE) / 2);
  const nx = (tw - 1) / 2, ny = (th - 1) / 2;
  const walls = new Uint8Array(tw * th).fill(1);
  const at = (i, j) => walls[j * tw + i];
  const set = (i, j, v) => { walls[j * tw + i] = v; };
  const roomTile = (i, j) => ({ i: 2 * i + 1, j: 2 * j + 1 });

  // Recursive backtracker over the room graph; carve rooms + linking walls.
  const visited = new Uint8Array(nx * ny);
  const stack = [0];
  visited[0] = 1;
  set(1, 1, 0);
  while (stack.length) {
    const current = stack[stack.length - 1];
    const ci = current % nx, cj = Math.floor(current / nx);
    const neighbors = [
      [ci + 1, cj, ci * 2 + 2, cj * 2 + 1], [ci - 1, cj, ci * 2, cj * 2 + 1],
      [ci, cj + 1, ci * 2 + 1, cj * 2 + 2], [ci, cj - 1, ci * 2 + 1, cj * 2],
    ].filter(([i, j]) => i >= 0 && i < nx && j >= 0 && j < ny && !visited[j * nx + i]);
    if (!neighbors.length) { stack.pop(); continue; }
    const [ni, nj, wi, wj] = neighbors[Math.floor(rng() * neighbors.length)];
    visited[nj * nx + ni] = 1;
    set(wi, wj, 0);
    const carved = roomTile(ni, nj);
    set(carved.i, carved.j, 0);
    stack.push(nj * nx + ni);
  }
  // Loops: clear some interior walls so several routes thread the labyrinth.
  for (let j = 0; j < ny; j++)
    for (let i = 0; i < nx; i++) {
      if (i + 1 < nx && rng() < LOOP_CHANCE) set(i * 2 + 2, j * 2 + 1, 0);
      if (j + 1 < ny && rng() < LOOP_CHANCE) set(i * 2 + 1, j * 2 + 2, 0);
    }

  const cellCenter = (i, j) => ({ x: ox + i * TILE + TILE / 2, y: oy + j * TILE + TILE / 2 });
  const rooms = [];
  for (let j = 0; j < ny; j++)
    for (let i = 0; i < nx; i++) {
      const tile = roomTile(i, j);
      rooms.push({ i, j, ...cellCenter(tile.i, tile.j) });
    }
  const roomAt = (i, j) => rooms[j * nx + i];

  // BFS over open room-to-room links, from the west-middle room.
  const startRoom = roomAt(0, Math.floor(ny / 2));
  const dist = new Map([[startRoom.j * nx + startRoom.i, 0]]);
  const queue = [startRoom];
  while (queue.length) {
    const room = queue.shift();
    const d = dist.get(room.j * nx + room.i);
    for (const [di, dj, wi, wj] of [[1, 0, 1, 0], [-1, 0, -1, 0], [0, 1, 0, 1], [0, -1, 0, -1]]) {
      const i = room.i + di, j = room.j + dj;
      if (i < 0 || i >= nx || j < 0 || j >= ny) continue;
      if (at(roomTile(room.i, room.j).i + wi, roomTile(room.i, room.j).j + wj)) continue;
      const key = j * nx + i;
      if (dist.has(key)) continue;
      dist.set(key, d + 1);
      queue.push(roomAt(i, j));
    }
  }

  /** Open a 3×3-tile plaza around a room so a whole camp fits inside. */
  const carvePlaza = (room) => {
    const tile = roomTile(room.i, room.j);
    for (let j = tile.j - 1; j <= tile.j + 1; j++)
      for (let i = tile.i - 1; i <= tile.i + 1; i++)
        if (i > 0 && i < tw - 1 && j > 0 && j < th - 1) set(i, j, 0);
  };
  carvePlaza(startRoom);

  // Anchor areas along the journey: strictly increasing path distance west →
  // the boss camp; the act boss holds the farthest room of the labyrinth.
  const byDistance = [...rooms].sort((a, b) =>
    (dist.get(a.j * nx + a.i) ?? 1e9) - (dist.get(b.j * nx + b.i) ?? 1e9) || (a.i + a.j) - (b.i + b.j));
  const anchors = {};
  const used = new Set([startRoom.j * nx + startRoom.i]);
  const claim = (room) => { used.add(room.j * nx + room.i); carvePlaza(room); return cellCenter(roomTile(room.i, room.j).i, roomTile(room.i, room.j).j); };
  const areas = opts.areas || [];
  const bossRoom = byDistance[byDistance.length - 1];
  const pathRooms = byDistance.slice(0, byDistance.length - 1);
  areas.filter((id) => id !== opts.bossId).forEach((id, index) => {
    const wanted = Math.round(((index + 1) / (areas.length + 1)) * (pathRooms.length - 1));
    let room = pathRooms[wanted];
    // Nudge along the distance ladder until clear of every used camp.
    let guard = 0;
    while (room && used.has(room.j * nx + room.i) && guard++ < pathRooms.length)
      room = pathRooms[(wanted + guard) % pathRooms.length];
    anchors[id] = room && !used.has(room.j * nx + room.i)
      ? claim(room)
      : claim(pathRooms.find((candidate) => !used.has(candidate.j * nx + candidate.i)) || startRoom);
  });
  anchors.boss = claim(bossRoom);

  // Wayside shrines: quiet dead ends away from every camp, one incense each.
  const degree = (room) => [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([di, dj]) => {
    const tile = roomTile(room.i, room.j);
    return !at(tile.i + di, tile.j + dj);
  }).length;
  const shrineRooms = rooms
    .filter((room) => !used.has(room.j * nx + room.i))
    .map((room) => ({ room, degree: degree(room), roll: rng() }))
    .sort((a, b) => a.degree - b.degree || b.roll - a.roll || (dist.get(b.room.j * nx + b.room.i) ?? 0) - (dist.get(a.room.j * nx + a.room.i) ?? 0))
    .map((entry) => entry.room);
  const shrineCount = Math.max(4, Math.min(8, Math.round(rooms.length / 10)));
  const shrines = shrineRooms.slice(0, shrineCount)
    .map((room, index) => ({ id: `shrine-${index}`, ...cellCenter(roomTile(room.i, room.j).i, roomTile(room.i, room.j).j) }));

  // Merge horizontal wall runs into AABBs for resolveBlockers.
  const rects = [];
  for (let j = 0; j < th; j++) {
    let run = -1;
    for (let i = 0; i <= tw; i++) {
      const wall = i < tw && at(i, j);
      if (wall && run < 0) run = i;
      if (!wall && run >= 0) {
        rects.push({ x: ox + run * TILE, y: oy + j * TILE, w: (i - run) * TILE, h: TILE });
        run = -1;
      }
    }
  }

  const tileIndex = (x, y) => ({
    i: Math.floor((x - ox) / TILE),
    j: Math.floor((y - oy) / TILE),
  });
  const isWallTile = (i, j) => i < 0 || i >= tw || j < 0 || j >= th || !!at(i, j);
  return {
    tile: TILE, tw, th, ox, oy, walls, rects, rooms,
    start: cellCenter(roomTile(startRoom.i, startRoom.j).i, roomTile(startRoom.i, startRoom.j).j),
    anchors, shrines,
    isWallTile,
    /** Circle-vs-tile test used by rival wandering and arrow impacts. */
    blocked(x, y, radius = 16) {
      const { i, j } = tileIndex(x, y);
      for (let jj = j - 1; jj <= j + 1; jj++)
        for (let ii = i - 1; ii <= i + 1; ii++) {
          if (!isWallTile(ii, jj)) continue;
          const left = ox + ii * TILE, top = oy + jj * TILE;
          const cx = Math.max(left, Math.min(x, left + TILE));
          const cy = Math.max(top, Math.min(y, top + TILE));
          if ((x - cx) ** 2 + (y - cy) ** 2 < radius * radius) return true;
        }
      return false;
    },
    /** Room path-distance from the start, for anchoring and the route map. */
    distanceAt(x, y) {
      const { i, j } = tileIndex(x, y);
      const ri = Math.floor(i / 2), rj = Math.floor(j / 2);
      return dist.get(rj * nx + ri) ?? Infinity;
    },
    /** Arrow line of sight: no wall tile between the two points. */
    rayClear(x0, y0, x1, y1) {
      const steps = Math.ceil(Math.hypot(x1 - x0, y1 - y0) / (TILE / 2));
      for (let s = 0; s <= steps; s++) {
        const t = s / steps;
        const { i, j } = tileIndex(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t);
        if (isWallTile(i, j)) return false;
      }
      return true;
    },
  };
}
