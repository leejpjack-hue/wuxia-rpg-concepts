import { CULTIVATIONS } from "../content/campaign.js";
export function cultivationCost(profile, id) {
  const item = CULTIVATIONS.find((item) => item.id === id);
  if (!item) throw new Error(`Unknown cultivation: ${id}`);
  const rank = profile.ranks[id] || 0;
  return {
    item,
    rank,
    cost: item.baseCost * (rank + 1),
    maxed: rank >= item.maxRank,
  };
}
export function purchaseCultivation(profile, id) {
  const { rank, cost, maxed } = cultivationCost(profile, id);
  if (maxed || profile.wallet < cost) return false;
  profile.wallet -= cost;
  profile.ranks[id] = rank + 1;
  return true;
}
export function applyCultivation(player, profile) {
  for (const item of CULTIVATIONS) {
    const rank = profile.ranks[item.id] || 0;
    if (item.effect === "maxHp") {
      player.maxHp += item.amount * rank;
      player.hp = player.maxHp;
    }
    if (item.effect === "flow")
      player.flow = Math.min(100, player.flow + item.amount * rank);
    if (item.effect === "power") player.power += item.amount * rank;
  }
}
export function awardResult(profile, run, won, act) {
  if (won && profile.completedRuns.includes(run.runId)) return false;
  if (won) {
    profile.completedRuns.push(run.runId);
    profile.completedRuns = profile.completedRuns.slice(-100);
  }
  const record = (profile.records[run.p.id] ||= { best: 0, wins: 0 });
  record.best = Math.max(record.best, run.score);
  if (won) record.wins++;
  if (won && run.runMode === "campaign") {
    profile.wallet += Math.max(0, Math.floor(run.score));
    if (!profile.completedActs.includes(act.id))
      profile.completedActs.push(act.id);
    for (const id of act.unlocks)
      if (!profile.unlockedHeroes.includes(id)) profile.unlockedHeroes.push(id);
  }
  return true;
}
