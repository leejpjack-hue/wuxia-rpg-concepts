import { BLOCKERS } from "../domain/ground.js";

/** Stamp natural cutouts at their own proportions; never stretch to a wall. */
export const BLOCKER_ART = BLOCKERS.flatMap((wall, wallIndex) => {
  const cols = Math.max(1, Math.ceil(wall.w / 150));
  const rows = Math.max(1, Math.ceil(wall.h / 150));
  return Array.from({ length: cols * rows }, (_, index) => ({
    x: wall.x + wall.w * (index % cols + 0.5) / cols,
    y: wall.y + wall.h * (Math.floor(index / cols) + 0.5) / rows,
    size: 180,
    flip: (wallIndex + index) % 2 ? -1 : 1,
    tilt: [-4, 3, 0][(wallIndex + index) % 3],
  }));
});
