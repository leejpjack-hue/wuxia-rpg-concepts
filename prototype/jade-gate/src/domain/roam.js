import { distance } from './math.js';
import { groundPoint, SPAWN_MARKERS, resolveBlockers, BLOCKERS, GROUND, onGround, WORLD, VIEWPORT, cameraFocus, smoothCamera, DEADZONE } from './ground.js';
export { WORLD, VIEWPORT, cameraFocus, smoothCamera, DEADZONE };
import { FixedClock, seededRandom } from '../engine/clock.js';
import { rosterForEncounter, DUEL_ENEMIES, HERO_TECHNIQUES, isEscortKind, isNamedRivalKind } from '../content/duels.js';
import { techniqueCost } from '../content/curios.js';
export const ARENA = { width: WORLD.width, height: WORLD.height, margin: 64, top: GROUND.top };
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

/** Deterministic golden-angle spread so an open-field area reads as a camp. */
function openFieldPoint(anchor, index) {
  const angle = index * 2.39996;
  const radius = index === 0 ? 0 : 90 + (index % 3) * 70;
  return groundPoint(anchor.x + Math.cos(angle) * radius, anchor.y + Math.sin(angle) * radius);
}

/** Grounded exploration. Melee contact opens duels; archers fight in real time.
 *  Open-field mode (roster + areas + anchors + maze) deploys every pass rival
 *  of an act at once on one persistent maze map, tagged by the area they hold. */
export function createRoam(g, bus, { encounter, roster: explicitRoster, areas, anchors, maze, coreCount = rosterForEncounter(encounter?.id, g.runMode)?.length ?? 0 } = {}) {
  const roster = explicitRoster || rosterForEncounter(encounter?.id, g.runMode);
  if (!roster) throw new Error('This encounter has no arena rivals yet.');
  const openField = Array.isArray(areas) && areas.length === roster.length;
  const clock = new FixedClock(), pending = [];
  let serial = 0;
  const hazardRandom = seededRandom(7171 + g.encounterIndex * 37);
  // Maze passes collide against the labyrinth walls; classic passes keep the
  // painted-stone BLOCKERS. Slide helpers keep every actor out of the hedges.
  const walls = maze ? maze.rects : BLOCKERS;
  const slide = (actor, x, y, radius = 18) => resolveBlockers(x, y, radius, actor, walls);
  const sight = (a, b) => !maze || maze.rayClear(a.x, a.y, b.x, b.y);
  /** CAM-09 markers + CAM-04 scroll: last (or sole) rival homes past the
   *  first 1280×720 screen; earlier rivals stay on near markers. */
  function spawnMarkerFor(index, count) {
    if (encounter?.id === 'warden') return SPAWN_MARKERS.find(m => m.id === 'far-clearing');
    const far = SPAWN_MARKERS.filter(m => m.id !== 'far-clearing' && (m.x > VIEWPORT.width || m.y > VIEWPORT.height));
    const near = SPAWN_MARKERS.filter(m => m.x <= VIEWPORT.width && m.y <= VIEWPORT.height);
    if (far.length && (count === 1 || index === count - 1)) {
      return far[index % far.length];
    }
    if (near.length) return near[index % near.length];
    return SPAWN_MARKERS[index % SPAWN_MARKERS.length];
  }
  // Escorts skip the marker ladder: they deploy around their ward after the
  // field is built, so the named legend keeps its usual post.
  const base = roster.filter(kind => !isEscortKind(kind));
  let baseIndex = 0;
  const field = roster.map((kind, index) => {
    const def = DUEL_ENEMIES[kind];
    const escort = isEscortKind(kind);
    const area = openField ? areas[index] : null;
    // The story-deployed core holds the camp; extra grunts are the ranks.
    const core = openField ? index < coreCount : true;
    // Open-field groups spawn around their area anchor; classic passes use markers.
    const marker = !openField && !escort ? spawnMarkerFor(baseIndex++, base.length) : null;
    const anchor = openField ? anchors?.[area] : null;
    const position = marker ? groundPoint(marker.x, marker.y)
      : anchor ? openFieldPoint(anchor, index)
      : groundPoint(640, 500);
    // Elite encounters (and wander stages) field hardened rivals.
    const eliteScale = encounter.scale ?? (encounter.elite ? 1.35 : 1);
    const damageScale = encounter.damageScale ?? (encounter.elite ? 1.15 : 1);
    return { ...def, hp: Math.round(def.hp*eliteScale), damage: Math.round(def.damage*damageScale),
      reward: Math.round(def.reward*(encounter.elite?1.5:1)), ...position, id: `${encounter.id}-field-${index}`, kind,
      area, core, maxHp: Math.round(def.hp*eliteScale), ranged: isRanged(kind), radius: 36,
      speed: def.boss ? 70 : 55+index*10,
      homeX: position.x, homeY: position.y, tx: position.x, ty: position.y,
      timer: 0, cooldown: 1.4+index*.4, windup: 0, aim: null,
      rng: seededRandom(1337+g.encounterIndex*7+index*131) };
  });
  // The escort squad rings its area's last named legend, facing the hero's entry.
  const ringEscorts = (ward, escorts) => {
    const entryBearing = Math.atan2(500 - ward.y, 640 - ward.x);
    escorts.forEach((escort, slot) => {
      const bearing = entryBearing + (slot - (escorts.length - 1) / 2) * 0.42;
      const ring = 130 + slot * 24;
      const point = groundPoint(ward.x + Math.cos(bearing) * ring, ward.y + Math.sin(bearing) * ring);
      Object.assign(escort, point, { homeX: point.x, homeY: point.y, tx: point.x, ty: point.y, slot, guardOf: ward.id });
    });
  };
  if (openField) {
    const byArea = new Map();
    for (const enemy of field) {
      if (!byArea.has(enemy.area)) byArea.set(enemy.area, []);
      byArea.get(enemy.area).push(enemy);
    }
    for (const group of byArea.values()) {
      const ward = group.filter(enemy => isNamedRivalKind(enemy.kind) || DUEL_ENEMIES[enemy.kind]?.boss).at(-1);
      if (ward) ringEscorts(ward, group.filter(enemy => isEscortKind(enemy.kind)));
    }
    // The maze has the last word on deployment: any rival the hedges swallowed
    // walks back toward its camp anchor until the lantern light frees it.
    if (maze) {
      for (const enemy of field) {
        let guard = 0;
        const anchor = anchors?.[enemy.area] || maze.start;
        while (maze.blocked(enemy.x, enemy.y, 28) && guard++ < 12) {
          enemy.x += (anchor.x - enemy.x) * 0.35;
          enemy.y += (anchor.y - enemy.y) * 0.35;
        }
        if (maze.blocked(enemy.x, enemy.y, 28)) Object.assign(enemy, { x: anchor.x, y: anchor.y });
        Object.assign(enemy, { homeX: enemy.x, homeY: enemy.y, tx: enemy.x, ty: enemy.y });
      }
    }
  } else {
    const ward = field.filter(enemy => isNamedRivalKind(enemy.kind) || DUEL_ENEMIES[enemy.kind]?.boss).at(-1);
    if (ward) ringEscorts(ward, field.filter(enemy => isEscortKind(enemy.kind)));
  }
  const spawn = maze ? maze.start : { x: 640, y: 500 };
  Object.assign(g.p, spawn);
  const partyFollowers = (g.party?.followers || []).map((id, index) => {
    const point = groundPoint(g.p.x - 48 * (index + 1), g.p.y + 12 * (index + 1));
    return { id, x: point.x, y: point.y, dx: g.p.dx || 1 };
  });
  // Seed a short trail behind the lead so followers start staggered (no stack/teleport).
  const seedTrail = [];
  for (let i = 16; i >= 0; i--) {
    const point = groundPoint(g.p.x - 12 * i, g.p.y);
    seedTrail.push({ x: point.x, y: point.y });
  }
  g.roam = { field, contact: -1, defeated: 0, shots: [], effects: [],
    followers: partyFollowers, trail: seedTrail,
    strikeCD: 0, dodgeCD: 0, invulnerable: 0, dash: 0, facingX: 1, facingY: 0,
    sneaking: false, sneakMaster: g.p.id === 'nie-yinniang',
    windTime: 0, windX: 0, pillarTimer: 3, pillar: null,
    maze: maze || null,
    // Wayside shrines restore a spent hero once each: health, Flow and nerve.
    shrines: maze ? maze.shrines.map(shrine => ({ ...shrine, used: false })) : [] };
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
    if (action === 'sneak') {
      roam.sneaking = !roam.sneaking;
      bus.emit('audio:sfx', { type: 'ui_click' }); return true;
    }
    if (!['strike', 'technique'].includes(action) || roam.strikeCD > 0) return false;
    if (action === 'technique' && g.p.flow < techniqueCost(g.p, g.curios)) return false;
    // Rattled heroes reach shorter on the pass until they rest.
    const range = (action === 'technique' ? 280 : 175) * (g.p.rattled ? 0.8 : 1);
    // Hedges block a swing in the maze: no first blood through walls.
    const targets = field.filter(e => distance(e, g.p) < range && sight(g.p, e));
    roam.strikeCD = action === 'technique' ? .8 : .38;
    if (action === 'technique') g.p.flow -= techniqueCost(g.p, g.curios);
    effect(action, g.p.x, g.p.y);
    bus.emit('audio:sfx', { type: action === 'technique' ? 'special' : 'strike', param: g.p.id });
    for (const enemy of targets) {
      // Melee rivals take no real-time damage: a clean hit marks first blood,
      // and the contact duel opens with them reeling.
      if (!enemy.ranged) {
        if (!enemy.firstBlood) {
          enemy.firstBlood = true;
          effect('firstblood', enemy.x, enemy.y, 'FIRST BLOOD');
        }
        continue;
      }
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
      Object.assign(enemy, slide(enemy, enemy.x+dx/d*step, enemy.y+dy/d*step, 20));
    }
    if (d <= 8 || enemy.timer <= 0) {
      // Maze patrols pick a stroll the hedges actually allow.
      let point = null;
      for (let tries = 0; tries < 4 && !point; tries++) {
        const candidate = groundPoint(enemy.homeX+(enemy.rng()*2-1)*180*(g.weather?.wanderScale || 1), enemy.homeY+(enemy.rng()*2-1)*100*(g.weather?.wanderScale || 1));
        if (!maze || !maze.blocked(candidate.x, candidate.y, 26)) point = candidate;
      }
      if (!point) point = { x: enemy.homeX, y: enemy.homeY };
      enemy.tx = point.x; enemy.ty = point.y; enemy.timer = 1.2+enemy.rng()*1.6;
    }
  }
  /** Escorts screen their ward: hold the line between the hero and the legend. */
  function screen(enemy, dt, ward) {
    enemy.timer -= dt;
    if (enemy.windup > 0) return;
    const dx = g.p.x-ward.x, dy = g.p.y-ward.y;
    const d = Math.hypot(dx,dy) || 1;
    const engaged = d < 560;
    let tx = enemy.tx, ty = enemy.ty;
    if (engaged) {
      // Cut the approach line, spread by slot so the wall has no single gap.
      const bearing = Math.atan2(dy,dx) + ((enemy.slot ?? 1)-1)*0.4;
      const ring = Math.min(130+((enemy.slot ?? 1)-1)*24, Math.max(120, d-70));
      tx = ward.x+Math.cos(bearing)*ring; ty = ward.y+Math.sin(bearing)*ring;
    } else if (enemy.timer <= 0) {
      // At rest the guard keeps a loose patrol ring beside its legend.
      const bearing = enemy.rng()*Math.PI*2, ring = 90+enemy.rng()*80;
      tx = ward.x+Math.cos(bearing)*ring; ty = ward.y+Math.sin(bearing)*ring;
      enemy.timer = 1.2+enemy.rng()*1.6;
    }
    const goal = groundPoint(tx,ty);
    const mx = goal.x-enemy.x, my = goal.y-enemy.y, md = Math.hypot(mx,my);
    // Never press into the hero: the duel opens on the hero's step, not the guard's shove.
    if (md > 6 && Math.hypot(goal.x-g.p.x, goal.y-g.p.y) > 84) {
      // Intercepting guards outpace the hero so the line stays closed.
      const pace = engaged ? 335 : enemy.speed;
      const step = Math.min(md, pace*dt);
      Object.assign(enemy, slide(enemy, enemy.x+mx/md*step, enemy.y+my/md*step, 20));
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
      // Sneaking closes the watchful range; the Hidden Blade near-erases it.
      const sneakBase = g.weather?.sneakAggro
        ? (roam.sneakMaster ? g.weather.sneakMasterAggo || 260 : g.weather.sneakAggro)
        : (roam.sneakMaster ? 300 : 420);
      const aggro = roam.sneaking ? sneakBase : Math.round(850 * (g.weather?.aggroMultiplier ?? 1));
      // Volley budget: with tripled ranks, only a handful of arrows fly at
      // once — a wall of simultaneous archers would shred any hero.
      // In the maze an archer only draws when a clear line exists through the hedges.
      if (enemy.cooldown <= 0 && roam.shots.length < 6 && distance(enemy,g.p)<aggro && sight(enemy, g.p)) {
        enemy.windup = .85; enemy.aim = {x:g.p.x,y:g.p.y};
        bus.emit('audio:sfx',{type:'enemy_windup'});
      }
    }
  }
  function tick(dt, input) {
    if (g.mode !== 'exploring' || roam.contact >= 0) return;
    for (const key of ['strikeCD','dodgeCD','invulnerable','dash']) roam[key] = Math.max(0,roam[key]-dt);
    roam.windTime += dt;
    roam.windX = g.hazards?.includes('wind-gust') ? Math.sin(roam.windTime * 1.3) * 55 : 0;
    if (g.hazards?.includes('falling-pillar')) {
      if (roam.pillar) {
        roam.pillar.time -= dt;
        if (roam.pillar.time <= 0) {
          const pillar = roam.pillar;
          effect('pillar', pillar.x, pillar.y, 'STONEFALL');
          if (distance(g.p, pillar) < 55 && !roam.invulnerable) {
            const damage = Math.min(g.p.hp, 18);
            g.p.hp -= damage; g.p.damageTaken += damage; roam.invulnerable = .35;
            effect('hurt', g.p.x, g.p.y, `−${damage}`);
            bus.emit('audio:sfx', {type:'hurt'});
            if (!g.p.hp) { bus.emit('combat:defeat'); return; }
          }
          roam.pillar = null;
        }
      } else if ((roam.pillarTimer -= dt) <= 0) {
        // Stonefall roams the whole maze; never drops a pillar inside a hedge.
        let point = null;
        for (let tries = 0; tries < 4 && !point; tries++) {
          const candidate = groundPoint(250 + hazardRandom() * (WORLD.width - 500), GROUND.top + 120 + hazardRandom() * (GROUND.bottom - GROUND.top - 240));
          if (!maze || !maze.blocked(candidate.x, candidate.y, 40)) point = candidate;
        }
        if (point) roam.pillar = { ...point, time: 1.15 };
        roam.pillarTimer = 4.5 + hazardRandom() * 2;
        bus.emit('audio:sfx',{type:'enemy_windup'});
      }
    }
    for (const item of roam.effects) item.life -= dt;
    roam.effects = roam.effects.filter(e => e.life>0);
    Object.assign(g.p, slide(g.p, g.p.x, g.p.y));
    const {dx=0,dy=0} = input || {}, len = Math.hypot(dx,dy);
    if (len) { roam.facingX=dx/len; roam.facingY=dy/len; }
    if (len || roam.dash>0) {
      const sneakFactor = roam.sneaking ? 0.45 : 1;
      const shallowsFactor = isRoamInShallows(encounter,g)
        ? (g.weather?.shallowsFactor ?? SHALLOWS_ROAM_SPEED_FACTOR) : 1;
      const speed = roam.dash>0 ? 720 : PLAYER_SPEED*sneakFactor*shallowsFactor;
      Object.assign(g.p, slide(g.p, g.p.x+(roam.facingX*speed+roam.windX)*dt, g.p.y+roam.facingY*speed*dt));
      if (roam.facingX) g.p.dx=roam.facingX>0?1:-1;
    }
    if (!len && roam.dash <= 0 && roam.windX)
      Object.assign(g.p, slide(g.p, g.p.x + roam.windX * dt, g.p.y));
    g.p.moving = !!len;
    // WU-PARTY-04: denser trail + larger lag so followers ease along the path
    // instead of stacking on the lead or snapping across the courtyard.
    const TRAIL_SAMPLE = 10;
    const TRAIL_MAX = 56;
    const LAG_PER_FOLLOWER = 14;
    const last = roam.trail[roam.trail.length - 1];
    if (!last || Math.hypot(g.p.x - last.x, g.p.y - last.y) > TRAIL_SAMPLE)
      roam.trail.push({ x: g.p.x, y: g.p.y });
    while (roam.trail.length > TRAIL_MAX) roam.trail.shift();
    for (let i = 0; i < roam.followers.length; i++) {
      const follower = roam.followers[i];
      const lag = (i + 1) * LAG_PER_FOLLOWER;
      const target = roam.trail[Math.max(0, roam.trail.length - 1 - lag)] || last || g.p;
      const dx = target.x - follower.x, dy = target.y - follower.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 4) {
        // Pace toward the lagged point — never teleport; ease when close, catch up when far.
        const pace = dist > 220 ? PLAYER_SPEED * 1.05 : dist > 48 ? PLAYER_SPEED * 0.88 : PLAYER_SPEED * 0.55;
        const step = Math.min(dist, pace * dt);
        Object.assign(follower, slide(follower, follower.x + (dx / dist) * step, follower.y + (dy / dist) * step));
      }
      // Soft separation from the prior party member so they do not stack.
      const prior = i === 0 ? g.p : roam.followers[i - 1];
      const sepX = follower.x - prior.x, sepY = follower.y - prior.y;
      const sep = Math.hypot(sepX, sepY);
      if (sep > 0 && sep < 36) {
        const push = ((36 - sep) / 36) * PLAYER_SPEED * 0.35 * dt;
        Object.assign(follower, slide(follower, follower.x + (sepX / sep) * push, follower.y + (sepY / sep) * push));
      }
      // WU-PARTY-07: cosmetic facing mirrors lead, not chase delta.
      follower.dx = g.p.dx;
    }
    for (const action of pending.splice(0)) {
      act(action); if (g.mode !== 'exploring') return;
    }
    // Wayside shrines: stepping to the lantern rests the party once per shrine.
    for (const shrine of roam.shrines) {
      if (shrine.used || distance(g.p, shrine) > 64) continue;
      shrine.used = true;
      effect('rest', shrine.x, shrine.y, 'REST');
      bus.emit('roam:rest', { id: shrine.id });
    }
    for (const enemy of field) {
      if (isEscortKind(enemy.kind)) {
        const ward = field.find(rival => rival.id === enemy.guardOf);
        if (ward) screen(enemy, dt, ward);
        else {
          // Ward fallen: the guard holds the ground it stands on.
          if (!enemy.orphaned) {
            enemy.orphaned = true;
            Object.assign(enemy, { homeX: enemy.x, homeY: enemy.y, tx: enemy.x, ty: enemy.y, timer: 0 });
          }
          wander(enemy, dt);
        }
      } else wander(enemy, dt);
      if (enemy.ranged) archer(enemy, dt);
    }
    for (const shot of roam.shots) {
      shot.vx += roam.windX * dt * .7;
      const before={x:shot.x,y:shot.y}; shot.x+=shot.vx*dt; shot.y+=shot.vy*dt; shot.life-=dt;
      // Hedges stop arrows cold — corners are cover in the maze.
      if (maze && maze.blocked(shot.x, shot.y, 8)) shot.life = 0;
      if (segmentDistance(g.p,before,shot)<26) {
        shot.life=0;
        if (!roam.invulnerable) {
          const damage=Math.min(g.p.hp,shot.damage);
          g.p.hp-=damage; g.p.damageTaken+=damage; roam.invulnerable=.35;
          // Composure: each real-time wound wears at the hero's nerve.
          g.p.composure = Math.min(100, (g.p.composure || 0) + 18);
          if (g.p.composure >= 100 && !g.p.rattled) {
            g.p.rattled = true;
            bus.emit('notice', { text: 'Your nerve frays — strikes shorter, techniques cost more until you rest.' });
          }
          effect('hurt',g.p.x,g.p.y,`−${damage}`);
          bus.emit('audio:sfx',{type:'hurt'});
          if (!g.p.hp) { bus.emit('combat:defeat'); return; }
        } else effect('evade',g.p.x,g.p.y,'EVADE');
      }
    }
    roam.shots=roam.shots.filter(s=>s.life>0 && onGround(s));
    for(let i=0;i<field.length;i++) {
      if(!field[i].ranged && distance(g.p,field[i])<34+field[i].radius) {
        roam.contact=i; bus.emit('roam:contact',{index:i,kind:field[i].kind,
          ambush: !!(field[i].firstBlood || roam.sneaking)}); break;
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
    /** Open field: a fallen leader's area scatters — the survivors flee without
     *  duels. `keepNamed` holds named legends and bosses in place: their
     *  retinue routs, but a legend fights to the last. */
    scatterArea(area, keepNamed = false) {
      const removed=[];
      for(let i=field.length-1;i>=0;i--) {
        if(field[i].area!==area) continue;
        if(keepNamed && (isNamedRivalKind(field[i].kind) || DUEL_ENEMIES[field[i].kind]?.boss)) continue;
        removed.push(field.splice(i,1)[0]);
      }
      if(removed.length){
        roam.defeated+=removed.length;
        const gone=new Set(removed.map(enemy=>enemy.id));
        roam.shots=roam.shots.filter(shot=>!gone.has(shot.owner));
      }
      return removed.reverse();
    },
  };
}
