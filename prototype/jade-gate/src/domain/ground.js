import { clamp } from './math.js';

// Feet-space on the painted stone courtyard, in the 1280 × 720 arena.
// The narrowing rear edge excludes the sky, railings and gate stairs.
export const GROUND = { top: 290, bottom: 630, rearLeft: 280, rearRight: 1000, frontLeft: 135, frontRight: 1145 };
export function groundEdges(y) {
  const t = clamp((y - GROUND.top) / (GROUND.bottom - GROUND.top), 0, 1);
  return { left: GROUND.rearLeft + (GROUND.frontLeft - GROUND.rearLeft) * t,
    right: GROUND.rearRight + (GROUND.frontRight - GROUND.rearRight) * t };
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
