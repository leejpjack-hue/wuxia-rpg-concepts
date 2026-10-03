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

/** Act V — the otherworld: the twenty hidden legends fight as rivals.
 * Each was torn out of their own story by the edict's shards; a duel loss
 * snaps the bond and frees them. Same balance band as pass legends. */
const otherworldPatterns = {
  "jia-zheng": ["guard", "strike", "heavy"],
  "jia-yucun": ["bleed", "strike", "guard"],
  "bao-zheng": ["heavy", "strike", "guard"],
  "di-renjie": ["strike", "guard", "double"],
  "kuang-zhong": ["guard", "heavy", "strike"],
  "fan-jin": ["concuss", "strike", "guard"],
  "lu-su": ["guard", "mend", "strike"],
  "xun-yu": ["guard", "strike", "heavy"],
  "song-jiang": ["strike", "guard", "mend"],
  "wu-yong": ["drain", "guard", "strike"],
  "jia-yuanchun": ["guard", "strike", "double"],
  "xue-baochai": ["guard", "strike", "bleed"],
  "lin-daiyu": ["bleed", "guard", "strike"],
  "wang-xifeng": ["double", "bleed", "strike"],
  diaochan: ["double", "guard", "strike"],
  "yang-yuhuan": ["concuss", "strike", "guard"],
  "zhen-huan": ["drain", "guard", "strike"],
  "empress-yixiu": ["guard", "drain", "heavy"],
  "hua-fei": ["heavy", "strike", "concuss"],
  "zhao-min": ["double", "strike", "guard", "heavy", "strike"],
};
export const OTHERWORLD_RIVALS = Object.fromEntries(HEROES.filter(hero => hero.hidden).map(hero => [`hero-${hero.id}`, {
  heroId: hero.id, name: hero.name, title: hero.title,
  art: `${hero.id}-sprite`, portrait: hero.id,
  hp: Math.round(hero.hp * .85), damage: Math.round(hero.damage * .5), reward: 170,
  pattern: otherworldPatterns[hero.id],
}]));
export const OTHERWORLD_HERO_IDS = HEROES.filter(hero => hero.hidden).map(hero => hero.id);

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
  // Act V — the otherworld: the twenty, camp by camp (Zhao Min holds the bridge).
  "rift-street": ["hero-jia-yucun", "hero-fan-jin", "hero-kuang-zhong", "hero-lu-su"],
  "hall-watch": ["hero-jia-zheng", "hero-xun-yu", "hero-song-jiang", "hero-wu-yong"],
  "hall-of-twenty": ["hero-bao-zheng", "hero-di-renjie", "hero-wang-xifeng", "hero-jia-yuanchun"],
  "lattice-first-round": [
    "hero-xue-baochai", "hero-lin-daiyu", "hero-diaochan",
    "hero-yang-yuhuan", "hero-zhen-huan", "hero-hua-fei", "hero-empress-yixiu",
  ],
};
