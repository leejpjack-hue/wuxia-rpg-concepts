import { STORY_RIVALS, STORY_ROSTERS } from "./story-rivals.js";
// Card combat tuning is separate from the archived real-time arena rules.
// Quick Play retains its original roster; Story uses named hero rival rosters.
export const DUEL_ROSTERS = {
  vanguard: ["guard", "bandit"],
  "archer-run": ["archer", "venom-adept", "guard"],
  "gate-vanguard": ["pugilist", "bandit", "guard"],
  crossfire: ["archer", "ashen-priest"],
  warden: ["warden"],
  // Act II: the whispering bamboo and the river crossing.
  "bamboo-ambush": ["shadow-assassin", "shadow-assassin"],
  "bamboo-elite": ["shadow-assassin", "venom-adept", "shadow-assassin"],
  "river-skiff": ["skiff-archer", "shadow-assassin"],
  "night-heron": ["night-heron"],
  "canglan-approach": ["canglan-monk", "canglan-monk", "archer"],
  "bell-terrace": ["canglan-monk", "canglan-monk", "archer"],
  "monk-trial": ["canglan-monk", "canglan-monk", "canglan-monk"],
  "windward-cloister": ["shadow-assassin", "archer", "canglan-monk"],
  "lu-bu-rival": ["lu-bu-rival"],
  // Act IV: the Imperial Meridian Citadel finale.
  "citadel-gate": ["jade-sentinel", "jade-sentinel"],
  "meridian-wall": ["archer", "meridian-acolyte", "archer"],
  "inner-guard": ["jade-sentinel", "meridian-acolyte", "jade-sentinel"],
  "citadel-watch": ["meridian-acolyte", "jade-sentinel"],
  sovereign: ["sovereign"],
};

/**
 * Escort bodyguards travel with named legend rivals (`hero-*` kinds) on Story
 * passes. Their roam movement screens the ward: they hold the line between the
 * hero and the legend, so closing on the special character means cutting
 * through the escort first.
 */
export const ESCORT_KINDS = [
  "gate-shield",
  "halberdier",
  "banner-guard",
  "qi-warden",
  "bell-guard",
];
export const isEscortKind = (kind) => ESCORT_KINDS.includes(kind);
export const isNamedRivalKind = (kind) => typeof kind === "string" && kind.startsWith("hero-");

/** Three escorts per guarded encounter, rotating deterministically per pass. */
export function escortSquadFor(encounterId, size = 3) {
  let hash = 7;
  for (const ch of String(encounterId)) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return Array.from({ length: size }, (_, i) => ESCORT_KINDS[(hash + i) % ESCORT_KINDS.length]);
}

const rosterWithEscorts = (roster, runMode, encounterId) =>
  runMode === "campaign" && roster?.some(isNamedRivalKind)
    ? [...roster, ...escortSquadFor(encounterId)]
    : roster;

export const rosterForEncounter = (encounterId, runMode) =>
  rosterWithEscorts(
    (runMode === "campaign" ? STORY_ROSTERS[encounterId] : null) || DUEL_ROSTERS[encounterId],
    runMode,
    encounterId,
  );

export const DUEL_ENEMIES = {
  ...STORY_RIVALS,
  guard: {
    name: "Ashen Swordsman", title: "THE VANGUARD", art: "guard-sprite",
    hp: 68, damage: 12, reward: 120,
    pattern: ["strike", "heavy", "guard"],
  },
  archer: {
    name: "Pass Watcher", title: "THE CROSSFIRE", art: "archer-sprite",
    hp: 62, damage: 14, reward: 150,
    pattern: ["heavy", "strike", "guard"],
  },
  bandit: {
    name: "Scarred Bandit", title: "RED PASS BRIGAND", art: "guard-sprite",
    hp: 60, damage: 11, reward: 130,
    pattern: ["bleed", "strike", "double"],
  },
  "venom-adept": {
    heroId: "venom-adept", name: "The Venom Adept", title: "THE SILENT ADDER", art: "venom-adept-sprite",
    hp: 52, damage: 12, reward: 160,
    pattern: ["poison", "drain", "guard"],
  },
  pugilist: {
    name: "Iron Pugilist", title: "FISTS OF THE GATE", art: "guard-sprite",
    hp: 78, damage: 13, reward: 150,
    pattern: ["concuss", "strike", "heavy"],
  },
  "ashen-priest": {
    name: "Ashen Priest", title: "BANNER CHOIR", art: "warden-sprite",
    hp: 64, damage: 10, reward: 170,
    pattern: ["mend", "poison", "strike"],
  },
  warden: {
    boss: true,
    name: "The Ashen Warden", title: "KEEPER OF THE JADE GATE", art: "warden-sprite",
    hp: 240, damage: 18, reward: 700,
    pattern: ["strike", "heavy", "guard", "heavy"],
  },
  "shadow-assassin": {
    name: "Shadow Assassin", title: "BAMBOO MIST STALKER", art: "shadow-assassin-sprite",
    hp: 44, damage: 15, reward: 140,
    pattern: ["strike", "guard", "heavy"],
  },
  "skiff-archer": {
    name: "Skiff Archer", title: "RIVER VOLLEY", art: "skiff-archer-sprite",
    hp: 36, damage: 16, reward: 160,
    pattern: ["strike", "heavy", "guard"],
  },
  "night-heron": {
    boss: true,
    name: "The Night Heron", title: "THE BLIND ZITHER-ASSASSIN", art: "night-heron-sprite",
    hp: 210, damage: 18, reward: 800,
    pattern: ["poison", "heavy", "strike", "guard", "heavy"],
  },
  "canglan-monk": {
    name: "Canglan Iron Monk", title: "BELL OF THE CLOUDS", art: "canglan-monk-sprite",
    hp: 88, damage: 15, reward: 190,
    pattern: ["guard", "heavy", "concuss", "strike"],
  },
  "lu-bu-rival": {
    boss: true,
    heroId: "lu-bu", name: "Lü Bu", title: "THE FLYING GENERAL", art: "lu-bu-rival-sprite",
    hp: 300, damage: 23, reward: 1000,
    pattern: ["heavy", "double", "guard", "heavy", "strike"],
  },
  // Act IV has dedicated guard art; the Sovereign keeps its existing fallback.
  "jade-sentinel": {
    name: "Jade Sentinel", title: "MOON GATE WATCH", art: "jade-sentinel-sprite",
    hp: 80, damage: 14, reward: 190,
    pattern: ["guard", "bleed", "heavy", "strike"],
  },
  "meridian-acolyte": {
    name: "Meridian Acolyte", title: "QI VORTEX CHOIR", art: "meridian-acolyte-sprite",
    hp: 68, damage: 15, reward: 200,
    pattern: ["drain", "poison", "strike", "guard"],
  },
  sovereign: {
    boss: true,
    name: "The Ashen Sovereign", title: "THRONE OF THE BLOOD MOON", art: "sovereign-sprite",
    hp: 280, damage: 18, reward: 1500,
    pattern: ["heavy", "poison", "double", "strike", "heavy"],
  },
  // Escort bodyguards: light duel stats (they are many; their roam movement,
  // not their duels, is what shields the named legend rivals).
  "gate-shield": {
    escort: true,
    name: "Gate Shieldbearer", title: "SWORN WALL OF THE LEGENDS", art: "guard-sprite",
    hp: 60, damage: 7, reward: 90,
    pattern: ["guard", "strike", "guard"],
  },
  halberdier: {
    escort: true,
    name: "Ashen Halberdier", title: "VANGUARD HALBERD", art: "warden-sprite",
    hp: 46, damage: 9, reward: 110,
    pattern: ["heavy", "strike", "guard"],
  },
  "banner-guard": {
    escort: true,
    name: "Banner Swornshield", title: "OATH OF THE GREY BANNER", art: "jade-sentinel-sprite",
    hp: 52, damage: 7, reward: 100,
    pattern: ["guard", "strike", "guard"],
  },
  "qi-warden": {
    escort: true,
    name: "Meridian Qi-Warden", title: "CHANNEL SCREEN", art: "meridian-acolyte-sprite",
    hp: 44, damage: 8, reward: 100,
    pattern: ["drain", "guard", "strike"],
  },
  "bell-guard": {
    escort: true,
    name: "Bell Custodian", title: "CLOISTER SCREEN", art: "canglan-monk-sprite",
    hp: 54, damage: 8, reward: 100,
    pattern: ["concuss", "guard", "strike"],
  },
};

export const HERO_TECHNIQUES = {
  "zhao-yun": { multiplier: 2, protect: 0.5, heal: 0, stun: false,
    description: "Deal double damage. Halve the enemy's reply." },
  "lu-zhishen": { multiplier: 1.6, protect: 0, heal: 10, stun: true,
    description: "Deal 1.6× damage, recover 10 health, and stun the enemy." },
  "hu-sanniang": { multiplier: 2.4, protect: 0, heal: 8, stun: false,
    description: "Deal 2.4× damage and recover 8 health." },
  "lu-bu": { multiplier: 2.8, protect: 0, heal: 0, stun: false,
    description: "Deal 2.8× damage through the enemy's guard." },
  "guan-yu": { multiplier: 2.6, protect: 0.3, heal: 0, stun: false,
    description: "Deal 2.6× damage and blunt the reply by 30%." },
  "wu-song": { multiplier: 2.1, protect: 0, heal: 0, stun: true,
    description: "Deal 2.1× damage and stun the enemy." },
  "mu-guiying": { multiplier: 2, protect: 0.35, heal: 5, stun: false,
    description: "Deal 2× damage, blunt the reply by 35%, and recover 5 health." },
  "liang-hongyu": { multiplier: 2.3, protect: 0, heal: 6, stun: false,
    description: "Deal 2.3× damage and recover 6 health." },
  "nie-yinniang": { multiplier: 1.8, protect: 0.6, heal: 0, stun: false,
    description: "Deal 1.8× damage and evade 60% of the reply." },
  "sun-shangxiang": { multiplier: 2.2, protect: 0.2, heal: 4, stun: false,
    description: "Deal 2.2× damage, blunt the reply by 20%, and recover 4 health." },
  "gu-dasao": { multiplier: 2.4, protect: 0, heal: 0, stun: true,
    description: "Deal 2.4× damage and stun the enemy." },
  "qin-liangyu": { multiplier: 1.7, protect: 0.45, heal: 4, stun: false,
    description: "Deal 1.7× damage, blunt the reply by 45%, and recover 4 health." },
  "bao-sanniang": { multiplier: 2.0, protect: 0.25, heal: 4, stun: false,
    description: "Deal 2× damage, blunt the reply by 25%, and recover 4 health." },
  "dian-wei": { multiplier: 2.5, protect: 0, heal: 0, stun: true,
    description: "Deal 2.5× damage and stun the enemy." },
  "yang-zhi": { multiplier: 2.1, protect: 0.3, heal: 3, stun: false,
    description: "Deal 2.1× damage, blunt the reply by 30%, and recover 3 health." },
  "jia-zheng": { multiplier: 1.8, protect: 0.4, heal: 0, stun: false,
    description: "Deal 1.8× damage and blunt the reply by 40%." },
  "jia-yucun": { multiplier: 1.9, protect: 0.25, heal: 0, stun: false,
    description: "Deal 1.9× damage and blunt the reply by 25%." },
  "bao-zheng": { multiplier: 2.2, protect: 0.3, heal: 0, stun: false,
    description: "Deal 2.2× damage and blunt the reply by 30%." },
  "di-renjie": { multiplier: 2.0, protect: 0.35, heal: 0, stun: false,
    description: "Deal 2× damage and blunt the reply by 35%." },
  "kuang-zhong": { multiplier: 1.8, protect: 0.45, heal: 3, stun: false,
    description: "Deal 1.8× damage, blunt the reply by 45%, and recover 3 health." },
  "fan-jin": { multiplier: 1.7, protect: 0.2, heal: 6, stun: false,
    description: "Deal 1.7× damage, blunt the reply by 20%, and recover 6 health." },
  "lu-su": { multiplier: 1.8, protect: 0.4, heal: 4, stun: false,
    description: "Deal 1.8× damage, blunt the reply by 40%, and recover 4 health." },
  "xun-yu": { multiplier: 1.9, protect: 0.45, heal: 0, stun: false,
    description: "Deal 1.9× damage and blunt the reply by 45%." },
  "song-jiang": { multiplier: 2.0, protect: 0.3, heal: 5, stun: false,
    description: "Deal 2× damage, blunt the reply by 30%, and recover 5 health." },
  "wu-yong": { multiplier: 1.8, protect: 0.55, heal: 0, stun: false,
    description: "Deal 1.8× damage and evade 55% of the reply." },
  "jia-yuanchun": { multiplier: 1.7, protect: 0.4, heal: 5, stun: false,
    description: "Deal 1.7× damage, blunt the reply by 40%, and recover 5 health." },
  "xue-baochai": { multiplier: 1.8, protect: 0.4, heal: 4, stun: false,
    description: "Deal 1.8× damage, blunt the reply by 40%, and recover 4 health." },
  "lin-daiyu": { multiplier: 1.9, protect: 0.2, heal: 7, stun: false,
    description: "Deal 1.9× damage, blunt the reply by 20%, and recover 7 health." },
  "wang-xifeng": { multiplier: 2.2, protect: 0.2, heal: 3, stun: false,
    description: "Deal 2.2× damage, blunt the reply by 20%, and recover 3 health." },
  "diaochan": { multiplier: 1.8, protect: 0.55, heal: 0, stun: false,
    description: "Deal 1.8× damage and evade 55% of the reply." },
  "yang-yuhuan": { multiplier: 1.8, protect: 0.25, heal: 6, stun: false,
    description: "Deal 1.8× damage, blunt the reply by 25%, and recover 6 health." },
  "zhen-huan": { multiplier: 1.9, protect: 0.5, heal: 0, stun: false,
    description: "Deal 1.9× damage and evade 50% of the reply." },
  "empress-yixiu": { multiplier: 1.8, protect: 0.5, heal: 3, stun: false,
    description: "Deal 1.8× damage, blunt the reply by 50%, and recover 3 health." },
  "hua-fei": { multiplier: 2.2, protect: 0, heal: 0, stun: true,
    description: "Deal 2.2× damage and stun the enemy." },
  "zhao-min": { multiplier: 2.1, protect: 0.25, heal: 0, stun: false,
    description: "Deal 2.1× damage and blunt the reply by 25%." },
  "venom-adept": { multiplier: 2, protect: 0.2, heal: 5, stun: false,
    description: "Deal 2× damage, blunt the reply by 20%, and recover 5 health." },
};
