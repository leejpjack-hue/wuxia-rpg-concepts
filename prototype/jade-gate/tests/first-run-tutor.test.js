import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { tutorLesson, FirstRunTutor } from "../src/presentation/first-run-tutor.js";
import { defaultProfile, sanitizeProfile, SAVE_KEY } from "../src/platform/save-store.js";
import { translate } from "../src/locales/i18n.js";
import { memoryStorage, session, quickParty } from "./helpers.js";
import { DUEL_ENEMIES } from "../src/content/duels.js";

const MOVE = "Move with WASD or the arrow keys, or the on-screen pad. Walk into a swordsman to start a card duel.";
const DUEL = "Choose Strike, Guard, Technique, or Healing tea. Strike deals damage and gains Flow. Guard blocks 80% of the reply. Technique spends Flow and pierces guard. Healing tea restores health once; the rival still replies. Keys 1–4 match the buttons.";

test("a fresh profile teaches movement on the pass and the four actions in a duel", () => {
  const settings = defaultProfile().settings;
  assert.equal(settings.language, "ja");
  assert.equal(settings.tutorSkipped, false);
  assert.equal(tutorLesson(settings, "menu"), null);
  assert.equal(tutorLesson(settings, "dialogue"), null);
  assert.equal(tutorLesson(settings, "exploring"), "move");
  assert.equal(tutorLesson(settings, "playing"), "duel");
  assert.equal(tutorLesson({ ...settings, tutorSeenMove: true }, "exploring"), null);
  assert.equal(tutorLesson({ ...settings, tutorSeenMove: true }, "playing"), "duel");
  assert.equal(tutorLesson({ ...settings, tutorSeenDuel: true }, "playing"), null);
  assert.equal(tutorLesson({ ...settings, tutorSkipped: true }, "exploring"), null);
  assert.equal(tutorLesson({ ...settings, tutorSkipped: true }, "playing"), null);
});

test("older played saves stay quiet; a settings-only save still gets the tutor", () => {
  const veteran = sanitizeProfile({
    version: 2,
    settings: { language: "en", music: false },
    checkpoint: null,
    records: { "zhao-yun": { best: 10, wins: 1 } },
    wallet: 40,
  });
  assert.equal(veteran.settings.language, "en");
  assert.equal(veteran.settings.tutorSkipped, false);
  assert.equal(veteran.settings.tutorSeenMove, true);
  assert.equal(veteran.settings.tutorSeenDuel, true);
  assert.equal(tutorLesson(veteran.settings, "exploring"), null);

  const checkpointed = sanitizeProfile({
    version: 2,
    completedActs: ["jade-gate"],
  });
  assert.equal(checkpointed.settings.tutorSeenMove, true);
  assert.equal(checkpointed.settings.tutorSeenDuel, true);

  const fresh = sanitizeProfile({ version: 2, settings: { language: "ja", sound: false } });
  assert.equal(fresh.settings.sound, false);
  assert.equal(fresh.settings.tutorSeenMove, false);
  assert.equal(fresh.settings.tutorSeenDuel, false);
  assert.equal(tutorLesson(fresh.settings, "exploring"), "move");
});

test("an explicit skip or seen flag survives a later checkpoint", () => {
  const kept = sanitizeProfile({
    version: 2,
    wallet: 80,
    completedRuns: ["run-1"],
    settings: { tutorSkipped: true, tutorSeenMove: false, tutorSeenDuel: false },
  });
  assert.equal(kept.settings.tutorSkipped, true);
  assert.equal(kept.settings.tutorSeenMove, false);
  assert.equal(tutorLesson(kept.settings, "playing"), null);
});

test("skip during the first pass hides the duel lesson after reload", () => {
  const storage = memoryStorage();
  const game = session(storage);
  const { nodes } = mount(game);
  game.start("zhao-yun", "quickplay", "jade-gate", quickParty("zhao-yun"));
  assert.equal(game.mode, "exploring");
  assert.equal(nodes["tutor-move"].hidden, false);
  assert.equal(nodes["tutor-duel"].hidden, true);
  assert.equal(nodes["roam-menu"].open, true);
  nodes["tutor-skip-move"].onclick();
  assert.equal(game.profile.settings.tutorSkipped, true);
  assert.equal(nodes["tutor-move"].hidden, true);
  const again = session(storage);
  mount(again);
  again.start("zhao-yun", "quickplay", "jade-gate", quickParty("zhao-yun"));
  assert.equal(tutorLesson(again.profile.settings, "exploring"), null);
  assert.equal(again.profile.settings.language, "ja");
});

test("campaign dialogue stays free of the tutor, then the pass lesson appears", () => {
  const game = session();
  const { nodes } = mount(game);
  game.start("zhao-yun", "campaign");
  assert.equal(game.mode, "dialogue");
  assert.equal(nodes["tutor-move"].hidden, true);
  assert.equal(nodes["tutor-duel"].hidden, true);
  game.advanceDialogue(true);
  assert.equal(game.mode, "exploring");
  assert.equal(nodes["tutor-move"].hidden, false);
  game.setSetting("language", "en");
  assert.equal(game.profile.settings.language, "en");
  assert.equal(nodes["tutor-move"].hidden, false);
  assert.equal(nodes["roam-menu"].open, true);
});

test("movement acknowledgement leaves the four duel actions to teach, and Guard still resolves", () => {
  const game = session();
  const { nodes } = mount(game);
  game.start("zhao-yun", "quickplay", "jade-gate", quickParty("zhao-yun"));
  nodes["tutor-move-done"].onclick();
  assert.equal(nodes["tutor-move"].hidden, true);
  const index = game.g.roam.field.findIndex((rival) => !rival.ranged && !DUEL_ENEMIES[rival.kind]?.boss);
  assert.ok(index >= 0);
  assert.equal(game.beginDuel(index), true);
  assert.equal(game.mode, "playing");
  assert.equal(nodes["tutor-duel"].hidden, false);
  assert.ok(game.combat.preview("attack"));
  assert.ok(game.combat.preview("guard"));
  assert.equal(game.combat.act("guard"), true);
  assert.equal(game.mode, "playing");
  assert.equal(game.profile.settings.tutorSeenDuel, false);
  assert.equal(nodes["tutor-duel"].hidden, false);
  nodes["tutor-duel-done"].onclick();
  assert.equal(nodes["tutor-duel"].hidden, true);
  assert.equal(tutorLesson(game.profile.settings, "playing"), null);
});

test("tutor copy is Japanese by default, English on toggle, and the trailer stays a separate link", () => {
  assert.notEqual(translate(MOVE), MOVE);
  assert.equal(translate(MOVE, "en"), MOVE);
  assert.notEqual(translate(DUEL), DUEL);
  assert.equal(translate(DUEL, "en"), DUEL);
  assert.equal(translate("Skip tutor forever"), "指南を以後表示しない");
  assert.equal(translate("Got it", "en"), "Got it");
  const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  const trailer = readFileSync(new URL("../trailer.html", import.meta.url), "utf8");
  assert.match(html, /href="trailer\.html"/);
  assert.match(html, /id="tutor-move"/);
  assert.match(html, /id="tutor-duel"/);
  assert.match(html, /data-i18n="Strike"/);
  assert.match(html, /data-i18n="Guard"/);
  assert.match(html, /data-i18n="Healing tea"/);
  assert.equal(html.includes(MOVE), true);
  assert.equal(html.includes(DUEL), true);
  assert.equal(trailer.includes("tutor-move"), false);
  assert.equal(trailer.includes("tutor-duel"), false);
  const tutorHtml = html.slice(html.indexOf('id="tutor-move"'), html.indexOf('id="roam-menu"'));
  const duelTutor = html.slice(html.indexOf('id="tutor-duel"'), html.indexOf('class="duel-actions"'));
  assert.equal(/Assist|tag-in|party/i.test(tutorHtml + duelTutor), false);
});

test("skip and seen flags persist through the save store", () => {
  const storage = memoryStorage();
  const game = session(storage);
  game.setSetting("tutorSeenMove", true);
  game.setSetting("language", "en");
  const saved = JSON.parse(storage.getItem(SAVE_KEY));
  assert.equal(saved.settings.tutorSeenMove, true);
  assert.equal(saved.settings.tutorSeenDuel, false);
  assert.equal(saved.settings.tutorSkipped, false);
  assert.equal(saved.settings.language, "en");
  const reloaded = session(storage);
  assert.equal(reloaded.profile.settings.tutorSeenMove, true);
  assert.equal(reloaded.profile.settings.language, "en");
  assert.equal(tutorLesson(reloaded.profile.settings, "exploring"), null);
  assert.equal(tutorLesson(reloaded.profile.settings, "playing"), "duel");
});

function mount(game) {
  const nodes = {};
  const el = () => ({ hidden: true, open: false, onclick: null });
  for (const id of ["tutor-move", "tutor-duel", "tutor-move-done", "tutor-skip-move", "tutor-duel-done", "tutor-skip-duel", "roam-menu"])
    nodes[id] = el();
  const document = { getElementById: (id) => nodes[id] || null };
  const tutor = new FirstRunTutor(game, document);
  return { nodes, tutor };
}
