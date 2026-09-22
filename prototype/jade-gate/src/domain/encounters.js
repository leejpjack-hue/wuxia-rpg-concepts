import { BOSSES } from "../content/campaign.js";
export function createEnemies(encounter, index) {
  return encounter.enemies.map((type, i) => {
    const boss = type === "boss",
      archer = type === "archer";
    const definition = boss ? BOSSES[encounter.bossId] : null;
    const hp = boss ? definition.hp : index === 0 ? 62 : 85;
    return {
      id: `${encounter.id}-${i}`,
      type,
      bossId: boss ? encounter.bossId : null,
      name: definition?.name,
      hp,
      maxHp: hp,
      x: i % 2 ? 1090 : 190,
      y: 315 + ((i * 67) % 285),
      radius: boss ? 33 : 21,
      speed: boss ? 80 : archer ? 72 : 100 + index * 8,
      damage: boss ? 25 : archer ? 12 : 14,
      cd: 1 + i * 0.25,
      wind: 0,
      stun: 0,
      flash: 0,
      facing: 0,
      target: null,
      attacks: 0,
      phase: 0,
      burst: 0,
    };
  });
}
export function bossPhase(enemy) {
  return BOSSES[enemy.bossId]?.phases[enemy.phase];
}
