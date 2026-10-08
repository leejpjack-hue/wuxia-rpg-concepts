import { ANCHOR } from "./vanguard-anchor.mjs";

/**
 * Foot point on the plate, in percent.
 * x is the foot center. h is sprite height. foot is the ground line.
 * Approach closes from x0 to x1. Fight beats use POSE_PAIR so each
 * drawing's weapon meets the other fighter. Camera zooms in CAMERA_FIT
 * keep that ground line inside the frame.
 */
export const BEAT_PLACE = {
  approach: {
    foot: 86,
    h: 64,
    hero: { x0: 28, x1: 42 },
    rival: { x0: 72, x1: 58 },
  },
  windup: {
    foot: 92,
    h: 78,
    hero: { x: 46 },
    rival: null,
  },
  feint: {
    foot: 84,
    h: 64,
    hero: { x: 40 },
    rival: { x: 60 },
  },
  ots: {
    foot: 90,
    h: 66,
    hero: { x: 36, h: 74 },
    rival: { x: 62, h: 56, foot: 86 },
  },
  exchange: {
    foot: 84,
    h: 60,
    hero: { x: 43 },
    rival: { x: 57 },
  },
  impact: {
    foot: 90,
    h: 78,
    hero: { x: 38 },
    rival: { x: 62 },
  },
  follow: {
    foot: 85,
    h: 64,
    hero: { x: 41 },
    rival: { x: 59 },
  },
  aftermath: {
    foot: 86,
    h: 58,
    hero: { x: 40 },
    rival: { x: 60 },
  },
};

/** Zooms re-fit so the courtyard feet stay in frame. Durations stay on the shot list. */
export const CAMERA_FIT = {
  feint: { from: { zoom: 1.12, x: 48, y: 54 }, zoom: 1.3, x: 50, y: 52 },
  exchange: { from: { zoom: 1.16, x: 44, y: 52 }, zoom: 1.26, x: 56, y: 52 },
  follow: { from: { zoom: 1.26, x: 50, y: 52 }, zoom: 1.06, x: 50, y: 54 },
};

export const POSE_PAIR = {
  feint: {
    "wa3|wa2": { hero: 39.14, rival: 60.86 },
    "wa3-s|wa2-s": { hero: 38.49, rival: 61.51 },
    "wb3|wa3": { hero: 38.5, rival: 61.5 },
    "wb3-s|wa3-s": { hero: 38.04, rival: 61.96 },
    "wc0|wa4": { hero: 45.65, rival: 54.35 },
    "wc0-s|wa4-s": { hero: 42.69, rival: 57.31 },
    "wc1|wa5": { hero: 46.3, rival: 53.7 },
    "wc1-s|wa5-s": { hero: 42.06, rival: 57.94 },
    "wb4|wb0": { hero: 42.03, rival: 57.97 },
    "wb4-s|wb0-s": { hero: 39.93, rival: 60.07 },
    "wa4|wb1": { hero: 43.38, rival: 56.62 },
  },
  exchange: {
    "wc0|wb0": { hero: 45.31, rival: 54.69 },
    "wc0-s|wb0-s": { hero: 43.02, rival: 56.98 },
    "wc1|wb1": { hero: 44.19, rival: 55.81 },
    "wc1-s|wb1-s": { hero: 41.39, rival: 58.61 },
    "wa3|wb2": { hero: 37.82, rival: 62.18 },
    "wa3-s|wb2-s": { hero: 37.15, rival: 62.85 },
    "wb3|wb3": { hero: 39.46, rival: 60.54 },
    "wb3-s|wb3-s": { hero: 37.87, rival: 62.13 },
    "wc2|wb4": { hero: 39.01, rival: 60.99 },
    "wc0|wb4-s": { hero: 41.35, rival: 58.65 },
    "wc0-s|wb5": { hero: 41.8, rival: 58.2 },
    "wc1|wb0": { hero: 46.11, rival: 53.89 },
  },
  follow: {
    "wa5|wa5": { hero: 44.13, rival: 55.87 },
    "wa5-s|wa5-s": { hero: 39.85, rival: 60.15 },
    "wc3|wa4": { hero: 41.91, rival: 58.09 },
    "wc3-s|wa4-s": { hero: 38.01, rival: 61.99 },
    "wc4|wa3": { hero: 44.48, rival: 55.52 },
    "wc4-s|wa3-s": { hero: 42.73, rival: 57.27 },
    "wb5|wa2": { hero: 42.93, rival: 57.07 },
    "wb5-s|wa2-s": { hero: 40.67, rival: 59.33 },
    "wc5|wa1": { hero: 42.55, rival: 57.45 },
    "wa5|wa1-s": { hero: 43.13, rival: 56.87 },
    "wa5-s|wa0": { hero: 42.74, rival: 57.26 },
    "wc3|wa5": { hero: 41.7, rival: 58.3 },
    "wc3-s|wa5-s": { hero: 36.96, rival: 63.04 },
    "wc4|wa4": { hero: 45.14, rival: 54.86 },
    "wc4-s|wa4-s": { hero: 42.42, rival: 57.58 },
    "wb5|wa3": { hero: 42.46, rival: 57.54 },
    "wb5-s|wa3-s": { hero: 40.39, rival: 59.61 },
  },
  impact: {
    "cucu3|cucu3": { hero: 38.3, rival: 61.7 },
    "cucu4|cucu4": { hero: 38.16, rival: 61.84 },
    "cucu4-s|cucu4-s": { hero: 36.29, rival: 63.71 },
    "cucu5|cucu5": { hero: 38.47, rival: 61.53 },
  },
  ots: {
    "otsots0|otsots0": { hero: 40.86, rival: 57.14 },
    "otsots0-s|otsots0-s": { hero: 39.73, rival: 58.27 },
    "otsots1|otsots1": { hero: 40.39, rival: 57.61 },
    "otsots1-s|otsots1-s": { hero: 39.18, rival: 58.82 },
    "otsots2|otsots2": { hero: 42.43, rival: 55.57 },
    "otsots2-s|otsots2-s": { hero: 41.32, rival: 56.68 },
    "otsots3|otsots3": { hero: 39.67, rival: 58.33 },
    "otsots3-s|otsots3-s": { hero: 37.96, rival: 60.04 },
    "otsots4|otsots4": { hero: 43.65, rival: 54.35 },
    "otsots4-s|otsots4-s": { hero: 42.75, rival: 55.25 },
    "otsots5|otsots5": { hero: 41.7, rival: 56.3 },
  },
  aftermath: {
    "wc5|wa0": { hero: 42.68, rival: 57.32 },
    "wc5-s|wa0-s": { hero: 41.15, rival: 58.85 },
    "wa0|wa1": { hero: 41.06, rival: 58.94 },
    "wa0-s|wa1-s": { hero: 39.93, rival: 60.07 },
    "wb5|wa2": { hero: 41.39, rival: 58.61 },
  },
};

export function anchorFor(relPath) {
  return ANCHOR[relPath] ?? 0.5;
}

export function layoutFor(beat, elapsed, dur = 1000, poses = {}) {
  const spec = BEAT_PLACE[beat];
  if (!spec) return null;
  const u = Math.min(1, Math.max(0, elapsed / dur));
  const pair = poses.hero && poses.rival
    ? POSE_PAIR[beat]?.[`${poses.hero}|${poses.rival}`]
    : null;
  const slot = (who) => {
    const row = spec[who];
    if (!row) return null;
    let x = row.x0 != null ? row.x0 + (row.x1 - row.x0) * u : row.x;
    if (pair && pair[who] != null) x = pair[who];
    return {
      x,
      h: row.h ?? spec.h,
      foot: row.foot ?? spec.foot,
    };
  };
  return { hero: slot("hero"), rival: slot("rival") };
}

export function gap(layout) {
  if (!layout?.hero || !layout?.rival) return null;
  return Math.abs(layout.hero.x - layout.rival.x);
}

/** Bottom of the camera window, in percent of the plate. */
export function visibleBottom(zoom, originY) {
  return originY + 50 / zoom;
}

export function visibleSpan(zoom, originX) {
  const half = 50 / zoom;
  return [originX - half, originX + half];
}
