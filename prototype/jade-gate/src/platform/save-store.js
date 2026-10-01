import { HEROES, HERO_IDS } from "../content/heroes.js";
import { ACTS, CULTIVATIONS, actById } from "../content/campaign.js";
import { CURIO_IDS } from "../content/curios.js";
import { MERIDIAN_NODES, migrateRanks } from "../content/meridians.js";
export const SAVE_VERSION = 2;
export const SAVE_KEY = "blades-profile-v2";
const number = (v, fallback = 0, max = 1e8) =>
  Number.isFinite(v) ? Math.max(0, Math.min(max, v)) : fallback;
const integer = (v, fallback = 0, max = 1e8) =>
  Math.floor(number(v, fallback, max));
export const defaultProfile = () => ({
  version: SAVE_VERSION,
  settings: {
    language: "ja",
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
  meridian: [],
  earnedHeroes: [],
  codex: { heroes: {}, rivals: {}, curios: {} },
  reputation: { people: 0, ashen: 0 },
  recruits: [],
  wander: { bestStage: 0, runs: 0 },
  unlockedHeroes: HEROES.filter((hero) => !hero.quickPlayOnly && hero.id !== "lu-bu").map((hero) => hero.id),
  completedActs: [],
  completedRuns: [],
  checkpoint: null,
  // Last Quick Play party. Cosmetic followers only; never an unlock source.
  lastQuickParty: null,
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
/** `{ lead, followers[2] }` of distinct known heroes, or null. Does not grant unlocks. */
export function sanitizeQuickParty(raw) {
  const followers = Array.isArray(raw?.followers) ? raw.followers : null;
  if (typeof raw?.lead !== "string" || !followers || followers.length !== 2)
    return null;
  const ids = [raw.lead, followers[0], followers[1]];
  if (ids.some((id) => typeof id !== "string" || !HERO_IDS.includes(id)))
    return null;
  if (new Set(ids).size !== 3) return null;
  return { lead: ids[0], followers: [ids[1], ids[2]] };
}
export function sanitizeCheckpoint(raw) {
  if (!raw || typeof raw !== "object" || !HERO_IDS.includes(raw.heroId))
    return null;
  const act = actById(raw.actId);
  const stages = [
    "arrival",
    "combat",
    "map",
    "upgrade",
    "warden-intro",
    "warden-fall",
    "waystation",
    "bamboo-arrival",
    "night-heron-intro",
    "night-heron-fall",
    "heron-intro",
    "heron-fall",
    "canglan-arrival",
    "lu-bu-rival-intro",
    "lu-bu-rival-fall",
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
    // Run curios and branching-map progress ride along on the checkpoint.
    curios: Array.isArray(raw.curios)
      ? [...new Set(raw.curios)].filter((id) => CURIO_IDS.includes(id)).slice(0, 8)
      : [],
    map:
      act.map &&
      raw.map &&
      Number.isInteger(raw.map.row) &&
      Array.isArray(raw.map.cleared)
        ? {
            row: Math.max(0, Math.min(raw.map.row, act.map.rows.length - 1)),
            cleared: raw.map.cleared
              .filter((node) => typeof node === "string" && node.length <= 40)
              .slice(0, 12),
          }
        : null,
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
  // Meridian tree: legacy flat ranks migrate onto their vessel points.
  result.meridian = [
    ...new Set([
      ...migrateRanks(raw.ranks),
      ...(Array.isArray(raw.meridian)
        ? raw.meridian.filter(
            (id) =>
              typeof id === "string" &&
              MERIDIAN_NODES.some((node) => node.id === id),
          )
        : []),
    ]),
  ].slice(0, MERIDIAN_NODES.length);
  result.completedActs = ACTS.filter(
    (act) =>
      Array.isArray(raw.completedActs) && raw.completedActs.includes(act.id),
  ).map((act) => act.id);
  // Mid-Act III rescues are permanent; older saves derive Act I/II rewards on load.
  result.earnedHeroes = Array.isArray(raw.earnedHeroes)
    ? [...new Set(raw.earnedHeroes)].filter((id) => ["mu-guiying", "liang-hongyu", "nie-yinniang"].includes(id))
    : [];
  result.unlockedHeroes = [
    ...new Set([
      ...result.unlockedHeroes,
      ...ACTS.filter((act) => result.completedActs.includes(act.id)).flatMap(
        (act) => act.unlocks,
      ),
      ...result.earnedHeroes,
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
  if (["ja", "en"].includes(raw.settings?.language))
    result.settings.language = raw.settings.language;
  for (const key of ["masterVolume", "musicVolume", "sfxVolume"])
    result.settings[key] = number(raw.settings?.[key], result.settings[key], 1);
  result.checkpoint = sanitizeCheckpoint(raw.checkpoint);
  if (
    result.checkpoint &&
    !result.unlockedHeroes.includes(result.checkpoint.heroId)
  )
    result.checkpoint = null;
  result.lastQuickParty = sanitizeQuickParty(raw.lastQuickParty);
  // Expansion profile state: codex sightings, sect reputation, recruits, wander records.
  for (const group of ["heroes", "rivals", "curios"])
    result.codex[group] = Object.fromEntries(
      Object.entries(raw.codex?.[group] || {})
        .filter(([id, seen]) => typeof id === "string" && id.length <= 40 && seen)
        .slice(0, 60),
    );
  result.reputation = {
    people: integer(raw.reputation?.people, 0, 10000),
    ashen: integer(raw.reputation?.ashen, 0, 10000),
  };
  result.recruits = Array.isArray(raw.recruits)
    ? [...new Set(raw.recruits)].filter((id) => id === "venom-adept").slice(0, 8)
    : [];
  result.wander = {
    bestStage: integer(raw.wander?.bestStage, 0, 100000),
    runs: integer(raw.wander?.runs, 0, 100000),
  };
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
