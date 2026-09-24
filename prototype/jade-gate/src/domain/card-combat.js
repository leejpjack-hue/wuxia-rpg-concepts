import { DUEL_ROSTERS, DUEL_ENEMIES, HERO_TECHNIQUES } from "../content/duels.js";

/** Pure, synchronous turns. No timers, DOM, random hit chance, or background damage. */
export function createCardCombat(g, bus, { encounter } = {}) {
  const roster = DUEL_ROSTERS[encounter?.id];
  if (!roster) throw new Error("This encounter has no card duel yet.");
  g.turns ||= 0;

  /** One duel per contacted rival; tea and progress persist within the encounter. */
  function begin(kind, id = `${encounter.id}-card`) {
    const rival = DUEL_ENEMIES[kind];
    if (!rival) throw new Error(`Unknown rival: ${kind}`);
    g.enemies = [
      {
        ...rival,
        id,
        kind,
        type: kind === "warden" ? "boss" : kind,
        maxHp: rival.hp,
        phase: 0,
        move: 0,
      },
    ];
    g.encounterDone = false;
    g.duel = {
      round: 1,
      total: roster.length,
      defeated: g.duel?.defeated ?? 0,
      tea: g.duel?.tea ?? 1,
      log: [],
      lastAction: null,
      lastDamage: 0,
      lastIncoming: 0,
    };
    bus.emit("card:changed");
  }
  function intent(enemy = g.enemies[0]) {
    if (!enemy) return null;
    const kind = enemy.pattern[enemy.move % enemy.pattern.length];
    const damage = kind === "guard" ? 0 :
      Math.round(enemy.damage * (kind === "heavy" ? 1.8 : 1) * (enemy.phase ? 1.2 : 1));
    return {
      kind, damage,
      name: kind === "heavy" ? "Heavy strike" : kind === "guard" ? "Iron guard" : "Weapon strike",
      description: kind === "guard" ? "Blocks half of a normal attack. Techniques pierce guard."
        : kind === "heavy" ? `${damage} damage next. Guard to reduce it by 80%.`
          : `${damage} damage after your action.`,
    };
  }
  function log(text) {
    g.duel.log.unshift(text);
    g.duel.log = g.duel.log.slice(0, 8);
  }
  function act(action) {
    if (g.mode !== "playing" || !g.duel || !g.enemies.length || g.encounterDone) return false;
    if (!["attack", "guard", "technique", "tea"].includes(action)) return false;
    const p = g.p, d = g.duel, enemy = g.enemies[0], next = intent(enemy);
    if (action === "technique" && p.flow < p.cost) return false;
    if (action === "tea" && (d.tea < 1 || p.hp >= p.maxHp)) return false;
    let damage = 0, protect = 0, stunned = false;
    d.lastAction = action;
    d.lastIncoming = 0;
    g.turns++;
    if (action === "attack") {
      damage = Math.round(p.damage * p.power * (next.kind === "guard" ? 0.5 : 1));
      p.flow = Math.min(100, p.flow + 12 + p.flowBonus);
      bus.emit("audio:sfx", { type: "strike" });
    } else if (action === "guard") {
      protect = 0.8;
      p.flow = Math.min(100, p.flow + 20);
      log("You guard and gather 20 Flow.");
      bus.emit("audio:sfx", { type: "dodge" });
    } else if (action === "tea") {
      const healed = Math.min(30, p.maxHp - p.hp);
      p.hp += healed;
      d.tea--;
      log(`Healing tea restores ${healed} health. The enemy still takes its turn.`);
      bus.emit("audio:sfx", { type: "heal" });
    } else {
      const technique = HERO_TECHNIQUES[p.id];
      p.flow -= p.cost;
      damage = Math.round(p.damage * p.power * technique.multiplier);
      p.hp = Math.min(p.maxHp, p.hp + technique.heal);
      protect = technique.protect;
      stunned = technique.stun;
      bus.emit("audio:sfx", { type: "special", param: p.id });
    }
    d.lastDamage = Math.min(enemy.hp, damage);
    enemy.hp = Math.max(0, enemy.hp - damage);
    if (damage) log(`${action === "technique" ? p.skill : "Your strike"} deals ${d.lastDamage} damage.`);
    if (enemy.hp <= 0) {
      g.score += enemy.reward;
      g.totalKills++;
      p.kills++;
      p.hp = Math.min(p.maxHp, p.hp + 12);
      p.flow = Math.min(100, p.flow + 8);
      d.defeated++;
      log(`${enemy.name} falls. +${enemy.reward} Renown, +12 health, +8 Flow.`);
      g.enemies.shift();
      g.encounterDone = true;
      bus.emit("duel:won");
    } else {
      const incoming = stunned ? 0 : Math.round(next.damage * (1 - protect));
      d.lastIncoming = Math.min(p.hp, incoming);
      p.hp = Math.max(0, p.hp - incoming);
      p.damageTaken += d.lastIncoming;
      log(stunned ? `${enemy.name} is stunned and cannot reply.`
        : next.kind === "guard" ? `${enemy.name} holds a defensive stance.`
          : `${enemy.name} uses ${next.name.toLowerCase()}: ${d.lastIncoming} damage.`);
      enemy.move++;
      if (enemy.type === "boss" && enemy.phase === 0 && enemy.hp <= enemy.maxHp / 2) {
        enemy.phase = 1;
        log("The Warden enters his second stance. Incoming damage rises by 20%.");
        bus.emit("boss:phase", { name: "Warden · Unbroken fury" });
      }
      if (p.hp <= 0) bus.emit("combat:defeat");
      else d.round++;
    }
    bus.emit("card:changed");
    return true;
  }
  return { act, intent, begin, clearInput() {}, step() {} };
}
