import { clamp } from './math.js';

/** Fixed on-screen frame. World may be larger; roam-view scrolls via camera. */
export const VIEWPORT = { width: 1280, height: 720 };

/** Four forest stretches, retaining the newer south pocket. The world grew
 *  taller for the maze passes: corridors now climb and descend as well. */
export const MAZE_SEGMENT_WIDTH = 2560;
export const WORLD = { width: MAZE_SEGMENT_WIDTH * 4, height: 3520 };

// Feet-space across the enlarged world. Same courtyard trapezoid flare as the
// original 1280×720 pass, stretched so the first screen stays walkable and the
// hero (and PARTY followers) can roam past the old right/bottom edges.
export const GROUND = {
  top: 160,
  bottom: 3360,
  rearLeft: 280,
  rearRight: WORLD.width - 280,
  frontLeft: 135,
  frontRight: WORLD.width - 135,
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

/** World-space encounter spawn markers along the courtyard → corridor → pocket path. */
export const SPAWN_MARKERS = [
  { id: 'courtyard-near', x: 880, y: 400 },
  { id: 'courtyard-approach', x: 1200, y: 500 },
  { id: 'corridor-gap', x: 1450, y: 500 },
  { id: 'second-pocket', x: 1850, y: 600 },
  { id: 'third-pocket', x: 1900, y: 1050 },
  { id: 'far-clearing', x: 9650, y: 650 },
].map(marker => ({ id: marker.id, ...groundPoint(marker.x, marker.y) }));

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

/** East courtyard past the CAM-02 corridor — intentional second roam pocket. */
export const SECOND_ZONE = {
  left: 1500,
  right: 2200,
  top: 370,
  bottom: 880,
};

export function inSecondZone({ x, y }) {
  return x >= SECOND_ZONE.left && x <= SECOND_ZONE.right
    && y >= SECOND_ZONE.top && y <= SECOND_ZONE.bottom;
}

/** South spur off the second pocket — third walkable courtyard (CAM-10). */
export const THIRD_ZONE = {
  left: 1700,
  right: 2100,
  top: SECOND_ZONE.bottom,
  bottom: 1180,
};

export function inThirdZone({ x, y }) {
  return x >= THIRD_ZONE.left && x <= THIRD_ZONE.right
    && y >= THIRD_ZONE.top && y <= THIRD_ZONE.bottom;
}

// CAM-02 vertical barrier + CAM-03 walls that carve the east pocket +
// CAM-10 south-spur walls for the third pocket.
// Corridor gap ~y 460–560 at x=1400 remains the only west↔east passage;
// first-courtyard spawn/contact lane (left of barrier) stays clear.
// Second→third mouth spans THIRD_ZONE.left–right at SECOND_ZONE.bottom.
export const BLOCKERS = [
  { x: 1400, y: GROUND.top, w: 100, h: 170 },
  { x: 1400, y: 560, w: 100, h: GROUND.bottom - 560 },
  // East pocket north wall (above SECOND_ZONE.top)
  { x: SECOND_ZONE.left, y: GROUND.top, w: SECOND_ZONE.right - SECOND_ZONE.left, h: SECOND_ZONE.top - GROUND.top },
  // South wall west remnant (left of third-pocket mouth)
  { x: SECOND_ZONE.left, y: SECOND_ZONE.bottom, w: THIRD_ZONE.left - SECOND_ZONE.left, h: GROUND.bottom - SECOND_ZONE.bottom },
  // South wall east remnant (right of third-pocket mouth)
  { x: THIRD_ZONE.right, y: SECOND_ZONE.bottom, w: SECOND_ZONE.right - THIRD_ZONE.right, h: GROUND.bottom - SECOND_ZONE.bottom },
  // Third pocket south end wall — encloses the spur
  { x: THIRD_ZONE.left, y: THIRD_ZONE.bottom, w: THIRD_ZONE.right - THIRD_ZONE.left, h: GROUND.bottom - THIRD_ZONE.bottom },
  // Continue east through alternating openings across the restored long route.
  ...[
    { x: 3500, gapTop: 570, gapBottom: 820 },
    { x: 5350, gapTop: 420, gapBottom: 670 },
    { x: 7200, gapTop: 580, gapBottom: 830 },
    { x: 9050, gapTop: 440, gapBottom: 740 },
  ].flatMap(({ x, gapTop, gapBottom }) => [
    { x, y: GROUND.top, w: 100, h: gapTop - GROUND.top },
    { x, y: gapBottom, w: 100, h: GROUND.bottom - gapBottom },
  ]),
];

/** Resolve feet against radius-expanded AABBs, sweeping X then Y to slide.
 *  Supplying the previous point prevents even a long step tunnelling through.
 *  `walls` overrides the classic BLOCKERS (the maze passes inject their own);
 *  classic passes and quick play keep the painted-stone layout. */
export function resolveBlockers(x, y, radius = 18, from = { x, y }, walls = BLOCKERS) {
  const start = groundPoint(from.x, from.y);
  const target = groundPoint(x, y);
  let px = start.x, py = start.y;
  // Recover an overlapping starting point using the nearest free edge.
  for (const b of walls) {
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
  for (const b of walls) {
    if (py <= b.y-radius || py >= b.y+b.h+radius) continue;
    if (px <= b.x-radius && nextX > b.x-radius) nextX = b.x-radius;
    if (px >= b.x+b.w+radius && nextX < b.x+b.w+radius) nextX = b.x+b.w+radius;
  }
  let nextY = target.y;
  for (const b of walls) {
    if (nextX <= b.x-radius || nextX >= b.x+b.w+radius) continue;
    if (py <= b.y-radius && nextY > b.y-radius) nextY = b.y-radius;
    if (py >= b.y+b.h+radius && nextY < b.y+b.h+radius) nextY = b.y+b.h+radius;
  }
  return groundPoint(nextX, nextY);
}
