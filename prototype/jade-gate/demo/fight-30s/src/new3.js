// ===================== FX events =====================
const ang=(a,d)=>d>0?a:Math.PI-a;
function atkFX(who,t0,big=1,dir=1,hit=true){
  ev(t0,.6,(u,t)=>{const z=zState(t),g=gState(t);const mx=(z[0]+g[0])/2,my=GROUND-330;const q=clamp(u/.38);
    if(who==='Z'||who==='X')sweep(q,z[0]+dir*150,my+30,260*big,ang(-1.0,dir),ang(.6,dir),1.3,46*big,'z',1,1);
    if(who==='G'||who==='X')sweep(q,g[0]-dir*120,my-10,300*big,ang(Math.PI*.8,dir),ang(Math.PI*1.38,dir),1.2,50*big,'g',1,1);
    if(hit&&u>.2){const cx=mx+dir*(who==='G'?-40:(who==='Z'?40:0));clash((u-.2)/.5,cx,my,big);}
    const dx=(who==='G')?z[0]:g[0];if(u<.7)dust(dx-dir*30,GROUND+8,u/.7,4,Math.floor(t0*10),90);
  });}
// ---- A: six exchanges + last strike
EXA.forEach((e,i)=>atkFX(e[1],e[0],i===6?1.5:1,1));
shk(4.85+.12,16,.4);shk(.52,5,.2);shk(1.32,5,.2);shk(2.12,5,.2);shk(2.87,5,.2);shk(3.62,6,.2);shk(4.27,6,.2);
ev(4.97,.55,(u,t)=>{const x=mA(t)+10;ring(x,GROUND+10,40+700*eo(u),70*(1-u)+10,'rgba(255,240,200,A)',(1-u)*.8,.2);debris(x,GROUND-300,u,26,401,520,420);dust(x,GROUND,u,12,402,260);});
// ---- hole damage in bg space
const HOLE=(()=>{const R=rng(2026);const pts=[];const cx=1040,top=361,base=800,side=173,y0=520;
  const outline=[];for(let a=Math.PI;a<=2*Math.PI+1e-6;a+=Math.PI/22)outline.push([cx+Math.cos(a)*side,y0+Math.sin(a)*(y0-top)]);
  const arch=[[cx-side,base]].concat([[cx-side,y0]],outline,[[cx+side,y0],[cx+side,base]]);
  // expand along outward direction with jagged jitter
  const ex=arch.map((p,i)=>{const dx=p[0]-cx,dy=p[1]-(y0+120);const l=Math.hypot(dx,dy)||1;const j=(i>0&&i<arch.length-1)?20+R()*70:6;return[p[0]+dx/l*j,p[1]+dy/l*j*.8];});
  const cracks=[];for(let i=0;i<14;i++){const p=outline[Math.floor(R()*outline.length)];const a=Math.atan2(p[1]-(y0+120),p[0]-cx);let x=p[0],y=p[1];const seg=[[x,y]];for(let k=0;k<4;k++){const aa=a+(R()-.5)*.8;const l=30+R()*60;x+=Math.cos(aa)*l;y+=Math.sin(aa)*l;seg.push([x,y]);}cracks.push(seg);}
  const ex2=[];for(let i=0;i<ex.length;i++){const a=ex[i],b=ex[(i+1)%ex.length];ex2.push(a);const n=3;for(let k=1;k<=n;k++){const u=k/(n+1);ex2.push([lerp(a[0],b[0],u)+(R()-.5)*28,lerp(a[1],b[1],u)+(R()-.5)*28]);}}
  return {arch,ex:ex2,cracks,inner:arch};})();
function holeFX(){const {ex,cracks,inner}=HOLE;ctx.save();
  ctx.beginPath();ex.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();
  inner.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();
  ctx.fillStyle='rgba(9,8,9,.97)';ctx.fill('evenodd');
  ctx.beginPath();ex.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();
  ctx.lineWidth=3;ctx.strokeStyle='rgba(120,110,95,.35)';ctx.lineJoin='bevel';ctx.stroke();
  ctx.fillStyle='rgba(2,3,6,.55)';ctx.beginPath();inner.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();ctx.fill();
  ctx.strokeStyle='rgba(5,5,8,.9)';ctx.lineWidth=4;for(const c of cracks){ctx.beginPath();c.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.stroke();}
  ctx.restore();}
function bgToScreen(cam,x,y){const [cx,cy,z,roll]=cam;const bz=1+(z-1)*.8;const bs=1.45,bx0=960-960*bs,by0=905-900*bs,bw=W*bs,bh=H*bs;
  let bcx=960+(cx-960)*.8,bcy=560+(cy-560)*.8;bcx=clamp(bcx,bx0+960/bz+4,bx0+bw-960/bz-4);bcy=clamp(bcy,by0+540/bz+4,by0+bh-540/bz-4);
  return [W/2+(x-bcx)*bz,H/2+(y-bcy)*bz];}
// debris that blocks the camera (screen space), 4.95–5.5, shape morphs to the hole
function blockDebris(t){if(t<4.95||t>=5.5)return;const u=(t-4.95)/.55,e=ei(u);
  const cam0=kf(CAMHOLE,5.49);const pts=HOLE.ex.map(p=>bgToScreen(cam0,p[0],p[1]));
  let cx=0,cy=0;pts.forEach(p=>{cx+=p[0];cy+=p[1]});cx/=pts.length;cy/=pts.length;
  const sc=lerp(.05,1,e),ox=lerp(1150,cx,e),oy=lerp(620,cy,e);
  ctx.save();ctx.beginPath();pts.forEach((p,i)=>{const x=ox+(p[0]-cx)*sc,y=oy+(p[1]-cy)*sc;i?ctx.lineTo(x,y):ctx.moveTo(x,y)});ctx.closePath();
  const gg=ctx.createLinearGradient(ox-300*sc,oy-300*sc,ox+300*sc,oy+300*sc);gg.addColorStop(0,'rgb(34,32,34)');gg.addColorStop(.5,'rgb(12,12,15)');gg.addColorStop(1,'rgb(5,5,8)');ctx.fillStyle=gg;ctx.fill();ctx.save();ctx.clip();ctx.strokeStyle='rgba(120,125,140,.35)';ctx.lineWidth=3;for(let i=0;i<7;i++){ctx.beginPath();ctx.moveTo(ox+(i*97%500-250)*sc,oy-350*sc);ctx.lineTo(ox+(i*61%400-200)*sc,oy+(i*53%300-100)*sc);ctx.lineTo(ox+(i*131%500-250)*sc,oy+400*sc);ctx.stroke();}ctx.restore();ctx.fillStyle='rgba(0,0,0,'+(.45*e)+')';ctx.fillRect(0,0,W,H);ctx.fillStyle=gg;ctx.lineWidth=2+6*e;ctx.strokeStyle=`rgba(190,180,160,${.6*(1-e*.4)})`;ctx.stroke();ctx.restore();
  // companion small chunks flying past
  const R=rng(51);ctx.save();for(let i=0;i<9;i++){const a=R()*6.28,d=lerp(80,900,R())*e,sz=lerp(10,60,R())*(.3+e);const x=1150+Math.cos(a)*d*1.2,y=620+Math.sin(a)*d*.8;
    ctx.translate(x,y);ctx.rotate(R()*6+u*3);ctx.fillStyle=`rgb(${30+R()*30|0},${28+R()*25|0},${28+R()*25|0})`;ctx.beginPath();ctx.moveTo(-sz,-sz*.4);ctx.lineTo(sz*.3,-sz*.8);ctx.lineTo(sz,sz*.3);ctx.lineTo(-sz*.3,sz*.7);ctx.closePath();ctx.fill();ctx.setTransform(1,0,0,1,0,0);}
  ctx.restore();}
ev(5.49,1.4,(u,t)=>{dust(1040,700,u,14,501,260);const R=rng(502);for(let i=0;i<8;i++){const x=1040+(R()-.5)*420,sz=lerp(4,16,R());const y0=420+R()*100,y=y0+700*Math.max(0,u-.05*i)*Math.max(0,u-.05*i)*1.3;ctx.fillStyle='rgb(60,56,52)';ctx.fillRect(x,y,sz,sz*.8);}});
// ---- B: Guan counter combo
shk(6.76,10,.25);
ev(6.38,.34,(u,t)=>{const g=gState(t);speedLines(t,g[0],GROUND-300,18,611,.4*(1-u));dust(g[0]+120,GROUND+8,u,6,612,120);});
ev(6.52,.50,(u,t)=>{const g=gState(t),cx=g[0]-40,cy=GROUND-330;for(let k=0;k<2;k++){const a=t*20+k*Math.PI;arc(cx,cy,300+k*40,a,a+3.8,40,GC[0],GC[1],.85*(1-u*.4),.9);}});
ev(6.74,.5,(u,t)=>{const z=zState(t);clash(u,z[0]+230,GROUND-350,1.1);});
ev(6.98,.3,(u,t)=>{const g=gState(t);arc(g[0]-130,GROUND-40,380,Math.PI*.78,Math.PI*1.32,60*(1-u*.4),GC[0],GC[1],.95*(1-u*.6),.3);dust(g[0]-100,GROUND+6,u,8,621,200);});
ev(7.26,.34,(u,t)=>{const g=gState(t);sweep(u,g[0]-150,GROUND-210,400,Math.PI*.78,Math.PI*1.58,1.2,62,'g',1,1);});
shk(7.46,22,.4);
ev(7.44,.6,(u,t)=>{clash(u,640,GROUND-300,1.6);ring(640,GROUND-300,60+500*eo(u),40*(1-u)+6,'rgba(255,240,205,A)',(1-u)*.6,1);});
ev(7.5,1.6,(u,t)=>{const z=zState(t);const R=rng(Math.floor(t*12)+700);ctx.save();
  if(u<.9)dust(z[0],GROUND+6,(u*1.6)%1,4,Math.floor(t*12)+701,110);
  if(z[1]>GROUND+60&&Math.abs(z[3]%360)>70){sparks(z[0],GROUND+16,(t*12)%1,6,Math.floor(t*12)+702,70,'255,235,200');}ctx.restore();});
// gather + pressure strike
ev(9.36,.34,(u,t)=>{const z=zState(t);const tx=z[0]+300,ty=GROUND-250;glow(tx,ty,160+120*(1-u),'rgba(210,235,255,A)',.35+.6*u);for(let k=0;k<3;k++)arc(tx,ty,200*(1-u)+60+k*40,-2.2+u*3+k*2,-0.8+u*3+k*2,22,ZC[0],'rgba(240,250,255,.95)',.65*u,1);});
ev(9.62,.45,(u,t)=>{const z=zState(t);sweep(clamp(u/.35),z[0]+260,GROUND-330,330,-1.3,.9,1.4,60,'z',1,1);if(u>.22)glow(SLABX,GROUND-40,(240*(1-(u-.22)/.4)+60),'rgba(235,245,255,A)',.95);});
shk(SMASH,24,.45);
ev(SMASH,1.3,(u,t)=>{ring(SLABX,GROUND+10,50+1300*eo(u),80*(1-u*.7)+16,'rgba(190,225,255,A)',1-u,.2);ring(SLABX,GROUND+10,30+900*eo(clamp(u*1.15)),50*(1-u*.7)+10,'rgba(255,255,255,A)',(1-u)*.8,.2);
  ring(SLABX+40,GROUND-120,60+600*eo(u),50*(1-u*.8)+8,'rgba(170,215,255,A)',(1-u)*.5,1);sparks(SLABX,GROUND-80,clamp(u/.4),26,711,360,'230,245,255');dust(SLABX,GROUND,u,16,712,300);});
// ---- slab (floor stone) ----
const SLABP=(()=>{const R=rng(88);const cols=4,rows=2,hw=170,hh=38;const gx=[],gy=[];
  for(let i=0;i<=cols;i++){gx.push([]);for(let j=0;j<=rows;j++){const edge=(i===0||i===cols||j===0||j===rows);gx[i].push([lerp(-hw,hw,i/cols)+(i>0&&i<cols?(R()-.5)*34:0),lerp(-hh,hh,j/rows)+(j>0&&j<rows?(R()-.5)*14:0)]);}}
  const ps=[];for(let i=0;i<cols;i++)for(let j=0;j<rows;j++){const q=[gx[i][j],gx[i+1][j],gx[i+1][j+1],gx[i][j+1]];const c=[q.reduce((a,p)=>a+p[0],0)/4,q.reduce((a,p)=>a+p[1],0)/4];
    ps.push({q,c,vx:(c[0]+60)*lerp(1.8,3.5,R())+(R()-.5)*160,vy:-lerp(500,1150,R())*(1-Math.abs(c[0])/260),w:(R()-.5)*14,r0:0,land:GROUND+lerp(-8,28,R())});}
  return ps;})();
function slabTex(poly,ox,oy){ // top face textured with floor crop of bg
  ctx.save();ctx.beginPath();poly.forEach((p,i)=>i?ctx.lineTo(p[0]+ox,p[1]+oy):ctx.moveTo(p[0]+ox,p[1]+oy));ctx.closePath();ctx.clip();
  ctx.drawImage(IMG.bg,640,980,620,90,-175+ox,-40+oy,350,80);
  ctx.fillStyle='rgba(120,130,150,.10)';ctx.fillRect(-180+ox,-42+oy,360,84);ctx.restore();
  ctx.save();ctx.beginPath();poly.forEach((p,i)=>i?ctx.lineTo(p[0]+ox,p[1]+oy):ctx.moveTo(p[0]+ox,p[1]+oy));ctx.closePath();ctx.lineWidth=2;ctx.strokeStyle='rgba(215,222,235,.55)';ctx.stroke();ctx.restore();}
function slabDraw(t){if(t<5.49||t>=12)return;
  if(t<SMASH){ // intact slab: top + front face
    ctx.save();ctx.translate(SLABX,GROUND+4);ctx.fillStyle='rgba(0,0,0,.45)';ctx.beginPath();ctx.ellipse(0,60,200,22,0,0,7);ctx.fill();
    const gf=ctx.createLinearGradient(0,38,0,100);gf.addColorStop(0,'rgb(58,64,76)');gf.addColorStop(1,'rgb(16,19,26)');ctx.fillStyle=gf;ctx.beginPath();ctx.moveTo(-170,38);ctx.lineTo(170,38);ctx.lineTo(170,100);ctx.lineTo(-170,100);ctx.closePath();ctx.fill();
    const q=[[-170,-38],[170,-38],[170,38],[-170,38]];slabTex(q,0,0);ctx.strokeStyle='rgba(8,8,12,.7)';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-40,-32);ctx.lineTo(-10,0);ctx.lineTo(-50,32);ctx.moveTo(60,-32);ctx.lineTo(80,10);ctx.stroke();ctx.restore();return;}
  const d=t-SMASH,fade=t>11.4?clamp(1-(t-11.4)/.6):1;
  for(const p of SLABP){const tt=d;let dx=p.vx*Math.min(tt,1.0)*.4,dy=p.vy*tt+1500*tt*tt*.5;const lo=p.land-GROUND;let rot=p.w*Math.min(tt,.8)*1.8;
    if(dy>lo&&tt>.12)dy=lo;
    ctx.save();ctx.globalAlpha=fade;ctx.translate(SLABX+p.c[0]+dx,GROUND+4+p.c[1]+dy);ctx.rotate(rot);
    const TH=34,poly=p.q.map(q=>[q[0]-p.c[0],q[1]-p.c[1]]);
    ctx.fillStyle='rgb(46,52,64)';ctx.beginPath();poly.forEach((q,i)=>i?ctx.lineTo(q[0],q[1]+TH):ctx.moveTo(q[0],q[1]+TH));ctx.closePath();ctx.fill();        // underside
    ctx.fillStyle='rgb(30,35,46)';for(let i=0;i<poly.length;i++){const a=poly[i],b2=poly[(i+1)%poly.length];ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b2[0],b2[1]);ctx.lineTo(b2[0],b2[1]+TH);ctx.lineTo(a[0],a[1]+TH);ctx.closePath();ctx.fill();}
    ctx.save();ctx.beginPath();poly.forEach((q,i)=>i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]));ctx.closePath();ctx.clip();
    ctx.drawImage(IMG.bg,640,980,620,90,-175-p.c[0],-40-p.c[1],350,80);ctx.fillStyle='rgba(150,162,185,.26)';ctx.fillRect(-200,-80,400,160);ctx.restore();
    ctx.beginPath();poly.forEach((q,i)=>i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]));ctx.closePath();ctx.lineWidth=2;ctx.strokeStyle='rgba(215,222,235,.5)';ctx.stroke();ctx.restore();}}
