/**
 * Act I and Act II Card Duel content and encounter rosters.
 *
 * Act I:
 * - vanguard: 2 Ashen Guards
 * - crossfire: 1 Perimeter Archer + 1 Ashen Guard
 * - warden: The Ashen Warden
 *
 * Act II (behind the bamboo-crossing gate):
 * - bamboo-ambush: Shadow Assassins
 * - river-skiff: Skiff Archer + Shadow Assassin
 * - night-heron: The Night Heron (blind zither-assassin)
 */

export const DUEL_ENEMIES = {
  // Act I
  guard: {
    id: "guard",
    name: "Ashen Guard",
    title: "Frontier Sentry",
    cn: "灰旗前鋒",
    sprite: "guard-sprite",
    hp: 38,
    maxHp: 38,
    damage: 12,
    moves: [
      { name: "Iron Sweep", damage: 12, intent: "attack", detail: "Standard spear slash" },
      { name: "Shield Brace", damage: 0, intent: "guard", detail: "Raises iron buckler (blocks 50%)" },
      { name: "Vanguard Thrust", damage: 16, intent: "heavy", detail: "Committed forward thrust" },
    ],
  },
  archer: {
    id: "archer",
    name: "Perimeter Archer",
    title: "Ashen Sharpshooter",
    cn: "關防弓手",
    sprite: "archer-sprite",
    hp: 30,
    maxHp: 30,
    damage: 14,
    moves: [
      { name: "Aimed Shot", damage: 14, intent: "attack", detail: "Direct shaft to the chest" },
      { name: "Arrow Flurry", damage: 18, intent: "heavy", detail: "Rapid twin release" },
      { name: "Tactical Step", damage: 6, intent: "guard", detail: "Disengaging volley" },
    ],
  },
  warden: {
    id: "warden",
    name: "The Ashen Warden",
    title: "Border Pass Commander",
    cn: "守關統領 · 崔玄",
    sprite: "warden-sprite",
    hp: 80,
    maxHp: 80,
    damage: 20,
    boss: true,
    moves: [
      { name: "Polearm Sweep", damage: 20, intent: "heavy", detail: "Wide cleaving arc" },
      { name: "Ashen Ward", damage: 0, intent: "guard", detail: "Iron poise stance" },
      { name: "Piercing Thrust", damage: 25, intent: "heavy", detail: "Lethal armor-piercing drive" },
    ],
  },

  // Act II — behind the gate
  "shadow-assassin": {
    id: "shadow-assassin",
    name: "Shadow Assassin",
    title: "Bamboo Mist Stalker",
    cn: "幽篁影刺客",
    sprite: "guard-sprite",
    hp: 44,
    maxHp: 44,
    damage: 15,
    moves: [
      { name: "Mist Lunge", damage: 15, intent: "attack", detail: "Sudden strike through the fog" },
      { name: "Shadow Cloak", damage: 0, intent: "guard", detail: "Dissolves into bamboo mist" },
      { name: "Twin Fang Strike", damage: 22, intent: "heavy", detail: "Dual-blade puncture" },
    ],
  },
  "skiff-archer": {
    id: "skiff-archer",
    name: "Skiff Archer",
    title: "River Volley Sniper",
    cn: "舟楫弓手",
    sprite: "archer-sprite",
    hp: 36,
    maxHp: 36,
    damage: 16,
    moves: [
      { name: "River Volley", damage: 16, intent: "attack", detail: "Bowshot fired across water" },
      { name: "Barbed Arrow", damage: 20, intent: "heavy", detail: "Piercing barbed flight" },
      { name: "Reeds Concealment", damage: 8, intent: "guard", detail: "Shoots from reed cover" },
    ],
  },
  "night-heron": {
    id: "night-heron",
    name: "The Night Heron",
    title: "The Blind Zither-Assassin",
    cn: "夜鷺娘子",
    sprite: "warden-sprite",
    hp: 95,
    maxHp: 95,
    damage: 24,
    boss: true,
    moves: [
      { name: "Sonic Shockwave", damage: 24, intent: "heavy", detail: "Rippling concentric soundwave arc" },
      { name: "Razor-Wire Snare", damage: 18, intent: "attack", detail: "Glinting wire drawn taut across shallows" },
      { name: "Zither Resonator", damage: 0, intent: "guard", detail: "Harmonic barrier deflecting steel" },
      { name: "Severing Chord", damage: 30, intent: "heavy", detail: "All strings strummed with lethal force" },
    ],
  },
};

// Aliases for user convenience and readability
DUEL_ENEMIES["shadow assassin"] = DUEL_ENEMIES["shadow-assassin"];
DUEL_ENEMIES["skiff archer"] = DUEL_ENEMIES["skiff-archer"];
DUEL_ENEMIES["Night Heron"] = DUEL_ENEMIES["night-heron"];

export const DUEL_ROSTERS = {
  // Act I
  vanguard: ["guard", "guard"],
  crossfire: ["archer", "guard"],
  warden: ["warden"],

  // Act II
  "bamboo-ambush": ["shadow-assassin", "shadow-assassin"],
  "river-skiff": ["skiff-archer", "shadow-assassin"],
  "night-heron": ["night-heron"],
};

export const HERO_TECHNIQUES = {
  "zhao-yun": {
    name: "Dragon Rush",
    cn: "蒼龍破",
    cost: 40,
    multiplier: 2.0,
    replyFactor: 0.5,
    detail: "Double damage · Halves the rival's reply",
  },
  "lu-zhishen": {
    name: "Mountain Bell",
    cn: "梵鐘撼地",
    cost: 40,
    multiplier: 1.6,
    heal: 10,
    stunReply: true,
    detail: "1.6× damage · +10 Health · Stuns rival reply",
  },
  "hu-sanniang": {
    name: "Crimson Waltz",
    cn: "血月旋舞",
    cost: 40,
    multiplier: 2.4,
    heal: 8,
    detail: "2.4× damage · +8 Health",
  },
  "lu-bu": {
    name: "Skybreaker",
    cn: "破天裂壁",
    cost: 40,
    multiplier: 2.8,
    detail: "2.8× damage · Massive guard-breaking force",
  },
};
