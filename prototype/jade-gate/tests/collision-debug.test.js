import test from "node:test";
import assert from "node:assert/strict";
import { isDebugFlag } from "../src/platform/debug-flag.js";
import { isCollisionDebugOn, paintCollisionDebug } from "../src/presentation/collision-debug.js";
import { BLOCKERS, WORLD, VIEWPORT } from "../src/domain/ground.js";

test("collision debug overlay is off by default", () => {
  assert.equal(isDebugFlag(""), false);
  assert.equal(isDebugFlag("?"), false);
  assert.equal(isDebugFlag("?foo=1"), false);
  assert.equal(isDebugFlag("?debug=0"), false);
  assert.equal(isDebugFlag("?debug=false"), false);
  assert.equal(isCollisionDebugOn(""), false);
});

test("collision debug overlay enables via ?debug=1 or true", () => {
  assert.equal(isDebugFlag("?debug=1"), true);
  assert.equal(isDebugFlag("debug=1"), true);
  assert.equal(isDebugFlag("?debug=true"), true);
  assert.equal(isDebugFlag("?other=x&debug=1"), true);
  assert.equal(isCollisionDebugOn("?debug=1"), true);
});

test("paintCollisionDebug strokes world, each CAM-02 blocker, and camera rect", () => {
  const calls = [];
  const mock = {
    save() { calls.push("save"); },
    restore() { calls.push("restore"); },
    setLineDash(d) { calls.push(["dash", d]); },
    strokeRect(x, y, w, h) {
      calls.push(["stroke", this.strokeStyle, x, y, w, h]);
    },
    strokeStyle: "",
    lineWidth: 1,
  };
  paintCollisionDebug(mock, { x: 100, y: 50 });
  const strokeCalls = calls.filter((c) => Array.isArray(c) && c[0] === "stroke");
  // world + blockers + camera
  assert.equal(strokeCalls.length, 1 + BLOCKERS.length + 1);
  const worldStroke = strokeCalls[0];
  assert.equal(worldStroke[1], "#44aaff");
  // world (0,0) with cam (100,50) → screen (-100,-50), size WORLD
  assert.equal(worldStroke[2], -100);
  assert.equal(worldStroke[3], -50);
  assert.equal(worldStroke[4], WORLD.width);
  assert.equal(worldStroke[5], WORLD.height);
  for (let i = 0; i < BLOCKERS.length; i++) {
    const b = BLOCKERS[i];
    const s = strokeCalls[1 + i];
    assert.equal(s[1], "#ff6644");
    assert.equal(s[2], b.x - 100);
    assert.equal(s[3], b.y - 50);
    assert.equal(s[4], b.w);
    assert.equal(s[5], b.h);
  }
  const camStroke = strokeCalls[strokeCalls.length - 1];
  assert.equal(camStroke[1], "#ffee44");
  assert.equal(camStroke[2], 1);
  assert.equal(camStroke[3], 1);
  assert.equal(camStroke[4], VIEWPORT.width - 2);
  assert.equal(camStroke[5], VIEWPORT.height - 2);
});

test("paintCollisionDebug no-ops without ctx or cam", () => {
  assert.equal(paintCollisionDebug(null, { x: 0, y: 0 }), undefined);
  assert.equal(paintCollisionDebug({}, null), undefined);
});
