import { clamp, distance } from "./math.js";
import { FixedClock, seededRandom } from "../engine/clock.js";
import { DUEL_ROSTERS, DUEL_ENEMIES } from "../content/duels.js";

/** Logical ground plane shared with the archived real-time arena rules. */
export const ARENA = {
  width: 1280,
  height: 720,
  margin: 64,
  // Anchors sit at a sprite's feet; keep enough headroom for the 27% hero art.
  top: 170,
};
/** Dry-ground roam speed. Shallows use SHALLOWS_ROAM_SPEED_FACTOR of this. */
export const PLAYER_SPEED = 300;
/** Water shallows slow footwork to 65% — inside the 60–70% band. */
export const SHALLOWS_ROAM_SPEED_FACTOR = 0.65;
const PLAYER_RADIUS = 34;

/** True when the pass or the run state marks water shallows. */
export function isRoamInShallows(encounter, g) {
  if (g?.shallows) return true;
  if (encounter?.hazards?.includes("shallows")) return true;
  if (Array.isArray(g?.hazards) && g.hazards.includes("shallows")) return true;
  return false;
}

/**
 * Arena roaming between duels: the hero walks with directional input, rivals
 * patrol near their posts, and the first contact hands off to a card duel.
 * Runs on a fixed 60 Hz step so 30 and 120 FPS produce identical simulations.
 */
export function createRoam(g, bus, { encounter } = {}) {
  const roster = DUEL_ROSTERS[encounter?.id];
  if (!roster) throw new Error("This encounter has no arena rivals yet.");
  const clock = new FixedClock();
  const field = roster.map((kind, index) => {
    const def = DUEL_ENEMIES[kind];
    const x =
      ARENA.margin +
      ((ARENA.width - 2 * ARENA.margin) * (index + 0.5)) / roster.length;
    const y = ARENA.top + (index % 2) * 150;
    return {
      id: `${encounter.id}-field-${index}`,
      kind,
      name: def.name,
      title: def.title,
      art: def.art,
      radius: 44,
      speed: kind === "warden" ? 70 : 55 + index * 10,
      x,
      y,
      homeX: x,
      homeY: y,
      tx: x,
      ty: y,
      timer: 0,
      rng: seededRandom(1337 + g.encounterIndex * 7 + index * 131),
    };
  });
  g.p.x = ARENA.width / 2;
  // Keep the archived arena start (640, 500): the real-time combat tests aim at it.
  g.p.y = 500;
  g.roam = { field, contact: -1 };

  function wander(enemy, dt) {
    enemy.timer -= dt;
    const dx = enemy.tx - enemy.x,
      dy = enemy.ty - enemy.y,
      d = Math.hypot(dx, dy);
    if (d > 8) {
      const step = Math.min(d, enemy.speed * dt);
      enemy.x += (dx / d) * step;
      enemy.y += (dy / d) * step;
    }
    if (d <= 8 || enemy.timer <= 0) {
      enemy.tx = clamp(
        enemy.homeX + (enemy.rng() * 2 - 1) * 240,
        ARENA.margin,
        ARENA.width - ARENA.margin,
      );
      enemy.ty = clamp(
        enemy.homeY + (enemy.rng() * 2 - 1) * 170,
        ARENA.top,
        ARENA.height - ARENA.margin - 40,
      );
      enemy.timer = 1.2 + enemy.rng() * 1.6;
    }
  }

  function tick(dt, input) {
    const roam = g.roam;
    if (roam.contact >= 0) return;
    const { dx = 0, dy = 0 } = input || {};
    if (dx || dy) {
      const len = Math.hypot(dx, dy) || 1,
        nx = dx / len,
        ny = dy / len;
      const speed = isRoamInShallows(encounter, g)
        ? PLAYER_SPEED * SHALLOWS_ROAM_SPEED_FACTOR
        : PLAYER_SPEED;
      g.p.x = clamp(
        g.p.x + nx * speed * dt,
        ARENA.margin,
        ARENA.width - ARENA.margin,
      );
      g.p.y = clamp(
        g.p.y + ny * speed * dt,
        ARENA.top,
        ARENA.height - ARENA.margin + 20,
      );
      if (nx) g.p.dx = nx > 0 ? 1 : -1;
      g.p.moving = true;
    } else g.p.moving = false;
    for (const enemy of roam.field) wander(enemy, dt);
    for (let i = 0; i < roam.field.length; i++) {
      if (distance(g.p, roam.field[i]) < PLAYER_RADIUS + roam.field[i].radius) {
        roam.contact = i;
        bus.emit("roam:contact", { index: i, kind: roam.field[i].kind });
        break;
      }
    }
  }

  return {
    field,
    step(dt, input) {
      clock.advance(dt, (h) => tick(h, input));
    },
    removeContacted() {
      if (g.roam.contact < 0) return null;
      const [removed] = g.roam.field.splice(g.roam.contact, 1);
      g.roam.contact = -1;
      return removed;
    },
  };
}
