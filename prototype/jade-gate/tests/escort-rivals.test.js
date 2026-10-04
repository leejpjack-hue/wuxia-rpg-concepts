import test from "node:test";
import assert from "node:assert/strict";
import {
  DUEL_ENEMIES,
  DUEL_ROSTERS,
  ESCORT_KINDS,
  escortSquadFor,
  isEscortKind,
  rosterForEncounter,
  QUICKPLAY_HORDE,
} from "../src/content/duels.js";
import { STORY_ROSTERS } from "../src/content/story-rivals.js";
import { createRoam } from "../src/domain/roam.js";
import { distance } from "../src/domain/math.js";
import assetManifest from "../docs/asset-manifest.json" with { type: "json" };

/** A raw campaign roam over one encounter, no session wiring. */
function roamFor(encounterId, encounterIndex = 0) {
  const events = [];
  const bus = { emit: (type, payload) => events.push({ type, payload }) };
  const g = {
    mode: "exploring",
    p: { id: "zhao-yun", x: 640, y: 500, hp: 400, maxHp: 400, flow: 0, power: 1, damage: 20 },
    encounterIndex,
    runMode: "campaign",
    party: { followers: [] },
    curios: [],
    hazards: [],
  };
  const roam = createRoam(g, bus, { encounter: { id: encounterId, enemies: ["guard"] } });
  return { roam, g, events };
}

/** Step toward a live target until a melee rival makes contact (or frames run out). */
function walkToward(g, roam, target, frames = 900) {
  for (let i = 0; i < frames && g.roam.contact < 0; i++) {
    const dx = target().x - g.p.x, dy = target().y - g.p.y, len = Math.hypot(dx, dy) || 1;
    roam.step(1 / 60, { dx: dx / len, dy: dy / len });
  }
  return g.roam.contact;
}

test("escort kinds are light duel rivals with existing sprite art", () => {
  const arts = new Set(assetManifest.map((row) => row.id));
  for (const kind of ESCORT_KINDS) {
    const def = DUEL_ENEMIES[kind];
    assert(def, `DUEL_ENEMIES must define ${kind}`);
    assert(def.escort, `${kind} is flagged as an escort`);
    assert(def.art.endsWith("-sprite"));
    assert(arts.has(def.art), `${kind} art ${def.art} exists in the manifest`);
    assert(def.pattern.length >= 2);
    assert(def.hp > 0 && def.damage > 0 && def.reward > 0);
    assert(!def.boss && !def.heroId);
  }
});

test("escorts join only campaign passes that field a named legend", () => {
  for (const [id, roster] of Object.entries(STORY_ROSTERS)) {
    const withEscorts = rosterForEncounter(id, "campaign");
    if (roster.some((kind) => kind.startsWith("hero-"))) {
      assert.deepEqual(withEscorts, [...roster, ...escortSquadFor(id)], id);
    } else {
      assert.deepEqual(withEscorts, roster, `${id} has no named legend, no escorts`);
    }
    // Quick Play keeps its own encounters at horde scale — still no escorts.
    const quickplay = rosterForEncounter(id, "quickplay");
    const base = DUEL_ROSTERS[id] || roster;
    assert.equal(quickplay.length, base.length * QUICKPLAY_HORDE, `${id} fields the horde`);
    assert.deepEqual([...new Set(quickplay)], [...new Set(base)], `${id} horde repeats only its own kinds`);
  }
  for (const kind of ESCORT_KINDS)
    assert(!Object.values(DUEL_ROSTERS).some((roster) => roster.includes(kind)));
  assert.deepEqual(escortSquadFor("vanguard"), escortSquadFor("vanguard"));
  assert.equal(new Set(escortSquadFor("vanguard")).size <= 3, true);
});

test("escorts deploy in a ring around the last named legend and leave it reachable only by their fall", () => {
  const { roam, g } = roamFor("gate-vanguard");
  const ward = g.roam.field.find((rival) => rival.kind === "hero-qin-liangyu");
  const escorts = g.roam.field.filter((rival) => isEscortKind(rival.kind));
  assert.equal(escorts.length, 3);
  for (const escort of escorts) {
    assert.equal(escort.guardOf, ward.id);
    assert(distance(escort, ward) < 260, "escort spawns beside its ward");
  }
  // Idle far away: no contact, and the squad keeps to its legend's ground.
  for (let i = 0; i < 180; i++) roam.step(1 / 60, {});
  assert.equal(g.roam.contact, -1);
  for (const escort of g.roam.field.filter((rival) => isEscortKind(rival.kind)))
    assert(distance(escort, ward) < 340, "escort stays leashed to its ward");

  // March on the legend: every screen must be cut down before she can be touched.
  const defeated = [];
  while (defeated.filter((kind) => isEscortKind(kind)).length < escorts.length) {
    const wardLive = () => g.roam.field.find((rival) => rival.id === ward.id) || ward;
    const index = walkToward(g, roam, wardLive);
    assert(index >= 0, "a rival bars the way");
    const contacted = g.roam.field[index];
    assert.notEqual(contacted.kind, "hero-qin-liangyu", "the ward stays screened while escorts live");
    defeated.push(contacted.kind);
    roam.removeContacted();
  }
  const escortDefeats = defeated.filter(isEscortKind);
  assert.equal(escortDefeats.length, 3);
  for (const kind of escortDefeats) assert(ESCORT_KINDS.includes(kind));
  // Guards down: the legend finally comes to blades.
  assert.equal(walkToward(g, roam, () => g.roam.field.find((rival) => rival.id === ward.id) || ward) >= 0, true);
  assert.equal(g.roam.field[g.roam.contact].kind, "hero-qin-liangyu");
});

test("escorts never shove into a standing hero, and orphan when their ward falls", () => {
  const { roam, g } = roamFor("gate-vanguard");
  const ward = g.roam.field.find((rival) => rival.kind === "hero-qin-liangyu");
  // Stand just inside the screening radius: guards cut the line but hold their gap.
  Object.assign(g.p, { x: ward.x - 300, y: ward.y });
  for (let i = 0; i < 240; i++) roam.step(1 / 60, {});
  assert.equal(g.roam.contact, -1, "a standing hero is not shoved into a duel");
  for (const escort of g.roam.field.filter((rival) => isEscortKind(rival.kind)))
    assert(distance(escort, g.p) > 70, "escort holds the line without pressing in");

  // Ward removed (as a won duel would): the squad holds the ground and keeps roaming.
  g.roam.field.splice(g.roam.field.indexOf(ward), 1);
  g.roam.contact = -1;
  for (let i = 0; i < 120; i++) roam.step(1 / 60, {});
  const survivors = g.roam.field.filter((rival) => isEscortKind(rival.kind));
  assert.equal(survivors.length, 3);
  for (const escort of survivors) assert.equal(escort.orphaned, true);
});
