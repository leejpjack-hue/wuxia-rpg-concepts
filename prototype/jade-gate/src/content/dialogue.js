const line = (speaker, text) => ({ speaker, text });
const replies = {
  "zhao-yun": [
    "A young swordsman from Changshan… Why bleed for an empire that has forgotten its gates?",
    "I do not bleed for the empire. I bleed so the people behind this gate can sleep without terror. Draw your blade.",
  ],
  "lu-zhishen": [
    "A renegade monk with blood on his prayer beads. Is this your Buddhist compassion?",
    "Buddha shows mercy to souls. My monk’s spade is reserved for devils like you!",
  ],
  "hu-sanniang": [
    "The orphan of the Hu Manor… You should have stayed hidden in the tea hills.",
    "My father’s blood still stains the banner behind you. Today, my sabers wash it clean.",
  ],
  "lu-bu": [
    "General Lü! You swore an accord with the Sovereign—why strike down our own garrison?!",
    "Your Warden blocks my path and dares speak of accords. Stand aside, or be split beneath my halberd.",
  ],
};
export function dialogueFor(key, hero) {
  if (key === "arrival")
    return [
      line(
        "The Jade Gate",
        "The Ashen Banner holds the pass. Beyond these walls, the last refugees wait for a path through the mountains.",
      ),
      line(hero.name, "Then this gate will open."),
    ];
  if (key === "warden-intro")
    return [
      line("Ashen Warden", replies[hero.id][0]),
      line(hero.name, replies[hero.id][1]),
    ];
  if (key === "warden-fall")
    return [
      line(
        "Ashen Warden",
        "The Jade Gate was only the threshold… the Sovereign already walks the capital.",
      ),
      line(
        "The road ahead",
        "Smoke rises from the river crossing. Tonight, the four blades find shelter at the tea house.",
      ),
    ];
  throw new Error(`Unknown dialogue: ${key}`);
}
