import { clamp } from './math.js';

/** Fixed on-screen frame. World may be larger; roam-view scrolls via camera. */
export const VIEWPORT = { width: 1280, height: 720 };

/** Logical roam extent — ≥2× the old single-screen arena. */
export const WORLD = { width: 2560, height: 1440 };

// Feet-space across the enlarged world. Same courtyard trapezoid flare as the
// original 1280×720 pass, stretched so the first screen stays walkable and the
// hero (and PARTY followers) can roam past the old right/bottom edges.
export const GROUND = {
  top: 290,
  bottom: 1350,
  rearLeft: 280,
  rearRight: 2280,
  frontLeft: 135,
  frontRight: 2425,
};

export function groundEdges(y) {
  const t = clamp((y - GROUND.top) / (GROUND.bottom - GROUND.top), 0, 1);
  return {
    left: GROUND.rearLeft + (GROUND.frontLeft - GROUND.rearLeft) * t,
    right: GROUND.rearRight + (GROUND.frontRight - GROUND.rearRight) * t,
  };
}

export function groundPoint(x, y) {
  y = clamp(y, GROUND.top, GROUND.bottom);
  const { left, right } = groundEdges(y);
  return { x: clamp(x, left, right), y };
}

export function onGround({ x, y }) {
  const { left, right } = groundEdges(y);
  return y >= GROUND.top && y <= GROUND.bottom && x >= left && x <= right;
}

/**
 * Camera top-left in world space: ideal target that keeps the focus near
 * viewport center, clamped so the view never shows past WORLD edges.
 * Soft follow uses this as the chase target; followers share the same cam.
 */
export function cameraFocus(focus, world = WORLD, viewport = VIEWPORT) {
  const maxX = Math.max(0, world.width - viewport.width);
  const maxY = Math.max(0, world.height - viewport.height);
  return {
    x: clamp(focus.x - viewport.width / 2, 0, maxX),
    y: clamp(focus.y - viewport.height / 2, 0, maxY),
  };
}

/**
 * Half-size of the soft-follow deadzone in world/screen px (centered on the
 * viewport). Lead fidgets inside this box do not chase the camera.
 * Modest: ~100×75 (within ~80–120 × ~60–90).
 */
export const DEADZONE = { halfW: 100, halfH: 75 };

/** Soft-camera chase rate (units of fraction toward ideal per second). */
export const CAMERA_LERP_RATE = 6;

function cameraBounds(world = WORLD, viewport = VIEWPORT) {
  return {
    maxX: Math.max(0, world.width - viewport.width),
    maxY: Math.max(0, world.height - viewport.height),
  };
}

/**
 * Soft camera: if the focus's screen position relative to prevCam is still
 * inside a centered deadzone, keep prevCam. Otherwise lerp toward
 * cameraFocus(focus). Always clamp to WORLD edges.
 *
 * @param {{x:number,y:number}|null|undefined} prevCam prior top-left (null snaps)
 * @param {{x:number,y:number}} focus lead world position
 * @param {number} dt seconds since last frame
 * @param {{world?:object,viewport?:object,deadzone?:{halfW:number,halfH:number},rate?:number}} [opts]
 */
export function smoothCamera(prevCam, focus, dt, opts = {}) {
  const world = opts.world ?? WORLD;
  const viewport = opts.viewport ?? VIEWPORT;
  const deadzone = opts.deadzone ?? DEADZONE;
  const rate = opts.rate ?? CAMERA_LERP_RATE;
  const ideal = cameraFocus(focus, world, viewport);
  const { maxX, maxY } = cameraBounds(world, viewport);

  if (!prevCam) {
    return { x: ideal.x, y: ideal.y };
  }

  const screenX = focus.x - prevCam.x;
  const screenY = focus.y - prevCam.y;
  const cx = viewport.width / 2;
  const cy = viewport.height / 2;
  const inDeadzone =
    Math.abs(screenX - cx) <= deadzone.halfW &&
    Math.abs(screenY - cy) <= deadzone.halfH;

  if (inDeadzone) {
    return {
      x: clamp(prevCam.x, 0, maxX),
      y: clamp(prevCam.y, 0, maxY),
    };
  }

  const t = Math.min(1, Math.max(0, rate) * Math.max(0, dt));
  return {
    x: clamp(prevCam.x + (ideal.x - prevCam.x) * t, 0, maxX),
    y: clamp(prevCam.y + (ideal.y - prevCam.y) * t, 0, maxY),
  };
}

export function worldToScreen(wx, wy, cam) {
  return { x: wx - cam.x, y: wy - cam.y };
}

// A vertical barrier across the pass; the 100px opening keeps the spawn lane
// walkable while travel at other heights must route through the corridor.
export const BLOCKERS = [
  { x: 1400, y: GROUND.top, w: 100, h: 170 },
  { x: 1400, y: 560, w: 100, h: GROUND.bottom - 560 },
];

/** Resolve feet against radius-expanded AABBs, sweeping X then Y to slide.
 * Supplying the previous point prevents even a long step tunnelling through.
 */
export function resolveBlockers(x, y, radius = 18, from = { x, y }) {
  const start = groundPoint(from.x, from.y);
  const target = groundPoint(x, y);
  let px = start.x, py = start.y;
  // Recover an overlapping starting point using the nearest free edge.
  for (const b of BLOCKERS) {
    const left = b.x - radius, right = b.x + b.w + radius;
    const top = b.y - radius, bottom = b.y + b.h + radius;
    if (px > left && px < right && py > top && py < bottom) {
      const exits = [
        { x: left, y: py }, { x: right, y: py },
        { x: px, y: top }, { x: px, y: bottom },
      ].filter(onGround);
      exits.sort((a, b) => Math.hypot(a.x-px, a.y-py) - Math.hypot(b.x-px, b.y-py));
      ({ x: px, y: py } = exits[0]);
    }
  }
  let nextX = target.x;
  for (const b of BLOCKERS) {
    if (py <= b.y-radius || py >= b.y+b.h+radius) continue;
    if (px <= b.x-radius && nextX > b.x-radius) nextX = b.x-radius;
    if (px >= b.x+b.w+radius && nextX < b.x+b.w+radius) nextX = b.x+b.w+radius;
  }
  let nextY = target.y;
  for (const b of BLOCKERS) {
    if (nextX <= b.x-radius || nextX >= b.x+b.w+radius) continue;
    if (py <= b.y-radius && nextY > b.y-radius) nextY = b.y-radius;
    if (py >= b.y+b.h+radius && nextY < b.y+b.h+radius) nextY = b.y+b.h+radius;
  }
  return groundPoint(nextX, nextY);
}
