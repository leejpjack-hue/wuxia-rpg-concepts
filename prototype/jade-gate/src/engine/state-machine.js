const transitions = {
  menu: ["dialogue", "playing", "waystation"],
  dialogue: ["playing", "waystation", "menu"],
  playing: ["paused", "upgrade", "dialogue", "victory", "defeat"],
  paused: ["playing", "menu"],
  upgrade: ["playing", "dialogue", "menu"],
  victory: ["playing", "dialogue", "menu"],
  defeat: ["playing", "dialogue", "menu"],
  waystation: ["dialogue", "playing", "menu"],
};
export class StateMachine {
  constructor(initial = "menu") {
    if (!transitions[initial]) throw new Error(`Unknown state: ${initial}`);
    this.value = initial;
  }
  can(next) {
    return transitions[this.value]?.includes(next) || false;
  }
  transition(next) {
    if (!this.can(next))
      throw new Error(`Illegal transition: ${this.value} → ${next}`);
    const previous = this.value;
    this.value = next;
    return { previous, current: next };
  }
}
