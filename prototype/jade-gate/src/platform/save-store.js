import { HERO_IDS } from "../content/heroes.js";
import { ACTS, CULTIVATIONS, actById } from "../content/campaign.js";
export const SAVE_VERSION = 2;
export const SAVE_KEY = "blades-profile-v2";
const number = (v, fallback = 0, max = 1e8) =>
  Number.isFinite(v) ? Math.max(0, Math.min(max, v)) : fallback;
const integer = (v, fallback = 0, max = 1e8) =>
  Math.floor(number(v, fallback, max));
export const defaultProfile = () => ({
  version: SAVE_VERSION,
  settings: {
    sound: true,
    music: true,
    reducedMotion: false,
    masterVolume: 0.75,
    musicVolume: 0.65,
    sfxVolume: 0.85,
  },
  records: {},
  wallet: 0,
  ranks: {},
  unlockedHeroes: HERO_IDS.filter((id) => id !== "lu-bu"),
  completedActs: [],
  completedRuns: [],
  checkpoint: null,
});
const playerFields = {
  hp: 1000,
  maxHp: 1000,
  flow: 100,
  power: 10,
  flowBonus: 50,
  cost: 40,
  kills: 1000,
  damageTaken: 1e6,
};
export function sanitizeCheckpoint(raw) {
  if (!raw || typeof raw !== "object" || !HERO_IDS.includes(raw.heroId))
    return null;
  const act = actById(raw.actId);
  const stages = [
    "arrival",
    "combat",
    "upgrade",
    "warden-intro",
    "warden-fall",
    "waystation",
    "bamboo-arrival",
    "night-heron-intro",
    "night-heron-fall",
    "heron-intro",
    "heron-fall",
  ];
  if (
    !act?.available ||
    !stages.includes(raw.stage) ||
    typeof raw.runId !== "string" ||
    raw.runId.length > 100
  )
    return null;
  if (
    !Number.isInteger(raw.encounterIndex) ||
    raw.encounterIndex < 0 ||
    raw.encounterIndex >= act.encounters.length
  )
    return null;
  const player = {};
  for (const [key, max] of Object.entries(playerFields)) {
    if (!Number.isFinite(raw.player?.[key])) return null;
    player[key] = number(raw.player[key], 0, max);
  }
  if (player.maxHp < 1 || player.power < 0.1 || player.cost < 1) return null;
  player.hp = Math.min(player.maxHp, player.hp);
  return {
    runId: raw.runId,
    heroId: raw.heroId,
    actId: raw.actId,
    encounterIndex: raw.encounterIndex,
    stage: raw.stage,
    player,
    score: integer(raw.score),
    time: number(raw.time),
    totalKills: integer(raw.totalKills, 0, 1000),
    turns: integer(raw.turns),
  };
}
export function sanitizeProfile(raw) {
  const result = defaultProfile();
  if (!raw || typeof raw !== "object") return result;
  result.wallet = integer(raw.wallet);
  for (const id of HERO_IDS)
    if (raw.records?.[id])
      result.records[id] = {
        best: integer(raw.records[id].best),
        wins: integer(raw.records[id].wins),
      };
  for (const item of CULTIVATIONS)
    result.ranks[item.id] = integer(raw.ranks?.[item.id], 0, item.maxRank);
  result.completedActs = ACTS.filter(
    (act) =>
      Array.isArray(raw.completedActs) && raw.completedActs.includes(act.id),
  ).map((act) => act.id);
  // Unlocks are derived from campaign completion, never from a legacy quick-play win.
  result.unlockedHeroes = [
    ...new Set([
      ...result.unlockedHeroes,
      ...ACTS.filter((act) => result.completedActs.includes(act.id)).flatMap(
        (act) => act.unlocks,
      ),
    ]),
  ];
  result.completedRuns = Array.isArray(raw.completedRuns)
    ? raw.completedRuns
        .filter((id) => typeof id === "string" && id.length <= 100)
        .slice(-100)
    : [];
  for (const key of ["sound", "music", "reducedMotion"])
    if (typeof raw.settings?.[key] === "boolean")
      result.settings[key] = raw.settings[key];
  for (const key of ["masterVolume", "musicVolume", "sfxVolume"])
    result.settings[key] = number(raw.settings?.[key], result.settings[key], 1);
  result.checkpoint = sanitizeCheckpoint(raw.checkpoint);
  if (
    result.checkpoint &&
    !result.unlockedHeroes.includes(result.checkpoint.heroId)
  )
    result.checkpoint = null;
  return result;
}
export class SaveStore {
  constructor(storage) {
    this.storage = storage;
    this.warning = "";
    this.readOnly = false;
    this.hadSettings = false;
    this.lastSerialized = null;
  }
  load() {
    try {
      const text = this.storage?.getItem(SAVE_KEY) || null;
      this.lastSerialized = text;
      if (text) {
        const raw = JSON.parse(text);
        if (raw?.version > SAVE_VERSION) {
          this.readOnly = true;
          this.warning =
            "This save is from a newer build. It will not be overwritten.";
          return defaultProfile();
        }
        if (raw?.version !== SAVE_VERSION && raw?.version !== 1)
          throw new Error("Unsupported save version");
        this.hadSettings = !!raw.settings;
        return sanitizeProfile(raw);
      }
      const legacy = JSON.parse(
        this.storage?.getItem("blades-records") || "{}",
      );
      return sanitizeProfile({ records: legacy });
    } catch {
      this.readOnly = true;
      this.warning =
        "Saved data could not be read. Playing is available; the original save will not be overwritten.";
      return defaultProfile();
    }
  }
  save(profile) {
    if (this.readOnly) return false;
    try {
      if (!this.storage) throw new Error("Storage unavailable");
      if (this.storage.getItem(SAVE_KEY) !== this.lastSerialized) {
        this.readOnly = true;
        this.warning =
          "Another tab updated your save. Reload this tab before saving further progress.";
        return false;
      }
      const serialized = JSON.stringify(sanitizeProfile(profile));
      this.storage.setItem(SAVE_KEY, serialized);
      this.lastSerialized = serialized;
      this.warning = "";
      return true;
    } catch {
      this.warning =
        "Progress is held in this session only because local saving is unavailable.";
      return false;
    }
  }
}
