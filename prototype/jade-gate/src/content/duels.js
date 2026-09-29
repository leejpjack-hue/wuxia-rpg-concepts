// Card combat tuning is separate from the archived real-time arena rules.
// Roster totals are kept stable across reshuffles so run stats stay comparable.
export const DUEL_ROSTERS = {
  vanguard: ["guard", "bandit"],
  "archer-run": ["archer", "venom-adept", "guard"],
  "gate-vanguard": ["pugilist", "bandit", "guard"],
  crossfire: ["archer", "ashen-priest"],
  warden: ["warden"],
  // Act II: the whispering bamboo and the river crossing.
  "bamboo-ambush": ["shadow-assassin", "shadow-assassin"],
  "bamboo-elite": ["shadow-assassin", "shadow-assassin", "shadow-assassin"],
  "river-skiff": ["skiff-archer", "shadow-assassin"],
  "night-heron": ["night-heron"],
  "canglan-approach": ["canglan-monk", "canglan-monk", "archer"],
  "bell-terrace": ["canglan-monk", "canglan-monk", "archer"],
  "monk-trial": ["canglan-monk", "canglan-monk", "canglan-monk"],
  "windward-cloister": ["shadow-assassin", "archer", "canglan-monk"],
  "lu-bu-rival": ["lu-bu-rival"],
};

export const DUEL_ENEMIES = {
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
    name: "Venom Adept", title: "THE SILENT ADDER", art: "archer-sprite",
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
    name: "Lü Bu", title: "THE FLYING GENERAL", art: "lu-bu-rival-sprite",
    hp: 300, damage: 23, reward: 1000,
    pattern: ["heavy", "double", "guard", "heavy", "strike"],
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
};
