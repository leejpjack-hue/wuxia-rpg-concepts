import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { FRAMES } from "../capscreens-fight-designs/vanguard-cast.mjs";
import { activeHero, resolveFrame } from "../capscreens-fight-designs/vanguard-layers.mjs";
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
  const smear = resolveFrame("feint", wind.n * 42);
  assert.equal(smear.phase, "smear");
  assert.notEqual(wind.hero, smear.hero);
  assert.match(smear.hero, /-s\.png/);
  assert.equal(wind.bg, smear.bg);
  assert.match(resolveFrame("impact", 0).flash, /pose-impact-white/);
  assert.match(resolveFrame("impact", 100).flash, /pose-impact-black/);
  const slash = resolveFrame("impact", 200);
  const held = resolveFrame("impact", 360);
  assert.equal(slash.flash, "");
  assert.equal(slash.phase, "stop");
  assert.equal(slash.hero, held.hero);
  assert.notEqual(resolveFrame("impact", 640).hero, slash.hero);
});

test("the clash is a longer phrase with a smear between keys", () => {
  assert.ok(totalMs() > 16000, totalMs());
  assert.ok(totalMs() < 22000, totalMs());
  let ticks = 0;
  let smears = 0;
  let stops = 0;
  for (const list of Object.values(FRAMES)) {
    ticks += list.length;
    let prev = "";
    for (const frame of list) {
      if (frame.phase === "smear") smears += 1;
      if (frame.phase === "stop" && prev !== "stop") stops += 1;
      prev = frame.phase || "";
    }
  }
  assert.ok(ticks > 300, ticks);
  assert.ok(smears > 40, smears);
  assert.ok(stops >= 4, stops);
  const coil = FRAMES.windup.map((frame) => frame.hero).filter(Boolean);
  assert.ok(coil.indexOf("lowlow0") < coil.indexOf("lowlow3"));
  assert.ok(coil.indexOf("lowlow3") < coil.lastIndexOf("lowlow5"));
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
