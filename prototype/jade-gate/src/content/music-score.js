// A deterministic 32-bar score. Keeping composition separate from Web Audio makes
// its length, transitions and density testable without a browser AudioContext.
export const MUSIC_BARS = 32;

const ROOTS = {
  E: { bass: 82.41, chord: 82.41, fifth: 123.47 },
  G: { bass: 98, chord: 98, fifth: 146.83 },
  A: { bass: 110, chord: 110, fifth: 164.81 },
  C: { bass: 65.41, chord: 130.81, fifth: 196 },
  D: { bass: 73.42, chord: 146.83, fifth: 220 },
  B: { bass: 61.74, chord: 123.47, fifth: 185 },
};

const PROGRESSIONS = {
  select: "E G C D E G A B C G D A E D C B E G C D E A C B G D E C A B E E".split(" "),
  upgrade: "E C G D E C A B C G D E A C D B E C G D C A D B G D E C A B E E".split(" "),
  battle: "E E G A C D E B E G C D A C B E E G A B C D E E G A C D E B E E".split(" "),
  boss: "E E C B E G A B C B A G E D C B E E G A C B A B E G C D E B E E".split(" "),
  "battle-bamboo": "A C D E A G C B A D E C G A B E C A G D E B C A D G E C A B G A".split(" "),
  "boss-heron": "A A C B A G E D C A B G A E C B A D C G E A B C D E A G C B A A".split(" "),
  "battle-canglan": "D A G E D C G A B D C A G E B D A C D E G D A B C G D A E B D D".split(" "),
  "boss-lubu": "E B E G A E B C E D C B A G E B E E G A B E C B G D E C B A E E".split(" "),
};

// E-minor pentatonic hooks; the response changes at every eight-bar section.
const HOOKS = [
  [329.63, 392, 440, 392, 329.63, 293.66, 246.94, 329.63],
  [392, 440, 493.88, 587.33, 493.88, 440, 392, 329.63],
  [493.88, 587.33, 659.25, 587.33, 493.88, 440, 392, 440],
  [659.25, 587.33, 493.88, 440, 392, 329.63, 293.66, 329.63],
];

export function musicStepCount(mode) {
  return MUSIC_BARS * (mode.startsWith("battle") || mode.startsWith("boss") ? 16 : 8);
}

export function scoreStep(mode, step) {
  const key = mode === "waystation" ? "select" : mode;
  const progression = PROGRESSIONS[key];
  if (!progression) return [];

  const battle = key.startsWith("battle"), boss = key.startsWith("boss");
  const river = key.includes("bamboo") || key.includes("heron");
  const mountain = key.includes("canglan") || key.includes("lubu");
  const stepsPerBar = battle || boss ? 16 : 8;
  const bar = Math.floor(step / stepsPerBar) % MUSIC_BARS;
  const subdivision = step % stepsPerBar;
  const beat = Math.floor(subdivision / (stepsPerBar / 4));
  const section = Math.floor(bar / 8);
  const sectionBar = bar % 8;
  const root = ROOTS[progression[bar]];
  const sparse = key === "upgrade" || (key === "select" && section === 2);
  const climax = section === 3;
  const events = [];
  const add = (instrument, pitch, duration, velocity, extra = {}) =>
    events.push({ instrument, pitch, duration, velocity, ...extra });

  if (subdivision === 0) {
    if (bar === 0 || (sectionBar === 0 && section > 0))
      add("crash", 0, 1.1, boss ? 0.6 : 0.42);
    add("chord", root.chord, sparse ? 1.25 : 0.62, sparse ? 0.4 : 0.54);
    if (key === "select" || key === "upgrade")
      add("guzheng", root.chord * 4, 1.7, 0.37);
  }

  // A two-beat response and a turnaround keep the harmonic rhythm moving.
  if (beat === 2 && subdivision === stepsPerBar / 2 && !sparse)
    add("chord", sectionBar === 7 ? ROOTS.B.chord : root.chord, 0.32, 0.37, { mute: true });

  const eighth = stepsPerBar / 8;
  if (subdivision % eighth === 0) {
    const eighthIndex = subdivision / eighth;
    if (eighthIndex % 2 === 0 || (boss && section !== 2)) {
      const bassPitch = eighthIndex === 6 && sectionBar === 7 ? root.fifth : root.bass;
      add("bass", bassPitch, sparse ? 0.34 : 0.23, sparse ? 0.38 : 0.49);
    }
    if (!sparse && (eighthIndex % 2 === 0 || boss))
      add("hat", 0, 0.06, boss ? 0.26 : 0.2, { open: eighthIndex === 7 });
  }

  if (subdivision === 0 || (boss && subdivision === stepsPerBar / 2))
    add("kick", 0, 0.28, sparse ? 0.47 : 0.65);
  if ((beat === 1 || beat === 3) && subdivision === beat * (stepsPerBar / 4))
    add("snare", 0, 0.16, sparse ? 0.27 : 0.48);
  if (!sparse && sectionBar === 7 && subdivision === stepsPerBar - eighth)
    add("snare", 0, 0.12, 0.28);

  // Each eight-bar section has a different contour, with rests between calls.
  const hookPosition = sectionBar % 4;
  if (subdivision === stepsPerBar / 2 && hookPosition !== 0) {
    const note = HOOKS[section][sectionBar];
    const duration = key === "upgrade" ? 0.65 : key === "select" ? 0.48 : 0.28;
    add(river ? "flute" : mountain && !boss ? "pipa" :
      key === "upgrade" || (key === "select" && section === 2) ? "flute" : "lead",
      river ? note * 0.89 : mountain ? note * 1.12 : note,
      duration, climax ? 0.55 : 0.44);
  }
  if (subdivision === stepsPerBar - eighth && sectionBar % 4 === 3) {
    const answer = HOOKS[section][(sectionBar + 1) % 8];
    add(river ? "guzheng" : battle || boss ? "pipa" : "guzheng", answer,
      battle || boss ? 0.18 : 0.4, 0.35);
  }
  if (climax && subdivision === stepsPerBar / 4 && (sectionBar === 3 || sectionBar === 7))
    add("lead", HOOKS[section][sectionBar] * 2, 0.34, 0.42);

  return events;
}
