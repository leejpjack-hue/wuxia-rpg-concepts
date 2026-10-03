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
  // Stitch try-run 2026-09-25 roster.
  "guan-yu": [
    "The Peach Garden idealist… a rogue god playing soldier for peasants?",
    "I swore my blade to the people, not to tyrants. The Warden falls before dusk.",
  ],
  "wu-song": [
    "The tiger-killer of Jingyang Ridge, drunk on his own legend… this pass is no tiger to be wrestled.",
    "I strangled the tiger with bare hands. You are only a man with a polearm.",
  ],
  "mu-guiying": [
    "The widow-general of a broken house… did the gates not take enough of your family?",
    "My family paid so gates like this would stand open. I finish what they began.",
  ],
  "liang-hongyu": [
    "The drum-wife of the river walls… your war drums fall silent at the Jade Gate.",
    "My drums have never called a retreat. Hear the last measure — it is yours.",
  ],
  "nie-yinniang": [
    "A hidden blade out of the mist… assassins have no place in honest war.",
    "I was trained to end tyrants quietly. Tonight the mist does not need me quiet.",
  ],
  "sun-shangxiang": [
    "A Wu princess with two swords… did your brother send you to die at our gate?",
    "Wu stands whether he watches or not. These blades open the pass.",
  ],
  "gu-dasao": [
    "The inn-keeper of Dengzhou, knives still wet… this gate is no tavern brawl.",
    "Every brawl I won started with a man who thought the same. Step aside.",
  ],
  "qin-liangyu": [
    "The white-shaft general of the frontier… your spear is a long way from Sichuan.",
    "The shaft is white so the fallen can see who held the line. It holds here too.",
  ],
  "bao-sanniang": [
    "A Shu spear from the cavalry lines… jade green does not frighten this gate.",
    "This spear opened roads for the people of Shu. It opens this pass the same way.",
  ],
  "dian-wei": [
    "Twin iron halberds and a bodyguard's stare… Cao's dog, so far from the capital?",
    "I guard who I choose. Today I choose this gate — and you are in the way.",
  ],
  "yang-zhi": [
    "The blue-faced beast of the marches… that sabre looks stolen from better men.",
    "It was earned. The mark is mine. Step aside or learn both.",
  ],
  "venom-adept": [
    "The spared adder returns to the gate… did mercy teach you nothing?",
    "Mercy taught me which side of the wall deserves my rings.",
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
  "guan-yu": [
    "Guan Yu… the beard that banners fear. Even legends drown in three feet of water.",
    "The river may rise, assassin. The Green Dragon does not.",
  ],
  "wu-song": [
    "The tiger of the ridge, wading… your roar is muffled by the rain, brute.",
    "Tigers hunt in this rain. So do I.",
  ],
  "mu-guiying": [
    "The general of a broken house… command nothing here but reeds.",
    "Then I will command the reeds. They whisper where you hide.",
  ],
  "liang-hongyu": [
    "War drums across the water… I will cut the drumsticks from your hands, widow.",
    "Cut them, and the river itself keeps time for me.",
  ],
  "nie-yinniang": [
    "A shadow meeting a shadow… we are the same trade, you and I.",
    "No. You sold your strings to a tyrant. My blades were never for sale.",
  ],
  "sun-shangxiang": [
    "The archer-princess, far from the river Wu… your twin blades sing too loudly for fog.",
    "Then let them sing. I did not come to hide.",
  ],
  "gu-dasao": [
    "Gu Dasao… the sash is red enough already. The river will drink the rest.",
    "Drink, then. My cleavers have fed worse nights than this.",
  ],
  "qin-liangyu": [
    "One spear against a zither in the fog… reach means nothing when you cannot see.",
    "I do not need to see the string. I only need the hand that plucks it.",
  ],
  "bao-sanniang": [
    "A jade-green spear crossing the shallows… Shu cavalry far from home.",
    "Home is wherever the spear still answers. Cross, or be swept aside.",
  ],
  "dian-wei": [
    "Twin iron in the rain… a bodyguard makes a loud corpse in fog.",
    "Then dig two graves. These blades do not travel alone.",
  ],
  "yang-zhi": [
    "Blue-faced beast on the water… that birthmark shines even in fog.",
    "Good. Then you will see the sabre coming.",
  ],
  "venom-adept": [
    "The adder curls beside tigers now… whose venom bought your loyalty?",
    "The mercy of one swordsman. Play your requiem and learn it.",
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
        "Smoke rises from the river crossing. Guan Yu withdraws from the gate after your duel; tonight, the company shelters at the tea house.",
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
        "The pagoda falls silent. Wu Song yields the river road after your duel. Beyond the crossing rise the clouds of Mount Canglan.",
      ),
    ];
  if (key === "canglan-arrival")
    return [
      line("Mount Canglan", "Above the clouds, armored monks guard the path to Lü Bu. Mu Guiying's scouts are pinned below the first terrace."),
      line(hero.name, "We climb together. A broken oath can be cut without abandoning those it binds."),
    ];
  if (key === "lu-bu-rival-intro")
    return [
      line("Lü Bu", hero.id === "lu-bu"
        ? "The mountain mirrors my cursed oath. Defeat this shadow, and the bond finally breaks."
        : "The Ashen Oath binds my halberd. Stand aside, or meet the full weight of it."),
      line(hero.name, "Then I will break the oath, not the man. Draw your halberd."),
    ];
  if (key === "lu-bu-rival-fall")
    return [
      line("Lü Bu", "The curse is gone. My blade is mine again. I will ride beside you to the citadel."),
      line("The road ahead", "The clouds part over Mount Canglan. Five new allies now answer the call, and the capital waits beyond the pass."),
    ];
  if (key === "citadel-arrival")
    return [
      line("The Meridian Citadel", "Beneath a blood moon, the imperial gates stand open. The Ashen Sovereign knows you have come, and the qi vortex sings along the walls."),
      line(hero.name, "Then let him watch us walk in. Every oath he broke is waiting on this side of the moon."),
    ];
  if (key === "sovereign-intro")
    return [
      line("The Ashen Sovereign", hero.id === "lu-bu"
        ? "The Flying General, unleashed at last. Did you truly think breaking my oath would break me?"
        : hero.id === "venom-adept"
          ? "My own adder, curled at the feet of peasants. The vortex taught you better than this."
          : "Four blades and a borrowed moon. I authored every oath you cut — kneel, and I will write you a kinder one."),
      line(hero.name, "You wrote the oaths with other people's blood. Tonight the ink runs out. Take your form — we end this before the moon does."),
    ];
  if (key === "sovereign-fall")
    return [
      line("The Ashen Sovereign", "So the moon sets… Keep your jianghu, then. It was never the throne I feared losing — only the silence after."),
      line("The road ahead", "The blood moon fades over the Meridian Citadel. The gates open onto a ordinary dawn, and the jianghu belongs to whoever walks it kindly. The oath is fulfilled."),
    ];
  // Act V — the otherworld: rift, corpse street, hall of twenty, first round,
  // and the cloud causeway home. The trio lands a hundred to two hundred
  // years after their own story, among twenty legends stolen from other books.
  if (key === "rift-arrival")
    return [
      line(
        "The Rift",
        "The dawn after the Sovereign's fall lasts one heartbeat. A golden seam splits the sky above the shattered gates and drinks the blood moon's last light — then it takes the three of you, the way a river takes leaves.",
      ),
      line(
        "The far side",
        "Stone under your back. Fog, and a street that smells of old smoke. The stars are wrong, the dynasty on the coins is one you never served — a hundred years, maybe two, from the gate you saved.",
      ),
      line(hero.name, "Then we save this street the same way. Together — watch my back when we rise."),
    ];
  if (key === "hall-reveal")
    return [
      line(
        "The Hall of Twenty",
        "Beyond the great gate: a hall vast as an examination courtyard. Twenty desks stand in ranked rows, and twenty faces turn towards you as one — judges, chancellors, consorts, legends pulled out of their own unfinished stories.",
      ),
      line(
        "Empress Yixiu",
        "Stray characters from a closed book. The edict gathered us here to be written into a kinder court, and it will do the same for you. Kneel and be edited gently — or stand, duel all twenty of us, and win the bridge home.",
      ),
      line(hero.name, "We are not characters. We are the hand that holds the pen. Let the bench take its seats — we will call on them one by one."),
    ];
  if (key === "first-round")
    return [
      line(
        "The Lattice Halls",
        "The twenty rise from their desks and scatter into the maze of lattice screens — silk sleeves, judge's blades, fans half-opened behind every panel. The first round begins where the lanterns burn lowest.",
      ),
      line(hero.name, "Better to fight them on my feet than be judged on my knees. Open the screens — first round."),
    ];
  if (key === "zhao-min-rival-intro")
    return [
      line(
        "Zhao Min",
        "Nineteen of my twenty have fallen to your blades, and the edict is nearly spent. I am Zhao Min — the last keeper. The bridge home crosses my shadow, and I have been looking forward to this duel since the hall went quiet.",
      ),
      line(hero.name, "A keeper who smiles at her own gate. Then let it be a duel worth crossing for — after you, the clouds part."),
    ];
  if (key === "zhao-min-rival-fall")
    return [
      line(
        "Zhao Min",
        "Well struck… the bond snaps — you feel it too, don't you? The hall was a cage; the bridge was always yours. Cross while the sky still remembers your names.",
      ),
      line(
        "The road home",
        "The twentieth desk stands empty. Below the causeway the clouds open onto your own morning — a hundred years untouched, a gate still worth guarding. The story folds itself shut behind you as you walk.",
      ),
    ];
  throw new Error(`Unknown dialogue: ${key}`);
}
