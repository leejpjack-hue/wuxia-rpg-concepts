/** Gate Vanguard is a sequence of drawings, not a tween of four plates.
 * Each tick is its own cutout. The body, cloth, and weapon are in the drawing.
 */

import { DRAW } from "./vanguard-draw.mjs";

export const TICK = DRAW.frameMs;

const byId = Object.fromEntries(DRAW.beats.map((beat) => [beat.id, beat]));

export const BEATS = byId;
export const BEAT_MS = Object.fromEntries(DRAW.beats.map((beat) => [beat.id, beat.ms]));

function pose(id) {
  return {
    pose: id,
    from: id,
    to: id,
    blend: 0,
    smear: 0,
    hold: false,
    x: 0,
    y: 0,
    rot: 0,
    skew: 0,
    blur: 0,
    sx: 1,
    phase: "draw",
  };
}

export function sampleBeat(id, elapsed = 0) {
  const beat = byId[id];
  if (!beat) return null;
  const t = Math.min(Math.max(0, elapsed), Math.max(0, beat.ms - 1));
  const index = Math.min(beat.hero.length - 1, Math.floor(t / DRAW.frameMs));
  return {
    bg: "gate",
    ms: beat.ms,
    phase: "draw",
    flash: "",
    fx: "",
    hero: pose(beat.hero[index]),
    rival: pose(beat.rival[index]),
    light: 0,
    index,
  };
}

export function listFrames(id) {
  const beat = byId[id];
  const frames = [];
  for (let at = 0; at < beat.ms; at += TICK) {
    const sample = sampleBeat(id, at);
    frames.push({
      at,
      bg: sample.bg,
      hero: sample.hero.pose,
      rival: sample.rival.pose,
      heroFrom: sample.hero.pose,
      heroTo: sample.hero.pose,
      phase: sample.phase,
      flash: null,
      fx: null,
    });
  }
  return frames;
}

export function arcFor() {
  return {};
}

export function lifeScale() {
  return 0;
}

export function poseAt(frame, who, life = {}, shift = { x: 0, y: 0 }) {
  const motion = frame?.motion?.[who];
  const depth = who === "hero" ? 1 : 0.82;
  return {
    x: (motion?.x || 0) + (shift.x || 0) * depth,
    y: (motion?.y || 0) + (life.y || 0) + (shift.y || 0) * depth,
    rot: (motion?.rot || 0) + (life.rot || 0),
    skew: 0,
    blur: 0,
    sx: 1,
  };
}
