import { BACKGROUNDS, CAST, DEFAULT_HERO, FRAMES } from "./vanguard-cast.mjs";
import { sampleBeat } from "./vanguard-phrase.mjs";

const ROOT = "../assets/fight/ep1-vanguard/";

export function activeHero(requested) {
  if (requested && CAST[requested] && requested !== "vanguard") return requested;
  return DEFAULT_HERO;
}

function fileOf(who, pose) {
  if (!pose) return "";
  const book = CAST[who];
  const rel = book?.[pose] || (who !== "vanguard" ? book?.standin : "");
  return rel ? `${ROOT}${rel}` : "";
}

/** One drawn frame. Paths come from the cast manifest, not from the beat name. */
export function resolveFrame(beat, elapsed, heroId = DEFAULT_HERO) {
  const hero = activeHero(heroId);
  const sample = sampleBeat(beat, elapsed);
  if (!sample) return null;
  const heroPose = sample.hero.pose;
  const rivalPose = sample.rival?.pose || "";
  return {
    bg: sample.bg ? `${ROOT}${BACKGROUNDS[sample.bg]}` : "",
    hero: fileOf(hero, heroPose),
    rival: fileOf("vanguard", rivalPose),
    heroFrom: fileOf(hero, sample.hero.from),
    heroTo: fileOf(hero, sample.hero.to),
    rivalFrom: fileOf("vanguard", sample.rival?.from),
    rivalTo: fileOf("vanguard", sample.rival?.to),
    fx: sample.fx ? `${ROOT}${sample.fx}` : "",
    flash: sample.flash ? `${ROOT}${sample.flash}` : "",
    pose: heroPose || sample.flash || "",
    heroPose,
    rivalPose,
    heroId: hero,
    phase: sample.phase || "",
    hold: !!sample.hero.hold,
    motion: { hero: sample.hero, rival: sample.rival, light: sample.light },
  };
}

export function castFiles(heroId = DEFAULT_HERO) {
  const hero = activeHero(heroId);
  const files = new Set();
  for (const list of Object.values(FRAMES)) {
    for (const frame of list) {
      if (frame.bg) files.add(`${ROOT}${BACKGROUNDS[frame.bg]}`);
      if (frame.hero) files.add(fileOf(hero, frame.hero));
      if (frame.heroFrom) files.add(fileOf(hero, frame.heroFrom));
      if (frame.heroTo) files.add(fileOf(hero, frame.heroTo));
      if (frame.rival) files.add(fileOf("vanguard", frame.rival));
      if (frame.fx) files.add(`${ROOT}${frame.fx}`);
      if (frame.flash) files.add(`${ROOT}${frame.flash}`);
    }
  }
  return [...files];
}
