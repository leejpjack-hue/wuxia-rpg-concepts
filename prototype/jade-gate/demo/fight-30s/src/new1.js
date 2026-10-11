// =====================================================================
//  30 s engine  (global world-time t in seconds; 24 fps; 720 frames)
// =====================================================================
const GROUND=880;
const T=rows=>rows.map(r=>{const a=r.slice();for(let k=r.length;k<7;k++)a.push(k===3?S:(k===4?0:1));return a;});
function poseF(list,t){let e=list[0];for(const p of list){if(t>=p[0]-1e-6)e=p;}return [e[1],!!e[2]];}
function w2s(cam,x,y){const [cx,cy,z,roll]=cam;const px=(x-cx)*z,py=(y-cy)*z;const r=roll*Math.PI/180,c=Math.cos(r),s=Math.sin(r);return [W/2+px*c-py*s,H/2+px*s+py*c];}
const HOLDS=[338,713];
function wfOf(F){let w=F;if(F>=341)w-=3;else if(F>=338)w-=(F-338);   // hold 1 (beat impact): world time lags 3 frames after
  if(F>=713&&F<716)w-=(F-713);                                          // hold 2 (final clash): 3 exposure frames freeze world time
  return w;}
function sprite(name,x,y,s,o={}){const im=IMG[name],m=meta[name];if(!im)return;
  ctx.save();ctx.translate(x,y);
  if(o.rot){const py=-0.45*im.height*s;ctx.translate(0,py);ctx.rotate(o.rot*Math.PI/180);ctx.translate(0,-py);}
  ctx.scale((o.flip?-1:1)*(o.sx||1),(o.sy||1));
  ctx.drawImage(im,-m.ax*s,-m.ay*s,im.width*s,im.height*s);ctx.restore();}
function worldBegin(cam,o={}){
  const [cx,cy,z,roll]=cam;
  ctx.save();ctx.translate(W/2,H/2);ctx.rotate(roll*Math.PI/180);
  ctx.save();const bz=1+(z-1)*.8;let bcx=960+(cx-960)*.8+(o.bgx||0),bcy=560+(cy-560)*.8;
  const bs=1.45,bx0=960-960*bs,by0=905-900*bs,bw=W*bs,bh=H*bs;
  const mgn=Math.abs(roll)>2?1.12:1;const hx=960*mgn/bz,hy=540*mgn/bz*1.0;
  bcx=clamp(bcx,bx0+hx+4,bx0+bw-hx-4);bcy=clamp(bcy,by0+hy+4,by0+bh-hy-4);
  ctx.scale(bz*(Math.abs(roll)>2?1.0:1),bz);ctx.translate(-bcx,-bcy);
  if(o.flip){ctx.translate(960,0);ctx.scale(-1,1);ctx.translate(-960,0);}
  ctx.drawImage(IMG.bg,bx0,by0,bw,bh);if(o.bgfx&&!o.flip)o.bgfx();ctx.restore();
  ctx.scale(z,z);ctx.translate(-cx,-cy);}
function worldEnd(){ctx.restore();}
// event list (world-space FX, global time)
const EV=[];const EVB=[];const ev=(t0,d,fn,back)=>(back?EVB:EV).push({t0,d,fn});
const SHK=[]; // [t0,amp,dur]
const shk=(t0,amp,dur)=>SHK.push([t0,amp,dur]);
const ZC=['rgba(255,255,255,0)','rgba(190,225,255,.95)'],GC=['rgba(110,240,150,0)','rgba(255,228,140,.95)'];
function sweep(u,x,y,r,A0,A1,span,wd,who,al=1,ry=1){ // travelling crescent
  const h=lerp(A0,A1,eo(u)),sg=A1>=A0?1:-1,c=who==='z'?ZC:GC;
  arc(x,y,r,h-sg*span,h,wd*(1-u*.35),c[0],c[1],al*(1-u*.55),ry);}
function clash(u,x,y,sz=1,col='255,246,215',flat=true){ // spark + glow + ring
  if(u<.6){sparks(x,y,u/.6,Math.round(18*sz),Math.floor(x+y)%97+1,150*sz,col);glow(x,y,(210*(1-u/.6)+30)*sz,'rgba(230,240,255,A)',.9);}
  ring(x,y+(flat?GROUND-y+10:0),30+380*sz*eo(u),40*(1-u)+6,'rgba(200,230,255,A)',(1-u)*.7,flat?.2:1);}
// ----- pose lists & tracks (A: 0-5.5 analytic) -----
const EXA=[[0.40,'Z','zhao-impact','guan-exchange'],[1.20,'G','zhao-parry','guan-follow'],[2.00,'Z','zhao-exchange','guan-feint'],[2.75,'G','zhao-feint','guan-approach'],[3.50,'X','zhao-follow','guan-follow'],[4.15,'Z','zhao-impact','guan-exchange'],[4.85,'G','zhao-parry','guan-follow']];
function pulse(t,t0){if(t<t0)return 0;const d=t-t0;return d<.12?d/.12:Math.exp(-(d-.12)*5.5);}
function offs(EX,t,sgn,k=70){let z=0,g=0;for(const e of EX){const p=pulse(t,e[0]);if(e[1]==='Z'){z+=sgn*k*p;g+=sgn*20*p;}else if(e[1]==='G'){g-=sgn*k*p;z-=sgn*20*p;}else{z+=sgn*30*p;g-=sgn*30*p;}}return [z,g];}
function posesFrom(EX,neutZ,neutG,t00){const zl=[[t00,neutZ]],gl=[[t00,neutG]];
  for(const e of EX){zl.push([e[0],e[2]]);gl.push([e[0],e[3]]);zl.push([e[0]+.46,neutZ]);gl.push([e[0]+.46,neutG]);}return [zl,gl];}
const [ZPA,GPA]=posesFrom(EXA,'zhao-follow','guan-feint',0);
const mA=t=>lerp(1330,780,clamp(t/5.1));
// ----- B (5.5 – 12.0) -----
const SLABX=770,SMASH=9.70;
const ZB=T([[5.49,230,GROUND],[6.30,590,GROUND],[6.74,600,GROUND],[6.85,572,GROUND],[7.05,576,GROUND],
 [7.06,586,GROUND+6,S,0,1.10,.78],[7.40,586,GROUND+6,S,0,1.10,.78],[7.44,582,GROUND],
 [7.50,566,GROUND-30,S,-18],[7.62,500,GROUND-130,S,-55],[7.76,430,GROUND-30,S,-88]]);
const GBr=T([[5.49,1860,GROUND],[6.30,1580,GROUND],[6.40,1540,GROUND],[6.72,1090,GROUND],[7.00,1075,GROUND],[7.10,1040,GROUND],[7.28,980,GROUND],[7.44,905,GROUND],[7.8,905,GROUND],[8.7,860,GROUND],[9.4,900,GROUND],[9.68,900,GROUND],[9.80,950,GROUND],[10.0,1000,GROUND]]);
const ZPB=[[5.49,'zhao-follow'],[5.85,'zhao-approach'],[6.2,'zhao-follow'],[6.74,'zhao-parry'],[7.06,'zhao-exchange'],[7.44,'zhao-parry'],[7.50,'zhao-aftermath'],[9.36,'zhao-exchange'],[9.62,'zhao-impact'],[9.90,'zhao-follow']];
const GPB=[[5.49,'guan-feint'],[6.40,'guan-exchange'],[6.55,'guan-follow'],[6.85,'guan-exchange'],[7.02,'guan-follow'],[7.12,'guan-exchange'],[7.28,'guan-follow'],[7.60,'guan-approach'],[8.0,'guan-feint'],[8.4,'guan-approach'],[8.8,'guan-feint'],[9.2,'guan-approach'],[9.62,'guan-follow'],[9.82,'guan-exchange']];
function zRoll(t){ // 7.76–9.36 roll, slide, rise
  const u=clamp((t-7.76)/1.24);const rot=-88-720*eo(u);
  let x=430-170*eo(clamp((t-7.76)/1.6)),y=GROUND+235*Math.abs(Math.sin(rot*Math.PI/180));
  if(t>=9.0){const v=clamp((t-9.0)/.36);const r2=-808+88*eio(v);x=260+(300-260)*0; y=GROUND+235*Math.abs(Math.sin(r2*Math.PI/180));return [x,y,S,r2,1,1];}
  // hops during roll
  y-=40*Math.abs(Math.sin(u*Math.PI*3))*(1-u);
  return [x,y,S,rot,1,1];}
// orbit (10.0-11.5)
const ORB=[10.0,11.5],OC=715,OD=290;
function orbit(t){const u=clamp((t-ORB[0])/(ORB[1]-ORB[0]));const th=(u*u*(3-2*u))*Math.PI*2;return th;}
function orbChars(t){const th=orbit(t),c=Math.cos(th),s=Math.sin(th);
  let dz=-OD*c,dg=OD*c;const sepMin=150;
  if(Math.abs(dz)<sepMin){const sg=c>=0?-1:1;dz=sg*sepMin;dg=-dz;}
  const sx=.80+.20*Math.abs(c),flip=c<0;
  const zS=S*(1+.17*s),gS=S*(1-.17*s);
  return {z:[OC+dz,GROUND+34*s,zS,0,sx,1],g:[OC+dg,GROUND-34*s,gS,0,sx,1],flip,th};}
