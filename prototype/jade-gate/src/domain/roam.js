import { distance } from './math.js';
import { groundPoint, GROUND, onGround } from './ground.js';
import { FixedClock, seededRandom } from '../engine/clock.js';
import { DUEL_ROSTERS, DUEL_ENEMIES, HERO_TECHNIQUES } from '../content/duels.js';
import { techniqueCost } from '../content/curios.js';
export const ARENA = { width: 1280, height: 720, margin: 64, top: GROUND.top };
export const PLAYER_SPEED = 300;
export const SHALLOWS_ROAM_SPEED_FACTOR = .65;
export const isRanged = kind => kind === 'archer' || kind === 'skiff-archer';
export function isRoamInShallows(encounter, g) {
  return !!(g?.shallows || encounter?.hazards?.includes('shallows') || g?.hazards?.includes('shallows'));
}
function segmentDistance(p, a, b) {
  const dx = b.x-a.x, dy = b.y-a.y, length = dx*dx+dy*dy;
  const t = length ? Math.max(0, Math.min(1, ((p.x-a.x)*dx+(p.y-a.y)*dy)/length)) : 0;
  return Math.hypot(p.x-a.x-t*dx, p.y-a.y-t*dy);
}

/** Grounded exploration. Melee contact opens duels; archers fight in real time. */
export function createRoam(g, bus, { encounter } = {}) {
  const roster = DUEL_ROSTERS[encounter?.id];
  if (!roster) throw new Error('This encounter has no arena rivals yet.');
  const clock = new FixedClock(), pending = [];
  let serial = 0;
  const field = roster.map((kind, index) => {
    const def = DUEL_ENEMIES[kind];
    const position = groundPoint(ARENA.margin + (ARENA.width-2*ARENA.margin)*(index+.5)/roster.length, 325+((index+1)%2)*105);
    // Elite encounters field hardened rivals.
    const eliteScale = encounter.elite ? 1.35 : 1;
    return { ...def, hp: Math.round(def.hp*eliteScale), damage: Math.round(def.damage*(encounter.elite?1.15:1)),
      reward: Math.round(def.reward*(encounter.elite?1.5:1)), ...position, id: `${encounter.id}-field-${index}`, kind,
      maxHp: Math.round(def.hp*eliteScale), ranged: isRanged(kind), radius: 36,
      speed: kind === 'warden' ? 70 : 55+index*10,
      homeX: position.x, homeY: position.y, tx: position.x, ty: position.y,
      timer: 0, cooldown: 1.4+index*.4, windup: 0, aim: null,
      rng: seededRandom(1337+g.encounterIndex*7+index*131) };
  });
  Object.assign(g.p, { x: 640, y: 500 });
  g.roam = { field, contact: -1, defeated: 0, shots: [], effects: [],
    strikeCD: 0, dodgeCD: 0, invulnerable: 0, dash: 0, facingX: 1, facingY: 0 };
  const roam = g.roam;
  function effect(kind, x, y, text = '') {
    roam.effects.push({ id: ++serial, kind, x, y, text, life: .55 });
  }
  function act(action) {
    if (g.mode !== 'exploring' || roam.contact >= 0) return false;
    if (action === 'dodge') {
      if (roam.dodgeCD > 0) return false;
      roam.dodgeCD = 1.2; roam.invulnerable = .3; roam.dash = .18;
      bus.emit('audio:sfx', { type: 'dodge' }); return true;
    }
    if (!['strike', 'technique'].includes(action) || roam.strikeCD > 0) return false;
    if (action === 'technique' && g.p.flow < techniqueCost(g.p, g.curios)) return false;
    const targets = field.filter(e => e.ranged && distance(e, g.p) < (action === 'technique' ? 280 : 175));
    roam.strikeCD = action === 'technique' ? .8 : .38;
    if (action === 'technique') g.p.flow -= techniqueCost(g.p, g.curios);
    effect(action, g.p.x, g.p.y);
    bus.emit('audio:sfx', { type: action === 'technique' ? 'special' : 'strike', param: g.p.id });
    for (const enemy of targets) {
      const damage = Math.round(g.p.damage*g.p.power*(action === 'technique' ? HERO_TECHNIQUES[g.p.id].multiplier : 1));
      enemy.hp = Math.max(0, enemy.hp-damage);
      g.p.flow = Math.min(100, g.p.flow+ (action === 'strike' ? 12+g.p.flowBonus : 0));
      effect('hit', enemy.x, enemy.y, `−${damage}`);
      if (!enemy.hp) {
        field.splice(field.indexOf(enemy), 1); roam.defeated++;
        g.score += enemy.reward; g.totalKills++; g.p.kills++;
        g.p.hp = Math.min(g.p.maxHp, g.p.hp+12); g.p.flow = Math.min(100,g.p.flow+8);
        if (g.duel) g.duel.defeated = roam.defeated;
        // No orphaned projectiles after their shooter falls.
        roam.shots = roam.shots.filter(s => s.owner !== enemy.id);
        bus.emit('roam:rival-defeated', { id: enemy.id });
      }
    }
    return true;
  }
  function wander(enemy, dt) {
    enemy.timer -= dt;
    if (enemy.windup > 0) return;
    const dx = enemy.tx-enemy.x, dy = enemy.ty-enemy.y, d = Math.hypot(dx,dy);
    if (d > 8) {
      const step = Math.min(d, enemy.speed*dt);
      Object.assign(enemy, groundPoint(enemy.x+dx/d*step, enemy.y+dy/d*step));
    }
    if (d <= 8 || enemy.timer <= 0) {
      const point = groundPoint(enemy.homeX+(enemy.rng()*2-1)*180, enemy.homeY+(enemy.rng()*2-1)*100);
      enemy.tx = point.x; enemy.ty = point.y; enemy.timer = 1.2+enemy.rng()*1.6;
    }
  }
  function archer(enemy, dt) {
    if (enemy.windup > 0) {
      enemy.windup = Math.max(0, enemy.windup-dt);
      if (!enemy.windup) {
        const dx = enemy.aim.x-enemy.x, dy = enemy.aim.y-enemy.y, len = Math.hypot(dx,dy)||1;
        roam.shots.push({ id: ++serial, owner: enemy.id, x:enemy.x, y:enemy.y,
          vx: dx/len*390, vy:dy/len*390, damage: enemy.damage, life: 2.5 });
        enemy.aim = null; enemy.cooldown = 2.2;
        bus.emit('audio:sfx',{type:'arrow_shoot'});
      }
    } else {
      enemy.cooldown -= dt;
      if (enemy.cooldown <= 0 && distance(enemy,g.p)<850) {
        enemy.windup = .85; enemy.aim = {x:g.p.x,y:g.p.y};
        bus.emit('audio:sfx',{type:'enemy_windup'});
      }
    }
  }
  function tick(dt, input) {
    if (g.mode !== 'exploring' || roam.contact >= 0) return;
    for (const key of ['strikeCD','dodgeCD','invulnerable','dash']) roam[key] = Math.max(0,roam[key]-dt);
    for (const item of roam.effects) item.life -= dt;
    roam.effects = roam.effects.filter(e => e.life>0);
    Object.assign(g.p, groundPoint(g.p.x,g.p.y));
    const {dx=0,dy=0} = input || {}, len = Math.hypot(dx,dy);
    if (len) { roam.facingX=dx/len; roam.facingY=dy/len; }
    if (len || roam.dash>0) {
      const speed = roam.dash>0 ? 720 : PLAYER_SPEED*(isRoamInShallows(encounter,g) ? SHALLOWS_ROAM_SPEED_FACTOR : 1);
      Object.assign(g.p, groundPoint(g.p.x+roam.facingX*speed*dt,g.p.y+roam.facingY*speed*dt));
      if (roam.facingX) g.p.dx=roam.facingX>0?1:-1;
    }
    g.p.moving = !!len;
    for (const action of pending.splice(0)) {
      act(action); if (g.mode !== 'exploring') return;
    }
    for (const enemy of field) { wander(enemy,dt); if(enemy.ranged) archer(enemy,dt); }
    for (const shot of roam.shots) {
      const before={x:shot.x,y:shot.y}; shot.x+=shot.vx*dt; shot.y+=shot.vy*dt; shot.life-=dt;
      if (segmentDistance(g.p,before,shot)<26) {
        shot.life=0;
        if (!roam.invulnerable) {
          const damage=Math.min(g.p.hp,shot.damage);
          g.p.hp-=damage; g.p.damageTaken+=damage; roam.invulnerable=.35;
          effect('hurt',g.p.x,g.p.y,`−${damage}`);
          bus.emit('audio:sfx',{type:'hurt'});
          if (!g.p.hp) { bus.emit('combat:defeat'); return; }
        } else effect('evade',g.p.x,g.p.y,'EVADE');
      }
    }
    roam.shots=roam.shots.filter(s=>s.life>0 && onGround(s));
    for(let i=0;i<field.length;i++) {
      if(!field[i].ranged && distance(g.p,field[i])<34+field[i].radius) {
        roam.contact=i; bus.emit('roam:contact',{index:i,kind:field[i].kind}); break;
      }
    }
  }
  return {
    field, act,
    clearInput() { pending.length=0; clock.reset(); },
    step(dt,input={}) {
      if (g.mode !== 'exploring') return;
      pending.push(...(input.actions||[]).slice(0,8-pending.length));
      clock.advance(dt,h=>tick(h,input));
    },
    removeContacted() {
      if(roam.contact<0) return null;
      const [removed]=field.splice(roam.contact,1); roam.contact=-1; roam.defeated++;
      return removed;
    },
  };
}
