// Stable compatibility exports for the art gallery and external consumers.
import { HEROES } from "./src/content/heroes.js";
export { HEROES };
export const SPRITE_HEROES = HEROES.filter((hero) => !hero.hidden).map((hero) => hero.id);
// Only approved orthographic sheets are listed as modeling references.
export const TURNAROUND_HEROES = ["zhao-yun", "lu-zhishen", "hu-sanniang", "lu-bu"];
export { UPGRADES, applyUpgrade } from "./src/content/disciplines.js";
export { clamp, distance, inArc } from "./src/domain/math.js";
export { makePlayer, takeDamage } from "./src/domain/player.js";
