/** Fixed simulation step; excess wall time is discarded after a bounded catch-up. */
export class FixedClock {
  constructor(step = 1 / 60, maxSteps = 8) {
    this.step = step;
    this.maxSteps = maxSteps;
    this.accumulator = 0;
  }
  reset() {
    this.accumulator = 0;
  }
  advance(seconds, update) {
    this.accumulator += Math.max(
      0,
      Math.min(seconds, this.step * this.maxSteps),
    );
    let steps = 0;
    while (this.accumulator + 1e-10 >= this.step && steps < this.maxSteps) {
      this.accumulator -= this.step;
      update(this.step);
      steps++;
    }
    return steps;
  }
}
export function seededRandom(seed = 1) {
  let value = seed >>> 0;
  return () => {
    value = (Math.imul(1664525, value) + 1013904223) >>> 0;
    return value / 4294967296;
  };
}
