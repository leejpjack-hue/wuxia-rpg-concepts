/** Continuous Gate Vanguard motion.
 * A beat is a list of pose keys. Between keys the body arc (x, y, rotation)
 * is interpolated every frame. A pose change crossfades through a smear.
 * Hit-stop freezes the arc. This is not a timed swap of held plates.
 */

export const TICK = 42;

const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
const lerp = (a, b, u) => a + (b - a) * u;
const smooth = (u) => {
  const t = clamp(u, 0, 1);
  return t * t * (3 - 2 * t);
};

const k = (at, pose, extra = {}) => ({ at, pose, x: 0, y: 0, rot: 0, ...extra });

export const BEATS = {
  approach: {
    ms: 2400,
    bg: "gate",
    hero: [
      k(0, "motion-guard", { rot: -3, phase: "breath" }),
      k(2400, "motion-guard", { rot: 2, y: -2, phase: "breath" }),
    ],
    rival: [
      k(0, "wa0", { rot: 2, phase: "breath" }),
      k(2400, "wa0", { rot: -2, y: -1, phase: "breath" }),
    ],
  },
  windup: {
    ms: 1800,
    bg: "low",
    hero: [
      k(0, "motion-guard", { rot: -2, phase: "wind" }),
      k(240, "motion-wind", { rot: -8, y: 4, phase: "wind" }),
      k(980, "motion-wind", { rot: -18, y: 8, phase: "wind" }),
      k(1800, "motion-wind", { rot: -6, y: 2, phase: "wind" }),
    ],
    rival: null,
  },
  feint: {
    ms: 2000,
    bg: "gate",
    hero: [
      k(0, "motion-wind", { rot: -10, y: 3, phase: "wind" }),
      k(360, "motion-wind", { rot: -16, y: 5, phase: "wind" }),
      k(560, "motion-lunge", { x: 10, y: -8, rot: 6 }),
      k(680, "motion-lunge", { x: 6, y: -3, rot: 2, hold: true }),
      k(1040, "motion-lunge", { x: 6, y: -3, rot: 2, hold: true }),
      k(1500, "motion-guard", { rot: -2 }),
      k(2000, "motion-guard", { rot: 0 }),
    ],
    rival: [
      k(0, "wa0", { rot: 1, phase: "wind" }),
      k(360, "wb0", { rot: 5, phase: "wind" }),
      k(560, "wa1", { x: -8, y: -4, rot: -4 }),
      k(680, "wa1", { x: -5, y: -2, rot: -2, hold: true }),
      k(1040, "wa1", { x: -5, y: -2, rot: -2, hold: true }),
      k(1500, "wb0", { rot: 1 }),
      k(2000, "wa0", { rot: 0 }),
    ],
  },
  ots: {
    ms: 1600,
    bg: "gate",
    hero: [
      k(0, "motion-wind", { rot: -8, y: 2, phase: "wind" }),
      k(420, "motion-cut", { x: 8, y: -6, rot: 8 }),
      k(980, "motion-cut", { x: 2, y: -1, rot: 2 }),
      k(1600, "motion-wind", { rot: -4, y: 1 }),
    ],
    rival: [
      k(0, "wb0", { rot: 3, phase: "wind" }),
      k(420, "wa1", { x: -6, rot: -3 }),
      k(980, "wb2", { rot: 2 }),
      k(1600, "wa0", { rot: 0 }),
    ],
  },
  exchange: {
    ms: 1900,
    bg: "gate",
    hero: [
      k(0, "motion-lunge", { x: 4, rot: 2, phase: "wind" }),
      k(280, "motion-cut", { x: 12, y: -8, rot: 8 }),
      k(420, "motion-cut", { x: 8, y: -3, rot: 3, hold: true }),
      k(700, "motion-cut", { x: 8, y: -3, rot: 3, hold: true }),
      k(1100, "motion-wind", { rot: -10, y: 4 }),
      k(1480, "motion-lunge", { x: 8, y: -6, rot: 4 }),
      k(1900, "motion-guard", { rot: -1 }),
    ],
    rival: [
      k(0, "wb0", { rot: 2, phase: "wind" }),
      k(280, "wa1", { x: -10, y: -4, rot: -5 }),
      k(420, "wa1", { x: -6, y: -2, rot: -2, hold: true }),
      k(700, "wa1", { x: -6, y: -2, rot: -2, hold: true }),
      k(1100, "wb2", { rot: 4 }),
      k(1480, "wb0", { x: -4, rot: -2 }),
      k(1900, "wa0", { rot: 0 }),
    ],
  },
  impact: {
    ms: 1500,
    bg: "gate",
    flash: [
      { at: 0, until: 84, file: "pose-impact-white.png" },
      { at: 84, until: 168, file: "pose-impact-black.png" },
    ],
    hero: [
      k(0, "motion-cut", { x: 6, y: -4, rot: 3, hold: true }),
      k(168, "motion-cut", { x: 6, y: -4, rot: 3, hold: true }),
      k(560, "motion-cut", { x: 6, y: -4, rot: 3, hold: true }),
      k(860, "motion-lunge", { x: 2, y: -1, rot: 1 }),
      k(1500, "motion-guard", { rot: -2 }),
    ],
    rival: [
      k(0, "wa1", { x: -6, y: -3, rot: -3, hold: true }),
      k(168, "wa1", { x: -6, y: -3, rot: -3, hold: true }),
      k(560, "wa1", { x: -6, y: -3, rot: -3, hold: true }),
      k(860, "wb2", { rot: 2 }),
      k(1500, "wa0", { rot: 0 }),
    ],
  },
  counter: {
    ms: 1900,
    bg: "gate",
    hero: [
      k(0, "motion-guard", { rot: -2, phase: "wind" }),
      k(320, "motion-wind", { rot: -14, y: 5, phase: "wind" }),
      k(560, "motion-lunge", { x: 12, y: -8, rot: 7 }),
      k(700, "motion-lunge", { x: 7, y: -3, rot: 2, hold: true }),
      k(1040, "motion-lunge", { x: 7, y: -3, rot: 2, hold: true }),
      k(1500, "motion-cut", { x: 4, rot: 2 }),
      k(1900, "motion-guard", { rot: 0 }),
    ],
    rival: [
      k(0, "wb2", { rot: 6, x: -4, phase: "wind" }),
      k(320, "wa1", { x: -12, y: -6, rot: -6 }),
      k(560, "wb0", { x: -4, rot: 2 }),
      k(700, "wb0", { x: -4, rot: 2, hold: true }),
      k(1040, "wb0", { x: -4, rot: 2, hold: true }),
      k(1500, "wb2", { rot: 3 }),
      k(1900, "wa0", { rot: 0 }),
    ],
  },
  reprise: {
    ms: 2000,
    bg: "gate",
    hero: [
      k(0, "motion-wind", { rot: -12, y: 4, phase: "wind" }),
      k(300, "motion-wind", { rot: -18, y: 7, phase: "wind" }),
      k(520, "motion-cut", { x: 14, y: -10, rot: 9 }),
      k(660, "motion-cut", { x: 8, y: -4, rot: 3, hold: true }),
      k(1080, "motion-cut", { x: 8, y: -4, rot: 3, hold: true }),
      k(1560, "motion-lunge", { x: 3, rot: 1 }),
      k(2000, "motion-guard", { rot: -1 }),
    ],
    rival: [
      k(0, "wb0", { rot: 2, phase: "wind" }),
      k(300, "wb2", { rot: 6, phase: "wind" }),
      k(520, "wa1", { x: -12, y: -6, rot: -6 }),
      k(660, "wa1", { x: -7, y: -2, rot: -2, hold: true }),
      k(1080, "wa1", { x: -7, y: -2, rot: -2, hold: true }),
      k(1560, "wb0", { rot: 1 }),
      k(2000, "wa0", { rot: 0 }),
    ],
  },
  follow: {
    ms: 1600,
    bg: "gate",
    hero: [
      k(0, "motion-cut", { x: 6, rot: 4, phase: "wind" }),
      k(480, "motion-lunge", { x: 2, y: -2, rot: 1 }),
      k(1100, "motion-guard", { rot: -2, y: 1 }),
      k(1600, "motion-guard", { rot: 0 }),
    ],
    rival: [
      k(0, "wa1", { x: -4, rot: -2, phase: "wind" }),
      k(480, "wb2", { rot: 3 }),
      k(1100, "wa0", { rot: 1 }),
      k(1600, "wa0", { rot: 0 }),
    ],
  },
  aftermath: {
    ms: 1700,
    bg: "gate",
    hero: [
      k(0, "motion-guard", { rot: -1, y: 0, phase: "breath" }),
      k(850, "motion-guard", { rot: 2, y: -2, phase: "breath" }),
      k(1700, "motion-guard", { rot: 0, phase: "breath" }),
    ],
    rival: [
      k(0, "wa0", { rot: 1, phase: "breath" }),
      k(850, "wa0", { rot: -2, y: -1, phase: "breath" }),
      k(1700, "wa0", { rot: 0, phase: "breath" }),
    ],
  },
};

export const BEAT_MS = Object.fromEntries(Object.entries(BEATS).map(([id, beat]) => [id, beat.ms]));

function segment(keys, t) {
  let i = 0;
  while (i < keys.length - 2 && t >= keys[i + 1].at) i += 1;
  const a = keys[i];
  const b = keys[Math.min(i + 1, keys.length - 1)];
  const span = Math.max(1, b.at - a.at);
  const raw = clamp((t - a.at) / span, 0, 1);
  const held = !!(a.hold && b.hold);
  const u = held ? 0 : smooth(raw);
  const poseChange = a.pose !== b.pose;
  const smear = held || !poseChange ? 0 : Math.sin(raw * Math.PI);
  let phase = a.phase || "arc";
  if (held) phase = "stop";
  else if (smear > 0.55) phase = "smear";
  else if (poseChange) phase = "strike";
  return {
    pose: raw < 0.5 || held ? a.pose : b.pose,
    from: a.pose,
    to: b.pose,
    blend: poseChange && !held ? raw : 0,
    smear,
    hold: held,
    x: lerp(a.x || 0, b.x || 0, u),
    y: lerp(a.y || 0, b.y || 0, u),
    rot: lerp(a.rot || 0, b.rot || 0, u),
    phase,
  };
}

function dress(sample, who) {
  const dir = who === "hero" ? 1 : -1;
  const smear = sample.smear || 0;
  return {
    ...sample,
    skew: dir * smear * 10,
    blur: smear * 1.5,
    sx: 1 + smear * 0.045,
  };
}

export function sampleBeat(id, elapsed = 0) {
  const beat = BEATS[id];
  if (!beat) return null;
  const t = clamp(elapsed, 0, Math.max(0, beat.ms - 1));
  const hero = dress(segment(beat.hero, t), "hero");
  const rival = beat.rival ? dress(segment(beat.rival, t), "rival") : null;
  const flash = (beat.flash || []).find((item) => t >= item.at && t < item.until);
  const spark = hero.smear > 0.35 || hero.hold;
  let phase = hero.phase;
  if (flash) phase = "flash";
  return {
    bg: beat.bg,
    ms: beat.ms,
    phase,
    flash: flash ? flash.file : "",
    fx: spark && rival ? "layers/fx/fx0.png" : "",
    hero,
    rival,
    light: 0.2 + hero.smear * 0.6 + (hero.hold ? 0.22 : 0),
  };
}

export function listFrames(id) {
  const beat = BEATS[id];
  const frames = [];
  for (let at = 0; at < beat.ms; at += TICK) {
    const sample = sampleBeat(id, at);
    frames.push({
      at,
      bg: sample.bg,
      hero: sample.hero.pose,
      rival: sample.rival ? sample.rival.pose : null,
      heroFrom: sample.hero.from,
      heroTo: sample.hero.to,
      phase: sample.phase,
      flash: sample.flash || null,
      fx: sample.fx || null,
    });
  }
  return frames;
}

export function arcFor(phase, step = 0, n = 1, who = "hero") {
  const u = n <= 1 ? 1 : step / (n - 1);
  const dir = who === "hero" ? 1 : -1;
  if (phase === "wind") return { x: dir * (-4 * (1 - u)), y: 4 * (1 - u), rot: dir * (-6 * (1 - u)) };
  if (phase === "smear") return { x: dir * 6, rot: dir * 3, skew: dir * 8, blur: 1.2, sx: 1.03 };
  if (phase === "stop" || phase === "hold" || phase === "flash") return {};
  return { y: Math.sin(u * Math.PI) * -1.5 };
}

export function lifeScale(phase) {
  if (phase === "stop" || phase === "strike" || phase === "flash" || phase === "smear") return 0;
  if (phase === "wind") return 0.15;
  return 0.35;
}

export function poseAt(frame, who, life = {}, shift = { x: 0, y: 0 }) {
  const motion = frame?.motion?.[who];
  if (motion) {
    const depth = who === "hero" ? 1 : 0.82;
    return {
      x: (motion.x || 0) + (shift.x || 0) * depth,
      y: (motion.y || 0) + (life.y || 0) + (shift.y || 0) * depth,
      rot: (motion.rot || 0) + (life.rot || 0),
      skew: motion.skew || 0,
      blur: motion.blur || 0,
      sx: motion.sx || 1,
    };
  }
  const arc = arcFor(frame?.phase, frame?.step, frame?.n, who);
  const depth = who === "hero" ? 1 : 0.82;
  return {
    x: (arc.x || 0) + (shift.x || 0) * depth,
    y: (arc.y || 0) + (life.y || 0) + (shift.y || 0) * depth,
    rot: (arc.rot || 0) + (life.rot || 0),
    skew: arc.skew || 0,
    blur: arc.blur || 0,
    sx: arc.sx || 1,
  };
}
