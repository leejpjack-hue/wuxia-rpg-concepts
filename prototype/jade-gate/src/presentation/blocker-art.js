import { BLOCKERS } from "../domain/ground.js";

/** Round thicket cutouts mark narrow dividers; the forest plate marks the
 *  long north/south edges. Collision stays in ground.js. */
export const BLOCKER_ART_SIZE = 180;
export const BLOCKER_ART = BLOCKERS.flatMap((blocker, wallIndex) => {
  if (blocker.w > blocker.h) return [];
  const count = Math.max(1, Math.ceil(blocker.h / 170));
  return Array.from({ length: count }, (_, index) => ({
    x: blocker.x + blocker.w / 2,
    y: blocker.y + blocker.h * (index + 0.5) / count,
    size: BLOCKER_ART_SIZE,
    flip: (wallIndex + index) % 2 ? -1 : 1,
    tilt: [-4, 3, 0][(wallIndex + index) % 3],
  }));
});
