export const UPGRADES = [
  {
    id: "power",
    name: "Tempered steel",
    description: "+25% strike and technique damage.",
  },
  {
    id: "vitality",
    name: "Mountain heart",
    description: "+30 maximum health. Recover 55 health.",
  },
  {
    id: "flow",
    name: "Still water",
    description: "+8 Flow per hit. Techniques cost 30 Flow.",
  },
];
export function applyUpgrade(p, id) {
  if (id === "power") p.power *= 1.25;
  if (id === "vitality") {
    p.maxHp += 30;
    p.hp = Math.min(p.maxHp, p.hp + 55);
  }
  if (id === "flow") {
    p.flowBonus += 8;
    p.cost = 30;
  }
}
