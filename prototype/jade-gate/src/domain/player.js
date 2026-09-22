export function makePlayer(hero) {
  return {
    ...hero,
    x: 640,
    y: 500,
    maxHp: hero.hp,
    flow: 40,
    attackCD: 0,
    dodgeCD: 0,
    specialCD: 0,
    invulnerable: 0,
    dash: 0,
    dx: 1,
    dy: 0,
    facing: 0,
    attackAnim: 0,
    combo: 0,
    comboTime: 0,
    power: 1,
    flowBonus: 0,
    cost: 40,
    kills: 0,
    damageTaken: 0,
    moving: false,
    perfectWindow: 0,
    chainTime: 0,
    chain: 0,
    lastEvaded: null,
  };
}
export function takeDamage(p, amount) {
  if (p.invulnerable > 0) return false;
  p.hp = Math.max(0, p.hp - amount);
  p.damageTaken += amount;
  p.invulnerable = 0.65;
  p.combo = 0;
  return true;
}
