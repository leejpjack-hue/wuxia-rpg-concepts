// Card combat tuning is separate from the archived real-time arena rules.
export const DUEL_ROSTERS = {
  vanguard: ["guard", "guard"],
  crossfire: ["archer", "guard"],
  warden: ["warden"],
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
