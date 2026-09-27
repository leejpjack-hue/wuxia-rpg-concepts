/**
 * Meridian cultivation tree (tea-house meta, Wandering-Sword-style acupoints).
 * Vessel points carry the classic stat tracks; crossing cavities are gated
 * perks that require points from multiple vessels.
 */
export const VESSELS = [
  { id: "ren", cn: "任脈", name: "Conception Vessel", track: "iron-vessel", stat: "maxHp",
    line: "Sea of Qi → Chest Center → Humor Palace", amount: 15, unit: "max health" },
  { id: "du", cn: "督脈", name: "Governing Vessel", track: "flow-retention", stat: "flow",
    line: "Long Strong → Life Gate → Jade Pillow", amount: 10, unit: "starting Flow" },
  { id: "dai", cn: "帯脈", name: "Girding Vessel", track: "keen-edge", stat: "power",
    line: "Binding Point → Five Pivots → Girding Blade", amount: 0.05, unit: "damage" },
];

export const MERIDIAN_NODES = [
  // Conception Vessel (health).
  { id: "ren-1", vessel: "ren", point: "Sea of Qi 気海", cost: 300, requires: [] },
  { id: "ren-2", vessel: "ren", point: "Chest Center 膻中", cost: 450, requires: ["ren-1"] },
  { id: "ren-3", vessel: "ren", point: "Humor Palace 玉堂", cost: 600, requires: ["ren-2"] },
  // Governing Vessel (Flow).
  { id: "du-1", vessel: "du", point: "Long Strong 長強", cost: 250, requires: [] },
  { id: "du-2", vessel: "du", point: "Life Gate 命門", cost: 350, requires: ["du-1"] },
  { id: "du-3", vessel: "du", point: "Jade Pillow 玉枕", cost: 500, requires: ["du-2"] },
  // Girding Vessel (power).
  { id: "dai-1", vessel: "dai", point: "Binding Point 帯脈穴", cost: 400, requires: [] },
  { id: "dai-2", vessel: "dai", point: "Five Pivots 五枢", cost: 550, requires: ["dai-1"] },
  { id: "dai-3", vessel: "dai", point: "Girding Blade 帯刃", cost: 700, requires: ["dai-2"] },
  // Crossing cavities (gated perks).
  { id: "dantian", vessel: "cross", point: "Dantian Core 丹田", cost: 500, requires: ["ren-1", "du-1"],
    perk: "dantian", effect: "Techniques cost 5 less Flow on every run." },
  { id: "phoenix-eye", vessel: "cross", point: "Phoenix Eye 鳳眼", cost: 650, requires: ["du-2"],
    perk: "phoenix-eye", effect: "Curio drafts offer a fourth choice." },
  { id: "dragons-cavity", vessel: "cross", point: "Dragon's Cavity 竜穴", cost: 800, requires: ["ren-2", "dai-1"],
    perk: "dragons-cavity", effect: "Begin every encounter with a second pot of healing tea." },
];

export const nodeById = (id) => MERIDIAN_NODES.find((node) => node.id === id);

/** Struck legacy ranks migrate onto their vessel points. */
export function migrateRanks(ranks = {}) {
  const struck = [];
  for (const vessel of VESSELS) {
    const rank = Math.max(0, Math.min(3, Math.round(Number(ranks[vessel.track]) || 0)));
    for (let i = 1; i <= rank; i++) struck.push(`${vessel.id}-${i}`);
  }
  return struck;
}
