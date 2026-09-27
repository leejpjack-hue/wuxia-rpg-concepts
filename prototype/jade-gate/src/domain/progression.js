import { VESSELS, nodeById } from "../content/meridians.js";
export function meridianState(profile, id) {
  const node = nodeById(id);
  if (!node) throw new Error(`Unknown acupoint: ${id}`);
  const struck = profile.meridian.includes(id);
  const ready = node.requires.every((need) => profile.meridian.includes(need));
  return {
    node,
    struck,
    ready,
    locked: !struck && !ready,
    cost: node.cost,
    affordable: profile.wallet >= node.cost,
  };
}
export function strikeNode(profile, id) {
  const state = meridianState(profile, id);
  if (state.struck || state.locked || profile.wallet < state.cost) return false;
  profile.wallet -= state.cost;
  profile.meridian.push(id);
  return true;
}
export function hasPerk(profile, perk) {
  return profile.meridian.some((id) => nodeById(id)?.perk === perk);
}
export function applyCultivation(player, profile) {
  for (const id of profile.meridian) {
    const node = nodeById(id);
    if (!node?.vessel || node.vessel === "cross") continue;
    const vessel = VESSELS.find((item) => item.id === node.vessel);
    if (vessel.stat === "maxHp") {
      player.maxHp += vessel.amount;
      player.hp = player.maxHp;
    }
    if (vessel.stat === "flow")
      player.flow = Math.min(100, player.flow + vessel.amount);
    if (vessel.stat === "power") player.power += vessel.amount;
  }
  if (hasPerk(profile, "dantian")) player.cost = Math.max(20, player.cost - 5);
  if (hasPerk(profile, "dragons-cavity")) player.teaPots = 2;
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
