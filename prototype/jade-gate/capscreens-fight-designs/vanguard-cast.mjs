import { BEATS, listFrames } from "./vanguard-phrase.mjs";

export const DEFAULT_HERO = "zhao-yun";
export const BACKGROUNDS = {
  gate: "bg.png",
  low: "bg-low.png",
  blades: "bg-blades.png",
  ots: "bg-ots.png",
};

export const FRAMES = Object.fromEntries(
  Object.keys(BEATS).map((id) => [id, listFrames(id)]),
);

function poses(role) {
  const set = new Set();
  for (const list of Object.values(FRAMES)) {
    for (const frame of list) {
      const ids = role === "vanguard"
        ? [frame.rival]
        : [frame.hero, frame.heroFrom, frame.heroTo];
      for (const id of ids) if (id) set.add(id);
    }
  }
  return [...set];
}

function book(who, ids) {
  const out = {};
  for (const id of ids) {
    out[id] = who === "lu-zhishen"
      ? "layers/lu-zhishen/standin.png"
      : `layers/${who}/${id}.png`;
  }
  return out;
}

export const CAST = {
  "zhao-yun": book("zhao-yun", poses("hero")),
  "lu-zhishen": book("lu-zhishen", poses("hero")),
  vanguard: book("vanguard", poses("vanguard")),
};
