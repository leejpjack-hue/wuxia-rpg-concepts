// Card combat tuning is separate from the archived real-time arena rules.
export const DUEL_ROSTERS = {
  vanguard: ["guard", "guard"],
  crossfire: ["archer", "guard"],
  warden: ["warden"],
  // Act II stays behind bamboo-crossing.available === false.
  "bamboo-ambush": ["shadow-assassin", "shadow-assassin"],
  "river-skiff": ["skiff-archer", "shadow-assassin"],
  "night-heron": ["night-heron"],
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
  warden: {
    name: "The Ashen Warden", title: "KEEPER OF THE JADE GATE", art: "warden-sprite",
    hp: 240, damage: 18, reward: 700,
    pattern: ["strike", "heavy", "guard", "heavy"],
  },
  "shadow-assassin": {
    name: "Shadow Assassin", title: "BAMBOO MIST STALKER", art: "guard-sprite",
    hp: 44, damage: 15, reward: 140,
    pattern: ["strike", "guard", "heavy"],
  },
  "skiff-archer": {
    name: "Skiff Archer", title: "RIVER VOLLEY", art: "archer-sprite",
    hp: 36, damage: 16, reward: 160,
    pattern: ["strike", "heavy", "guard"],
  },
  "night-heron": {
    name: "The Night Heron", title: "THE BLIND ZITHER-ASSASSIN", art: "warden-sprite",
    hp: 95, damage: 24, reward: 800,
    pattern: ["heavy", "strike", "guard", "heavy"],
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
};
