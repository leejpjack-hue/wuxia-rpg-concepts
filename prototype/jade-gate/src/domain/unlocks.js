import { isStoryHero } from "../content/story-rivals.js";

/** Legacy completion, rescue and recruit records never change Story roles. */
export function campaignHeroUnlocked(_profile, heroId) {
  return isStoryHero(heroId);
}
