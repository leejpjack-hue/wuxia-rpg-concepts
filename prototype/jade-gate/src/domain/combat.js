import { clamp, distance, inArc } from "./math.js";
import { takeDamage } from "./player.js";
import { updateEnemy } from "./enemy-ai.js";
import { seededRandom } from "../engine/clock.js";
/** Browser-independent combat. Commands enter; domain events leave. */
export function createCombat(g, bus, { seed = 1 } = {}) {
  let keys = new Set();
  let pendingActions = [];
  const random = seededRandom(seed);
  const sfx = (type, param) => bus.emit("audio:sfx", { type, param });
  function effect(kind, props, life = 0.5) {
    g.effects.push({ kind, ...props, life, max: life });
  }
  function floating(x, y, text, color = "#fff0c3", big = false) {
    effect("text", { x, y, text: String(text), color, big }, 0.8);
  }
  function nearest() {
    return [...g.enemies].sort(
      (a, b) => distance(a, g.p) - distance(b, g.p),
    )[0];
  }

  function hit(e, amount, knock = 20, stun = 0.16) {
    if (e.hp <= 0) return;
    const p = g.p;
    const dmg = Math.round(amount);
    e.hp -= dmg;
    e.flash = 0.14;
    if (e.type !== "boss" || stun >= 0.6) {
      e.stun = Math.max(e.stun, stun);
      e.wind = 0;
      e.target = null;
      e.cd = Math.max(e.cd, 0.45);
      e.burst = 0;
    } else {
      knock = 0;
    }
    const angle = Math.atan2(e.y - p.y, e.x - p.x);
    e.x = clamp(e.x + Math.cos(angle) * knock, 135, 1145);
    e.y = clamp(e.y + Math.sin(angle) * knock, 290, 655);
    p.flow = clamp(p.flow + 7 + p.flowBonus, 0, 100);
    p.combo++;
    p.comboTime = 2.4;
    floating(e.x, e.y - 95, dmg, p.color);
    for (let i = 0; i < 5; i++)
      effect(
        "spark",
        {
          x: e.x,
          y: e.y - 40,
          vx: (random() - 0.5) * 95,
          vy: (random() - 0.5) * 75,
          color: p.color,
        },
        0.3,
      );
    g.shake = Math.max(g.shake, 3);
    g.hitStop = 0.025;
    bus.emit("combat:hit", { enemyId: e.id, damage: dmg });
    if (e.hp <= 0) {
      p.kills++;
      g.totalKills++;
      g.score += e.type === "boss" ? 700 : 100 + Math.min(15, p.combo) * 5;
      if (g.totalKills % 3 === 0) g.pickups.push({ x: e.x, y: e.y });
      sfx(e.type === "boss" ? "finisher" : "hit", true);
    } else {
      sfx("hit", e.type === "boss");
    }
  }

  function attack() {
    if (g.mode !== "playing" || g.p.attackCD > 0) return;
    const p = g.p,
      t = nearest();
    if (t && distance(p, t) < p.reach + 65)
      p.facing = Math.atan2(t.y - p.y, t.x - p.x);
    p.attackCD = p.rate;
    p.attackAnim = 0.23;
    p.chain = ((p.chain || 0) % 3) + 1;
    p.chainTime = 1.1;
    const finisher = p.chain === 3;
    effect(
      "slash",
      { x: p.x, y: p.y, angle: p.facing, r: p.reach * 0.8, color: p.color },
      0.22,
    );
    for (const e of g.enemies) {
      if (inArc(p, e, p.reach))
        hit(e, p.damage * p.power * (finisher ? 1.3 : 1));
    }
    if (finisher) {
      floating(p.x, p.y - 145, "FINISHER", p.color);
      sfx("finisher");
    } else {
      sfx("strike", (p.combo % 3) + 1);
    }
  }

  function dodge() {
    if (g.mode !== "playing" || g.p.dodgeCD > 0) return;
    const p = g.p;
    let x =
        (keys.has("KeyD") || keys.has("ArrowRight") ? 1 : 0) -
        (keys.has("KeyA") || keys.has("ArrowLeft") ? 1 : 0),
      y =
        (keys.has("KeyS") || keys.has("ArrowDown") ? 1 : 0) -
        (keys.has("KeyW") || keys.has("ArrowUp") ? 1 : 0);
    if (!x && !y) {
      x = Math.cos(p.facing);
      y = Math.sin(p.facing);
    }
    const n = Math.hypot(x, y);
    p.dx = x / n;
    p.dy = y / n;
    p.dash = 0.22;
    p.invulnerable = 0.36;
    p.perfectWindow = 0.12;
    p.dodgeCD = p.id === "hu-sanniang" ? 0.8 : 1.05;
    effect("ring", { x: p.x, y: p.y, r: 55, color: p.color }, 0.3);
    sfx("dodge");
  }

  function special() {
    if (g.mode !== "playing") return;
    const p = g.p;
    if (p.flow < p.cost || p.specialCD > 0) {
      bus.emit("notice", {
        text:
          p.flow < p.cost
            ? "Strike enemies to build Flow"
            : "Technique is recovering",
      });
      return;
    }
    p.flow -= p.cost;
    p.specialCD = 3.2;
    p.attackAnim = 0.4;
    p.invulnerable = 0.55;
    const t = nearest();
    if (t) p.facing = Math.atan2(t.y - p.y, t.x - p.x);
    bus.emit("notice", { text: p.skill });
    sfx("special", p.id);
    g.shake = 8;
    if (p.id === "zhao-yun") {
      const x = p.x,
        y = p.y;
      const dx = Math.cos(p.facing),
        dy = Math.sin(p.facing);
      for (const e of g.enemies) {
        const ex = e.x - x,
          ey = e.y - y;
        const along = ex * dx + ey * dy,
          cross = Math.abs(ex * dy - ey * dx);
        if (along > -35 && along < 310 && cross < 70)
          hit(e, p.damage * p.power * 2.8, 45, 0.7);
      }
      p.x = clamp(x + dx * 240, 135, 1145);
      p.y = clamp(y + dy * 240, 300, 650);
      effect("slash", { x, y, angle: p.facing, r: 260, color: p.color }, 0.45);
    } else {
      const range =
        p.id === "lu-zhishen" ? 220 : p.id === "hu-sanniang" ? 190 : 250;
      for (const e of g.enemies)
        if (
          distance(p, e) < range &&
          (p.id !== "lu-bu" || inArc(p, e, range, 1.8))
        )
          hit(
            e,
            p.damage * p.power * (p.id === "hu-sanniang" ? 4 : 2.6),
            p.id === "lu-zhishen" ? 90 : 50,
            p.id === "lu-zhishen" ? 1.8 : 0.8,
          );
      effect("ring", { x: p.x, y: p.y, r: range, color: p.color }, 0.65);
      effect(
        "slash",
        { x: p.x, y: p.y, angle: p.facing, r: range * 0.85, color: p.color },
        0.4,
      );
    }
  }

  function hurt(amount, attackId = "impact") {
    const p = g.p;
    if (p.perfectWindow > 0 && p.lastEvaded !== attackId) {
      p.lastEvaded = attackId;
      p.flow = clamp(p.flow + 10, 0, 100);
      floating(p.x, p.y - 110, "PERFECT EVADE", p.color);
      bus.emit("combat:evade", { attackId });
    }
    if (takeDamage(p, amount)) {
      floating(p.x, p.y - 105, `−${amount}`, "#ffb3a3");
      g.shake = 6;
      sfx("hurt");
    }
  }

  function update(dt) {
    g.time += dt;
    g.waveTime += dt;
    const p = g.p;
    for (const key of [
      "attackCD",
      "dodgeCD",
      "specialCD",
      "invulnerable",
      "dash",
      "attackAnim",
      "comboTime",
      "perfectWindow",
      "chainTime",
    ])
      p[key] = Math.max(0, p[key] - dt);
    if (!p.comboTime) p.combo = 0;
    if (!p.chainTime) p.chain = 0;

    let mx =
        (keys.has("KeyD") || keys.has("ArrowRight") ? 1 : 0) -
        (keys.has("KeyA") || keys.has("ArrowLeft") ? 1 : 0),
      my =
        (keys.has("KeyS") || keys.has("ArrowDown") ? 1 : 0) -
        (keys.has("KeyW") || keys.has("ArrowUp") ? 1 : 0);
    p.moving = !!(mx || my);
    if (p.dash > 0) {
      p.x += p.dx * 850 * dt;
      p.y += p.dy * 650 * dt;
    } else if (p.moving) {
      const n = Math.hypot(mx, my);
      p.x += (mx / n) * p.speed * dt;
      p.y += (my / n) * p.speed * 0.72 * dt;
      p.facing = Math.atan2(my, mx);
    }
    p.x = clamp(p.x, 135, 1145);
    p.y = clamp(p.y, 300, 650);
    if (keys.has("KeyJ")) attack();

    for (const e of g.enemies)
      updateEnemy(g, e, dt, { effect, hurt, sfx, bus });

    for (let i = 0; i < g.enemies.length; i++)
      for (let j = i + 1; j < g.enemies.length; j++) {
        const a = g.enemies[i],
          b = g.enemies[j],
          d = distance(a, b);
        if (d > 0 && d < a.radius + b.radius) {
          const push = (a.radius + b.radius - d) * 0.5;
          const dx = (b.x - a.x) / d,
            dy = (b.y - a.y) / d;
          a.x -= dx * push;
          a.y -= dy * push;
          b.x += dx * push;
          b.y += dy * push;
        }
      }

    for (const s of g.shots) {
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt;
      if (distance(s, p) < 25) {
        hurt(s.damage, s.id);
        s.life = 0;
      }
    }
    g.shots = g.shots.filter(
      (s) => s.life > 0 && s.x > 90 && s.x < 1190 && s.y > 260 && s.y < 700,
    );

    g.pickups = g.pickups.filter((h) => {
      if (distance(h, p) < 38) {
        p.hp = Math.min(p.maxHp, p.hp + 18);
        floating(p.x, p.y - 100, "+18 health", "#c4edb0");
        sfx("heal");
        return false;
      }
      return true;
    });

    g.enemies = g.enemies.filter((e) => e.hp > 0);
    g.effects.forEach((e) => (e.life -= dt));
    g.effects = g.effects.filter((e) => e.life > 0);
    g.shake = Math.max(0, g.shake - dt * 30);

    if (p.hp <= 0) {
      g.encounterDone = true;
      bus.emit("combat:defeat");
    } else if (g.enemies.length === 0) {
      g.encounterDone = true;
      bus.emit("combat:cleared");
    }
  }

  return {
    step(dt, input = {}) {
      if (g.mode !== "playing" || g.encounterDone) return;
      keys = input.keys || new Set();
      pendingActions.push(...(input.actions || []));
      pendingActions = pendingActions.slice(-8);
      if (g.hitStop > 0) {
        g.hitStop = Math.max(0, g.hitStop - dt);
        return;
      }
      for (const command of pendingActions.splice(0)) {
        if (command === "dodge") dodge();
        if (command === "technique") special();
        if (command === "strike") attack();
      }
      update(dt);
    },
    clearInput() {
      keys.clear();
      pendingActions = [];
    },
    attack,
    dodge,
    special,
    hurt,
    hit,
  };
}
