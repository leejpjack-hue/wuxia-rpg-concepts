// ===================== render =====================
const NFG=720;
function drawChar(st,po,sc){ // st=[x,y,s,rot,sx,sy] po=[name,flip]
  sprite(po[0],st[0],st[1],st[2],{rot:st[3],sx:st[4],sy:st[5],flip:po[1]});}
function renderWide(t,F){
  const tq=Math.floor(t*12+1e-6)/12;
  let cam=camAtG(t);let sh=0;for(const [t0,a,d] of SHK){if(t>=t0&&t<t0+d)sh=Math.max(sh,a*(1-(t-t0)/d));}
  const R=rng(F*7+3);const cc=[cam[0]+(R()-.5)*sh,cam[1]+(R()-.5)*sh,cam[2],cam[3]];
  const o={};if(t>=5.49&&t<12)o.bgfx=holeFX;
  if(t>=ORB[0]&&t<ORB[1]){const oc=orbChars(t);o.bgx=300*Math.sin(oc.th);o.flip=Math.cos(oc.th)<0&&Math.sin(oc.th)>-2;}
  // bgfx hook: patch worldBegin to call
  worldBegin(cc,o);
  const zs=zState(tq),gs=gState(tq),zp=zPose(tq),gp=gPose(tq);
  for(const [c,sc] of [[zs,1],[gs,1]]){const hover=Math.max(0,GROUND-c[1]);ctx.save();ctx.globalAlpha=1/(1+hover/350);shadow(c[0]+(c===zs?30:-10),GROUND+6,230*c[2]/S*(1/(1+hover/700)),.55);ctx.restore();}
  if(t>=29.0)wallCollapse(t,CLASHT);
  slabDraw(t);
  for(const e of EVB){if(t>=e.t0&&t<e.t0+e.d)e.fn((t-e.t0)/e.d,t);}
  const order=[[gs,gp],[zs,zp]].sort((a,b)=>a[0][1]-b[0][1]);
  for(const [st,po] of order)drawChar(st,po);
  for(const e of EV){if(t>=e.t0&&t<e.t0+e.d)e.fn((t-e.t0)/e.d,t);}
  finalRings(t);
  worldEnd();
  embers(t,cam[0],cam[2]);
  // screen-space extras
  if(t>=ORB[0]&&t<ORB[1]){const u=(t-ORB[0])/(ORB[1]-ORB[0]);ctx.save();ctx.globalCompositeOperation='lighter';for(let k=0;k<4;k++){const a0=u*14+k*1.57;ctx.strokeStyle=`rgba(205,230,255,.4)`;ctx.lineWidth=5-k*.8;ctx.beginPath();ctx.ellipse(W*.5,H*.5,W*.50+k*30,H*.78+k*40,0,a0,a0+.8);ctx.stroke();}ctx.restore();speedLines(t,W*.5,H*.55,22,1000+(F%4),.28);}
  if(t>=24.0&&t<24.4)speedLines(t,W*.45,H*.5,22,2400+F%3,.35);
  if(t>=25.1&&t<26.9){const u=(t-25.1)/1.8;speedLines(t,W*.5,H*.5,18+Math.floor(u*20),2510+(F%3),.25+.3*Math.sin(Math.PI*u));}
  if(t>=26.5&&t<27.0)speedLines(t,W*.5,H*.35,30,2650+(F%3),.5);
  blockDebris(t);
  fgDebris(t,CLASHT,.30,2972,9,1);fgDebris(t,CLASHT+.04,.24,2980,6,-1);fgDebris(t,28.95,.4,2895,5,1);fgDebris(t,22.72,.35,2272,6,1);fgDebris(t,14.1,0,1,0);
  vignette(.45);
  return cc;}
function render(F){
  const wf=wfOf(F),t=wf/FPS;
  ctx.fillStyle='#000';ctx.fillRect(0,0,W,H);
  let cam=null;
  if(t>=12&&t<18){renderBeat(t-12,F-288);}
  else{const p=plateAt(t);if(p)drawPlate(p,t,F);else cam=renderWide(t,F);}
  if(F>=338&&F<341)expo(F-338,1130,560);
  else if(F>=713&&F<716){const c=clashC(CLASHT-.001);const cm=camAtG(t);const s=w2s(cm,c[0],c[1]);expo(F-713,s[0],s[1]);}
}
window.__render=render;window.__NF=NFG;
const META=%META%;
const names2=['zhao-approach','zhao-feint','zhao-parry','zhao-exchange','zhao-impact','zhao-follow','zhao-aftermath','guan-approach','guan-feint','guan-exchange','guan-follow','guan-aftermath'];
Promise.all([load('assets/bg/bg.jpg'),load('assets/bg/angle-low.jpg'),load('assets/bg/angle-ots.jpg'),...names2.map(n=>load('assets/sprites/'+n+'.png'))]).then(a=>{
  Object.assign(meta,META);IMG.bg=a[0];IMG.low=a[1];IMG.ots=a[2];names2.forEach((n,i)=>IMG[n]=a[3+i]);
  window.__ready=true;
  const q=new URLSearchParams(location.search);
  if(q.has('f')){render(+q.get('f'));return;}
  if(q.has('manual'))return;
  let t0=performance.now();(function loop(now){const f=Math.floor(((now-t0)/1000*FPS))%NFG;render(f);requestAnimationFrame(loop);})(t0);
});
})();
</script></body></html>
