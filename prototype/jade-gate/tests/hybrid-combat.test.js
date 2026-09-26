import test from 'node:test';
import assert from 'node:assert/strict';
import { session, clearEncounter } from './helpers.js';
import { groundPoint, onGround } from '../src/domain/ground.js';
import { HERO_IDS } from '../src/content/heroes.js';
import { StrikeTimeline } from '../src/presentation/duel-cinematic.js';
const frames = (g,n,input={}) => { for(let i=0;i<n;i++) g.step(1/60,input); };
function crossfire() {
  const g=session();g.start('zhao-yun','quickplay');clearEncounter(g);g.chooseDiscipline('power');return g;
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
  const g=crossfire();g.beginDuel(g.g.roam.field.findIndex(e=>!e.ranged));
  while(g.mode==='playing') g.combat.act(g.g.p.flow>=g.g.p.cost?'technique':'attack');
  assert.equal(g.mode,'exploring');const archer=g.g.roam.field[0];
  Object.assign(g.g.p,{x:archer.x+70,y:archer.y});archer.hp=1;
  g.g.roam.shots=[{owner:archer.id}];const kills=g.g.totalKills,score=g.g.score;
  assert(g.roam.act('strike'));assert.equal(g.mode,'upgrade');assert.equal(g.g.totalKills,kills+1);
  assert.equal(g.g.score,score+archer.reward);assert.equal(g.g.roam.shots.length,0);
  assert.equal(g.roam.act('strike'),false);assert.equal(g.g.totalKills,kills+1);
});
test('all actors and patrol targets remain on courtyard, including diagonal corners and dodges',()=>{
  for (const point of [{x:-999,y:-999},{x:9999,y:9999},{x:0,y:350},{x:1280,y:350}]) assert(onGround(groundPoint(point.x,point.y)));
  const g=session();g.start('zhao-yun','quickplay');
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
  for(const hero of HERO_IDS)for(const action of ['attack','technique','guard','tea']) {
    const g=session();g.start(hero,'quickplay');g.beginDuel(0);g.g.p.hp=50;
    const before=JSON.stringify(g.g), result=g.combat.preview(action);
    assert(result);assert.equal(JSON.stringify(g.g),before);
    g.combat.act(action);assert.equal(g.g.duel.lastDamage,result.damage);assert.equal(g.g.duel.lastIncoming,result.incoming);
  }
});
test('cinematic cancellation invalidates queued callbacks; finishing frame commits exactly once',()=>{
  let callbacks=[],phases=[],commits=0;
  const timeline=new StrikeTimeline((fn,ms)=>{callbacks.push({fn,ms});return callbacks.length;},()=>{});
  timeline.play(true,false,p=>phases.push(p),()=>commits++);
  assert.deepEqual(callbacks.map(c=>c.ms),[450,1050,1550,2150]);
  callbacks.slice(0,3).forEach(c=>c.fn());assert.equal(commits,0);assert.equal(phases.at(-1),'reply');
  callbacks[3].fn();callbacks[3].fn();assert.equal(commits,1);
  callbacks=[];timeline.play(false,true,()=>{},()=>commits++);assert.equal(callbacks.at(-1).ms,220);
  timeline.cancel();callbacks.forEach(c=>c.fn());assert.equal(commits,1);
});
test('default browser-compatible timer scheduler completes a reduced-motion turn',async()=>{
  const timeline=new StrikeTimeline();const phases=[];
  await new Promise(resolve=>timeline.play(false,true,p=>phases.push(p),resolve));
  assert.deepEqual(phases,['prepare','strike','impact','reply']);
});
