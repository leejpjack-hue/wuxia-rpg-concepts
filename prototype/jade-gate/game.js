import {HEROES,UPGRADES,clamp,distance,inArc,createGame,nextWave,applyUpgrade,takeDamage} from './core.js';
import {loadArt,draw} from './render.js';
import * as audio from './audio.js';

const $=id=>document.getElementById(id), canvas=$('arena'),ctx=canvas.getContext('2d');
let selected=HEROES[0],g={mode:'select'},keys=new Set(),last=performance.now(),sound=true,reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,ready=false,bannerTimer=0;
let saved={};try{saved=JSON.parse(localStorage.getItem('blades-records')||'{}');if(!saved||typeof saved!=='object')saved={};}catch{}

const sfx=(type,param)=>{try{if(typeof audio!=='undefined'&&audio.playSfx)audio.playSfx(type,param);}catch{}};
const music=(mode)=>{try{if(typeof audio!=='undefined'&&audio.setMusicMode)audio.setMusicMode(mode);}catch{}};
const soundToggle=()=>{try{if(typeof audio!=='undefined'&&audio.toggleSound)return audio.toggleSound();}catch{return false;}};
const musicToggle=()=>{try{if(typeof audio!=='undefined'&&audio.toggleMusic)return audio.toggleMusic();}catch{return false;}};
const initSound=()=>{try{if(typeof audio!=='undefined'&&audio.initAudio)audio.initAudio();}catch{}};

function persist(){try{localStorage.setItem('blades-records',JSON.stringify(saved));}catch{}}
function record(){const r=saved[selected.id];$('record').textContent=r?`Personal best: ${r.best} renown · ${r.wins} gates reclaimed`:'A new legend awaits. Your best run is saved on this device.';}
function choose(id){selected=HEROES.find(h=>h.id===id);document.querySelectorAll('.hero-card').forEach(b=>{const on=b.dataset.hero===id;b.classList.toggle('selected',on);b.setAttribute('aria-pressed',String(on));});$('hero-description').textContent=selected.description;record();sfx('ui_click');}
$('heroes').innerHTML=HEROES.map((h,i)=>`<button class="hero-card" data-hero="${h.id}" aria-pressed="false" aria-label="Choose ${h.name}"><img src="assets/${h.id}.png" alt="${h.name}, ${h.weapon}"><span class="card-number">0${i+1} / ${h.cn}</span><span class="card-check">✓</span><div class="card-copy"><small>${h.title}</small><h2>${h.name}</h2><p>${h.weapon}</p><div class="stats">${h.style.toUpperCase()}</div></div></button>`).join('');
document.querySelectorAll('.hero-card').forEach(b=>b.onclick=()=>choose(b.dataset.hero));choose(selected.id);

function updateSoundButton(){
  $('sound').textContent=sound?'Sound on':'Sound off';
  $('sound').setAttribute('aria-pressed',String(sound));
}
function updateMusicButton(){
  const m=$('music');
  if(!m)return;
  const on=typeof audio!=='undefined'&&audio.isMusicEnabled?audio.isMusicEnabled():true;
  m.textContent=on?'Music on':'Music off';
  m.setAttribute('aria-pressed',String(on));
}
$('sound').onclick=()=>{
  initSound();
  sound=soundToggle();
  updateSoundButton();
};
if($('music'))$('music').onclick=()=>{
  initSound();
  musicToggle();
  updateMusicButton();
};
updateSoundButton();
updateMusicButton();

function setMotion(){$('motion').textContent=reduced?'Motion reduced':'Motion on';$('motion').setAttribute('aria-pressed',String(reduced));}setMotion();$('motion').onclick=()=>{reduced=!reduced;setMotion();};
function announce(text){$('banner').textContent=text;$('banner').classList.add('show');bannerTimer=2.5;}

function start(){
  if(!ready)return;
  initSound();
  g=createGame(selected);
  keys.clear();
  $('selection').hidden=true;
  $('play').hidden=false;
  $('overlay').hidden=true;
  $('hud-portrait').src=`assets/${selected.id}.png`;
  $('hero-name').textContent=selected.name;
  $('skill-name').textContent=selected.skill;
  announce('Reclaim the Jade Gate');
  hud();
  canvas.focus();
  music('battle');
  sfx('ui_click');
}
$('start').onclick=start;

function effect(kind,props,life=.5){g.effects.push({kind,...props,life,max:life});}
function floating(x,y,text,color='#fff0c3',big=false){effect('text',{x,y,text:String(text),color,big},.8);}
function nearest(){return [...g.enemies].sort((a,b)=>distance(a,g.p)-distance(b,g.p))[0];}

function hit(e,amount,knock=20,stun=.16){
  if(e.hp<=0)return;
  const p=g.p;
  const dmg=Math.round(amount);
  e.hp-=dmg;
  e.flash=.14;
  if(e.type!=='boss'||stun>=.6){
    e.stun=Math.max(e.stun,stun);
    e.wind=0;
    e.target=null;
    e.cd=Math.max(e.cd,.45);
  }else{
    knock=0;
  }
  const angle=Math.atan2(e.y-p.y,e.x-p.x);
  e.x=clamp(e.x+Math.cos(angle)*knock,135,1145);
  e.y=clamp(e.y+Math.sin(angle)*knock,290,655);
  p.flow=clamp(p.flow+7+p.flowBonus,0,100);
  p.combo++;
  p.comboTime=2.4;
  floating(e.x,e.y-95,dmg,p.color);
  for(let i=0;i<5;i++)effect('spark',{x:e.x,y:e.y-40,vx:(Math.random()-.5)*95,vy:(Math.random()-.5)*75,color:p.color},.3);
  g.shake=Math.max(g.shake,3);
  if(e.hp<=0){
    p.kills++;
    g.totalKills++;
    g.score+=e.type==='boss'?700:100+Math.min(15,p.combo)*5;
    if(g.totalKills%3===0)g.pickups.push({x:e.x,y:e.y});
    sfx(e.type==='boss'?'finisher':'hit',true);
  }else{
    sfx('hit',e.type==='boss');
  }
}

function attack(){
  if(g.mode!=='playing'||g.p.attackCD>0)return;
  const p=g.p,t=nearest();
  if(t&&distance(p,t)<p.reach+65)p.facing=Math.atan2(t.y-p.y,t.x-p.x);
  p.attackCD=p.rate;
  p.attackAnim=.23;
  const finisher=p.combo>0&&p.combo%3===0;
  effect('slash',{x:p.x,y:p.y,angle:p.facing,r:p.reach*.8,color:p.color},.22);
  for(const e of g.enemies){
    if(inArc(p,e,p.reach))hit(e,p.damage*p.power*(finisher?1.3:1));
  }
  if(finisher){
    floating(p.x,p.y-145,'FINISHER',p.color);
    sfx('finisher');
  }else{
    sfx('strike',(p.combo%3)+1);
  }
}

function dodge(){
  if(g.mode!=='playing'||g.p.dodgeCD>0)return;
  const p=g.p;
  let x=(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0),y=(keys.has('KeyS')||keys.has('ArrowDown')?1:0)-(keys.has('KeyW')||keys.has('ArrowUp')?1:0);
  if(!x&&!y){x=Math.cos(p.facing);y=Math.sin(p.facing);}
  const n=Math.hypot(x,y);
  p.dx=x/n;
  p.dy=y/n;
  p.dash=.22;
  p.invulnerable=.36;
  p.dodgeCD=p.id==='hu-sanniang'?.8:1.05;
  effect('ring',{x:p.x,y:p.y,r:55,color:p.color},.3);
  sfx('dodge');
}

function special(){
  if(g.mode!=='playing')return;
  const p=g.p;
  if(p.flow<p.cost||p.specialCD>0){
    announce(p.flow<p.cost?'Strike enemies to build Flow':'Technique is recovering');
    return;
  }
  p.flow-=p.cost;
  p.specialCD=3.2;
  p.attackAnim=.4;
  p.invulnerable=.55;
  const t=nearest();
  if(t)p.facing=Math.atan2(t.y-p.y,t.x-p.x);
  announce(p.skill);
  sfx('special',p.id);
  g.shake=8;
  if(p.id==='zhao-yun'){
    const x=p.x,y=p.y;
    const dx=Math.cos(p.facing),dy=Math.sin(p.facing);
    for(const e of g.enemies){
      const ex=e.x-x,ey=e.y-y;
      const along=ex*dx+ey*dy,cross=Math.abs(ex*dy-ey*dx);
      if(along>-35&&along<310&&cross<70)hit(e,p.damage*p.power*2.8,45,.7);
    }
    p.x=clamp(x+dx*240,135,1145);
    p.y=clamp(y+dy*240,300,650);
    effect('slash',{x,y,angle:p.facing,r:260,color:p.color},.45);
  }else{
    const range=p.id==='lu-zhishen'?220:p.id==='hu-sanniang'?190:250;
    for(const e of g.enemies)if(distance(p,e)<range&&(p.id!=='lu-bu'||inArc(p,e,range,1.8)))hit(e,p.damage*p.power*(p.id==='hu-sanniang'?4:2.6),p.id==='lu-zhishen'?90:50,p.id==='lu-zhishen'?1.8:.8);
    effect('ring',{x:p.x,y:p.y,r:range,color:p.color},.65);
    effect('slash',{x:p.x,y:p.y,angle:p.facing,r:range*.85,color:p.color},.4);
  }
}

function hurt(amount){
  const p=g.p;
  if(takeDamage(p,amount)){
    floating(p.x,p.y-105,`−${amount}`,'#ffb3a3');
    g.shake=6;
    sfx('hurt');
  }
}

function modal(kicker,title,copy){keys.clear();$('modal-kicker').textContent=kicker;$('modal-title').textContent=title;$('modal-copy').textContent=copy;$('choices').innerHTML='';$('modal-actions').innerHTML='';$('overlay').hidden=false;}
function action(text,fn,primary=false){const b=document.createElement('button');b.textContent=text;if(primary)b.className='primary';b.onclick=fn;$('modal-actions').append(b);return b;}

function pause(){
  if(g.mode==='playing'){
    g.mode='paused';
    music('paused');
    modal('A MOMENT OF STILLNESS','The mountain can wait.','Your journey is paused.');
    action('Resume journey',resume,true).focus();
    action('Choose another hero',menu);
  }else if(g.mode==='paused')resume();
}

function resume(){
  g.mode='playing';
  music(g.wave===3?'boss':'battle');
  $('overlay').hidden=true;
  keys.clear();
  canvas.focus();
}

function menu(){
  g.mode='select';
  music('select');
  keys.clear();
  $('play').hidden=true;
  $('selection').hidden=false;
  $('overlay').hidden=true;
  record();
  $('start').focus();
}
$('pause').onclick=pause;

function clearWave(){
  if(g.wave===3){finish(true);return;}
  g.mode='upgrade';
  music('upgrade');
  sfx('upgrade');
  modal(`ENCOUNTER ${g.wave} COMPLETE`,'A lesson earned.','Choose a discipline for the rest of this run. The next encounter restores 22 health and 20 Flow.');
  for(const u of UPGRADES){
    const b=document.createElement('button');
    b.className='upgrade';
    b.innerHTML=`<small>◇</small><strong>${u.name}</strong><span>${u.description}</span>`;
    b.onclick=()=>{
      applyUpgrade(g.p,u.id);
      nextWave(g);
      $('overlay').hidden=true;
      announce(g.wave===2?'The archers have taken position':'The Ashen Warden awaits');
      music(g.wave===3?'boss':'battle');
      sfx('ui_click');
      canvas.focus();
    };
    $('choices').append(b);
  }
  $('choices').firstElementChild.focus();
}

function finish(win){
  g.mode=win?'victory':'defeat';
  music(win?'victory':'defeat');
  const r=saved[g.p.id]||{best:0,wins:0};
  if(win){g.score+=Math.max(0,Math.round(g.p.hp*3));r.wins++;}
  r.best=Math.max(r.best,g.score);
  saved[g.p.id]=r;
  persist();
  hud();
  modal(win?'THE OATH ENDURES':'EVERY LEGEND BEGINS AGAIN',win?'The gate is yours.':'Rise, and try again.',`${g.p.name} · ${g.score} renown · ${g.totalKills} foes defeated · ${Math.floor(g.time/60)}m ${Math.floor(g.time%60)}s. ${win?'The pass is open. The next chapter is unwritten.':'Read the red circles. Dodge just before a strike lands.'}`);
  action('Walk the path again',start,true).focus();
  action('Choose another hero',menu);
}

function update(dt){
  g.time+=dt;g.waveTime+=dt;const p=g.p;
  for(const key of ['attackCD','dodgeCD','specialCD','invulnerable','dash','attackAnim','comboTime'])p[key]=Math.max(0,p[key]-dt);
  if(!p.comboTime)p.combo=0;

  let mx=(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0),my=(keys.has('KeyS')||keys.has('ArrowDown')?1:0)-(keys.has('KeyW')||keys.has('ArrowUp')?1:0);
  p.moving=!!(mx||my);
  if(p.dash>0){p.x+=p.dx*850*dt;p.y+=p.dy*650*dt;}
  else if(p.moving){const n=Math.hypot(mx,my);p.x+=mx/n*p.speed*dt;p.y+=my/n*p.speed*.72*dt;p.facing=Math.atan2(my,mx);}
  p.x=clamp(p.x,135,1145);p.y=clamp(p.y,300,650);
  if(keys.has('KeyJ'))attack();

  for(const e of g.enemies){
    if(e.hp<=0)continue;
    e.flash=Math.max(0,e.flash-dt);
    e.stun=Math.max(0,e.stun-dt);
    if(e.stun>0)continue;
    const d=distance(p,e);
    e.facing=Math.atan2(p.y-e.y,p.x-e.x);
    e.cd-=dt;
    if(e.wind>0){
      e.wind-=dt;
      if(e.wind<=0){
        const t=e.target;
        if(e.type==='archer'){
          const dx=t.x-e.x,dy=t.y-e.y,n=Math.hypot(dx,dy)||1;
          g.shots.push({x:e.x,y:e.y,vx:dx/n*330,vy:dy/n*330,life:3,damage:e.damage});
          sfx('arrow_shoot');
        }else{
          effect('ring',{x:t.x,y:t.y,r:t.r,color:'#e5a37b'},.35);
          if(Math.hypot(p.x-t.x,(p.y-t.y)/.85)<t.r)hurt(e.damage);
        }
        e.attacks++;
        e.target=null;
        e.cd=e.type==='boss'?1.3:1.5;
      }
      continue;
    }
    const range=e.type==='archer'?355:e.type==='boss'?145:83;
    if(e.cd<=0&&d<range){
      e.wind=e.type==='boss'?1.0:e.type==='archer'?.95:.72;
      e.windMax=e.wind;
      e.target={x:p.x,y:p.y,r:e.type==='boss'?120:64};
      sfx('enemy_windup');
    }else if(d>(e.type==='archer'?260:55)){
      e.x+=Math.cos(e.facing)*e.speed*dt;
      e.y+=Math.sin(e.facing)*e.speed*.7*dt;
    }else if(e.type==='archer'&&d<190){
      e.x-=Math.cos(e.facing)*e.speed*dt;
      e.y-=Math.sin(e.facing)*e.speed*.7*dt;
    }
    e.x=clamp(e.x,135,1145);
    e.y=clamp(e.y,300,650);
  }

  for(let i=0;i<g.enemies.length;i++)for(let j=i+1;j<g.enemies.length;j++){
    const a=g.enemies[i],b=g.enemies[j],d=distance(a,b);
    if(d>0&&d<a.radius+b.radius){
      const push=(a.radius+b.radius-d)*.5;
      const dx=(b.x-a.x)/d,dy=(b.y-a.y)/d;
      a.x-=dx*push;a.y-=dy*push;
      b.x+=dx*push;b.y+=dy*push;
    }
  }

  for(const s of g.shots){
    s.x+=s.vx*dt;s.y+=s.vy*dt;s.life-=dt;
    if(distance(s,p)<25){
      if(p.invulnerable>0){
        floating(p.x,p.y-100,'EVADE',p.color);
        p.flow=clamp(p.flow+5,0,100);
        sfx('dodge');
      }else{
        hurt(s.damage);
        sfx('arrow_hit');
      }
      s.life=0;
    }
  }
  g.shots=g.shots.filter(s=>s.life>0&&s.x>90&&s.x<1190&&s.y>260&&s.y<700);

  g.pickups=g.pickups.filter(h=>{
    if(distance(h,p)<38){
      p.hp=Math.min(p.maxHp,p.hp+18);
      floating(p.x,p.y-100,'+18 health','#c4edb0');
      sfx('heal');
      return false;
    }
    return true;
  });

  g.enemies=g.enemies.filter(e=>e.hp>0);
  g.effects.forEach(e=>e.life-=dt);
  g.effects=g.effects.filter(e=>e.life>0);
  g.shake=Math.max(0,g.shake-dt*30);

  if(p.hp<=0)finish(false);
  else if(g.enemies.length===0)clearWave();
}

function hud(){
  if(!g.p)return;
  const p=g.p;
  $('hp-text').textContent=`${Math.ceil(p.hp)} / ${p.maxHp}`;
  $('hp-bar').style.width=`${100*p.hp/p.maxHp}%`;
  $('flow-text').textContent=`${Math.floor(p.flow)} / 100`;
  $('flow-bar').style.width=`${p.flow}%`;
  $('score').textContent=g.score;
  $('chapter').textContent=`ENCOUNTER 0${g.wave} / 03`;
  $('objective').textContent=['Break the vanguard','Silence the archers','Defeat the Ashen Warden'][g.wave-1];
  $('kills').textContent=`${g.enemies.length} enemies remain · ${p.combo} hit chain · ${g.totalKills} defeated`;
  $('combat-tip').textContent=g.wave===1?'Strike to build Flow. Green drops restore health.':g.wave===2?'Archers aim along dashed lines. Keep moving.':'Bait the Warden’s strike, then dodge out of the circle.';
  for(const [id,cd] of [['attack',p.attackCD],['dodge',p.dodgeCD]]){
    $(`${id}-status`).textContent=cd>0?`${cd.toFixed(1)}s`:'READY';
  }
  $('special-status').textContent=p.specialCD>0?`${p.specialCD.toFixed(1)}s`:`${p.cost} FLOW`;
  $('special').style.borderColor=p.flow>=p.cost&&p.specialCD===0?'#ceb88b':'';
  const boss=g.enemies.find(e=>e.type==='boss');
  $('boss-hud').hidden=!boss;
  if(boss)$('boss-bar').style.width=`${100*boss.hp/boss.maxHp}%`;
}

const handled=new Set(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyJ','KeyK','KeyL','KeyE','Space','Escape']);
window.addEventListener('keydown',e=>{
  initSound();
  if(e.code==='Escape'){if(!e.repeat)pause();return;}
  if(g.mode!=='playing')return;
  if(handled.has(e.code))e.preventDefault();
  keys.add(e.code);
  if(!e.repeat){
    if(e.code==='KeyK'||e.code==='Space')dodge();
    if(e.code==='KeyL'||e.code==='KeyE')special();
  }
});
window.addEventListener('keyup',e=>keys.delete(e.code));
window.addEventListener('blur',()=>{keys.clear();if(g.mode==='playing')pause();});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&g.mode==='playing')pause();});

window.addEventListener('pointerdown',initSound,{once:true});

canvas.addEventListener('pointerdown',e=>{
  initSound();
  if(g.mode!=='playing')return;
  const r=canvas.getBoundingClientRect();
  g.p.facing=Math.atan2((e.clientY-r.top)/r.height*720-g.p.y,(e.clientX-r.left)/r.width*1280-g.p.x);
  attack();
  canvas.focus();
});

for(const [id,fn] of [['attack',attack],['dodge',dodge],['special',special]]){
  $(id).addEventListener('click',e=>{if(e.detail===0)fn();});
  $(id).addEventListener('pointerdown',e=>{
    e.preventDefault();
    initSound();
    fn();
    if(id==='attack'){keys.add('KeyJ');$(id).setPointerCapture(e.pointerId);}
  });
  for(const event of ['pointerup','pointercancel','lostpointercapture'])$(id).addEventListener(event,()=>keys.delete('KeyJ'));
}

for(const b of document.querySelectorAll('[data-move]')){
  b.addEventListener('pointerdown',e=>{
    e.preventDefault();
    initSound();
    keys.add(b.dataset.move);
    b.setPointerCapture(e.pointerId);
  });
  for(const event of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(event,()=>keys.delete(b.dataset.move));
}

$('overlay').addEventListener('keydown',e=>{
  if(e.key!=='Tab')return;
  const bs=[...$('overlay').querySelectorAll('button')];
  if(!bs.length)return;
  const first=bs[0],end=bs.at(-1);
  if(e.shiftKey&&document.activeElement===first){e.preventDefault();end.focus();}
  else if(!e.shiftKey&&document.activeElement===end){e.preventDefault();first.focus();}
});

function loop(now){
  const dt=Math.min((now-last)/1000,.035);
  last=now;
  if(g.mode==='playing'){
    update(dt);
    hud();
    if(bannerTimer>0){
      bannerTimer-=dt;
      if(bannerTimer<=0)$('banner').classList.remove('show');
    }
  }
  if(g.p)draw(ctx,g,reduced);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

$('start').disabled=true;
$('start').textContent='Preparing your journey…';
await loadArt(['arena',...HEROES.map(h=>`${h.id}-sprite`),'guard-sprite','warden-sprite','archer-sprite']);
ready=true;
$('start').disabled=false;
$('start').innerHTML='Enter the mountain pass <span>→</span>';
