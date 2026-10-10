import { ANCHOR } from "./vanguard-anchor.mjs";
import { FRAMES } from "./vanguard-cast.mjs";
import { SPRITE } from "./vanguard-metrics.mjs";
import { SHOTS } from "./vanguard-shots.mjs";

/**
 * Foot point on the plate, in percent.
 * x is the foot center. h is sprite height. foot is the ground line.
 * Approach closes from x0 to x1. Fight beats solve a foot mark per pose
 * pair so that drawing's weapon meets the other fighter. Camera zooms
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
    h: 62,
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
    h: 76,
    hero: { x: 38 },
    rival: { x: 62 },
  },
  follow: {
    foot: 85,
    h: 62,
    hero: { x: 41 },
    rival: { x: 59 },
  },
  aftermath: {
    foot: 86,
    h: 58,
    hero: { x: 40 },
    rival: { x: 60 },
  },
  counter: {
    foot: 84,
    h: 62,
    hero: { x: 40 },
    rival: { x: 60 },
  },
  reprise: {
    foot: 84,
    h: 64,
    hero: { x: 42 },
    rival: { x: 58 },
  },
};

const PAIRED = new Set(["feint", "ots", "exchange", "impact", "follow", "counter", "reprise", "aftermath"]);

function boundsFor(beat) {
  if (beat === "ots") return { edgeMin: 4, edgeMax: 96, gap: -1 };
  if (beat === "aftermath") return { edgeMin: 4, edgeMax: 96, gap: 4 };
  return { edgeMin: 8, edgeMax: 92, gap: -1 };
}

function reach(who, pose, hPct) {
  const rel = `layers/${who}/${pose}.png`;
  const size = SPRITE[rel];
  const anchor = ANCHOR[rel] ?? 0.5;
  const aspect = size ? size[0] / size[1] : 0.5;
  const sw = hPct * (1080 / 1920) * aspect;
  return { left: anchor * sw, right: (1 - anchor) * sw };
}

function solved(beat, heroKey, rivalKey, hHero, hRival) {
  const hero = reach("zhao-yun", heroKey, hHero);
  const rival = reach("vanguard", rivalKey, hRival);
  const { gap } = boundsFor(beat);
  const delta = hero.right + rival.left + gap;
  const hx = 50 - delta / 2;
  const rx = 50 + delta / 2;
  const left = hx - hero.left;
  const right = rx + rival.right;
  const { edgeMin, edgeMax } = boundsFor(beat);
  const ok = hx >= 30 && hx <= 50 && rx >= 50 && rx <= 70 && left > edgeMin && right < edgeMax;
  return { ok, hx, rx };
}

const HEIGHT = new Map();

function heightFor(beat) {
  if (HEIGHT.has(beat)) return HEIGHT.get(beat);
  const spec = BEAT_PLACE[beat];
  const heroH = spec.hero?.h ?? spec.h;
  const rivalH = spec.rival?.h ?? spec.h;
  const pairs = [];
  for (const frame of FRAMES[beat] || []) {
    if (frame.hero && frame.rival) pairs.push([frame.hero, frame.rival]);
  }
  let chosen = { hero: heroH, rival: rivalH };
  for (const scale of [1, 0.92, 0.84, 0.76, 0.68, 0.6, 0.54, 0.48, 0.42]) {
    const hh = heroH * scale;
    const hr = rivalH * scale;
    if (beat === "ots" && !(hh > hr)) continue;
    if (pairs.every(([hero, rival]) => solved(beat, hero, rival, hh, hr).ok)) {
      chosen = { hero: hh, rival: hr };
      break;
    }
    chosen = { hero: hh, rival: hr };
  }
  HEIGHT.set(beat, chosen);
  return chosen;
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

/** First and last camera keys. The window test also walks `keys`. */
export const CAMERA_FIT = Object.fromEntries(
  ["feint", "exchange", "follow", "counter", "reprise"].map((id) => {
    const shot = SHOTS.find((item) => item.id === id);
    const keys = shot.camera;
    const end = keys[keys.length - 1];
    return [id, { from: keys[0], zoom: end.zoom, x: end.x, y: end.y, keys }];
  }),
);

export function anchorFor(relPath) {
  return ANCHOR[relPath] ?? 0.5;
}

export function layoutFor(beat, elapsed, dur = 1000, poses = {}) {
  const spec = BEAT_PLACE[beat];
  if (!spec) return null;
  const u = Math.min(1, Math.max(0, elapsed / dur));
  let pair = null;
  if (PAIRED.has(beat) && poses.hero && poses.rival) {
    const fitted = heightFor(beat);
    const mark = solved(beat, poses.hero, poses.rival, fitted.hero, fitted.rival);
    pair = {
      hero: round2(mark.hx),
      rival: round2(mark.rx),
      h: { hero: round2(fitted.hero), rival: round2(fitted.rival) },
    };
  }
  const slot = (who) => {
    const row = spec[who];
    if (!row) return null;
    let x = row.x0 != null ? row.x0 + (row.x1 - row.x0) * u : row.x;
    let h = row.h ?? spec.h;
    if (pair) {
      x = pair[who];
      h = pair.h[who];
    }
    return { x, h, foot: row.foot ?? spec.foot };
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

/** Pixel box for a cropped sprite planted on a foot mark. */
export function footStyle(rel, slot, stageW, stageH, naturalW, naturalH) {
  const anchor = anchorFor(rel);
  const bottom = `${(100 - slot.foot).toFixed(2)}%`;
  const origin = `${(anchor * 100).toFixed(2)}% 100%`;
  const height = `${slot.h}%`;
  if (!(stageW && stageH && naturalW && naturalH)) {
    return { left: `${slot.x}%`, height, bottom, origin };
  }
  const spriteH = (slot.h / 100) * stageH;
  const spriteW = spriteH * (naturalW / naturalH);
  const footX = (slot.x / 100) * stageW;
  return {
    left: `${(footX - anchor * spriteW).toFixed(2)}px`,
    height,
    bottom,
    origin,
  };
}

export function fxStyle(layout) {
  if (!layout?.hero || !layout?.rival) return null;
  const mid = (layout.hero.x + layout.rival.x) / 2;
  const span = Math.abs(layout.rival.x - layout.hero.x);
  const h = (layout.hero.h + layout.rival.h) / 2;
  const foot = (layout.hero.foot + layout.rival.foot) / 2;
  return {
    left: `${mid}%`,
    top: `${(foot - h * 0.46).toFixed(2)}%`,
    width: `${Math.max(16, span * 0.92).toFixed(2)}%`,
    height: `${(h * 0.42).toFixed(2)}%`,
  };
}
