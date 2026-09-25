import { DUEL_ENEMIES, DUEL_ROSTERS } from "../content/duels.js";

export { DUEL_ENEMIES, DUEL_ROSTERS } from "../content/duels.js";

/** Base roaming speed for heroes on dry ground (pixels/second). */
export const PLAYER_SPEED = 240;

/**
 * Shallows impedance factor (~60–70% of PLAYER_SPEED).
 * Water shallows impede footwork on the river crossing.
 */
export const SHALLOWS_ROAM_SPEED_FACTOR = 0.65;

/** Contact threshold distance between hero and rival to initiate a card duel. */
export const CONTACT_DISTANCE = 52;

/**
 * Determines whether the current roaming environment has shallows impedance.
 */
export function isRoamInShallows(encounter, g = null) {
  if (g?.shallows) return true;
  if (encounter?.hazards?.includes("shallows")) return true;
  if (Array.isArray(g?.hazards) && g.hazards.includes("shallows")) return true;
  return false;
}

/**
 * Calculates hero roam speed given shallows state.
 */
export function getHeroRoamSpeed(inShallows = false) {
  return inShallows
    ? PLAYER_SPEED * SHALLOWS_ROAM_SPEED_FACTOR
    : PLAYER_SPEED;
}

/**
 * Creates a deterministic fixed-step roam state for an encounter pass.
 *
 * @param {object|string} encounter - Encounter object or ID string.
 * @param {object|string} hero - Hero object or ID string.
 * @param {object} options - Optional configuration (g, shallows, heroX, heroY, etc.)
 */
export function createRoam(encounter, hero = "zhao-yun", options = {}) {
  const enc = typeof encounter === "string" ? { id: encounter } : (encounter || {});
  const encounterId = enc.id || "vanguard";
  const hazards = [
    ...new Set([
      ...(enc.hazards || []),
      ...(options.g?.hazards || []),
      ...(options.hazards || []),
    ]),
  ];
  const shallows = options.shallows ?? isRoamInShallows(enc, options.g);

  const heroId = typeof hero === "string" ? hero : (hero?.id || "zhao-yun");
  const heroState = {
    id: heroId,
    x: options.heroX ?? 180,
    y: options.heroY ?? 400,
    facing: 1,
    moving: false,
    inShallows: shallows,
    speed: getHeroRoamSpeed(shallows),
  };

  const rosterIds = DUEL_ROSTERS[encounterId] || enc.enemies || [];
  const rivals = rosterIds.map((enemyId, i) => {
    const enemyDef = DUEL_ENEMIES[enemyId] || {
      id: enemyId,
      name: enemyId,
      title: "Rival",
      hp: 40,
      maxHp: 40,
    };
    return {
      id: `${encounterId}-rival-${i}`,
      enemyId,
      name: enemyDef.name,
      title: enemyDef.title,
      cn: enemyDef.cn || "",
      hp: enemyDef.hp,
      maxHp: enemyDef.maxHp,
      boss: !!enemyDef.boss,
      x: 520 + i * 210,
      y: 360 + (i % 2 === 0 ? 40 : -40),
      originX: 520 + i * 210,
      originY: 360 + (i % 2 === 0 ? 40 : -40),
      alive: true,
      contact: false,
    };
  });

  return {
    encounterId,
    encounter: enc,
    hazards,
    shallows,
    hero: heroState,
    rivals,
    time: 0,
    contactRival: null,
    duelStarted: false,

    /**
     * Advances the roaming simulation by a deterministic fixed timestep `dt`.
     *
     * @param {number} dt - Timestep in seconds (e.g. 1/60).
     * @param {object} input - Input state ({ keys: Set, move: string, dx: number, dy: number }).
     * @returns {object|null} The rival contacted this frame, if any.
     */
    step(dt, input = {}) {
      this.time += dt;
      const keys = input.keys || (input.actions ? new Set(input.actions) : new Set());
      const move = input.move || null;

      let mx = 0, my = 0;

      // Handle keyboard keys (WASD and arrow keys)
      if (keys.has("KeyD") || keys.has("ArrowRight") || move === "right") mx += 1;
      if (keys.has("KeyA") || keys.has("ArrowLeft") || move === "left") mx -= 1;
      if (keys.has("KeyS") || keys.has("ArrowDown") || move === "down") my += 1;
      if (keys.has("KeyW") || keys.has("ArrowUp") || move === "up") my -= 1;

      // Handle direct vector input (e.g. analog sticks or test inputs)
      if (typeof input.dx === "number" && input.dx !== 0) mx = input.dx;
      if (typeof input.dy === "number" && input.dy !== 0) my = input.dy;

      const len = Math.hypot(mx, my);
      this.hero.moving = len > 0;
      this.hero.inShallows = this.shallows;

      if (this.hero.moving) {
        const normX = mx / len;
        const normY = my / len;
        const currentSpeed = getHeroRoamSpeed(this.shallows);
        this.hero.speed = currentSpeed;
        this.hero.x += normX * currentSpeed * dt;
        this.hero.y += normY * currentSpeed * dt;

        if (mx > 0) this.hero.facing = 1;
        else if (mx < 0) this.hero.facing = -1;
      }

      // Clamp hero within mountain pass stage bounds
      this.hero.x = Math.max(60, Math.min(1220, this.hero.x));
      this.hero.y = Math.max(160, Math.min(660, this.hero.y));

      // Deterministic subtle patrol sway for rivals
      for (const r of this.rivals) {
        if (!r.alive) continue;
        r.x = r.originX + Math.sin(this.time * 1.5 + r.originY) * 16;
        r.y = r.originY + Math.cos(this.time * 1.2 + r.originX) * 8;

        // Check contact collision
        const dist = Math.hypot(this.hero.x - r.x, this.hero.y - r.y);
        if (dist <= CONTACT_DISTANCE) {
          r.contact = true;
          this.contactRival = r;
          this.duelStarted = true;
          return r;
        }
      }

      return null;
    },

    /**
     * Resolves victory in a card duel against a rival, removing them from the pass.
     */
    defeatRival(rivalId) {
      const rival = this.rivals.find((r) => r.id === rivalId || r.enemyId === rivalId);
      if (rival) {
        rival.alive = false;
        rival.contact = false;
      }
      this.contactRival = null;
      this.duelStarted = false;
      return this.rivals.every((r) => !r.alive);
    },

    /**
     * Checks if all rivals in this encounter pass have been defeated.
     */
    isCleared() {
      return this.rivals.length > 0 && this.rivals.every((r) => !r.alive);
    },
  };
}
