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

const heronReplies = {
  "zhao-yun": [
    "A wanderer from Changshan… Your footsteps ripple across the shallows, swordsman. My zither already knows your reach.",
    "Then listen closely to the Qinggang blade. It cuts cleanly through every web you weave.",
  ],
  "lu-zhishen": [
    "The heavy tread of Mount Wutai… A savage monk who mistakes brute fury for harmony.",
    "My spade has no rhythm for assassin tunes! Play all your cursed strings—my iron will smash your pagoda!",
  ],
  "hu-sanniang": [
    "Hu Sanniang… The young mistress of a ruined manor. Did you believe your twin sabers could outrun the river’s sorrow?",
    "Your wire murdered in the dark while my clan burned. Hear my steel sing vengeance upon this water.",
  ],
  "lu-bu": [
    "The invincible Flying General wading in muddy water… Have you come to bow before the Sovereign’s melody?",
    "Petty zither tricks from a bird in a cage. Strum your last chord before my halberd fells your tower.",
  ],
};

export function dialogueFor(key, hero) {
  if (key === "arrival" || key === "jade-gate-arrival")
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
  if (key === "bamboo-arrival" || key === "act2-arrival" || key === "heron-arrival")
    return [
      line(
        "Whispering Bamboo",
        "Cold rain drums on the bamboo leaves. The shallows run deep, and unseen blades stir beneath the river fog.",
      ),
      line(hero.name, "Step through the shallows. No assassin halts our passage."),
    ];
  if (key === "heron-intro" || key === "night-heron-intro")
    return [
      line("The Night Heron", heronReplies[hero.id][0]),
      line(hero.name, heronReplies[hero.id][1]),
    ];
  if (key === "heron-fall" || key === "night-heron-fall")
    return [
      line(
        "The Night Heron",
        "The strings snap… but the fog does not lift. Look to the heights of Mount Canglan… the Flying General awaits you there.",
      ),
      line(
        "The road ahead",
        "The pagoda falls silent over the river shallows. Ahead, the treacherous road climbs toward the clouds of Mount Canglan.",
      ),
    ];
  throw new Error(`Unknown dialogue: ${key}`);
}
