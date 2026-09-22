import { clamp, distance } from "./math.js";
import { BOSSES } from "../content/campaign.js";
import { bossPhase } from "./encounters.js";
export function updateEnemy(g, e, dt, { effect, hurt, sfx, bus }) {
  if (e.hp <= 0) return;
  e.flash = Math.max(0, e.flash - dt);
  e.stun = Math.max(0, e.stun - dt);
  if (e.type === "boss") {
    const phases = BOSSES[e.bossId].phases;
    const next = e.phase + 1;
    if (phases[next] && e.hp / e.maxHp <= phases[next].at) {
      e.phase = next;
      e.wind = 0;
      e.target = null;
      e.cd = 0.6;
      e.burst = 0;
      e.stun = 0.3;
      bus.emit("boss:phase", {
        id: e.bossId,
        phase: next,
        name: phases[next].name,
      });
      effect("ring", { x: e.x, y: e.y, r: 160, color: "#e58a76" }, 0.7);
    }
  }
  if (e.stun > 0) return;
  const p = g.p,
    d = distance(p, e),
    phase = bossPhase(e);
  e.facing = Math.atan2(p.y - e.y, p.x - e.x);
  e.cd -= dt;
  if (e.wind > 0) {
    e.wind -= dt;
    if (e.wind <= 0) {
      const t = e.target;
      if (e.type === "archer") {
        const dx = t.x - e.x,
          dy = t.y - e.y,
          n = Math.hypot(dx, dy) || 1;
        g.shots.push({
          id: `${e.id}-${e.attacks}`,
          x: e.x,
          y: e.y,
          vx: (dx / n) * 330,
          vy: (dy / n) * 330,
          life: 3,
          damage: e.damage,
        });
        sfx("arrow_shoot");
      } else {
        effect("ring", { x: t.x, y: t.y, r: t.r, color: "#e5a37b" }, 0.35);
        if (Math.hypot(p.x - t.x, (p.y - t.y) / 0.65) < t.r)
          hurt(phase?.damage || e.damage, `${e.id}-${e.attacks}`);
      }
      e.attacks++;
      e.target = null;
      if (phase && e.burst < phase.bursts - 1) {
        e.burst++;
        e.cd = 0.12;
      } else {
        e.burst = 0;
        e.cd = phase?.cooldown || 1.5;
      }
    }
    return;
  }
  const range = e.type === "archer" ? 355 : e.type === "boss" ? 180 : 83;
  if (e.cd <= 0 && d < range) {
    e.wind = phase?.wind || (e.type === "archer" ? 0.95 : 0.72);
    e.windMax = e.wind;
    e.target = { x: p.x, y: p.y, r: phase?.radius || 64 };
    sfx("enemy_windup");
  } else if (d > (e.type === "archer" ? 260 : 55)) {
    e.x += Math.cos(e.facing) * e.speed * dt;
    e.y += Math.sin(e.facing) * e.speed * 0.7 * dt;
  } else if (e.type === "archer" && d < 190) {
    e.x -= Math.cos(e.facing) * e.speed * dt;
    e.y -= Math.sin(e.facing) * e.speed * 0.7 * dt;
  }
  e.x = clamp(e.x, 135, 1145);
  e.y = clamp(e.y, 300, 650);
}
