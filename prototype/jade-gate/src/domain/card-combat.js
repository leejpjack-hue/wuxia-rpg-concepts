import { DUEL_ROSTERS, DUEL_ENEMIES, HERO_TECHNIQUES } from "../content/duels.js";
import { techniqueCost } from "../content/curios.js";

/** Pure, synchronous turns. No timers, DOM, random hit chance, or background damage. */
export function createCardCombat(g, bus, { encounter } = {}) {
  const roster = DUEL_ROSTERS[encounter?.id];
  if (!roster) throw new Error("This encounter has no card duel yet.");
  g.turns ||= 0;
  // Run curios bend duel rules; effects below read this set.
  const has = (id) => g.curios?.includes(id);

  /** Intent specs: how a rival's telegraphed move resolves against the hero. */
  const INTENTS = {
    strike:  { hits: 1, scale: 1,    name: "Weapon strike",
      describe: (total) => `${total} damage after your action.` },
    heavy:   { hits: 1, scale: 1.8,  name: "Heavy strike",
      describe: (total) => `${total} damage next. Guard to reduce it by 80%.` },
    guard:   { hits: 0, scale: 0,    name: "Iron guard",
      describe: () => "Blocks half of a normal attack. Techniques pierce guard." },
    double:  { hits: 2, scale: 0.65, name: "Twin strike",
      describe: (total) => `Two rapid hits, ${total} total. Guard blunts each one.` },
    bleed:   { hits: 1, scale: 1,    name: "Rending slash", heroBleed: { turns: 2, amount: 3 },
      describe: (total) => `${total} damage, then Bleed: 3 damage over 2 turns. Bleed ignores guard.` },
    poison:  { hits: 1, scale: 0.6,  name: "Envenomed dart", heroPoison: { turns: 3, amount: 3 },
      describe: (total) => `${total} damage, then Poison: 3 damage over 3 turns. Tea clears it.` },
    drain:   { hits: 1, scale: 0.8,  name: "Qi siphon", drain: 10,
      describe: (total) => `${total} damage and siphons 10 of your Flow.` },
    concuss: { hits: 1, scale: 0.5,  name: "Pommel smash", stun: true,
      describe: (total) => `${total} damage. You lose your next turn — the rival strikes freely.` },
    mend:    { hits: 0, scale: 0,    name: "Ashen resolve", mend: 12,
      describe: () => "The rival chants and mends 12 health, washing away bleed and poison." },
  };

  /** One duel per contacted rival; tea and progress persist within the encounter. */
  function begin(kind, id = `${encounter.id}-card`) {
    const rival = DUEL_ENEMIES[kind];
    if (!rival) throw new Error(`Unknown rival: ${kind}`);
    const eliteScale = encounter.elite ? 1.35 : 1;
    const hp = Math.round(rival.hp * eliteScale);
    g.enemies = [
      {
        ...rival,
        id,
        kind,
        type: kind === "warden" ? "boss" : kind,
        hp,
        maxHp: hp,
        damage: Math.round(rival.damage * (encounter.elite ? 1.15 : 1)),
        reward: Math.round(rival.reward * (encounter.elite ? 1.5 : 1)),
        phase: 0,
        move: 0,
      },
    ];
    g.encounterDone = false;
    g.duel = {
      round: 1,
      total: roster.length,
      defeated: g.roam?.defeated ?? g.duel?.defeated ?? 0,
      tea: g.duel?.tea ?? 1,
      log: [],
      lastAction: null,
      lastDamage: 0,
      lastIncoming: 0,
      strikes: 0,
      fangStrikes: 0,
      pendantUsed: false,
      sashUsed: false,
      status: {
        hero: { bleed: null, poison: null, stunned: false },
        enemy: { bleed: null, poison: null },
      },
    };
    bus.emit("card:changed");
  }
  function intent(enemy = g.enemies[0], ahead = 0) {
    if (!enemy) return null;
    const kind = enemy.pattern[(enemy.move + ahead) % enemy.pattern.length];
    const spec = INTENTS[kind] || INTENTS.strike;
    const each = Math.round(
      enemy.damage * spec.scale * (enemy.phase ? 1.2 : 1),
    );
    const damage = spec.hits ? each * spec.hits : 0;
    return {
      kind,
      damage,
      hits: spec.hits,
      each,
      name: spec.name,
      description: spec.describe(damage),
    };
  }
  function log(text) {
    g.duel.log.unshift(text);
    g.duel.log = g.duel.log.slice(0, 8);
  }
  function defeatRival(enemy) {
    const p = g.p, d = g.duel;
    const reward = enemy.reward + (has("ashen-tally") ? 30 : 0);
    g.score += reward;
    g.totalKills++;
    p.kills++;
    p.hp = Math.min(p.maxHp, p.hp + 12);
    p.flow = Math.min(100, p.flow + 8);
    d.defeated++;
    log(`${enemy.name} falls. +${reward} Renown, +12 health, +8 Flow.`);
    g.enemies.shift();
    g.encounterDone = true;
    bus.emit("duel:won");
  }
  /** The rival's telegraphed reply, resolved from its intent spec. */
  function enemyReply(enemy, next, protect, rivalStunned) {
    const p = g.p, d = g.duel, spec = INTENTS[next.kind] || INTENTS.strike;
    if (rivalStunned) {
      log(`${enemy.name} is stunned and cannot reply.`);
      return;
    }
    if (spec.mend) {
      const healed = Math.min(spec.mend, enemy.maxHp - enemy.hp);
      enemy.hp += healed;
      d.status.enemy.bleed = null;
      d.status.enemy.poison = null;
      log(`${enemy.name} chants: +${healed} health, wounds knit closed.`);
      return;
    }
    let incoming = 0;
    for (let hit = 0; hit < spec.hits; hit++)
      incoming += Math.round(next.each * (1 - protect));
    d.lastIncoming = Math.min(p.hp, incoming);
    p.hp = Math.max(0, p.hp - incoming);
    p.damageTaken += d.lastIncoming;
    log(
      spec.hits > 1
        ? `${enemy.name} uses ${next.name.toLowerCase()}: ${spec.hits} hits, ${d.lastIncoming} damage.`
        : next.kind === "guard"
          ? `${enemy.name} holds a defensive stance.`
          : `${enemy.name} uses ${next.name.toLowerCase()}: ${d.lastIncoming} damage.`,
    );
    if (spec.heroBleed) {
      d.status.hero.bleed = { ...spec.heroBleed, fresh: true };
      log("The wound keeps bleeding.");
    }
    if (spec.heroPoison) {
      d.status.hero.poison = { ...spec.heroPoison, fresh: true };
      log("Venom creeps through your veins.");
    }
    if (spec.drain) {
      p.flow = Math.max(0, p.flow - spec.drain);
      log(`${enemy.name} siphons ${spec.drain} Flow.`);
    }
    if (spec.stun) {
      d.status.hero.stunned = true;
      log("The blow rattles you — next turn is lost.");
    }
  }
  /** End-of-turn status damage; a strong enough tick can finish either side. */
  function tickStatuses() {
    const p = g.p, d = g.duel;
    for (const side of ["hero", "enemy"]) {
      for (const kind of ["bleed", "poison"]) {
        const status = d.status[side][kind];
        if (!status || status.turns <= 0) continue;
        // Statuses land after their applying turn; they tick from the next one.
        if (status.fresh) {
          status.fresh = false;
          continue;
        }
        const target = side === "hero" ? p : g.enemies[0];
        if (!target) break;
        const damage = Math.min(target.hp, status.amount);
        target.hp = Math.max(0, target.hp - damage);
        status.turns--;
        if (!status.turns) d.status[side][kind] = null;
        log(
          side === "hero"
            ? `${kind === "bleed" ? "Bleed" : "Poison"} sears you for ${damage}.`
            : `${target.name} suffers ${damage} ${kind} damage.`,
        );
        if (side === "hero" && p.hp <= 0) {
          bus.emit("combat:defeat");
          return;
        }
      }
    }
    const enemy = g.enemies[0];
    if (enemy && enemy.hp <= 0) defeatRival(enemy);
  }
  function preview(action) {
    if (g.mode !== "playing" || !g.duel || !g.enemies.length || g.encounterDone ||
      !["attack", "guard", "technique", "tea"].includes(action)) return null;
    const p = g.p, enemy = g.enemies[0], next = intent(enemy), technique = HERO_TECHNIQUES[p.id];
    if (action === "technique" && p.flow < techniqueCost(p, g.curios) || action === "tea" && (!g.duel.tea || p.hp >= p.maxHp)) return null;
    const damage = Math.min(enemy.hp, Math.round(p.damage * p.power * (action === "attack" ? (next.kind === "guard" ? .5 : 1) : action === "technique" ? technique.multiplier : 0)));
    const lethal = damage >= enemy.hp;
    const heal = Math.min(p.maxHp - p.hp, action === "tea" ? 30 : action === "technique" ? technique.heal : 0);
    const stunned = action === "technique" && technique.stun;
    const incoming = lethal || stunned ? 0 : Math.min(p.hp + heal, Math.round(next.damage * (1 - (action === "guard" ? .8 : action === "technique" ? technique.protect : 0))));
    return { damage, incoming, lethal, heal, stunned, intent: next.kind };
  }
  function act(action, { silent = false } = {}) {
    if (g.mode !== "playing" || !g.duel || !g.enemies.length || g.encounterDone) return false;
    if (!["attack", "guard", "technique", "tea"].includes(action)) return false;
    const p = g.p, d = g.duel, enemy = g.enemies[0], next = intent(enemy);
    const cost = techniqueCost(p, g.curios);
    if (action === "technique" && p.flow < cost) return false;
    if (action === "tea" && (d.tea < 1 || p.hp >= p.maxHp)) return false;
    let damage = 0, protect = 0, stunned = false;
    d.lastAction = action;
    d.lastIncoming = 0;
    g.turns++;
    // A concussion from the rival steals this whole turn; it answers freely.
    if (d.status.hero.stunned) {
      d.status.hero.stunned = false;
      log("You reel, senses scattered — the turn is lost.");
      enemyReply(enemy, next, 0, false);
      enemy.move++;
      tickStatuses();
      if (p.hp > 0 && g.enemies.length) d.round++;
      else if (p.hp <= 0 && !g.encounterDone) bus.emit("combat:defeat");
      bus.emit("card:changed");
      return true;
    }
    if (action === "attack") {
      d.strikes++;
      d.fangStrikes++;
      damage = Math.round(p.damage * p.power * (next.kind === "guard" ? 0.5 : 1));
      if (has("twin-irons") && d.strikes % 3 === 0) {
        damage = Math.round(damage * 1.5);
        log("The twin irons ring — a heavy follow-through!");
      }
      if (has("rending-fang") && d.fangStrikes % 4 === 0 && enemy.hp > damage) {
        d.status.enemy.bleed = { turns: 2, amount: 3, fresh: true };
        log("The rending fang opens a bleeding wound.");
      }
      p.flow = Math.min(100, p.flow + 12 + p.flowBonus);
      if (!silent) bus.emit("audio:sfx", { type: "strike" });
    } else if (action === "guard") {
      protect = 0.8;
      p.flow = Math.min(100, p.flow + 20);
      log("You guard and gather 20 Flow.");
      if (has("jade-pendant") && !d.pendantUsed) {
        d.pendantUsed = true;
        const pendantHeal = Math.min(6, p.maxHp - p.hp);
        p.hp += pendantHeal;
        if (pendantHeal) log(`The jade pendant glows: +${pendantHeal} health.`);
      }
      if (!silent) bus.emit("audio:sfx", { type: "dodge" });
    } else if (action === "tea") {
      const healed = Math.min(30 + (has("river-charm") ? 15 : 0), p.maxHp - p.hp);
      p.hp += healed;
      d.tea--;
      const cleansed = [];
      if (d.status.hero.bleed) { d.status.hero.bleed = null; cleansed.push("bleed"); }
      if (d.status.hero.poison) { d.status.hero.poison = null; cleansed.push("poison"); }
      log(`Healing tea restores ${healed} health${cleansed.length ? ` and clears ${cleansed.join(" and ")}` : ""}. The enemy still takes its turn.`);
      if (!silent) bus.emit("audio:sfx", { type: "heal" });
    } else {
      const technique = HERO_TECHNIQUES[p.id];
      p.flow -= cost;
      damage = Math.round(p.damage * p.power * technique.multiplier);
      p.hp = Math.min(p.maxHp, p.hp + technique.heal);
      protect = technique.protect;
      stunned = technique.stun;
      if (has("shadow-sash") && !d.sashUsed) {
        d.sashUsed = true;
        protect = Math.max(protect, 0.5);
        log("The shadow sash unfurls — half the reply slips past.");
      }
      if (has("monk-beads") && stunned) {
        p.flow = Math.min(100, p.flow + 15);
        log("The monk's beads hum: +15 Flow.");
      }
      if (has("venom-vial")) {
        d.status.enemy.poison = { turns: 3, amount: 3, fresh: true };
        log("The venom vial's residue coats your technique.");
      }
      if (!silent) bus.emit("audio:sfx", { type: "special", param: p.id });
    }
    d.lastDamage = Math.min(enemy.hp, damage);
    enemy.hp = Math.max(0, enemy.hp - damage);
    if (damage) log(`${action === "technique" ? p.skill : "Your strike"} deals ${d.lastDamage} damage.`);
    if (enemy.hp <= 0) {
      defeatRival(enemy);
    } else {
      enemyReply(enemy, next, protect, stunned);
      enemy.move++;
      if (enemy.type === "boss" && enemy.phase === 0 && enemy.hp <= enemy.maxHp / 2) {
        enemy.phase = 1;
        log("The Warden enters his second stance. Incoming damage rises by 20%.");
        bus.emit("boss:phase", { name: "Warden · Unbroken fury" });
      }
      if (p.hp > 0 && g.enemies.length) {
        tickStatuses();
        if (p.hp > 0 && g.enemies.length) d.round++;
      } else if (p.hp <= 0 && !g.encounterDone) bus.emit("combat:defeat");
    }
    bus.emit("card:changed");
    return true;
  }
  return { act, preview, intent, begin, clearInput() {}, step() {} };
}
