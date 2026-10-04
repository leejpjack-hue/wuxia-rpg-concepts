import test from "node:test";
import assert from "node:assert/strict";
import {
  createSpeaker,
  hashVoice,
  pickVoice,
  portraitFor,
  scoreVoice,
} from "../src/platform/speech.js";
import { HEROES } from "../src/content/heroes.js";
import { DUEL_ENEMIES } from "../src/content/duels.js";
import { translate } from "../src/locales/i18n.js";

const voice = (name, lang, extra = {}) => ({ name, lang, ...extra });

test("voices rank language first, female names up, male names down", () => {
  const female = voice("Kyoko", "ja-JP");
  const male = voice("Otoya", "ja-JP");
  const otherLangFemale = voice("Samantha", "en-US");
  assert.ok(scoreVoice(female, "ja") > scoreVoice(male, "ja"));
  assert.ok(scoreVoice(male, "ja") > scoreVoice(otherLangFemale, "ja"));
  assert.ok(scoreVoice(voice("Google UK English Female", "en-GB"), "en") >
    scoreVoice(voice("Daniel", "en-GB"), "en"));
  // Sibling languages still rank: Mandarin voices serve a zh scene.
  assert.ok(scoreVoice(voice("Ting-Ting", "zh-CN"), "zh") >
    scoreVoice(voice("Karen", "en-AU"), "zh"));
});

test("every speaker keeps one stable, spread-out female-first voice", () => {
  const pool = [
    voice("Kyoko", "ja-JP"),
    voice("Otoya", "ja-JP"),
    voice("Google 日本語", "ja-JP"),
    voice("Milena", "ja-JP"),
    voice("Samantha", "en-US"),
  ];
  const speakers = ["Zhao Yun", "Lü Bu", "The Night Heron", "Gu Dasao", "Hu Sanniang", "Wu Song"];
  const picked = speakers.map((speaker) => pickVoice(speaker, pool, "ja"));
  // Stable per speaker.
  for (const [i, speaker] of speakers.entries())
    assert.equal(pickVoice(speaker, pool, "ja"), picked[i]);
  // Spread: several distinct voices across the cast, never the male pick
  // while female voices remain in the pool.
  assert.ok(new Set(picked).size >= 3, "the cast spreads across voices");
  assert.ok(!picked.includes(pool[1]), "the male voice is never chosen first");
  // An empty roster is safe.
  assert.equal(pickVoice("Zhao Yun", [], "ja"), null);
});

test("hashVoice is deterministic and spreads", () => {
  assert.equal(hashVoice("Zhao Yun"), hashVoice("Zhao Yun"));
  assert.notEqual(hashVoice("Zhao Yun"), hashVoice("Lü Bu"));
  const buckets = new Set(Array.from({ length: 24 }, (_, i) => hashVoice(`speaker-${i}`) % 8));
  assert.ok(buckets.size >= 5, "hashes spread across buckets");
});

test("speakers resolve to their portrait card; narrators borrow the hero", () => {
  assert.equal(portraitFor("Zhao Yun", { heroes: HEROES, fallback: "lu-zhishen" }), "zhao-yun");
  // Boss names resolve through the rival roster to their portrait art.
  assert.equal(portraitFor("Lü Bu", { heroes: HEROES, rivals: DUEL_ENEMIES, fallback: null }), "lu-bu");
  // Dialogue drops the rival's leading article — the card still resolves.
  assert.equal(portraitFor("Ashen Warden", { heroes: HEROES, rivals: DUEL_ENEMIES, fallback: null }), "warden");
  assert.equal(
    portraitFor("The road ahead", { heroes: HEROES, rivals: DUEL_ENEMIES, fallback: "hu-sanniang" }),
    "hu-sanniang",
    "narrator lines fall back to the player hero's card",
  );
});

test("the speaker controller cancels, reads one line, and reports its voice", () => {
  const spoken = [];
  const synthesis = {
    cancel() { spoken.push("cancel"); },
    speak(utterance) { spoken.push(utterance); },
    getVoices: () => [voice("Kyoko", "ja-JP"), voice("Milena", "ja-JP")],
    addEventListener() {},
  };
  const speaker = createSpeaker({ synthesis, Utterance: class { constructor(text) { this.text = text; } } });
  const utterance = speaker.speak(translate("Then this gate will open."), "Zhao Yun", "ja");
  assert.ok(utterance, "the line is spoken");
  assert.equal(spoken[0], "cancel");
  assert.equal(spoken[1], utterance);
  assert.ok(["Kyoko", "Milena"].includes(utterance.voice.name));
  assert.equal(typeof utterance.pitch, "number");
  // Without a synthesis instance everything is a safe no-op.
  const none = createSpeaker({ synthesis: null });
  assert.equal(none.speak("hi", "Zhao Yun", "ja"), null);
  assert.doesNotThrow(() => none.cancel());
});
