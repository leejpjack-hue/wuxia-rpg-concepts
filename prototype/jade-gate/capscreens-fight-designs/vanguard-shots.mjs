import { BEAT_MS, TICK } from "./vanguard-phrase.mjs";

/** The camera follows the phrase. It does not replace the drawings. */
const META = [
  {
    id: "approach",
    title: "Approach",
    size: "wide",
    angle: "frontal",
    move: "drift",
    easeName: "track",
    label: "courtyard · both weigh in",
    camera: [
      { u: 0, zoom: 1.02, x: 50, y: 56 },
      { u: 1, zoom: 1.06, x: 50, y: 55 },
    ],
  },
  {
    id: "windup",
    title: "Coil",
    size: "medium two-shot",
    angle: "frontal",
    move: "drift",
    easeName: "track",
    label: "stones · Zhao coils",
    camera: [
      { u: 0, zoom: 1.06, x: 48, y: 55 },
      { u: 1, zoom: 1.1, x: 46, y: 54 },
    ],
  },
  {
    id: "feint",
    title: "Feint",
    size: "medium two-shot",
    angle: "frontal",
    move: "ease in",
    easeName: "push",
    label: "stones · the first cut",
    camera: [
      { u: 0, zoom: 1.06, x: 50, y: 55 },
      { u: 1, zoom: 1.12, x: 50, y: 54 },
    ],
  },
  {
    id: "ots",
    title: "Reverse",
    size: "medium two-shot",
    angle: "frontal",
    move: "drift",
    easeName: "track",
    label: "stones · the parry",
    camera: [
      { u: 0, zoom: 1.08, x: 52, y: 55 },
      { u: 1, zoom: 1.1, x: 54, y: 54 },
    ],
  },
  {
    id: "exchange",
    title: "Exchange",
    size: "medium two-shot",
    angle: "frontal",
    move: "drift",
    easeName: "track",
    label: "stones · Guan sweeps",
    camera: [
      { u: 0, zoom: 1.08, x: 52, y: 55 },
      { u: 1, zoom: 1.12, x: 48, y: 54 },
    ],
  },
  {
    id: "impact",
    title: "Impact",
    size: "close two-shot",
    angle: "frontal, stone",
    move: "ease in",
    easeName: "push",
    label: "stones · the bind",
    camera: [
      { u: 0, zoom: 1.08, x: 50, y: 54 },
      { u: 1, zoom: 1.14, x: 50, y: 53 },
    ],
  },
  {
    id: "counter",
    title: "Counter",
    size: "medium two-shot",
    angle: "frontal",
    move: "drift",
    easeName: "track",
    label: "stones · the press",
    camera: [
      { u: 0, zoom: 1.1, x: 50, y: 54 },
      { u: 1, zoom: 1.14, x: 48, y: 54 },
    ],
  },
  {
    id: "reprise",
    title: "Reprise",
    size: "close two-shot",
    angle: "frontal, stone",
    move: "ease in",
    easeName: "push",
    label: "stones · the second cut",
    camera: [
      { u: 0, zoom: 1.1, x: 50, y: 54 },
      { u: 1, zoom: 1.16, x: 50, y: 53 },
    ],
  },
  {
    id: "follow",
    title: "Follow",
    size: "medium to wide",
    angle: "frontal",
    move: "ease out",
    easeName: "pull",
    label: "stones · the recovery",
    camera: [
      { u: 0, zoom: 1.14, x: 50, y: 54 },
      { u: 1, zoom: 1.06, x: 50, y: 56 },
    ],
  },
  {
    id: "aftermath",
    title: "Aftermath",
    size: "wide",
    angle: "frontal",
    move: "settle",
    easeName: "pull",
    label: "wide · both settle",
    camera: [
      { u: 0, zoom: 1.06, x: 50, y: 55 },
      { u: 1, zoom: 1.02, x: 50, y: 56 },
    ],
  },
];

function smooth(u) {
  const t = Math.min(1, Math.max(0, u));
  return t * t * (3 - 2 * t);
}

export const SHOTS = META.map((meta) => {
  const ms = BEAT_MS[meta.id];
  return {
    ...meta,
    ms,
    camera: meta.camera.map((key) => ({
      zoom: key.zoom,
      x: key.x,
      y: key.y,
      at: Math.round(key.u * Math.max(0, ms - TICK)),
    })),
  };
});

export function totalMs(shots = SHOTS) {
  return shots.reduce((sum, shot) => sum + shot.ms, 0);
}

export function sampleShot(elapsed, shots = SHOTS) {
  let start = 0;
  for (const shot of shots) {
    if (elapsed < start + shot.ms) return { shot, local: Math.max(0, elapsed - start), start };
    start += shot.ms;
  }
  const shot = shots[shots.length - 1];
  return { shot, local: shot.ms - 1, start: start - shot.ms };
}

export function sampleCamera(shot, local) {
  const keys = shot?.camera;
  if (!keys?.length) return { zoom: 1, x: 50, y: 50 };
  if (local <= keys[0].at) return { zoom: keys[0].zoom, x: keys[0].x, y: keys[0].y };
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i];
    const b = keys[i + 1];
    if (local > b.at) continue;
    const span = Math.max(1, b.at - a.at);
    const u = (local - a.at) / span;
    const e = smooth(u);
    return {
      zoom: a.zoom + (b.zoom - a.zoom) * e,
      x: a.x + (b.x - a.x) * e,
      y: a.y + (b.y - a.y) * e,
    };
  }
  const last = keys[keys.length - 1];
  return { zoom: last.zoom, x: last.x, y: last.y };
}
