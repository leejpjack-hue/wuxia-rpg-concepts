/**
 * Dialogue speech and portraits (Web Speech API).
 *
 * The browser's speechSynthesis ("the JavaScript speaker") reads each line as
 * it is shown. Voices are female-first and spread per speaker, so a scene with
 * several characters keeps several distinct voices.
 */

/** Common female voice names across desktop and browser rosters. */
const FEMALE_HINTS = new RegExp(
  [
    "female", "woman", "girl",
    // macOS / iOS
    "samantha", "victoria", "karen", "moira", "tessa", "fiona", "allison", "ava",
    "susan", "zoe", "serena", "catherine", "joana", "luciana", "paulina", "monica",
    "ting-?ting", "sin-?ji", "mei-?jia", "kyoko", "yuna", "milena", "laila", "carmit",
    "damayanti", "ellen", "ioana", "lekha", "sara", "nora", "satu", "melina", "mariska",
    // Windows
    "zira", "hana", "yaoyao", "huiqiu", "hanhan", "xiaoxiao", "xiaoyi",
    "tracy", "aRIA", "jenny", "amber", "ana", "emily", "michelle", "elsa",
    // Google / Chrome OS / Android
    "google uk english female", "google us english", "google 普通话", "google 日本語",
    "google hindi", "cmn-cn", "yue-cn",
  ].filter(Boolean).join("|"),
  "i",
);
/** Known male names — deprioritised so the cast reads female-first. */
const MALE_HINTS = new RegExp(
  [
    "male", "\\bman\\b", "daniel", "alex", "fred", "thomas", "rishi", "jorge", "diego",
    "juan", "yuri", "otoya", "hattori", "kyohei", "daisuke", "ichiro", "david", "mark",
    "james", "guy", "aaron", "arthur", "gordon", "oliver", "ryan", "thomas", "george",
    "liang", "kangkang", "yunxi", "yunyang", "christopher", "eric", "brian", "andrew",
  ].join("|"),
  "i",
);

/** Deterministic string hash (FNV-1a, 32-bit). */
export function hashVoice(seed) {
  let hash = 0x811c9dc5;
  for (const ch of String(seed)) {
    hash ^= ch.charCodeAt(0);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

/**
 * Rank a voice for a target language: language match first, then female names
 * up, male names down. `lang` is a BCP-47 tag ("ja", "en", "zh", ...).
 */
export function scoreVoice(voice, lang) {
  if (!voice) return -100;
  const tag = String(voice.lang || "").toLowerCase().replace("_", "-");
  const want = String(lang || "").toLowerCase();
  let score = 0;
  if (want && tag === want) score += 12;
  else if (want && tag.startsWith(want)) score += 9;
  else if (want && want.startsWith(tag.split("-")[0])) score += 6; // zh for yue/cmn, en-GB for en
  if (FEMALE_HINTS.test(voice.name)) score += 4;
  else if (MALE_HINTS.test(voice.name)) score -= 4;
  if (voice.localService) score += 1;
  return score;
}

/** Every speaker keeps one stable voice: the pool is ranked for the language,
 *  then the speaker's hash picks among the top voices so a scene spreads
 *  across as many distinct (female-first) voices as the roster offers. */
export function pickVoice(speaker, voices, lang) {
  if (!voices?.length) return null;
  const ranked = [...voices].sort((a, b) => scoreVoice(b, lang) - scoreVoice(a, lang));
  // Spread across voices close to the best rank: right language, female-first.
  const best = scoreVoice(ranked[0], lang);
  const pool = ranked.filter((voice) => scoreVoice(voice, lang) >= best - 4);
  const spread = Math.min(pool.length, 8);
  return pool[hashVoice(speaker) % spread] || pool[0];
}

/** Compare speaker names loosely: case and a leading article don't matter. */
const sameName = (a, b) =>
  String(a || "").toLowerCase().replace(/^the\s+/, "").trim() ===
  String(b || "").toLowerCase().replace(/^the\s+/, "").trim();

/** Resolve a dialogue speaker to their portrait art id.
 *  Speakers are display names: heroes, duel rivals, or narrator titles.
 *  Narrators fall back to the player hero — the story is theirs. */
export function portraitFor(speaker, { heroes = [], rivals = {}, fallback = null } = {}) {
  const hero = heroes.find((entry) => sameName(entry.name, speaker));
  if (hero) return hero.id;
  const rival = Object.values(rivals).find((entry) => sameName(entry?.name, speaker));
  if (rival) return rival.portrait || String(rival.art || "").replace(/-sprite$/, "");
  return fallback;
}

/** A cancellable line reader over a speechSynthesis instance. */
export function createSpeaker({
  synthesis = null,
  Utterance = globalThis.SpeechSynthesisUtterance || null,
  onVoices = () => {},
} = []) {
  let voices = [];
  const refresh = () => {
    const next = synthesis?.getVoices?.() || [];
    if (next.length) {
      voices = next;
      onVoices(next);
    }
  };
  refresh();
  if (synthesis && typeof synthesis.addEventListener === "function")
    synthesis.addEventListener("voiceschanged", refresh);
  return {
    get voices() { return voices; },
    cancel() { synthesis?.cancel?.(); },
    /** Speak one line; returns the utterance, or null when unavailable. */
    speak(text, speaker, lang) {
      if (!synthesis || !Utterance || !text) return null;
      synthesis.cancel();
      const utterance = new Utterance(String(text));
      const voice = pickVoice(speaker, voices, lang);
      if (voice) utterance.voice = voice;
      utterance.lang = voice?.lang || lang || "ja";
      // Same-roster fallback still varies: a light per-speaker pitch shift.
      utterance.pitch = 0.95 + (hashVoice(speaker + "#pitch") % 30) / 100;
      utterance.rate = 1;
      synthesis.speak(utterance);
      return utterance;
    },
  };
}
