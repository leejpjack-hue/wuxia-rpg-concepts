const transitions = {
  menu: ["dialogue", "exploring", "waystation"],
  dialogue: ["exploring", "waystation", "menu"],
  exploring: ["playing", "paused", "dialogue", "upgrade", "menu", "victory", "defeat"],
  playing: ["paused", "exploring", "upgrade", "dialogue", "victory", "defeat"],
  paused: ["playing", "exploring", "menu"],
  upgrade: ["exploring", "dialogue", "menu"],
  victory: ["exploring", "dialogue", "menu"],
  defeat: ["exploring", "dialogue", "menu"],
  waystation: ["dialogue", "exploring", "menu"],
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
