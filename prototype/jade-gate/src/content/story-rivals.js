import { HEROES } from "./heroes.js";

/** Story role is fixed, independent of legacy unlock/recruit save data. */
export const STORY_HERO_IDS = ["zhao-yun", "lu-zhishen", "hu-sanniang"];
export const isStoryHero = id => STORY_HERO_IDS.includes(id);

// A hero rival carries its source identity and sprite, but uses enemy balance.
const patterns = {
  "guan-yu": ["heavy", "guard", "strike"], "gu-dasao": ["bleed", "strike", "double"],
  "qin-liangyu": ["guard", "strike", "heavy"], "wu-song": ["concuss", "strike", "heavy"],
  "sun-shangxiang": ["double", "guard", "strike"], "bao-sanniang": ["strike", "guard", "heavy"],
  "mu-guiying": ["guard", "heavy", "mend", "strike"], "liang-hongyu": ["double", "strike", "guard"],
  "nie-yinniang": ["bleed", "guard", "heavy"], "dian-wei": ["double", "guard", "heavy"],
  "yang-zhi": ["heavy", "bleed", "guard"],
};
export const STORY_RIVALS = Object.fromEntries(HEROES.filter(hero =>
  !hero.hidden && !isStoryHero(hero.id) && !["lu-bu", "venom-adept"].includes(hero.id)
).map(hero => [`hero-${hero.id}`, {
  heroId: hero.id, name: hero.name, title: hero.title,
  art: `${hero.id}-sprite`, portrait: hero.id,
  // Named legends anchor their areas: clearly above the grunts, below bosses.
  hp: Math.round(hero.hp * .85), damage: Math.round(hero.damage * .5), reward: 170,
  pattern: patterns[hero.id],
}]));

/** Named opponents on required Story nodes; alternative branches retain variety. */
export const STORY_ROSTERS = {
  vanguard: ["hero-guan-yu", "hero-gu-dasao"],
  "archer-run": ["archer", "venom-adept", "guard"],
  "gate-vanguard": ["hero-qin-liangyu", "venom-adept", "pugilist"],
  crossfire: ["archer", "hero-yang-zhi"],
  "bamboo-ambush": ["hero-wu-song", "hero-sun-shangxiang", "hero-qin-liangyu"],
  "bamboo-elite": ["hero-bao-sanniang", "shadow-assassin", "venom-adept"],
  "canglan-approach": ["hero-mu-guiying", "hero-liang-hongyu", "hero-bao-sanniang"],
  "bell-terrace": ["canglan-monk", "hero-liang-hongyu", "archer"],
  "monk-trial": ["canglan-monk", "hero-mu-guiying", "hero-liang-hongyu"],
  "windward-cloister": ["hero-nie-yinniang", "archer", "hero-yang-zhi"],
  "citadel-gate": ["hero-dian-wei", "jade-sentinel", "venom-adept"],
};
