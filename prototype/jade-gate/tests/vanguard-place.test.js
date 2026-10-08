import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { FRAMES } from "../capscreens-fight-designs/vanguard-cast.mjs";
import { ANCHOR } from "../capscreens-fight-designs/vanguard-anchor.mjs";
import {
  BEAT_PLACE,
  CAMERA_FIT,
  gap,
  layoutFor,
  visibleBottom,
  visibleSpan,
} from "../capscreens-fight-designs/vanguard-place.mjs";

const root = new URL("../assets/fight/ep1-vanguard/", import.meta.url);

function pngSize(rel) {
  const buf = readFileSync(new URL(rel, root));
  assert.equal(buf.toString("ascii", 1, 4), "PNG");
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
}

/** Percent of frame width from the foot to each side of the cropped sprite. */
function reach(rel, hPct) {
  const { w, h } = pngSize(rel);
  const sw = hPct * (1080 / 1920) * (w / h);
  const anchor = ANCHOR[rel];
  assert.equal(typeof anchor, "number", rel);
  return { left: anchor * sw, right: (1 - anchor) * sw };
}

function placed(beat, heroKey, rivalKey, elapsed = 0, dur = 1000) {
  const layout = layoutFor(beat, elapsed, dur, { hero: heroKey, rival: rivalKey });
  const hero = reach(`layers/zhao-yun/${heroKey}.png`, layout.hero.h);
  const rival = reach(`layers/vanguard/${rivalKey}.png`, layout.rival.h);
  return {
    layout,
    left: layout.hero.x - hero.left,
    right: layout.rival.x + rival.right,
    edgeGap: (layout.rival.x - rival.left) - (layout.hero.x + hero.right),
  };
}

const FIGHT = ["feint", "exchange", "impact", "follow"];

test("approach starts apart and closes onto the courtyard", () => {
  const start = layoutFor("approach", 0, 1700);
  const end = layoutFor("approach", 1700, 1700);
  assert.ok(gap(start) > 40, gap(start));
  assert.ok(gap(end) < 20, gap(end));
  assert.ok(gap(start) > gap(end) + 20);
  assert.ok(start.hero.foot >= 84 && start.hero.foot <= 90);
  assert.equal(start.hero.foot, start.rival.foot);
});

test("fight beats put the weapons in reach and the feet on the ground", () => {
  for (const beat of FIGHT) {
    const seen = new Set();
    for (const frame of FRAMES[beat]) {
      if (!frame.hero || !frame.rival) continue;
      const key = `${frame.hero}|${frame.rival}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const row = placed(beat, frame.hero, frame.rival);
      assert.ok(row.edgeGap <= 0.5 && row.edgeGap >= -2.5, `${beat} ${key} gap ${row.edgeGap.toFixed(2)}`);
      assert.ok(row.layout.hero.x >= 30 && row.layout.hero.x <= 50, `${beat} hero x`);
      assert.ok(row.layout.rival.x >= 50 && row.layout.rival.x <= 70, `${beat} rival x`);
      assert.ok(row.layout.hero.foot >= 82 && row.layout.hero.foot <= 94, `${beat} foot`);
      assert.ok(row.left > 8 && row.right < 92, `${beat} ${key} edges ${row.left.toFixed(1)} ${row.right.toFixed(1)}`);
    }
    assert.ok(seen.size > 0, beat);
  }
});

test("the reverse and the settle stay engaged without leaving the frame", () => {
  for (const frame of FRAMES.ots) {
    if (!frame.hero || !frame.rival) continue;
    const row = placed("ots", frame.hero, frame.rival);
    assert.ok(row.edgeGap <= 0.5 && row.edgeGap >= -2, `ots ${row.edgeGap.toFixed(2)}`);
    assert.ok(row.layout.hero.h > row.layout.rival.h);
    assert.ok(row.left > 4 && row.right < 96);
  }
  for (const frame of FRAMES.aftermath) {
    if (!frame.hero || !frame.rival) continue;
    const row = placed("aftermath", frame.hero, frame.rival);
    assert.ok(row.edgeGap >= 2 && row.edgeGap <= 6, `aftermath ${row.edgeGap.toFixed(2)}`);
    assert.ok(row.left > 4 && row.right < 96);
  }
  const wind = layoutFor("windup", 0, 1000);
  assert.equal(wind.rival, null);
  assert.ok(wind.hero.foot >= 88 && wind.hero.foot <= 94);
  assert.ok(wind.hero.x > 30 && wind.hero.x < 60);
});

test("camera windows keep the ground line and the fighters inside the shot", () => {
  for (const beat of ["feint", "exchange", "follow"]) {
    const cam = CAMERA_FIT[beat];
    const foot = BEAT_PLACE[beat].foot;
    assert.ok(visibleBottom(cam.zoom, cam.y) >= foot + 2, `${beat} end`);
    assert.ok(visibleBottom(cam.from.zoom, cam.from.y) >= foot + 2, `${beat} start`);
    const [fromL, fromR] = visibleSpan(cam.from.zoom, cam.from.x);
    const [toL, toR] = visibleSpan(cam.zoom, cam.x);
    const lo = Math.max(fromL, toL);
    const hi = Math.min(fromR, toR);
    const seen = new Set();
    for (const frame of FRAMES[beat]) {
      if (!frame.hero || !frame.rival) continue;
      const key = `${frame.hero}|${frame.rival}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const row = placed(beat, frame.hero, frame.rival);
      assert.ok(row.left >= lo - 1, `${beat} ${key} left ${row.left.toFixed(1)} window ${lo.toFixed(1)}`);
      assert.ok(row.right <= hi + 1, `${beat} ${key} right ${row.right.toFixed(1)} window ${hi.toFixed(1)}`);
    }
  }
});

test("foot marks follow the pose pair, so a hero swap stands on the same ground", () => {
  const yun = layoutFor("feint", 200, 1200, { hero: "wa3", rival: "wa2" });
  const again = layoutFor("feint", 800, 1200, { hero: "wa3", rival: "wa2" });
  assert.deepEqual(yun, again);
  assert.notEqual(yun.hero.x, layoutFor("feint", 0, 1200).hero.x);
});
