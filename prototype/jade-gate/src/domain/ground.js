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
 * Camera top-left in world space: keep the focus near viewport center, clamped
 * so the view never shows past WORLD edges. Followers share this same cam.
 */
export function cameraFocus(focus, world = WORLD, viewport = VIEWPORT) {
  const maxX = Math.max(0, world.width - viewport.width);
  const maxY = Math.max(0, world.height - viewport.height);
  return {
    x: clamp(focus.x - viewport.width / 2, 0, maxX),
    y: clamp(focus.y - viewport.height / 2, 0, maxY),
  };
}

export function worldToScreen(wx, wy, cam) {
  return { x: wx - cam.x, y: wy - cam.y };
}
