/** Vanguard phrase clock.
 * A beat is a list of steps. Each step expands onto a 24fps tick (42ms).
 * wind loads the body back, the approved `-s` smear is the in-between,
 * strike lands, stop freezes (hit-stop), settle recovers.
 * pulse holds the clean key, then one smear echo. The echo is not
 * repeated every few frames — that reads as a second body.
 */

export const TICK = 42;

const smearOf = (id) => (id ? `${id}-s` : null);
const spark = (index) => `layers/fx/fx${index}.png`;

function push(frames, bg, spec, n) {
  for (let i = 0; i < n; i++) {
    frames.push({
      at: frames.length * TICK,
      bg,
      hero: spec.hero ?? null,
      rival: spec.rival ?? null,
      fx: spec.fx ?? null,
      flash: spec.flash ?? null,
      phase: spec.phase,
      hold: !!spec.hold,
      ghostHero: spec.ghostHero ?? null,
      ghostRival: spec.ghostRival ?? null,
      step: i,
      n,
    });
  }
}

export function buildBeat(bg, steps) {
  const frames = [];
  for (const step of steps) {
    if (step.kind === "flash") {
      push(frames, bg, { flash: step.flash, phase: "flash" }, step.n || 2);
      continue;
    }
    if (step.kind === "wind") {
      push(frames, bg, { hero: step.hero, rival: step.rival ?? null, phase: "wind" }, step.n || 3);
      push(frames, bg, {
        hero: smearOf(step.hero),
        rival: step.rival ? smearOf(step.rival) : null,
        phase: "smear",
        ghostHero: step.hero,
        ghostRival: step.rival || null,
        fx: step.spark == null ? null : spark(step.spark),
      }, 1);
      continue;
    }
    if (step.kind === "strike") {
      push(frames, bg, {
        hero: step.hero,
        rival: step.rival,
        phase: "strike",
        fx: spark(step.spark ?? 0),
      }, 1);
      push(frames, bg, {
        hero: step.hero,
        rival: step.rival,
        phase: "stop",
        hold: true,
        fx: spark(step.spark ?? 0),
      }, step.stop || 6);
      push(frames, bg, {
        hero: step.settle || step.hero,
        rival: step.settleRival || step.rival,
        phase: "settle",
      }, step.settleN || 3);
      continue;
    }
    if (step.kind === "stop") {
      push(frames, bg, {
        hero: step.hero,
        rival: step.rival ?? null,
        phase: "stop",
        hold: true,
        fx: step.spark == null ? null : spark(step.spark),
      }, step.n || 6);
      continue;
    }
    if (step.kind === "hold") {
      push(frames, bg, {
        hero: step.hero,
        rival: step.rival ?? null,
        phase: "hold",
        hold: true,
      }, step.n || 6);
      continue;
    }
    if (step.kind === "pulse") {
      const cycles = step.cycles || 4;
      const held = Math.max(2, cycles * 3 - 1);
      push(frames, bg, { hero: step.hero, rival: step.rival ?? null, phase: "breath" }, held);
      push(frames, bg, {
        hero: smearOf(step.hero),
        rival: step.rival ? smearOf(step.rival) : null,
        phase: "smear",
        ghostHero: step.hero,
        ghostRival: step.rival || null,
      }, 1);
      continue;
    }
    if (step.kind === "breathe") {
      push(frames, bg, { hero: step.hero, rival: step.rival ?? null, phase: "breath" }, step.n || 6);
      push(frames, bg, {
        hero: smearOf(step.hero),
        rival: step.rival ? smearOf(step.rival) : null,
        phase: "smear",
        ghostHero: step.hero,
        ghostRival: step.rival || null,
      }, 1);
    }
  }
  return frames;
}

const wind = (hero, rival, n = 4, sparkIndex = null) => ({ kind: "wind", hero, rival, n, spark: sparkIndex });
const strike = (hero, rival, settle, settleRival, sparkIndex = 0) => ({
  kind: "strike", hero, rival, settle, settleRival, spark: sparkIndex,
});
const pulse = (hero, rival, cycles) => ({ kind: "pulse", hero, rival, cycles });
const hold = (hero, rival, n) => ({ kind: "hold", hero, rival, n });
const flash = (file, n = 2) => ({ kind: "flash", flash: file, n });

/** Shot order is the fight. Durations fall out of the tick count. */
export const PHRASES = {
  approach: {
    bg: "gate",
    steps: [
      pulse("wa0", "wa0", 8),
      pulse("wa0", "wa0", 6),
      wind("wa2", "wb0", 4, 1),
      pulse("wa0", "wa0", 4),
    ],
  },
  windup: {
    bg: "low",
    steps: [
      wind("lowlow0", null, 4),
      wind("lowlow1", null, 4),
      wind("lowlow2", null, 4),
      wind("lowlow3", null, 4),
      wind("lowlow4", null, 4),
      wind("lowlow5", null, 4),
      wind("lowlow3", null, 3),
      wind("lowlow4", null, 3),
      wind("lowlow5", null, 4),
      hold("lowlow5", null, 8),
    ],
  },
  feint: {
    bg: "gate",
    steps: [
      wind("wa2", "wa0", 5, 1),
      strike("wa1", "wa2", "wa0", "wa1", 1),
      pulse("wa0", "wa1", 3),
      wind("wa4", "wb0", 5, 2),
      strike("wa3", "wb1", "wa5", "wa2", 0),
    ],
  },
  ots: {
    bg: "ots",
    steps: [
      wind("otsots0", "otsots0", 4),
      wind("otsots1", "otsots1", 4),
      wind("otsots2", "otsots2", 4),
      wind("otsots3", "otsots3", 4),
      wind("otsots4", "otsots4", 4),
      wind("otsots5", "otsots5", 4),
      hold("otsots5", "otsots5", 8),
    ],
  },
  exchange: {
    bg: "gate",
    steps: [
      wind("wc0", "wb0", 5, 1),
      strike("wc1", "wb1", "wb4", "wb2", 2),
      wind("wa5", "wb3", 4, 3),
      strike("wa3", "wb4", "wa0", "wa1", 0),
      pulse("wc5", "wa0", 3),
    ],
  },
  impact: {
    bg: "blades",
    steps: [
      flash("pose-impact-white.png", 2),
      flash("pose-impact-black.png", 2),
      { kind: "stop", hero: "cucu2", rival: "cucu2", n: 8, spark: 0 },
      wind("cucu3", "cucu3", 4, 2),
      wind("cucu4", "cucu4", 4, 4),
      wind("cucu5", "cucu5", 4, 1),
      wind("cucu0", "cucu0", 4, 3),
      wind("cucu1", "cucu1", 4, 0),
      hold("cucu5", "cucu5", 4),
    ],
  },
  counter: {
    bg: "gate",
    steps: [
      wind("wa0", "wb2", 5, 4),
      strike("wb0", "wb4", "wa0", "wb0", 3),
      pulse("wa0", "wb0", 3),
      wind("wa2", "wb0", 5, 1),
      strike("wa1", "wa3", "wa5", "wa1", 2),
    ],
  },
  reprise: {
    bg: "gate",
    steps: [
      wind("wa4", "wb1", 5, 1),
      strike("wa3", "wb2", "wa5", "wb0", 0),
      pulse("wa5", "wb0", 4),
      wind("wc2", "wa4", 4, 2),
      strike("wc1", "wb5", "wc5", "wa0", 3),
      hold("wc5", "wa0", 4),
    ],
  },
  follow: {
    bg: "gate",
    steps: [
      wind("wa5", "wa5", 4, 1),
      pulse("wa5", "wa4", 3),
      pulse("wc3", "wa3", 3),
      pulse("wc4", "wa2", 3),
      pulse("wb5", "wa1", 3),
      pulse("wc5", "wa0", 3),
    ],
  },
  aftermath: {
    bg: "gate",
    steps: [
      pulse("wc5", "wa0", 6),
      pulse("wa0", "wa1", 4),
      pulse("wb5", "wa2", 4),
    ],
  },
};

export function arcFor(phase, step = 0, n = 1, who = "hero") {
  const u = n <= 1 ? 1 : step / (n - 1);
  const dir = who === "hero" ? 1 : -1;
  if (phase === "wind") {
    return { x: dir * (-5 + 3 * u), y: 5 * (1 - u), rot: dir * (-3.4 + 2.2 * u) };
  }
  if (phase === "smear") {
    return { x: dir * 5, y: -1, rot: dir * 2.4, skew: dir * 3.5, blur: 0.4, sx: 1.02 };
  }
  if (phase === "strike") return { x: dir * 4, y: -4, rot: dir * 1.2 };
  if (phase === "stop" || phase === "hold" || phase === "flash") return {};
  if (phase === "settle") return { x: dir * 3 * (1 - u), y: -2 * (1 - u) };
  if (phase === "breath") return { y: Math.sin(u * Math.PI) * -2 };
  return {};
}

export function lifeScale(phase) {
  if (phase === "stop" || phase === "strike" || phase === "flash") return 0;
  if (phase === "smear" || phase === "wind" || phase === "hold") return 0.2;
  if (phase === "settle") return 0.45;
  return 1;
}

export function poseAt(frame, who, life = {}, shift = { x: 0, y: 0 }) {
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
