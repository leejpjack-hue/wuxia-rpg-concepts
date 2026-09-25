import test from "node:test";
import assert from "node:assert/strict";
import { musicStepCount, scoreStep } from "../src/content/music-score.js";

const settings = {
  select: { bpm: 96, stepsPerBar: 8 },
  upgrade: { bpm: 104, stepsPerBar: 8 },
  battle: { bpm: 138, stepsPerBar: 16 },
  boss: { bpm: 158, stepsPerBar: 16 },
};

test("each adaptive mode has a complete, varied 32-bar arrangement", () => {
  for (const [mode, { bpm, stepsPerBar }] of Object.entries(settings)) {
    assert.equal(musicStepCount(mode), stepsPerBar * 32);
    const seconds = (32 * 4 * 60) / bpm;
    assert(seconds >= 48, `${mode} loop is too short`);
    const bars = Array.from({ length: 32 }, (_, bar) =>
      Array.from({ length: stepsPerBar }, (_, step) =>
        scoreStep(mode, bar * stepsPerBar + step),
      ).flat(),
    );
    assert(bars.every((events) => events.some((event) => event.instrument === "bass")));
    assert(new Set(bars.map((events) => events.find((event) => event.instrument === "chord")?.pitch)).size >= 4);
    assert.notDeepEqual(bars.slice(0, 4), bars.slice(4, 8), `${mode} repeats after four bars`);
    assert.notDeepEqual(bars.slice(0, 8), bars.slice(8, 16), `${mode} repeats after eight bars`);
    assert.deepEqual(scoreStep(mode, 0), scoreStep(mode, musicStepCount(mode)));
  }
});

test("music events have bounded levels and wuxia voices in quiet passages", () => {
  for (const mode of Object.keys(settings)) {
    for (let step = 0; step < musicStepCount(mode); step++) {
      for (const event of scoreStep(mode, step)) {
        assert(event.duration > 0);
        assert(event.velocity > 0 && event.velocity <= 1);
        assert(Number.isFinite(event.pitch));
      }
    }
  }
  const menu = Array.from({ length: musicStepCount("select") }, (_, i) => scoreStep("select", i)).flat();
  const upgrade = Array.from({ length: musicStepCount("upgrade") }, (_, i) => scoreStep("upgrade", i)).flat();
  assert(menu.some((event) => event.instrument === "guzheng"));
  assert(upgrade.some((event) => event.instrument === "flute"));
  assert.deepEqual(scoreStep("paused", 0), []);
});
