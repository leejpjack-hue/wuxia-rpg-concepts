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

test("each tick is its own drawing, with no smear plate and no impact flash", () => {
  const first = resolveFrame("feint", 0);
  const next = resolveFrame("feint", 125);
  assert.equal(first.phase, "draw");
  assert.equal(first.flash, "");
  assert.notEqual(first.heroPose, next.heroPose);
  assert.equal(first.motion.hero.from, first.motion.hero.to);
  assert.equal(first.motion.hero.smear, 0);
  assert.equal(first.motion.hero.rot, 0);
  assert.doesNotMatch(first.hero, /-s\.png/);
  assert.equal(resolveFrame("impact", 0).flash, "");
  assert.equal(resolveFrame("impact", 100).flash, "");
  assert.notEqual(resolveFrame("impact", 0).heroPose, resolveFrame("impact", 600).heroPose);
  assert.notEqual(resolveFrame("impact", 0).rivalPose, resolveFrame("impact", 600).rivalPose);
});

test("both fighters are drawn across a phrase long enough to play", () => {
  assert.ok(totalMs() > 15000, totalMs());
  assert.ok(totalMs() < 25000, totalMs());
  const heroes = new Set();
  const rivals = new Set();
  for (const id of Object.keys(FRAMES)) {
    for (const frame of FRAMES[id]) {
      heroes.add(frame.hero);
      rivals.add(frame.rival);
      assert.equal(frame.hero.startsWith("wc"), false);
      assert.equal(frame.flash, null);
    }
  }
  assert.ok(heroes.size >= 100, heroes.size);
  assert.ok(rivals.size >= 100, rivals.size);
  const coil = sampleBeat("windup", 400);
  const later = sampleBeat("windup", 900);
  assert.notEqual(coil.hero.pose, later.hero.pose);
  assert.notEqual(coil.rival.pose, later.rival.pose);
  assert.equal(SHOTS.map((shot) => shot.id).includes("counter"), true);
  assert.equal(SHOTS.map((shot) => shot.id).includes("reprise"), true);
  assert.equal(SHOTS.some((shot) => shot.shake), false);
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
