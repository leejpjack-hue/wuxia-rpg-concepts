import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { activeHero, resolveFrame } from "../capscreens-fight-designs/vanguard-layers.mjs";

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

test("action beats advance to a new drawing each tick, and impact holds the slash", () => {
  const first = resolveFrame("feint", 0);
  const next = resolveFrame("feint", 83);
  assert.notEqual(first.hero, next.hero);
  assert.equal(first.bg, next.bg);
  assert.match(resolveFrame("impact", 0).flash, /pose-impact-white/);
  assert.match(resolveFrame("impact", 100).flash, /pose-impact-black/);
  const slash = resolveFrame("impact", 200);
  const held = resolveFrame("impact", 360);
  assert.equal(slash.flash, "");
  assert.equal(slash.hero, held.hero);
  assert.notEqual(resolveFrame("impact", 400).hero, slash.hero);
});

test("every manifest layer for the default cast is a file on disk", () => {
  for (const beat of ["approach", "windup", "feint", "ots", "exchange", "impact", "follow", "aftermath"]) {
    const frame = resolveFrame(beat, 0);
    for (const key of ["bg", "hero", "rival", "fx", "flash"]) {
      if (!frame[key]) continue;
      assert.equal(onDisk(frame[key]), true, frame[key]);
    }
    const later = resolveFrame(beat, 500);
    for (const key of ["bg", "hero", "rival", "fx", "flash"]) {
      if (!later[key]) continue;
      assert.equal(onDisk(later[key]), true, later[key]);
    }
  }
});
