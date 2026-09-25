// Stable compatibility exports for the art gallery and external consumers.
export { HEROES } from "./src/content/heroes.js";
// Only the original four have transparent sprites and turnaround sheets;
// the Stitch try-run roster is present as card art only.
export const SPRITE_HEROES = ["zhao-yun", "lu-zhishen", "hu-sanniang", "lu-bu"];
export const TURNAROUND_HEROES = SPRITE_HEROES;
export { UPGRADES, applyUpgrade } from "./src/content/disciplines.js";
export { clamp, distance, inArc } from "./src/domain/math.js";
export { makePlayer, takeDamage } from "./src/domain/player.js";
