export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
export function inArc(p, e, range, arc = 1.35) {
  const d = distance(p, e);
  if (d > range + e.radius) return false;
  const a = Math.atan2(e.y - p.y, e.x - p.x) - p.facing;
  return Math.abs(Math.atan2(Math.sin(a), Math.cos(a))) < arc || d < 36;
}
