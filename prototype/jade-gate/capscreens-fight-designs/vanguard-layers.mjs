import { BACKGROUNDS, CAST, DEFAULT_HERO, FRAMES } from "./vanguard-cast.mjs";

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
  const list = FRAMES[beat];
  if (!list || !list.length) return null;
  let frame = list[0];
  for (const item of list) {
    if (elapsed >= item.at) frame = item;
  }
  return {
    bg: frame.bg ? `${ROOT}${BACKGROUNDS[frame.bg]}` : "",
    hero: fileOf(hero, frame.hero),
    rival: fileOf("vanguard", frame.rival),
    fx: frame.fx ? `${ROOT}${frame.fx}` : "",
    flash: frame.flash ? `${ROOT}${frame.flash}` : "",
    ghostHero: fileOf(hero, frame.ghostHero),
    ghostRival: fileOf("vanguard", frame.ghostRival),
    pose: frame.hero || frame.flash || "",
    heroPose: frame.hero || "",
    rivalPose: frame.rival || "",
    heroId: hero,
    phase: frame.phase || "",
    step: frame.step || 0,
    n: frame.n || 1,
    hold: !!frame.hold,
  };
}

export function castFiles(heroId = DEFAULT_HERO) {
  const hero = activeHero(heroId);
  const files = new Set();
  for (const list of Object.values(FRAMES)) {
    for (const frame of list) {
      if (frame.bg) files.add(`${ROOT}${BACKGROUNDS[frame.bg]}`);
      if (frame.hero) files.add(fileOf(hero, frame.hero));
      if (frame.rival) files.add(fileOf("vanguard", frame.rival));
      if (frame.ghostHero) files.add(fileOf(hero, frame.ghostHero));
      if (frame.ghostRival) files.add(fileOf("vanguard", frame.ghostRival));
      if (frame.fx) files.add(`${ROOT}${frame.fx}`);
      if (frame.flash) files.add(`${ROOT}${frame.flash}`);
    }
  }
  return [...files];
}
