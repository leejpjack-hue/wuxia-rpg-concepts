import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import {
  EPISODES,
  SPEAKERS,
  FIGHT_PHASES,
  fightPhase,
  shotsOf,
  total,
  art,
  portraitSrc,
} from "../animation.js";

const root = new URL("../", import.meta.url);
const assetExists = (relPath) => existsSync(new URL(relPath, root));

test("animation episodes have valid scenes, backdrops, and durations", () => {
  assert.equal(EPISODES.length, 2, "Demo defines exactly two episodes");

  for (const ep of EPISODES) {
    assert.ok(ep.id && ep.title && ep.number, "Episode has id, title, and number");
    assert.ok(ep.scenes && ep.scenes.length > 0, "Episode has scenes");

    const totalSeconds = total(ep);
    assert.ok(totalSeconds > 600, `Episode ${ep.id} duration (${totalSeconds}s) is substantive`);

    let sceneSum = 0;
    for (const scene of ep.scenes) {
      assert.ok(scene.id, "Scene has id");
      assert.ok(scene.chapter, "Scene has chapter title");
      assert.ok(scene.duration > 0, "Scene duration must be positive");
      assert.ok(scene.backdrop, "Scene specifies backdrop");
      assert.ok(assetExists(scene.backdrop), `Scene backdrop must exist on disk: ${scene.backdrop}`);

      // Cast verification
      assert.ok(Array.isArray(scene.cast), "Scene has cast array");
      for (const member of scene.cast) {
        assert.ok(member.id, "Cast member has id");
        const spriteFile = `assets/${member.id}-sprite.png`;
        assert.ok(assetExists(spriteFile), `Cast sprite must exist on disk: ${spriteFile}`);
      }

      // Beats verification
      assert.ok(Array.isArray(scene.beats) && scene.beats.length > 0, "Scene has beats");
      let prevTime = 0;
      for (const beat of scene.beats) {
        assert.ok(typeof beat.t === "number" && beat.t >= 0, "Beat timestamp is valid");
        assert.ok(beat.t >= prevTime, `Beat timestamp must be non-decreasing: ${beat.t} >= ${prevTime}`);
        assert.ok(beat.t < scene.duration, `Beat timestamp (${beat.t}s) must fall within scene duration (${scene.duration}s)`);
        assert.ok(beat.text && beat.text.trim().length > 0, "Beat has text content");

        if (beat.who && !["三人", "裂口"].includes(beat.who)) {
          assert.ok(
            Object.prototype.hasOwnProperty.call(SPEAKERS, beat.who),
            `Speaker "${beat.who}" must be registered in SPEAKERS`
          );
        }
        prevTime = beat.t;
      }

      sceneSum += scene.duration;
    }

    assert.equal(totalSeconds, sceneSum, "total(ep) matches sum of scene durations");
  }
});

test("all SPEAKERS resolve to existing character art", () => {
  for (const [name, id] of Object.entries(SPEAKERS)) {
    assert.ok(id, `Speaker ${name} maps to non-empty id`);
    const portrait = portraitSrc(id);
    const spriteFile = `assets/${id}-sprite.png`;
    const hasVisual = portrait || assetExists(spriteFile);
    assert.ok(hasVisual, `Speaker "${name}" (${id}) must have either portrait or sprite asset`);
  }
});

test("portraitSrc finds both PNG and JPG portrait key art", () => {
  assert.equal(portraitSrc("zhao-yun"), "assets/zhao-yun.png", "Finds standard PNG portrait");
  assert.equal(portraitSrc("zhao-min"), "assets/zhao-min.jpg", "Finds approved Episode 2 JPG portrait");
  assert.equal(portraitSrc("lin-daiyu"), "assets/lin-daiyu.jpg", "Finds Lin Daiyu JPG portrait");
  assert.equal(portraitSrc("di-renjie"), "assets/di-renjie.jpg", "Finds Di Renjie JPG portrait");
  assert.equal(portraitSrc("nonexistent-character-id"), null, "Returns null for nonexistent character");
});

test("fightPhase accurately calculates combat progression", () => {
  assert.equal(FIGHT_PHASES.length, 7, "Combat follows 7-phase sakuga structure");

  assert.equal(fightPhase(0.0).name, "standoff");
  assert.equal(fightPhase(2.9).name, "standoff");
  assert.equal(fightPhase(3.1).name, "windup");
  assert.equal(fightPhase(5.1).name, "charge");
  assert.equal(fightPhase(5.8).name, "impact");
  assert.equal(fightPhase(6.5).name, "pass");
  assert.equal(fightPhase(8.0).name, "hold");
  assert.equal(fightPhase(11.0).name, "aftermath");
  assert.equal(fightPhase(999).name, "aftermath", "Clamps to aftermath when exceeding fight duration");
});

test("all scene shots have valid focus and rival art targets", () => {
  for (const ep of EPISODES) {
    for (const scene of ep.scenes) {
      const shots = shotsOf(scene);
      assert.ok(shots.length > 0, `Scene ${scene.id} must have shots`);

      for (const shot of shots) {
        assert.ok(["wide", "pan", "push", "closeup", "duel", "fight"].includes(shot.kind), `Shot kind "${shot.kind}" is valid`);

        if (shot.kind === "closeup") {
          assert.ok(shot.focus, `Closeup shot must specify focus character: ${JSON.stringify(shot)}`);
          const hasArt = portraitSrc(shot.focus) || assetExists(`assets/${shot.focus}-sprite.png`);
          assert.ok(hasArt, `Closeup focus "${shot.focus}" must have visual asset`);
        }

        if (shot.kind === "duel" || shot.kind === "fight") {
          assert.ok(shot.focus && shot.rival, `Duel/fight shot must specify both focus and rival: ${JSON.stringify(shot)}`);
          const heroHasArt = portraitSrc(shot.focus) || assetExists(`assets/${shot.focus}-sprite.png`);
          const rivalHasArt = portraitSrc(shot.rival) || assetExists(`assets/${shot.rival}-sprite.png`);
          assert.ok(heroHasArt, `Duel hero "${shot.focus}" must have visual asset`);
          assert.ok(rivalHasArt, `Duel rival "${shot.rival}" must have visual asset`);
        }
      }
    }
  }
});
