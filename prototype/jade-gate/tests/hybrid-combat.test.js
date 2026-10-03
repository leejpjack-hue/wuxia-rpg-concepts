import test from 'node:test';
import assert from 'node:assert/strict';
import { session, clearEncounter, quickParty } from './helpers.js';
import { groundPoint, onGround } from '../src/domain/ground.js';
import { HERO_IDS, HEROES } from '../src/content/heroes.js';
import { StrikeTimeline, DuelCinematic, CUTS, COUNTER_CUTS, cutFor, rivalFilmIdentity } from '../src/presentation/duel-cinematic.js';
import { translate } from '../src/locales/i18n.js';
const frames = (g,n,input={}) => { for(let i=0;i<n;i++) g.step(1/60,input); };
function crossfire() {
  const g=session();g.start('zhao-yun', 'quickplay', 'jade-gate', quickParty('zhao-yun'));clearEncounter(g);g.chooseDiscipline('power');return g;
}
test('archer contact and explicit challenge never open a card duel; arrows damage in real time',()=>{
  const g=crossfire(), archer=g.g.roam.field.find(e=>e.ranged);
  assert.equal(g.beginDuel(g.g.roam.field.indexOf(archer)),false);
  Object.assign(g.g.p,{x:archer.x,y:archer.y});frames(g,1);
  assert.equal(g.mode,'exploring');
  g.g.p.x=640;g.g.p.y=500; const hp=g.g.p.hp;
  frames(g,240);assert.equal(g.mode,'exploring');assert(g.g.p.hp<hp);assert.equal(g.g.duel,null);
});
test('arrows use swept collision, dodge prevents damage, pause freezes projectiles, death exits exploration',()=>{
  const g=crossfire();
  const arrow=()=>({x:g.g.p.x-60,y:g.g.p.y,vx:7200,vy:0,damage:15,life:1});
  g.g.roam.shots=[arrow()];g.roam.act('dodge');const hp=g.g.p.hp;frames(g,1);assert.equal(g.g.p.hp,hp);
  g.g.roam.shots=[arrow()];g.pause(); const frozen=JSON.stringify(g.g.roam);frames(g,60);assert.equal(JSON.stringify(g.g.roam),frozen);
  g.resume();g.g.roam.invulnerable=0;g.g.roam.dash=0;g.g.p.hp=1;g.g.roam.shots=[arrow()];frames(g,1);assert.equal(g.mode,'defeat');
});
test('last archer kill advances encounter once, with no orphan arrows or duplicate rewards',()=>{
  const g=crossfire();
  // archer-run fields an archer, a venom adept and a guard: duel both melee first.
  for(let duel=0; duel<2; duel++) {
    g.beginDuel(g.g.roam.field.findIndex(e=>!e.ranged));
    while(g.mode==='playing') g.combat.act(g.g.p.flow>=g.g.p.cost?'technique':'attack');
  }
  assert.equal(g.mode,'exploring');
  const archers=g.g.roam.field.filter(e=>e.ranged);
  assert.equal(archers.length,1); // archer-run now fields a single watcher
  for(const archer of archers) archer.hp=1;
  const kills=g.g.totalKills, score=g.g.score;
  Object.assign(g.g.p,{x:archers[0].x+70,y:archers[0].y});
  g.g.roam.shots=[{owner:archers[0].id}];
  assert(g.roam.act('strike'));
  assert.equal(g.mode,'upgrade');assert.equal(g.g.totalKills,kills+1);
  assert.equal(g.g.score,score+archers[0].reward);
  assert.equal(g.g.roam.shots.length,0);
  assert.equal(g.roam.act('strike'),false);assert.equal(g.g.totalKills,kills+1);
});
test('all actors and patrol targets remain on courtyard, including diagonal corners and dodges',()=>{
  for (const point of [{x:-999,y:-999},{x:9999,y:9999},{x:0,y:350},{x:1280,y:350}]) assert(onGround(groundPoint(point.x,point.y)));
  const g=session();g.start('zhao-yun', 'quickplay', 'jade-gate', quickParty('zhao-yun'));
  for(const [dx,dy] of [[0,-1],[-1,-1],[1,-1],[1,1],[-1,1]]) {
    for(let i=0;i<180;i++) {
      if(g.mode==='playing') { while(g.mode==='playing')g.combat.act(g.g.p.flow>=g.g.p.cost?'technique':'attack'); }
      if(g.mode!=='exploring')break;
      g.step(1/60,{dx,dy,actions:i%80===0?['dodge']:[]});assert(onGround(g.g.p));
      for(const e of g.g.roam.field){assert(onGround(e));assert(onGround({x:e.tx,y:e.ty}));}
    }
  }
});
test('cinematic preview matches actual damage and never consumes a turn',()=>{
  for(const hero of HERO_IDS.filter(id => { const h=HEROES.find(x => x.id === id); return h && !h.hidden && !h.recruitedOnly; }))for(const action of ['attack','technique','guard','tea']) {
    const g=session();g.start(hero, 'quickplay', 'jade-gate', quickParty(hero));g.beginDuel(0);g.g.p.hp=50;
    const before=JSON.stringify(g.g), result=g.combat.preview(action);
    assert(result);assert.equal(JSON.stringify(g.g),before);
    g.combat.act(action);assert.equal(g.g.duel.lastDamage,result.damage);assert.equal(g.g.duel.lastIncoming,result.incoming);
  }
});
test('cinematic cancellation invalidates queued callbacks; finishing frame commits exactly once',()=>{
  let callbacks=[],phases=[],commits=0;
  const timeline=new StrikeTimeline((fn,ms)=>{callbacks.push({fn,ms});return callbacks.length;},()=>{});
  timeline.play(cutFor('technique',false),p=>phases.push(p),()=>commits++);
  callbacks.slice(0,-1).forEach(c=>c.fn());assert.equal(commits,0);assert.equal(phases.at(-1),'reply');
  callbacks.at(-1).fn();callbacks.at(-1).fn();assert.equal(commits,1);
  callbacks=[];timeline.play(cutFor('technique',true),()=>{},()=>commits++);assert.equal(callbacks.at(-1).ms,220);
  timeline.cancel();callbacks.forEach(c=>c.fn());assert.equal(commits,1);
});
test('default browser-compatible timer scheduler completes a reduced-motion turn',async()=>{
  const timeline=new StrikeTimeline();const phases=[];
  await new Promise(resolve=>timeline.play(cutFor('attack',true),p=>phases.push(p),resolve));
  assert.deepEqual(phases,['prepare','strike','impact','reply']);
});
test('film cuts run in time order; a technique charges up before it strikes, a plain strike does not',()=>{
  for(const cut of Object.values(CUTS)){
    assert.equal(cut.at(-1)[0],'end');
    cut.slice(1).forEach(([,ms],i)=>assert(ms>=cut[i][1]));
  }
  const beats=cut=>cut.map(([beat])=>beat);
  assert.deepEqual(beats(cutFor('technique',false)),['prepare','focus','strike','impact','reply','end']);
  assert(!beats(cutFor('attack',false)).includes('focus'));
  assert(!beats(cutFor('technique',true)).includes('focus'));
  assert(cutFor('technique',false).at(-1)[1]>cutFor('attack',false).at(-1)[1]);
});

function filmFixture(manifest=[]){
  const parts=new Map(), cues=[], callbacks=[];
  const node={hidden:false,className:'',dataset:{},innerHTML:'',style:{setProperty(name,value){this[name]=value;}},
    // Real-DOM classList semantics backed by className, so counter/finisher toggles are observable.
    classList:{
      add(...names){node.className=[...new Set([...node.className.split(/\s+/).filter(Boolean),...names])].join(' ');},
      remove(...names){const drop=new Set(names);node.className=node.className.split(/\s+/).filter(name=>name&&!drop.has(name)).join(' ');},
      contains(name){return node.className.split(/\s+/).includes(name);},
      toggle(name,force){const on=force===undefined?!this.contains(name):!!force;on?this.add(name):this.remove(name);},
    },
    setAttribute(){},
    querySelector:selector=>{if(!parts.has(selector))parts.set(selector,{textContent:'',src:'',hidden:true,className:'',dataset:{},style:{},
      removeAttribute(name){if(name==='src')this.src='';},
      classList:{
      values:new Set(),add(name){this.values.add(name);},remove(name){this.values.delete(name);},contains(name){return this.values.has(name);}
    }});return parts.get(selector);}};
  const table={appendChild(){}};
  const timeline=new StrikeTimeline((fn,ms)=>{callbacks.push({fn,ms});return callbacks.length;},()=>{});
  const film=new DuelCinematic({createElement:()=>node},table,cue=>cues.push(cue.type),text=>text,timeline,manifest);
  const flush=()=>{callbacks.sort((a,b)=>a.ms-b.ms);while(callbacks.length)callbacks.shift().fn();};
  return {film,node,cues,callbacks,flush};
}
const hero=HEROES.find(h=>h.id==='zhao-yun');
const rival={name:'Ashen Swordsman',title:'Gate sentry',art:'guard-sprite',type:'grunt'};
test('duel intro opens with a gong and names both fighters, then leaves the table',()=>{
  const {film,node,cues,flush}=filmFixture();
  film.intro(hero,rival,true,false);
  assert.equal(node.hidden,false);assert.match(node.className,/film-intro/);assert.match(node.className,/ambush/);
  assert.equal(node.querySelector('.film-plate-hero b').textContent,'Zhao Yun');
  assert.equal(node.querySelector('.film-plate-enemy b').textContent,'Ashen Swordsman');
  flush();
  assert.deepEqual(cues,['dodge','duel_open']);
  assert.equal(node.querySelector('.film-caption').textContent,'AMBUSH · THE RIVAL REELS');
  assert.equal(node.hidden,true);
});
test('reduced motion skips the duel intro entirely',()=>{
  const {film,node,cues,callbacks}=filmFixture();node.hidden=true;
  film.intro(hero,rival,false,true);
  assert.equal(node.hidden,true);assert.equal(callbacks.length,0);assert.deepEqual(cues,[]);
});
test('acting during the intro cuts to the technique film; intro beats never fire and the turn commits once',()=>{
  const {film,node,cues,callbacks,flush}=filmFixture();
  film.intro(hero,rival,false,false);
  const stale=callbacks.splice(0);
  let commits=0;
  film.play('technique',hero,rival,{damage:54,incoming:6},false,()=>commits++);
  stale.forEach(c=>c.fn());
  assert.deepEqual(cues,['dodge']);
  flush();
  assert.deepEqual(cues,['dodge','charge','special','hit','enemy_windup','strike','hurt']);
  assert.equal(commits,1);assert.equal(node.hidden,true);
  assert.equal(node.querySelector('.film-seal').textContent,'趙雲');
});
test('new duel film captions have Japanese translations',()=>{
  for(const text of ['THE DUEL BEGINS','AMBUSH · THE RIVAL REELS']){
    assert.notEqual(translate(text),text);assert.equal(translate(text,'en'),text);
  }
});

const attackSheet={id:`${hero.id}-sheet`,file:'assets/test-sheet.png',frameW:128,frameH:128,
  anims:{attack:{frames:[[0,1],[1,1],[2,1]],fps:20,loop:false}}};
const assertStill=img=>{
  assert.equal(img.src,`assets/${hero.id}-sprite.png`);
  assert.equal(img.classList.contains('sheet-anim'),false);
  assert.equal(img.style.backgroundImage,'');
};
test('strike without a sheet or attack animation keeps the idle sprite throughout',()=>{
  for(const manifest of [[],[{...attackSheet,anims:{}}]]){
    const {film,node,callbacks}=filmFixture(manifest);
    film.play('attack',hero,rival,{damage:10},false,()=>{});
    const img=node.querySelector('.film-hero');assertStill(img);
    for(const {fn} of callbacks){fn();assertStill(img);}
  }
});
test('attack and technique sample every attack frame once, then restore the still before impact',()=>{
  for(const [action,fps] of [['attack',20],['technique',20],['attack',12],['technique',12]]){
    const sheet={...attackSheet,anims:{attack:{...attackSheet.anims.attack,fps}}};
    const {film,node,callbacks}=filmFixture([sheet]);let commits=0;
    film.play(action,hero,rival,{damage:10},false,()=>commits++);
    const img=node.querySelector('.film-hero');assertStill(img);
    const positions=[];
    for(const {fn} of callbacks.sort((a,b)=>a.ms-b.ms)){
      fn();
      if(img.classList.contains('sheet-anim')){
        assert.match(img.src,/^data:/);assert.equal(img.style.backgroundImage,'url("assets/test-sheet.png")');
        positions.push(img.style.backgroundPosition);
        assert.equal(node.dataset.phase,'strike');
      }else assertStill(img);
    }
    assert.deepEqual(positions,['0% 100%','50% 100%','100% 100%']);
    assert.equal(commits,1);assert.equal(node.hidden,true);
  }
});
test('long attacks clear at impact; cancelling invalidates frame ticks and cleans the next intro',()=>{
  const {film,node,callbacks,flush}=filmFixture([{...attackSheet,anims:{attack:{...attackSheet.anims.attack,fps:5}}}]);
  let commits=0;film.play('attack',hero,rival,{damage:10},false,()=>commits++);
  const img=node.querySelector('.film-hero');
  callbacks.sort((a,b)=>a.ms-b.ms);
  callbacks.shift().fn();assert.equal(img.classList.contains('sheet-anim'),true);
  callbacks.shift().fn();assert.equal(img.style.backgroundPosition,'50% 100%');
  callbacks.shift().fn();assert.equal(node.dataset.phase,'impact');assertStill(img);
  flush();assert.equal(commits,1);
  film.play('attack',hero,rival,{damage:10},false,()=>commits++);
  callbacks.shift().fn();assert.equal(img.classList.contains('sheet-anim'),true);
  const stale=callbacks.splice(0);film.cancel();assertStill(img);
  film.intro(hero,rival,false,false);stale.forEach(({fn})=>fn());assertStill(img);
  flush();assertStill(img);assert.equal(commits,1);
});
test('guard, tea, reduced motion and intro keep still sprites with a sheet available',()=>{
  const {film,node,callbacks,flush}=filmFixture([attackSheet]);
  const img=node.querySelector('.film-hero');
  for(const [action,reduced] of [['guard',false],['tea',false],['attack',true],['technique',true]]){
    film.play(action,hero,rival,{},reduced,()=>{});assertStill(img);
    for(const {fn} of callbacks.splice(0)){fn();assertStill(img);}
  }
  film.intro(hero,rival,false,false);flush();assertStill(img);
  film.play('attack',hero,rival,{},false,()=>{});callbacks.shift().fn();
  film.intro(hero,rival,false,true);assertStill(img);flush();assertStill(img);
});
test('an incoming counter plays the rival strike beats in order and the end beat waits for the hit',()=>{
  const {film,node,callbacks,cues}=filmFixture();
  let commits=0;
  film.play('attack',hero,rival,{damage:10,incoming:8,intent:'heavy'},false,()=>commits++);
  assert.match(node.className,/counter-heavy/);
  // timeline.play fires the first beat synchronously; the rest arrive as callbacks.
  // The final 'end' callback is intercepted by the timeline (cancel + commit), so the phase only changes on real beats.
  const phases=['prepare'];
  for(const {fn} of callbacks.sort((a,b)=>a.ms-b.ms)){fn();if(phases.at(-1)!==node.dataset.phase)phases.push(node.dataset.phase);}
  assert.deepEqual(phases,['prepare','strike','impact','reply','counter','counter-impact']);
  assert.deepEqual(cues,['strike','hit','enemy_windup','strike','hurt']);
  assert.equal(node.querySelector('.film-number').textContent,'−8');
  assert.equal(commits,1);
  assert.ok(callbacks.at(-1).ms>2000);
});
test('no incoming or reduced motion keeps the legacy reply beat without rival strike beats',()=>{
  for(const [result,reduced,expectedCues,expectedNumber] of [
    [{damage:10},false,['strike','hit'],''],
    [{damage:0,incoming:6},true,['strike','hurt'],'−6'],
  ]){
    const {film,node,callbacks,cues}=filmFixture();
    const phases=['prepare'];
    film.play('attack',hero,rival,result,reduced,()=>{});
    for(const {fn} of callbacks.sort((a,b)=>a.ms-b.ms)){fn();if(phases.at(-1)!==node.dataset.phase)phases.push(node.dataset.phase);}
    assert.deepEqual(phases,['prepare','strike','impact','reply']);
    assert.doesNotMatch(node.className,/counter-/);
    assert.deepEqual(cues,expectedCues);
    assert.equal(node.querySelector('.film-number').textContent,expectedNumber);
  }
});

test('signature uses the special cut and shows sig art on focus, then clears by impact',()=>{
  const {film,node,callbacks,cues}=filmFixture();
  let commits=0;
  film.play('signature',hero,rival,{damage:12,incoming:0},false,()=>commits++);
  assert.match(node.className,/action-signature/);
  const art=node.querySelector('.film-action-art');
  assert.equal(art.hidden,false);
  assert.match(art.src,/sig-counter\.png$/);
  const phases=['prepare'];
  for(const {fn} of callbacks.sort((a,b)=>a.ms-b.ms)){
    fn();
    if(phases.at(-1)!==node.dataset.phase)phases.push(node.dataset.phase);
    if(node.dataset.phase==='focus'){
      assert.equal(art.hidden,false);
      assert.match(art.src,/sig-counter\.png$/);
    }
    if(node.dataset.phase==='impact')assert.equal(art.hidden,true);
  }
  assert.ok(phases.includes('focus'));
  assert.ok(cues.includes('charge'));
  assert.ok(cues.includes('special'));
  assert.equal(commits,1);
  assert.equal(node.hidden,true);
});
test('counter-special shows special telegraph art on reply/counter then clears',()=>{
  const specialRival={...rival,kind:'guard',art:'guard-sprite'};
  const {film,node,callbacks}=filmFixture();
  film.play('attack',hero,specialRival,{damage:10,incoming:9,intent:'special'},false,()=>{});
  assert.match(node.className,/counter-special/);
  const art=node.querySelector('.film-action-art');
  assert.equal(art.hidden,true); // not yet — appears on reply
  for(const {fn} of callbacks.sort((a,b)=>a.ms-b.ms)){
    fn();
    if(['reply','counter-focus','counter'].includes(node.dataset.phase)){
      assert.equal(art.hidden,false);
      assert.match(art.src,/special-guard\.png$/);
    }
    if(node.dataset.phase==='counter-impact')assert.equal(art.hidden,true);
  }
});
test('assist flash shows oath emblem and follower sprite, then completes',()=>{
  const {film,node,callbacks,cues}=filmFixture();
  let commits=0;
  const follower={id:'guan-yu',name:'Guan Yu'};
  const oath={id:'changshan-vow',name:'Changshan Vow'};
  film.assistFlash({follower,oath,damage:16},hero,rival,false,()=>commits++);
  assert.match(node.className,/film-assist|action-assist/);
  assert.match(node.querySelector('.film-hero').src,/guan-yu-sprite\.png$/);
  const art=node.querySelector('.film-action-art');
  assert.equal(art.hidden,false);
  assert.match(art.src,/oath-changshan-vow\.png$/);
  for(const {fn} of callbacks.sort((a,b)=>a.ms-b.ms))fn();
  assert.ok(cues.includes('strike'));
  assert.ok(cues.includes('hit'));
  assert.equal(commits,1);
  assert.equal(node.hidden,true);
});
test('assist flash reduced motion skips straight to complete',()=>{
  const {film,node,callbacks,cues}=filmFixture();
  let commits=0;
  film.assistFlash({follower:{id:'guan-yu',name:'Guan Yu'},damage:8},hero,rival,true,()=>commits++);
  assert.equal(callbacks.length,0);
  assert.deepEqual(cues,[]);
  assert.equal(commits,1);
  assert.equal(node.hidden,true);
});

const duelAtlas=id=>({id:`${id}-duel-poses`, file:`assets/${id}-duel-poses.png`, runtimeApproved:true,
  duelPoses:{windup:[0,0],strike:[1,0],focus:[0,1],special:[1,1]}});
const poseRival={...rival,heroId:'guan-yu',art:'guan-yu-sprite',kind:'hero-guan-yu'};
test('normal and special films use different body poses and hold the contact pose through impact',()=>{
  for(const [action,windup,contact] of [['attack','windup','strike'],['technique','focus','special'],['signature','focus','special']]){
    const {film,node,callbacks}=filmFixture([duelAtlas(hero.id)]);
    let commits=0;film.play(action,hero,rival,{damage:20},false,()=>commits++);
    const img=node.querySelector('.film-hero');
    assert.equal(img.dataset.duelPose,windup);
    for(const {fn} of callbacks.sort((a,b)=>a.ms-b.ms)){
      fn();
      if(['strike','impact'].includes(node.dataset.phase))assert.equal(img.dataset.duelPose,contact);
      if(node.dataset.phase==='reply')assertStill(img);
    }
    assert.equal(commits,1);assertStill(img);
  }
});
test('named rival normal and special replies switch their own poses and cancellation restores both sprites',()=>{
  for(const intent of ['heavy','special']){
    const {film,node,callbacks}=filmFixture([duelAtlas(hero.id),duelAtlas('guan-yu')]);
    let commits=0;film.play('attack',hero,poseRival,{damage:10,incoming:12,intent},false,()=>commits++);
    const img=node.querySelector('.film-enemy');
    const tasks=callbacks.splice(0).sort((a,b)=>a.ms-b.ms);
    for(const task of tasks){
      task.fn();
      if(node.dataset.phase==='reply')assert.equal(img.dataset.duelPose,'windup');
      if(node.dataset.phase==='counter-focus')assert.equal(img.dataset.duelPose,'focus');
      if(node.dataset.phase==='counter'){
        assert.equal(img.dataset.duelPose,intent==='special'?'special':'strike');
        film.cancel();break;
      }
    }
    tasks.forEach(({fn})=>fn());
    assert.equal(commits,0);assertStill(node.querySelector('.film-hero'));
    assert.equal(img.src,'assets/guan-yu-sprite.png');
    assert.equal(img.style.backgroundImage,'');
    assert.equal(img.dataset.duelPose,undefined);
  }
});
test('pose atlases do not animate guard, tea, reduced motion or defeated rivals',()=>{
  for(const [action,reduced] of [['guard',false],['tea',false],['attack',true],['technique',true]]){
    const {film,node,callbacks}=filmFixture([duelAtlas(hero.id),duelAtlas('guan-yu')]);
    film.play(action,hero,poseRival,{incoming:0,lethal:true},reduced,()=>{});
    for(const {fn} of callbacks){fn();assertStill(node.querySelector('.film-hero'));assert.equal(node.querySelector('.film-enemy').dataset.duelPose,undefined);}
  }
});
test('assist poses belong to the follower and clear back to the follower sprite on completion',()=>{
  const {film,node,callbacks}=filmFixture([duelAtlas('guan-yu')]);
  let commits=0;film.assistFlash({follower:{id:'guan-yu',name:'Guan Yu'},damage:16},hero,rival,false,()=>commits++);
  const img=node.querySelector('.film-hero');assert.equal(img.dataset.duelPose,'windup');
  for(const {fn} of callbacks){fn();if(!node.hidden)assert.equal(img.dataset.duelPose,'strike');}
  assert.equal(commits,1);assert.equal(img.src,'assets/guan-yu-sprite.png');
  assert.equal(img.style.backgroundImage,'');
});


test('rival special charges, switches identity and poses, then commits once after its impact hold',()=>{
  for(const action of ['attack','guard','tea','technique','signature']){
    const {film,node,callbacks,cues}=filmFixture([duelAtlas(hero.id),duelAtlas('guan-yu')]);
    const guan=HEROES.find(h=>h.id==='guan-yu'), enemy={...poseRival,name:guan.name};
    let commits=0;
    film.play(action,hero,enemy,{damage:action==='attack'?10:0,incoming:12,intent:'special'},false,()=>commits++);
    assert.equal(node.style['--strike-color'],hero.color);
    const phases=['prepare'], times={};
    const tasks=callbacks.sort((a,b)=>a.ms-b.ms);
    for(const {fn,ms} of tasks.slice(0,-1)){
      fn(); times[node.dataset.phase]=ms;
      if(phases.at(-1)!==node.dataset.phase)phases.push(node.dataset.phase);
      assert.equal(commits,0);
      if(node.dataset.phase==='counter-focus'){
        assert.equal(node.dataset.attacker,'enemy');
        assert.equal(node.querySelector('.film-enemy').dataset.duelPose,'focus');
        assert.equal(node.querySelector('.film-title').textContent,guan.skill);
        assert.equal(node.querySelector('.film-seal').textContent,guan.cn);
        assert.equal(node.style['--strike-color'],guan.color);
        assert.equal(node.querySelector('.film-action-art').hidden,false);
      }
      if(['counter','counter-impact'].includes(node.dataset.phase))
        assert.equal(node.querySelector('.film-enemy').dataset.duelPose,'special');
    }
    const opening=['prepare',...(['technique','signature'].includes(action)?['focus']:[])];
    assert.deepEqual(phases,[...opening,'strike','impact','reply','counter-focus','counter','counter-impact']);
    assert.equal(times.counter-times['counter-focus'],900);
    assert.ok(tasks.at(-1).ms-times['counter-impact']>=620);
    assert.ok(cues.includes('charge'));assert.ok(cues.includes('special'));
    assert.equal(node.querySelector('.film-number').textContent,'−12');
    tasks.at(-1).fn();tasks.at(-1).fn();assert.equal(commits,1);
    assert.equal(node.hidden,true);
    film.play('attack',hero,enemy,{incoming:0},false,()=>{});
    assert.equal(node.dataset.attacker,'hero');assert.equal(node.style['--strike-color'],hero.color);
  }
});
test('a non-lethal counter reply does not take the defeated rival fade',()=>{
  const {film,node,callbacks}=filmFixture([duelAtlas('guan-yu')]);
  film.play('attack',hero,poseRival,{damage:10,incoming:12,intent:'special'},false,()=>{});
  let sawReply=false;
  for(const {fn} of callbacks.sort((a,b)=>a.ms-b.ms)){
    fn();
    if(node.dataset.phase==='reply'){
      sawReply=true;
      assert.equal(node.classList.contains('finisher'),false);
      assert.equal(node.classList.contains('counter'),true);
      assert.equal(node.querySelector('.film-enemy').dataset.duelPose,'windup');
    }
  }
  assert.equal(sawReply,true);
  const lethal=filmFixture([duelAtlas('guan-yu')]);
  lethal.film.play('attack',hero,poseRival,{damage:40,incoming:0,lethal:true},false,()=>{});
  for(const {fn} of lethal.callbacks.sort((a,b)=>a.ms-b.ms)){
    fn();
    if(lethal.node.dataset.phase==='reply'){
      assert.equal(lethal.node.classList.contains('finisher'),true);
      assert.equal(lethal.node.classList.contains('counter'),false);
    }
  }
});
test('cancel during the rival special focus prevents stale attack, impact and completion callbacks',()=>{
  const {film,node,callbacks,cues}=filmFixture([duelAtlas('guan-yu')]);
  let commits=0;
  film.play('attack',hero,poseRival,{incoming:12,intent:'special'},false,()=>commits++);
  const tasks=callbacks.sort((a,b)=>a.ms-b.ms);
  for(const {fn} of tasks){fn();if(node.dataset.phase==='counter-focus')break;}
  film.cancel();const sounds=cues.length;
  tasks.forEach(({fn})=>fn());
  assert.equal(commits,0);assert.equal(cues.length,sounds);assert.equal(node.hidden,true);
  assert.equal(node.querySelector('.film-enemy').src,'assets/guan-yu-sprite.png');
  assert.equal(node.querySelector('.film-action-art').hidden,true);
});
test('a special with no incoming damage and reduced motion never charges or displays special art',()=>{
  for(const [incoming,reduced] of [[0,false],[12,true]]){
    const {film,node,callbacks,cues}=filmFixture();
    film.play('guard',hero,{...rival,kind:'guard'},{incoming,intent:'special'},reduced,()=>{});
    for(const {fn} of callbacks){fn();assert.equal(node.querySelector('.film-action-art').hidden,true);}
    assert.ok(!cues.includes('charge'));assert.ok(!cues.includes('special'));
  }
});
test('rival motion uses its own identity and bosses retain their costume-specific sprite fallback',()=>{
  for(const fighter of HEROES){
    const identity=rivalFilmIdentity({heroId:fighter.id,kind:`hero-${fighter.id}`,art:`${fighter.id}-sprite`});
    assert.equal(identity.style,fighter.id);assert.equal(identity.color,fighter.color);assert.equal(identity.special,fighter.skill);
  }
  assert.equal(rivalFilmIdentity({heroId:'lu-bu',kind:'lu-bu-rival',art:'lu-bu-rival-sprite'}).special,'Skyfall Halberd');
  const {film,node,callbacks}=filmFixture([duelAtlas('lu-bu')]);
  film.play('attack',hero,{heroId:'lu-bu',kind:'lu-bu-rival',art:'lu-bu-rival-sprite'},{incoming:10,intent:'special'},false,()=>{});
  for(const {fn} of callbacks){fn();assert.equal(node.querySelector('.film-enemy').src,'assets/lu-bu-rival-sprite.png');}
  assert.equal(COUNTER_CUTS.special.at(-1)[0],'end');
  assert.notEqual(translate('RIVAL TECHNIQUE'),'RIVAL TECHNIQUE');
});
