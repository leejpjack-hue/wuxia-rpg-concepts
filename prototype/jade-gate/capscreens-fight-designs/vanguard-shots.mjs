import { BEAT_MS, TICK } from "./vanguard-phrase.mjs";

/** Camera keys use u in 0..1 of the beat. `at` is filled once the tick length is known. */
const META = [
  {
    id: "approach",
    title: "Approach",
    size: "wide",
    angle: "frontal",
    move: "slow track",
    easeName: "track",
    label: "establishing wide · frontal · slow track",
    camera: [
      { u: 0, zoom: 1.04, x: 42, y: 56 },
      { u: 1, zoom: 1.14, x: 57, y: 54 },
    ],
  },
  {
    id: "windup",
    title: "Coil",
    size: "CU",
    angle: "low, Yun",
    move: "push-in",
    easeName: "push",
    label: "low angle · push-in · coil",
    camera: [
      { u: 0, zoom: 1, x: 48, y: 58 },
      { u: 0.72, zoom: 1.12, x: 46, y: 54 },
      { u: 1, zoom: 1.16, x: 45, y: 52 },
    ],
  },
  {
    id: "feint",
    title: "Feint",
    size: "medium two-shot",
    angle: "frontal",
    move: "push-in",
    easeName: "push",
    label: "medium two-shot · frontal · push-in",
    camera: [
      { u: 0, zoom: 1.08, x: 48, y: 54 },
      { u: 1, zoom: 1.24, x: 50, y: 52 },
    ],
  },
  {
    id: "ots",
    title: "Reverse",
    size: "medium two-shot",
    angle: "frontal, rival lead",
    move: "drift",
    easeName: "track",
    label: "reverse angle · drift · stone",
    camera: [
      { u: 0, zoom: 1, x: 44, y: 54 },
      { u: 1, zoom: 1.08, x: 56, y: 52 },
    ],
  },
  {
    id: "exchange",
    title: "Exchange",
    size: "medium two-shot",
    angle: "frontal",
    move: "whip-pan",
    easeName: "whip",
    label: "medium two-shot · frontal · whip-pan",
    camera: [
      { u: 0, zoom: 1.1, x: 44, y: 54 },
      { u: 0.32, zoom: 1.22, x: 56, y: 52 },
      { u: 1, zoom: 1.18, x: 54, y: 52 },
    ],
  },
  {
    id: "impact",
    title: "Impact",
    size: "close two-shot",
    angle: "frontal, stone",
    move: "punch-in, hit-stop",
    easeName: "push",
    label: "stone floor · punch-in · hit-stop",
    shake: true,
    camera: [
      { u: 0, zoom: 1.02, x: 50, y: 52 },
      { u: 0.14, zoom: 1.14, x: 50, y: 50 },
      { u: 0.46, zoom: 1.14, x: 50, y: 50 },
      { u: 1, zoom: 1.06, x: 50, y: 52 },
    ],
  },
  {
    id: "counter",
    title: "Counter",
    size: "medium two-shot",
    angle: "frontal, rival lead",
    move: "push from the rival",
    easeName: "push",
    label: "medium two-shot · rival lead · push",
    camera: [
      { u: 0, zoom: 1.08, x: 56, y: 54 },
      { u: 1, zoom: 1.24, x: 48, y: 52 },
    ],
  },
  {
    id: "reprise",
    title: "Reprise",
    size: "close two-shot",
    angle: "frontal, stone",
    move: "punch-in, hit-stop",
    easeName: "push",
    label: "close two-shot · stone floor · second hit",
    camera: [
      { u: 0, zoom: 1.12, x: 50, y: 54 },
      { u: 0.22, zoom: 1.28, x: 50, y: 52 },
      { u: 0.48, zoom: 1.28, x: 50, y: 52 },
      { u: 1, zoom: 1.16, x: 50, y: 54 },
    ],
  },
  {
    id: "follow",
    title: "Follow",
    size: "medium to wide",
    angle: "frontal",
    move: "pull-back",
    easeName: "pull",
    label: "pull-back · frontal · to wide",
    camera: [
      { u: 0, zoom: 1.22, x: 50, y: 52 },
      { u: 1, zoom: 1.05, x: 50, y: 56 },
    ],
  },
  {
    id: "aftermath",
    title: "Aftermath",
    size: "wide",
    angle: "frontal",
    move: "settle",
    easeName: "pull",
    label: "wide · frontal · settle",
    camera: [
      { u: 0, zoom: 1.08, x: 50, y: 54 },
      { u: 1, zoom: 1.02, x: 50, y: 56 },
    ],
  },
];

function smooth(u) {
  const t = Math.min(1, Math.max(0, u));
  return t * t * (3 - 2 * t);
}

function whip(u) {
  const t = Math.min(1, Math.max(0, u));
  return 1 - (1 - t) ** 3;
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
    const e = shot.easeName === "whip" ? whip(u) : smooth(u);
    return {
      zoom: a.zoom + (b.zoom - a.zoom) * e,
      x: a.x + (b.x - a.x) * e,
      y: a.y + (b.y - a.y) * e,
    };
  }
  const last = keys[keys.length - 1];
  return { zoom: last.zoom, x: last.x, y: last.y };
}
