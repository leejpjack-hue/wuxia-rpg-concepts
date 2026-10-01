import { DUEL_ROSTERS, DUEL_ENEMIES, HERO_TECHNIQUES } from "../content/duels.js";
import { techniqueCost } from "../content/curios.js";
import { HEROES } from "../content/heroes.js";
import { oathFor, signatureById, specialFor } from "../content/expansion.js";

/** Fixed small assist bump (WU-PARTY-09I). Modest vs hero strikes (~19–40). */
export const ASSIST_DAMAGE = 8;

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
  function begin(kind, id = `${encounter.id}-card`, opening = false) {
    const rival = DUEL_ENEMIES[kind];
    if (!rival) throw new Error(`Unknown rival: ${kind}`);
    const eliteScale = encounter.scale ?? (encounter.elite ? 1.35 : 1);
    const damageScale = encounter.damageScale ?? (encounter.elite ? 1.15 : 1);
    const hp = Math.round(rival.hp * eliteScale);
    g.enemies = [
      {
        ...rival,
        id,
        kind,
        type: rival.boss ? "boss" : kind,
        hp,
        maxHp: hp,
        damage: Math.round(rival.damage * damageScale),
        reward: Math.round(rival.reward * (encounter.elite ? 1.5 : 1)),
        phase: 0,
        move: 0,
        focus: 0,
        specialAt: specialFor(kind)?.focus || 3,
      },
    ];
    g.encounterDone = false;
    g.duel = {
      round: 1,
      total: roster.length,
      defeated: g.roam?.defeated ?? g.duel?.defeated ?? 0,
      tea: g.duel?.tea ?? g.p.teaPots ?? 1,
      log: [],
      lastAction: null,
      lastDamage: 0,
      lastIncoming: 0,
      strikes: 0,
      fangStrikes: 0,
      pendantUsed: false,
      sashUsed: false,
      charged: 0,
      // WU-PARTY-09I: one free assist strike per duel (no Flow; no follower HP).
      assistUsed: false,
      assistReady: false,
      assistLimit: 1 + (g.assistLimitBonus || 0),
      openingStun: opening,
      status: {
        hero: { bleed: null, poison: null, stunned: false },
        enemy: { bleed: null, poison: null },
      },
    };
    bus.emit("card:changed");
  }
  function intent(enemy = g.enemies[0], ahead = 0) {
    if (!enemy) return null;
    // Focus full: the rival's telegraphed special replaces its next intent.
    const special = specialFor(enemy.kind);
    if (special && ahead === 0 && (enemy.focus || 0) >= (enemy.specialAt || special.focus || 3)) {
      const each = Math.round(enemy.damage * special.scale * (enemy.phase ? 1.2 : 1));
      const damage = special.hits ? each * special.hits : each;
      const effects = [
        special.heroBleed ? "bleed" : "",
        special.heroPoison ? "poison" : "",
        special.drain ? `siphons ${special.drain} Flow` : "",
        special.stun ? "stuns" : "",
        special.mend ? `mends ${special.mend}` : "",
        special.hits ? `${special.hits} hits` : "",
      ].filter(Boolean).join(", ");
      return {
        kind: "special",
        damage,
        hits: special.hits || 1,
        each,
        name: special.name,
        description: `SPECIAL — ${damage} damage${effects ? `, ${effects}` : ""}. A technique or ambush breaks the gathering.`,
        special: true,
      };
    }
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
    const p = g.p, d = g.duel;
    const special = specialFor(enemy.kind);
    const spec = next.special
      ? { hits: next.hits, heroBleed: special?.heroBleed, heroPoison: special?.heroPoison,
          drain: special?.drain, stun: special?.stun, mend: special?.mend }
      : INTENTS[next.kind] || INTENTS.strike;
    if (rivalStunned) {
      log(`${enemy.name} is stunned and cannot reply.`);
      return;
    }
    // First blood or a sneak ambush on the pass: the duel opens reeling.
    if (d.openingStun) {
      d.openingStun = false;
      log(`${enemy.name} reels from your ambush and cannot reply.`);
      return;
    }
    if (next.special) {
      enemy.focus = 0;
      enemy.specialAt = special?.focus || 3;
      log(`${enemy.name} unleashes ${next.name}!`);
    } else {
      enemy.focus = (enemy.focus || 0) + 1;
      enemy.specialAt = special?.focus || 3;
      if (special && enemy.focus === enemy.specialAt - 1)
        log(`${enemy.name} gathers power — the next blow will be ${next.special ? "" : ""}special.`);
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
    const signature = signatureById(g.p.id);
    if (!["attack", "guard", "technique", "tea", "signature"].includes(action)) return false;
    if (action === "signature" && !signature) return false;
    const p = g.p, d = g.duel, enemy = g.enemies[0], next = intent(enemy);
    const cost = techniqueCost(p, g.curios);
    if (action === "technique" && p.flow < cost) return false;
    if (action === "tea" && (d.tea < 1 || p.hp >= p.maxHp)) return false;
    if (action === "signature" && p.flow < (signature?.flow ?? 25)) return false;
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
      if (d.charged) {
        damage = Math.round(damage * d.charged);
        d.charged = 0;
        log("The wound-up strike lands with full force!");
      }
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
    } else if (action === "signature") {
      // Hero signature: a fifth, Flow-gated action shaped by its archetype.
      p.flow -= signature.flow;
      const base = p.damage * p.power;
      const statused = !!(d.status.enemy.bleed || d.status.enemy.poison);
      if (signature.archetype === "counter") {
        protect = signature.power;
        damage = Math.round(base * signature.damage);
        if (signature.heal) p.hp = Math.min(p.maxHp, p.hp + signature.heal);
        log(`${p.skill !== signature.name ? signature.name : "Your counter"}: ${signature.cn} — strike and brace.`);
      } else if (signature.archetype === "focusGuard") {
        protect = signature.power;
        enemy.focus = 0;
        if (signature.heal) p.hp = Math.min(p.maxHp, p.hp + signature.heal);
        log("The roar scatters the rival's gathering power.");
      } else if (signature.archetype === "bleedCut") {
        damage = Math.round(base * signature.damage);
        d.status.enemy.bleed = { ...signature.bleed, fresh: true };
        log("The cut leaves a bleeding wound.");
      } else if (signature.archetype === "execute") {
        damage = Math.round(base * signature.damage * (statused ? 1 + signature.bonus : 1));
        protect = signature.power || 0;
        if (statused) log("The wound opens wide — the marked cut bites deep!");
      } else if (signature.archetype === "charged") {
        d.charged = signature.charged;
        protect = signature.power;
        log(`You wind the blow — your next Strike deals ${Math.round(signature.charged * 100)}%.`);
      } else if (signature.archetype === "cleanse") {
        d.status.hero.bleed = null;
        d.status.hero.poison = null;
        p.hp = Math.min(p.maxHp, p.hp + signature.heal);
        if (signature.refreshAssist) d.assistUsed = false;
        log("The signal rallies the line — wounds steadied, allies ready.");
      } else if (signature.archetype === "drainStrike") {
        damage = Math.round(base * signature.damage);
        p.flow = Math.min(100, p.flow + signature.drain);
        log(`The grapple returns ${signature.drain} Flow to you.`);
      } else if (signature.archetype === "doubleSig") {
        damage = Math.round(base * signature.damage) * (signature.hits || 2);
        log(`Both beats land — ${signature.hits || 2} strikes in one turn.`);
      } else if (signature.archetype === "vanish") {
        protect = 1;
        d.status.enemy.bleed = { ...signature.bleed, fresh: true };
        log("You melt into the mist — the reply finds only air, and a cut.");
      }
      if (!silent) bus.emit("audio:sfx", { type: "special", param: p.id });
    } else {
      const technique = HERO_TECHNIQUES[p.id];
      p.flow -= cost;
      damage = Math.round(p.damage * p.power * technique.multiplier);
      p.hp = Math.min(p.maxHp, p.hp + technique.heal);
      protect = technique.protect;
      stunned = technique.stun;
      // Landing a technique breaks a gathering special.
      if (enemy.focus) {
        enemy.focus = 0;
        log("Your technique breaks the rival's gathering!");
      }
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
    if (damage) {
      log(`${action === "technique" ? p.skill : "Your strike"} deals ${d.lastDamage} damage.`);
      // Assist unlocks after lead deals outgoing damage this duel.
      d.assistReady = true;
    }
    if (enemy.hp <= 0) {
      defeatRival(enemy);
    } else {
      enemyReply(enemy, next, protect, stunned);
      enemy.move++;
      if (enemy.type === "boss" && enemy.phase === 0 && enemy.hp <= enemy.maxHp / 2) {
        enemy.phase = 1;
        log(`${enemy.name} enters a second stance. Incoming damage rises by 20%.`);
        bus.emit("boss:phase", { name: `${enemy.name} · second stance` });
      }
      if (p.hp > 0 && g.enemies.length) {
        tickStatuses();
        if (p.hp > 0 && g.enemies.length) d.round++;
      } else if (p.hp <= 0 && !g.encounterDone) bus.emit("combat:defeat");
    }
    bus.emit("card:changed");
    return true;
  }
  /**
   * WU-PARTY-09I: once-per-duel free assist strike from first party follower.
   * Pure damage flavor — no Flow cost, no follower HP, no tag-in.
   */
  function assistStrike() {
    if (g.mode !== "playing" || !g.duel || !g.enemies.length || g.encounterDone) return false;
    const d = g.duel;
    if ((d.assistUsed ? 1 : 0) >= (d.assistLimit || 1) || !d.assistReady) return false;
    const followers = g.party?.followers;
    if (!Array.isArray(followers) || !followers.length) return false;
    const followerId = followers[0];
    const follower = HEROES.find((h) => h.id === followerId);
    if (!follower) return false;
    const enemy = g.enemies[0];
    // Oath bonds: fielding an oath pair empowers the assist.
    const oath = oathFor([g.p.id, ...(g.party?.followers || [])]);
    const multiplier = oath ? oath.assistMultiplier : 1;
    let dealt = Math.min(enemy.hp, Math.round(ASSIST_DAMAGE * multiplier));
    enemy.hp = Math.max(0, enemy.hp - dealt);
    d.assistUsed = true;
    d.lastDamage = dealt;
    if (oath) {
      g.p.flow = Math.min(100, g.p.flow + oath.assistFlow);
      log(`${follower.name} answers the ${oath.name} (${oath.cn}): ${dealt} damage, +${oath.assistFlow} Flow.`);
    } else log(`${follower.name} assists: ${dealt} damage.`);
    bus.emit("audio:sfx", { type: "strike" });
    if (enemy.hp <= 0) defeatRival(enemy);
    bus.emit("card:changed");
    bus.emit("notice", { text: `${follower.name} assists (+${dealt} damage)` });
    return { followerId, followerName: follower.name, damage: dealt, oath: oath?.name || null };
  }
  return { act, preview, intent, begin, assistStrike, clearInput() {}, step() {} };
}
