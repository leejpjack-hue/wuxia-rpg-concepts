import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { FRAMES } from "../capscreens-fight-designs/vanguard-cast.mjs";
import { activeHero, resolveFrame } from "../capscreens-fight-designs/vanguard-layers.mjs";
import { sampleBeat } from "../capscreens-fight-designs/vanguard-phrase.mjs";
import { SHOTS, totalMs } from "../capscreens-fight-designs/vanguard-shots.mjs";

const root = new URL("../assets/fight/ep1-vanguard/", import.meta.url);

function onDisk(src) {
  const rel = src.replace("../assets/fight/ep1-vanguard/", "");
  return existsSync(new URL(rel, root));
}

test("swapping the hero keeps the background and points at that character's layers", () => {
  const yun = resolveFrame("approach", 166, "zhao-yun");
  const lu = resolveFrame("approach", 166, "lu-zhishen");
  assert.equal(yun.bg, lu.bg);
  assert.match(yun.hero, /layers\/zhao-yun\//);
  assert.match(lu.hero, /layers\/lu-zhishen\/standin\.png/);
  assert.equal(yun.rival, lu.rival);
  assert.equal(activeHero("no-such-hero"), "zhao-yun");
  assert.equal(lu.heroId, "lu-zhishen");
});

test("a smear sits between keys, and impact holds the slash through hit-stop", () => {
  const wind = resolveFrame("feint", 0);
  assert.equal(wind.phase, "wind");
  assert.match(wind.hero, /motion-wind\.png/);
  const smear = resolveFrame("feint", 460);
  assert.equal(smear.phase, "smear");
  assert.ok(smear.motion.hero.smear > 0.8, smear.motion.hero.smear);
  assert.notEqual(smear.motion.hero.from, smear.motion.hero.to);
  assert.equal(wind.bg, smear.bg);
  assert.doesNotMatch(smear.hero, /-s\.png/);
  assert.match(resolveFrame("impact", 0).flash, /pose-impact-white/);
  assert.match(resolveFrame("impact", 100).flash, /pose-impact-black/);
  const slash = resolveFrame("impact", 240);
  const held = resolveFrame("impact", 400);
  assert.equal(slash.flash, "");
  assert.equal(slash.phase, "stop");
  assert.equal(slash.heroPose, held.heroPose);
  assert.equal(slash.motion.hero.x, held.motion.hero.x);
  assert.equal(slash.motion.hero.rot, held.motion.hero.rot);
  assert.notEqual(resolveFrame("impact", 1200).heroPose, slash.heroPose);
});

test("the clash is a longer phrase with a continuous arc between poses", () => {
  assert.ok(totalMs() > 16000, totalMs());
  assert.ok(totalMs() < 19000, totalMs());
  const early = sampleBeat("windup", 1000);
  const later = sampleBeat("windup", 1400);
  assert.equal(early.hero.pose, "motion-wind");
  assert.equal(later.hero.pose, "motion-wind");
  assert.notEqual(early.hero.rot, later.hero.rot);
  let stops = 0;
  for (const id of ["feint", "exchange", "counter", "reprise"]) {
    let peaked = false;
    let prev = "";
    for (let at = 0; at < 2000; at += 42) {
      const sample = sampleBeat(id, at);
      if (sample.hero.smear > 0.8) peaked = true;
      if (sample.phase === "stop" && prev !== "stop") stops += 1;
      prev = sample.phase;
    }
    assert.equal(peaked, true, id);
  }
  assert.ok(stops >= 4, stops);
  const used = new Set(FRAMES.reprise.map((frame) => frame.hero));
  assert.equal(used.has("wc1"), false);
  assert.equal(used.has("motion-cut"), true);
  assert.equal(SHOTS.map((shot) => shot.id).includes("counter"), true);
  assert.equal(SHOTS.map((shot) => shot.id).includes("reprise"), true);
});

test("every manifest layer for the default cast is a file on disk", () => {
  for (const beat of Object.keys(FRAMES)) {
    for (const frame of FRAMES[beat]) {
      const view = resolveFrame(beat, frame.at);
      for (const key of ["bg", "hero", "rival", "fx", "flash"]) {
        if (!view[key]) continue;
        assert.equal(onDisk(view[key]), true, view[key]);
      }
    }
  }
});
