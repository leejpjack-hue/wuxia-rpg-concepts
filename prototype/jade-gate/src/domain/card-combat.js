import { DUEL_ENEMIES, DUEL_ROSTERS, HERO_TECHNIQUES } from "../content/duels.js";
import { createRoam } from "./roam.js";

/**
 * Creates turn-based Card Combat adapter injected into GameSession.
 *
 * Implements the card duel contract:
 * - 1 action per turn (Strike, Guard, Technique, Tea)
 * - 0 or 1 rival reply per turn
 * - Exact preview of rival incoming damage
 * - Flow accumulation and spending
 * - Shared healing tea pot per encounter
 * - Contact hand-off from roaming pass
 */
export function createCardCombat(g, bus, { seed = 1 } = {}) {
  const encounter = g?.encounter || { id: g?.act?.encounters?.[g?.encounterIndex || 0]?.id || "vanguard" };
  const hero = g?.p;
  const technique = HERO_TECHNIQUES[hero?.id] || HERO_TECHNIQUES["zhao-yun"];

  const roam = createRoam(encounter, hero, { g, shallows: g?.shallows });

  let duel = null;
  let teaCharges = 1;
  let heroGuarding = false;
  let rivalGuarding = false;

  function sfx(type, param) {
    bus?.emit?.("audio:sfx", { type, param });
  }

  function startDuel(rival) {
    const enemyDef = DUEL_ENEMIES[rival.enemyId] || DUEL_ENEMIES["guard"];
    duel = {
      rival,
      enemyDef,
      hp: rival.hp,
      maxHp: rival.maxHp,
      round: 1,
      moveIndex: 0,
      nextMove: enemyDef.moves[0],
      log: [],
    };
    bus?.emit?.("state:changed", {
      current: "playing",
      boss: !!enemyDef.boss,
      phase: "duel",
    });
  }

  function getIncomingDamage() {
    if (!duel || !duel.nextMove) return 0;
    return duel.nextMove.damage || 0;
  }

  function advanceRivalIntent() {
    if (!duel || !duel.enemyDef) return;
    const moves = duel.enemyDef.moves;
    duel.moveIndex = (duel.moveIndex + 1) % moves.length;
    duel.nextMove = moves[duel.moveIndex];
  }

  return {
    roam,
    get duel() {
      return duel;
    },
    get teaCharges() {
      return teaCharges;
    },
    get nextMove() {
      return duel?.nextMove || null;
    },
    get incomingDamage() {
      return getIncomingDamage();
    },

    step(dt, input) {
      if (!duel) {
        const contacted = roam.step(dt, input);
        if (contacted) {
          startDuel(contacted);
        }
      }
    },

    strike() {
      if (!duel) return false;
      const power = hero.power || 1.0;
      let dmg = Math.round((hero.damage || 20) * power);
      if (rivalGuarding) dmg = Math.round(dmg * 0.5);

      duel.hp -= dmg;
      hero.flow = Math.min(100, (hero.flow || 0) + 12 + (hero.flowBonus || 0));
      sfx("strike");
      bus?.emit?.("combat:hit", { damage: dmg, enemyId: duel.rival.id });

      if (duel.hp <= 0) {
        return this.finishDuel(true);
      }

      this.resolveRivalReply();
      return true;
    },

    guard() {
      if (!duel) return false;
      heroGuarding = true;
      hero.flow = Math.min(100, (hero.flow || 0) + 20);
      sfx("dodge");
      this.resolveRivalReply();
      heroGuarding = false;
      return true;
    },

    technique() {
      if (!duel) return false;
      const cost = hero.cost || technique.cost;
      if (hero.flow < cost) return false;

      hero.flow -= cost;
      const power = hero.power || 1.0;
      let dmg = Math.round((hero.damage || 20) * power * technique.multiplier);
      duel.hp -= dmg;

      if (technique.heal) {
        hero.hp = Math.min(hero.maxHp, hero.hp + technique.heal);
      }

      sfx("special", hero.id);
      bus?.emit?.("combat:hit", { damage: dmg, enemyId: duel.rival.id });

      if (duel.hp <= 0) {
        return this.finishDuel(true);
      }

      if (!technique.stunReply) {
        const factor = technique.replyFactor || 1.0;
        this.resolveRivalReply(factor);
      } else {
        advanceRivalIntent();
      }
      return true;
    },

    tea() {
      if (!duel || teaCharges <= 0 || hero.hp >= hero.maxHp) return false;
      teaCharges--;
      hero.hp = Math.min(hero.maxHp, hero.hp + 30);
      sfx("heal");
      this.resolveRivalReply();
      return true;
    },

    resolveRivalReply(damageFactor = 1.0) {
      if (!duel || duel.hp <= 0) return;
      const move = duel.nextMove;
      let replyDmg = Math.round((move.damage || 0) * damageFactor);

      if (move.intent === "guard") {
        rivalGuarding = true;
      } else {
        rivalGuarding = false;
      }

      if (replyDmg > 0) {
        if (heroGuarding) {
          replyDmg = Math.round(replyDmg * 0.2); // Block 80% damage
        }
        hero.hp = Math.max(0, hero.hp - replyDmg);
        sfx("hurt");
      }

      advanceRivalIntent();
      duel.round++;

      if (hero.hp <= 0) {
        bus?.emit?.("combat:defeat");
      }
    },

    finishDuel(won) {
      if (!won) {
        bus?.emit?.("combat:defeat");
        return;
      }

      const rival = duel.rival;
      const cleared = roam.defeatRival(rival.id);

      // Defeating a rival restores 12 health and 8 Flow
      hero.hp = Math.min(hero.maxHp, hero.hp + 12);
      hero.flow = Math.min(100, (hero.flow || 0) + 8);
      g.score = (g.score || 0) + (rival.boss ? 500 : 100);
      duel = null;

      if (cleared) {
        g.encounterDone = true;
        bus?.emit?.("combat:cleared");
      }
    },

    clearInput() {},
  };
}
