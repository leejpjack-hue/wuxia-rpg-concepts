import { HEROES } from "./heroes.js";

/**
 * Expansion content: hero signature actions, oath bonds, weather,
 * pass merchants, enemy special attacks, and the spare/judgement config.
 * All systems are data-driven; domain modules consume these tables.
 */

/** Hero signature actions: a fifth duel action, Flow-gated (key 5). */
export const SIGNATURES = {
  "zhao-yun": { name: "Scale Guard", cn: "龍鱗", flow: 25, archetype: "counter",
    power: 0.85, damage: 0.6, description: "Brace behind the blade: block 85% of the reply and cut back for 60% damage." },
  "lu-zhishen": { name: "Zen Roar", cn: "禪喝", flow: 25, archetype: "focusGuard",
    power: 0.8, heal: 6, description: "Bellow: guard 80%, recover 6 health, and scatter the rival's gathering special." },
  "hu-sanniang": { name: "Crimson Chain", cn: "紅連", flow: 25, archetype: "bleedCut",
    damage: 0.9, bleed: { turns: 2, amount: 4 }, description: "A linked pair of cuts: 90% damage and a bleeding wound (4 over 2 turns)." },
  "lu-bu": { name: "Halberd Sweep", cn: "戟掃", flow: 25, archetype: "execute",
    damage: 1.1, bonus: 0.8, description: "110% damage, +80% more against bleeding or poisoned rivals." },
  "guan-yu": { name: "Spring Reading", cn: "春秋", flow: 25, archetype: "charged",
    charged: 1.6, power: 0.3, description: "Read the ledger: your next Strike deals 160% and the reply is blunted 70%." },
  "wu-song": { name: "Tiger Pin", cn: "虎按", flow: 25, archetype: "drainStrike",
    damage: 0.8, drain: 15, description: "80% damage that wrestles away 15 of the rival's intent as Flow." },
  "mu-guiying": { name: "Rally Signal", cn: "令旗", flow: 25, archetype: "cleanse",
    heal: 10, refreshAssist: true, description: "Clear bleed and poison, recover 10 health, and ready the party assist again." },
  "liang-hongyu": { name: "Drumroll", cn: "連鼓", flow: 25, archetype: "doubleSig",
    damage: 0.7, hits: 2, description: "Two beats of the dao: a pair of 70% strikes." },
  "nie-yinniang": { name: "Vanish", cn: "霧消", flow: 25, archetype: "vanish",
    bleed: { turns: 2, amount: 3 }, description: "Slip from the reply entirely (no damage) and leave a bleeding cut behind." },
  "sun-shangxiang": { name: "Bowstring Trap", cn: "弦罠", flow: 25, archetype: "drainStrike",
    damage: 0.8, drain: 12, description: "80% damage; the snapped string returns 12 Flow to you." },
  "gu-dasao": { name: "Cleaver Rush", cn: "乱斬", flow: 25, archetype: "bleedCut",
    damage: 0.9, bleed: { turns: 2, amount: 4 }, description: "Kitchen ferocity: 90% damage and a bleeding wound (4 over 2 turns)." },
  "qin-liangyu": { name: "Shaft Wall", cn: "白杆", flow: 25, archetype: "counter",
    power: 0.85, damage: 0.5, heal: 5, description: "Plant the white shaft: block 85%, stab for 50%, recover 5 health." },
  "bao-sanniang": { name: "Jade Lunge", cn: "翠突", flow: 25, archetype: "charged",
    charged: 1.5, power: 0.25, description: "Wind the spear: your next Strike deals 150% and the reply is blunted 75%." },
  "dian-wei": { name: "Twin Iron", cn: "双鉄", flow: 25, archetype: "doubleSig",
    damage: 0.75, hits: 2, description: "Both halberds at once: a pair of 75% strikes." },
  "yang-zhi": { name: "Marked Cut", cn: "青斬", flow: 25, archetype: "execute",
    damage: 1.0, bonus: 0.8, power: 0.2, description: "100% damage, +80% against bleeding or poisoned rivals, reply blunted 20%." },
  "venom-adept": { name: "Adder's Coil", cn: "蛇纏", flow: 25, archetype: "bleedCut",
    damage: 0.85, bleed: { turns: 3, amount: 3 }, description: "85% damage and a coiling venom wound (3 over 3 turns)." },
};
export const signatureById = (heroId) => SIGNATURES[heroId] || null;

/** Oath bonds: pairs of heroes whose assists hit harder when fielded together. */
export const OATHS = [
  { heroes: ["zhao-yun", "guan-yu"], id: "changshan-vow", name: "Changshan Vow", cn: "常山之誓",
    assistMultiplier: 2, assistFlow: 10, note: "Assists deal double damage and grant 10 Flow." },
  { heroes: ["lu-zhishen", "wu-song"], id: "ridge-brothers", name: "Ridge Brothers", cn: "岡上兄弟",
    assistMultiplier: 2, assistFlow: 8, note: "Assists deal double damage and grant 8 Flow." },
  { heroes: ["hu-sanniang", "bao-sanniang"], id: "twin-moons", name: "Twin Moons", cn: "双月",
    assistMultiplier: 2, assistFlow: 8, note: "Assists deal double damage and grant 8 Flow." },
  { heroes: ["mu-guiying", "liang-hongyu"], id: "war-sisters", name: "War Sisters", cn: "陣姉妹",
    assistMultiplier: 2, assistFlow: 12, note: "Assists deal double damage and grant 12 Flow." },
  { heroes: ["nie-yinniang", "sun-shangxiang"], id: "silent-strings", name: "Silent Strings", cn: "無音の弦",
    assistMultiplier: 2, assistFlow: 10, note: "Assists deal double damage and grant 10 Flow." },
  { heroes: ["dian-wei", "yang-zhi"], id: "garrison-wall", name: "Garrison Wall", cn: "守壁",
    assistMultiplier: 2, assistFlow: 8, note: "Assists deal double damage and grant 8 Flow." },
];
export function oathFor(partyIds = []) {
  const field = new Set(partyIds);
  return OATHS.find((oath) => oath.heroes.every((id) => field.has(id))) || null;
}

/** Weather drawn per run (seeded from the run id): modifies the pass. */
export const WEATHERS = [
  { id: "clear", cn: "晴", name: "Clear", weight: 4 },
  { id: "rain", cn: "雨", name: "Rain", weight: 2,
    aggroMultiplier: 0.7, shallowsFactor: 0.55,
    note: "Archers see shorter (−30% watch range); shallows drag harder." },
  { id: "night", cn: "夜", name: "Night", weight: 2,
    sneakAggro: 180, sneakMasterAggro: 260, wanderScale: 0.8,
    note: "Sneaking hides you closer than ever; rivals patrol tighter." },
  { id: "fog", cn: "霧", name: "Fog", weight: 2,
    wanderScale: 1.45,
    note: "Rivals drift wide off their posts in the fog." },
];
export function weatherForRun(runId) {
  let seed = 0;
  for (const char of String(runId)) seed = (seed * 31 + char.charCodeAt(0)) >>> 0;
  seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
  const total = WEATHERS.reduce((sum, item) => sum + item.weight, 0);
  let roll = seed % total;
  for (const weather of WEATHERS) {
    roll -= weather.weight;
    if (roll < 0) return weather;
  }
  return WEATHERS[0];
}

/** Pass merchant stock: run-scoped purchases paid from run renown (score). */
export const SHOP_STOCK = [
  { id: "curio", name: "Sealed curio box", cn: "奇妙な箱", price: 240,
    description: "Take one curio of the merchant's three." },
  { id: "tea", name: "Extra pot of tea", cn: "茶壶", price: 180,
    description: "Carry a second healing tea pot for the rest of the run." },
  { id: "vitality", name: "Iron body salve", cn: "鉄身薬", price: 200,
    description: "+20 max health for the rest of the run." },
  { id: "incense", name: "Oath incense", cn: "香", price: 150,
    description: "The party assist can strike twice per duel for the rest of the run." },
];
export const shopItemById = (id) => SHOP_STOCK.find((item) => item.id === id);

/**
 * Enemy special attacks: rivals gather focus each exchange; when full, the next
 * intent becomes their telegraphed special. Hero techniques (and ambushes)
 * break the gathering. scale multiplies rival damage; status fields reuse the
 * intent spec shapes from card-combat.
 */
export const ENEMY_SPECIALS = {
  guard:         { name: "Banner Cleave", scale: 2.2, focus: 3 },
  archer:        { name: "Volley Storm", scale: 1.0, hits: 2, focus: 3 },
  bandit:        { name: "Red Ruin", scale: 2.3, heroBleed: { turns: 2, amount: 4 }, focus: 3 },
  "venom-adept": { name: "Adder's Kiss", scale: 2.0, heroPoison: { turns: 3, amount: 4 }, focus: 3 },
  pugilist:      { name: "Iron Bell", scale: 2.4, stun: true, focus: 3 },
  "ashen-priest":{ name: "Choir of Ash", scale: 1.6, mend: 15, focus: 3 },
  "shadow-assassin": { name: "Mist Execution", scale: 2.6, focus: 3 },
  "skiff-archer":{ name: "River Volley", scale: 1.0, hits: 2, focus: 3 },
  warden:        { name: "Gatebreaker", scale: 2.4, focus: 4 },
  "night-heron": { name: "Silken Requiem", scale: 2.3, heroPoison: { turns: 3, amount: 3 }, drain: 15, focus: 4 },
  "canglan-monk": { name: "Cloud Bell", scale: 1.8, focus: 4 },
  "lu-bu-rival": { name: "Skyfall Halberd", scale: 2.4, focus: 4 },
  "jade-sentinel": { name: "Moon Gate Slam", scale: 2.2, heroBleed: { turns: 2, amount: 3 }, focus: 3 },
  "meridian-acolyte": { name: "Vortex Palm", scale: 2.0, drain: 15, focus: 3 },
  sovereign:     { name: "Blood Moon Edict", scale: 2.3, heroPoison: { turns: 2, amount: 3 }, focus: 4 },
};
const heroSpecials = Object.fromEntries(HEROES.filter(hero => !hero.hidden).map(hero => {
  const sig = SIGNATURES[hero.id];
  return [`hero-${hero.id}`, {
    name: hero.skill, focus: 3, scale: sig.archetype === "execute" ? 2.4 : 1.8,
    ...(sig.bleed ? { heroBleed: sig.bleed } : {}),
    ...(sig.drain ? { drain: sig.drain } : {}),
    ...(sig.heal ? { mend: sig.heal } : {}),
    ...(sig.hits ? { hits: sig.hits, scale: .9 } : {}),
  }];
}));
export const specialFor = (kind) => ENEMY_SPECIALS[kind] || heroSpecials[kind] || null;

/** Judgement: elites (never bosses) can be spared or finished. */
export const JUDGEMENT = {
  reputations: { people: "the people", ashen: "the Ashen Banner" },
  peopleShopDiscount: 20, // percent, at reputation >= 20
  peopleEventBonus: 10,   // extra event heal at reputation >= 20
  ashenEliteBonus: 30,   // extra elite renown at reputation >= 20
  spareGain: 10,
  executeGain: 10,
  executeScoreBonus: 50,
  /** Sparing this rival kind in an elite node recruits them to the roster. */
  recruitable: "venom-adept",
};
