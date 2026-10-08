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
    h: 54,
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
    h: 58,
    hero: { x: 40 },
    rival: { x: 60 },
  },
  ots: {
    foot: 90,
    h: 66,
    hero: { x: 36, h: 70 },
    rival: { x: 62, h: 52, foot: 86 },
  },
  exchange: {
    foot: 84,
    h: 58,
    hero: { x: 43 },
    rival: { x: 57 },
  },
  impact: {
    foot: 90,
    h: 74,
    hero: { x: 38 },
    rival: { x: 62 },
  },
  follow: {
    foot: 85,
    h: 56,
    hero: { x: 41 },
    rival: { x: 59 },
  },
  aftermath: {
    foot: 86,
    h: 52,
    hero: { x: 40 },
    rival: { x: 60 },
  },
};

/** Zooms re-fit so the courtyard feet stay in frame. Durations stay on the shot list. */
export const CAMERA_FIT = {
  feint: { from: { zoom: 1.08, x: 48, y: 52 }, zoom: 1.16, x: 50, y: 50 },
  exchange: { from: { zoom: 1.12, x: 42, y: 50 }, zoom: 1.16, x: 58, y: 50 },
  follow: { from: { zoom: 1.14, x: 50, y: 50 }, zoom: 1.05, x: 50, y: 54 },
};

export const POSE_PAIR = {
  feint: {
    "wa3|wa2": { hero: 40.21, rival: 59.79 },
    "wa3-s|wa2-s": { hero: 39.62, rival: 60.38 },
    "wb3|wa3": { hero: 39.63, rival: 60.37 },
    "wb3-s|wa3-s": { hero: 39.22, rival: 60.78 },
    "wc0|wa4": { hero: 46.11, rival: 53.89 },
    "wc0-s|wa4-s": { hero: 43.43, rival: 56.57 },
    "wc1|wa5": { hero: 46.7, rival: 53.3 },
    "wc1-s|wa5-s": { hero: 42.86, rival: 57.14 },
    "wb4|wb0": { hero: 42.83, rival: 57.17 },
    "wb4-s|wb0-s": { hero: 40.93, rival: 59.07 },
    "wa4|wb1": { hero: 44.05, rival: 55.95 },
  },
  exchange: {
    "wc0|wb0": { hero: 45.48, rival: 54.52 },
    "wc0-s|wb0-s": { hero: 43.27, rival: 56.73 },
    "wc1|wb1": { hero: 44.41, rival: 55.59 },
    "wc1-s|wb1-s": { hero: 41.7, rival: 58.3 },
    "wa3|wb2": { hero: 38.24, rival: 61.76 },
    "wa3-s|wb2-s": { hero: 37.6, rival: 62.4 },
    "wb3|wb3": { hero: 39.84, rival: 60.16 },
    "wb3-s|wb3-s": { hero: 38.3, rival: 61.7 },
    "wc2|wb4": { hero: 39.4, rival: 60.6 },
    "wc0|wb4-s": { hero: 41.66, rival: 58.34 },
    "wc0-s|wb5": { hero: 42.09, rival: 57.91 },
    "wc1|wb0": { hero: 46.26, rival: 53.74 },
  },
  follow: {
    "wa5|wa5": { hero: 44.92, rival: 55.08 },
    "wa5-s|wa5-s": { hero: 41.18, rival: 58.82 },
    "wc3|wa4": { hero: 42.98, rival: 57.02 },
    "wc3-s|wa4-s": { hero: 39.57, rival: 60.43 },
    "wc4|wa3": { hero: 45.24, rival: 54.76 },
    "wc4-s|wa3-s": { hero: 43.7, rival: 56.3 },
    "wb5|wa2": { hero: 43.88, rival: 56.12 },
    "wb5-s|wa2-s": { hero: 41.9, rival: 58.1 },
    "wc5|wa1": { hero: 43.55, rival: 56.45 },
    "wa5|wa1-s": { hero: 44.05, rival: 55.95 },
    "wa5-s|wa0": { hero: 43.71, rival: 56.29 },
    "wc3|wa5": { hero: 42.8, rival: 57.2 },
    "wc3-s|wa5-s": { hero: 38.66, rival: 61.34 },
    "wc4|wa4": { hero: 45.81, rival: 54.19 },
    "wc4-s|wa4-s": { hero: 43.43, rival: 56.57 },
    "wb5|wa3": { hero: 43.47, rival: 56.53 },
    "wb5-s|wa3-s": { hero: 41.65, rival: 58.35 },
  },
  impact: {
    "cucu3|cucu3": { hero: 38.94, rival: 61.06 },
    "cucu4|cucu4": { hero: 38.8, rival: 61.2 },
    "cucu4-s|cucu4-s": { hero: 37.03, rival: 62.97 },
    "cucu5|cucu5": { hero: 39.1, rival: 60.9 },
  },
  ots: {
    "otsots0|otsots0": { hero: 41.39, rival: 56.61 },
    "otsots0-s|otsots0-s": { hero: 40.31, rival: 57.69 },
    "otsots1|otsots1": { hero: 40.94, rival: 57.06 },
    "otsots1-s|otsots1-s": { hero: 39.8, rival: 58.2 },
    "otsots2|otsots2": { hero: 42.85, rival: 55.15 },
    "otsots2-s|otsots2-s": { hero: 41.8, rival: 56.2 },
    "otsots3|otsots3": { hero: 40.24, rival: 57.76 },
    "otsots3-s|otsots3-s": { hero: 38.64, rival: 59.36 },
    "otsots4|otsots4": { hero: 44.02, rival: 53.98 },
    "otsots4-s|otsots4-s": { hero: 43.17, rival: 54.83 },
    "otsots5|otsots5": { hero: 42.17, rival: 55.83 },
  },
  aftermath: {
    "wc5|wa0": { hero: 43.01, rival: 56.99 },
    "wc5-s|wa0-s": { hero: 41.63, rival: 58.37 },
    "wa0|wa1": { hero: 41.55, rival: 58.45 },
    "wa0-s|wa1-s": { hero: 40.54, rival: 59.46 },
    "wb5|wa2": { hero: 41.85, rival: 58.15 },
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
