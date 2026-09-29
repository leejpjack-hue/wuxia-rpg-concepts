import { HEROES } from "../content/heroes.js";

// Story milestones, not a quick-play record or a copied unlockedHeroes list,
// determine whether a bonus hero may enter a campaign run.

const COMPLETION = {
  'guan-yu': 'jade-gate',
  'wu-song': 'bamboo-crossing',
  'lu-bu': 'mount-canglan',
};
const RESCUES = new Set(['mu-guiying', 'liang-hongyu', 'nie-yinniang']);
export function campaignHeroUnlocked(profile, heroId) {
  if (Object.hasOwn(COMPLETION, heroId))
    return profile.completedActs.includes(COMPLETION[heroId]);
  if (RESCUES.has(heroId))
    return profile.earnedHeroes?.includes(heroId) || false;
  const hero = HEROES.find((item) => item.id === heroId);
  if (hero?.quickPlayOnly) return false;
  return profile.unlockedHeroes.includes(heroId);
}
