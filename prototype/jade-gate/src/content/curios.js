/** Run-scoped passive curios (Slay-the-Spire-style relics, wuxia flavor). */
export const CURIOS = [
  {
    id: "jade-pendant",
    name: "Jade Pendant",
    cn: "玉佩",
    icon: "玉",
    description: "Your first Guard each duel also restores 6 health.",
  },
  {
    id: "twin-irons",
    name: "Twin Iron Rings",
    cn: "双鐵環",
    icon: "鐵",
    description: "Every third Strike deals +50% damage.",
  },
  {
    id: "night-eye",
    name: "Night-Eye Charm",
    cn: "夜眼符",
    icon: "眼",
    description: "Rival intents are revealed one move earlier.",
  },
  {
    id: "qiang-feather",
    name: "General's Feather",
    cn: "將羽",
    icon: "羽",
    description: "Techniques cost 10 less Flow.",
  },
  {
    id: "monk-beads",
    name: "Monk's Beads",
    cn: "佛珠",
    icon: "珠",
    description: "Stunning a rival also grants 15 Flow.",
  },
  {
    id: "river-charm",
    name: "River Charm",
    cn: "河符",
    icon: "河",
    description: "Healing tea restores 15 more health.",
  },
  {
    id: "ashen-tally",
    name: "Ashen Tally",
    cn: "灰帳",
    icon: "帳",
    description: "Defeated rivals award 30 extra Renown.",
  },
  {
    id: "shadow-sash",
    name: "Shadow Sash",
    cn: "影帶",
    icon: "帶",
    description: "Your first Technique each duel also blocks half the reply.",
  },
  {
    id: "venom-vial",
    name: "Venom Vial",
    cn: "毒瓶",
    icon: "毒",
    description: "Techniques also poison the rival for 3 damage over 3 turns.",
  },
  {
    id: "rending-fang",
    name: "Rending Fang",
    cn: "裂牙",
    icon: "牙",
    description: "Every fourth Strike opens a bleeding wound: 3 damage over 2 turns.",
  },
];

export const CURIO_IDS = CURIOS.map((curio) => curio.id);
export const curioById = (id) => CURIOS.find((curio) => curio.id === id);

/** Techniques may be discounted by the General's Feather (never below 20). */
export function techniqueCost(p, curios = []) {
  // A rattled hero (maxed composure) pays 5 more until they rest.
  return Math.max(20, p.cost - (curios.includes("qiang-feather") ? 10 : 0) + (p.rattled ? 5 : 0));
}

/** Events are map nodes resolved by choice instead of combat. */
export const EVENTS = {
  "travelers-gift": {
    title: "Travelers by the wayside",
    text: "A huddled family shares your road. They offer a bundle — tea leaves, or a sealed box they dare not open.",
    choices: [
      { label: "Share the tea leaves", description: "Restore 20 health.", heal: 20 },
      { label: "Open the sealed box", description: "Take a curio, but a needle trap bites for 8.", curio: true, hurt: 8 },
    ],
  },
};
