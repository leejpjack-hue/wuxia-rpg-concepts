import test from "node:test";
import assert from "node:assert/strict";
import { ACTS } from "../src/content/campaign.js";
import {
  DUEL_ROSTERS,
  ESCORT_KINDS,
  QUICKPLAY_HORDE,
  rosterForEncounter,
  setQuickplayHorde,
} from "../src/content/duels.js";
import { session, memoryStorage, quickParty, duelPolicy, engageRival } from "./helpers.js";

// These suites run at the classic scale; the horde is the shipped default.
setQuickplayHorde(null);

const actOne = ACTS.find((act) => act.id === "jade-gate");
const baseTotal = (act) =>
  act.encounters.reduce((sum, encounter) => sum + (DUEL_ROSTERS[encounter.id] || []).length, 0);

test("quick play fields the horde: every encounter at twenty times its roster, no escorts", () => {
  for (const act of ACTS) {
    for (const encounter of act.encounters) {
      const base = DUEL_ROSTERS[encounter.id];
      if (!base) continue;
      const roster = rosterForEncounter(encounter.id, "quickplay");
      assert.equal(roster.length, base.length * QUICKPLAY_HORDE, `${encounter.id} stands at ${QUICKPLAY_HORDE}x`);
      assert.deepEqual([...new Set(roster)], [...new Set(base)], `${encounter.id} repeats only its own kinds`);
      for (const kind of roster) assert(!ESCORT_KINDS.includes(kind), "quick play fields no escorts");
    }
    // The whole act carries at least twenty times its base enemy count.
    assert.equal(
      act.encounters.reduce((sum, encounter) => sum + rosterForEncounter(encounter.id, "quickplay").length, 0),
      baseTotal(act) * QUICKPLAY_HORDE,
      `${act.id} totals ${QUICKPLAY_HORDE}x enemies`,
    );
  }
  // Campaign rosters are untouched by the horde.
  const gate = rosterForEncounter("gate-vanguard", "campaign");
  assert.equal(gate.length < 10, true, "campaign stays at story scale");
});

test("the hidden legends play in quick play; campaign keeps its story gate", () => {
  const game = session(memoryStorage());
  game.start("zhao-min", "quickplay", "jade-gate", quickParty("zhao-min"));
  assert.equal(game.g.p.id, "zhao-min");
  assert.equal(game.mode, "exploring");
  const story = session(memoryStorage());
  assert.throws(() => story.start("zhao-min", "campaign"), /hidden until unlocked/);
  // The hidden cast cards up: every hidden legend starts their own run.
  for (const id of ["jia-zheng", "lin-daiyu", "song-jiang", "zhao-min"]) {
    const run = session(memoryStorage());
    run.start(id, "quickplay", "jade-gate", quickParty(id));
    assert.equal(run.g.p.id, id, `${id} starts`);
  }
});

test("the goal is everyone: victory comes only after the last rival of the horde falls", () => {
  const game = session(memoryStorage());
  game.start("zhao-yun", "quickplay", "jade-gate", quickParty("zhao-yun"));
  // Fast-forward the grind: cut each field to one rival, but clear EVERY
  // encounter — the run may only end in victory once everyone has fallen.
  let guardSteps = 0;
  while (!["victory", "defeat"].includes(game.mode) && guardSteps++ < 200) {
    if (game.mode === "dialogue") { game.advanceDialogue(true); continue; }
    if (game.mode === "upgrade") { game.chooseDiscipline("power"); continue; }
    if (game.mode === "exploring") {
      if (game.g.roam.field.length > 1) game.g.roam.field.length = 1;
      engageRival(game);
      continue;
    }
    game.combat.act(duelPolicy(game));
  }
  assert.equal(game.mode, "victory");
  assert.equal(game.g.totalKills, actOne.encounters.length, "one defeat per thinned encounter");
  assert.equal(game.profile.records["zhao-yun"].wins, 1);
  assert.equal(game.profile.checkpoint, null);
});
