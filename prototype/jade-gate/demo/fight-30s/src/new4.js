// ---- orbit fx (10.0–11.5)
ev(10.0,1.5,(u,t)=>{const th=orbit(t);for(let k=0;k<3;k++){const a=th*1.0+k*2.1;arc(OC,GROUND+16,430+k*60,a,a+1.1,22,'rgba(170,215,255,0)','rgba(235,248,255,.8)',.75,.22);}
  const q=Math.floor((t-10)*8);const who=q%2?'z':'g';const cx=OC+(who==='z'?-1:1)*60*Math.cos(th);const A=t*14;arc(OC,GROUND-330,330,A,A+2.6,34,(who==='z'?ZC:GC)[0],(who==='z'?ZC:GC)[1],.7,.8);});
shk(10.05,6,.3);
ev(11.5,.5,(u,t)=>{clash(u,OC,GROUND-330,1.4);});shk(11.52,14,.3);
// ---- plates (screen-space cuts)
const PLATES=[[10.40,10.62,'low',false],[11.00,11.22,'ots',false],[19.30,19.65,'low',true],[23.20,23.60,'ots',true],[25.95,26.22,'low',false],[28.50,28.85,'ots',true]];
function plateAt(t){for(const p of PLATES)if(t>=p[0]&&t<p[1])return p;return null;}
function drawPlate(p,t,F){const u=(t-p[0])/(p[1]-p[0]);ctx.save();
  if(p[3]){ctx.translate(W,0);ctx.scale(-1,1);} // mirrored plate (original art, flipped)
  if(p[2]==='low'){const z=lerp(1.0,1.2,eo(u));
    ctx.save();ctx.translate(W/2,H/2);ctx.scale(z,z);ctx.translate(-lerp(960,1020,u),-lerp(540,520,u));ctx.drawImage(IMG.low,0,0,W,H);
    arc(560,430,420,-1.35,-0.35,30,ZC[0],ZC[1],clamp(1-Math.abs(u-.35)*3)*.9,1);
    arc(1280,480,360,Math.PI*0.85,Math.PI*1.30,24,GC[0],GC[1],clamp(1-Math.abs(u-.7)*3)*.85,1);
    glow(1150,470,200,'rgba(235,245,255,A)',clamp(u*1.2-.4)*.8);ctx.restore();
  }else{const z=lerp(1.0,1.55,eio(u*.9+.1*u));const sh=(u>.85)?6*Math.sin(F*2.2):0;
    ctx.save();ctx.translate(W/2+sh,H/2);ctx.scale(z,z);ctx.translate(-lerp(900,1190,u),-lerp(520,530,u));ctx.drawImage(IMG.ots,0,0,W,H);
    if(u>.35){const q=(u-.35)/.65;glow(1106,628,120+220*(1-q),'rgba(210,235,255,A)',.35+.55*q);
      for(let k=0;k<3;k++)arc(1106,628,200*(1-q)+60+k*55,-2.2+q*3+k,-0.9+q*3+k,24,ZC[0],'rgba(240,250,255,.95)',.6*q,1);}
    if(u>.55){const q=(u-.55)/.45;sparks(1150,520,(q*3)%1,10,200+Math.floor(q*3),110,'255,245,215');}
    ctx.restore();}
  ctx.restore();
  speedLines(t,W*.5,H*.5,p[2]==='ots'?30:14,9+(F%3),p[2]==='ots'?.3+.5*u:.28*u);vignette(.52);}
// ---- D
EXD.forEach(e=>atkFX(e[1],e[0],1,1));
ev(19.66,.3,(u,t)=>{const g=gState(t);sweep(u,g[0]-150,GROUND-300,430,Math.PI*.75,Math.PI*1.45,1.5,70,'g',1,1);});
ev(19.7,.7,(u,t)=>{const g=gState(t);dust(g[0]+80,GROUND+8,u,8,1971,180);});
ev(19.9,.5,(u,t)=>{const z=zState(t);dust(z[0],GROUND+8,u,6,1990,140);if(t>20.2)ring(z[0],GROUND+10,40+260*eo(u),30*(1-u)+5,'rgba(200,230,255,A)',(1-u)*.6,.2);});
// gather 21.1–22.4
ev(21.1,1.3,(u,t)=>{const z=zState(t),g=gState(t);const tx=z[0]+330,ty=GROUND-270;
  glow(tx,ty,150+190*(1-u*.5),'rgba(210,235,255,A)',.12+.4*u);for(let k=0;k<4;k++)arc(tx,ty,260*(1-u)+60+k*40,-2.2+u*7+k*1.6,-0.8+u*7+k*1.6,22,ZC[0],'rgba(240,250,255,.95)',.6*u+.1,1);
  ring(g[0],GROUND+8,300*(1-u*.4),40,'rgba(130,240,160,A)',.2+.6*u,.2);
  const gx=g[0]-60,gy=GROUND-330;for(let k=0;k<3;k++){const a=-t*9+k*2.1;arc(gx,gy,330*(1-u*.25)+k*30,a,a+1.5,26,GC[0],GC[1],.15+.6*u,.9);}glow(gx,gy,230,'rgba(150,240,150,A)',.05+.1*u);});
ev(22.55,.7,(u,t)=>{const z=zState(t),g=gState(t);speedLines(t,(z[0]+g[0])/2,GROUND-300,20,2266,.45*(1-u));clash(clamp((u-.15)/.6),(z[0]+g[0])/2+10,GROUND-320,1.7);
  ring((z[0]+g[0])/2,GROUND-320,40+520*eo(u),44*(1-u)+6,'rgba(255,245,225,A)',(1-u)*.7,1);});
shk(22.72,18,.4);
ev(23.6,.4,(u,t)=>{const g=gState(t);ring(g[0],GROUND+8,260*(1-u*.2),30,'rgba(130,240,160,A)',.4+.4*u,.2);glow(g[0],GROUND-120,180,'rgba(150,240,150,A)',.1+.15*u);});
// ---- E
ev(24.04,.45,(u,t)=>{const g=gState(t);arc(g[0]-190,g[1]-330,470,Math.PI*.95,Math.PI*1.15+.5*u,44,GC[0],GC[1],.9*(1-u*.5),1);});
ev(24.2,.5,(u,t)=>{const z=zState(t);clash(u,z[0]+190,GROUND-330,1.4);dust(z[0]-20,GROUND+8,u,5,2421,120);});
shk(24.2,16,.35);
ev(24.25,.6,(u,t)=>{const z=zState(t);if(t<24.85){sparks(z[0],GROUND+14,(t*14)%1,6,Math.floor(t*14)+2430,70,'255,235,200');dust(z[0]+20,GROUND+8,(u*2)%1,4,Math.floor(t*14)+2431,100);}});
ev(24.45,.35,(u,t)=>{const g=gState(t);for(let k=0;k<2;k++){const a=t*22+k*Math.PI;arc(g[0]-40,GROUND-330,300+k*30,a,a+3.6,36,GC[0],GC[1],.85*(1-u*.3),.9);}});
ev(24.78,.34,(u,t)=>{const g=gState(t);for(let k=0;k<2;k++){const a=t*26+k*Math.PI;arc(g[0],g[1]-330,300+k*30,a,a+3.6,36,GC[0],GC[1],.85,.9);}});
ev(24.8,.34,(u,t)=>{const z=zState(t);arc(z[0]-100,GROUND-60,380,-.25,.3+0,40*(1-u*.4),ZC[0],ZC[1],.9*(1-u*.4),.25);dust(z[0]-60,GROUND+8,u,7,2481,170);});
ev(25.15,.45,(u,t)=>{const z=zState(t),g=gState(t);sweep(clamp(u/.5),z[0]-30,GROUND-190,400,2.3,4.75,1.5,70,'z',1,1);
  ring(z[0]-80,GROUND-210,50+520*eo(u),44*(1-u)+6,'rgba(190,225,255,A)',(1-u)*.8,1.0);for(let i=0;i<8;i++){const R=rng(2515+i);const px=z[0]-80+(R()-.5)*300,py=GROUND-80-u*(420+R()*300);ctx.fillStyle='rgb(70,66,62)';ctx.fillRect(px,py,8+R()*14,6+R()*10);}
  sparks(z[0]-60,GROUND-200,clamp(u/.5),18,2516,300,'230,245,255');});
shk(25.2,18,.4);
ev(25.55,.5,(u,t)=>{const z=zState(t);clash(u,z[0]-120,z[1]-330,1.5,'255,246,215',false);ring(z[0]-120,z[1]-330,40+420*eo(u),36*(1-u)+6,'rgba(255,245,225,A)',(1-u)*.7,1);});
shk(25.58,14,.35);
ev(25.7,1.1,(u,t)=>{const z=zState(t),g=gState(t);
  const k=Math.floor((t-25.7)*10);arc(g[0],g[1]-300,220,t*9,t*9+2.2,26,GC[0],GC[1],.7,1);arc(z[0],z[1]-300,260,-t*8,-t*8+2.4,28,ZC[0],ZC[1],.7,1);});
ev(26.0,.45,(u,t)=>{const x=(zState(t)[0]+gState(t)[0])/2,y=(zState(t)[1]+gState(t)[1])/2-320;clash(u,x,y,1.8,'255,246,215',false);ring(x,y,40+560*eo(u),40*(1-u)+6,'rgba(210,235,255,A)',(1-u)*.8,1);
  debris(x,y,u,22,2601,420,300);});
shk(26.02,16,.35);
ev(26.38,.4,(u,t)=>{const x=(zState(t)[0]+gState(t)[0])/2,y=(zState(t)[1]+gState(t)[1])/2-320;clash(u,x,y,1.4,'255,246,215',false);debris(x,y,u,16,2638,360,260);});
ev(26.5,.5,(u,t)=>{const z=zState(t),g=gState(t);for(const c of [z,g]){ctx.save();ctx.globalCompositeOperation='lighter';ctx.strokeStyle='rgba(225,240,255,.35)';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(c[0]+60,c[1]-620);ctx.lineTo(c[0]+160,c[1]-1000);ctx.stroke();ctx.restore();}});
ev(26.95,.6,(u,t)=>{const z=zState(t);ring(z[0],GROUND+10,40+700*eo(u),60*(1-u)+8,'rgba(200,230,255,A)',(1-u)*.8,.2);dust(z[0],GROUND,u,12,2695,240);});
shk(27.0,14,.3);
// ---- F
EXF.forEach((e,i)=>{if(i>=5&&i<=6)return;atkFX(e[1],e[0],i===7?1.6:(i===4?1.3:1),-1,i!==7);});
ev(27.2,.4,(u,t)=>{const g=gState(t);sweep(u,g[0]+150,GROUND-420,470,Math.PI*1.1,Math.PI*1.9,1.6,64,'g',1,1);});
ev(27.4,.5,(u,t)=>{const z=zState(t),g=gState(t);clash(u,(z[0]+g[0])/2,GROUND-260,1.2);ring(z[0]-120,GROUND-260,40+380*eo(u),36*(1-u)+6,'rgba(190,225,255,A)',(1-u)*.8,1);});
shk(27.47,12,.3);shk(28.07,10,.3);shk(28.27,16,.35);shk(27.82,8,.25);
ev(28.2,.55,(u,t)=>{const z=zState(t),g=gState(t);const x=(z[0]+g[0])/2;ring(x,GROUND-300,50+440*eo(u),44*(1-u)+6,'rgba(205,230,255,A)',(1-u)*.8,1);ring(x,GROUND-300,30+300*eo(clamp(u*1.2)),30*(1-u)+4,'rgba(255,255,255,A)',(1-u)*.6,1);});
ev(28.55,.55,(u,t)=>{const g=gState(t);for(let k=0;k<2;k++){const a=t*24+k*Math.PI;arc(g[0],GROUND-330,330+k*50,a,a+4.0,44,GC[0],GC[1],.9,.9);}glow(g[0],GROUND-330,260,'rgba(150,240,150,A)',.12);});
ev(28.9,.8,(u,t)=>{const g=gState(t);const R=rng(2892);for(let k=0;k<3;k++){const a=t*20+k*2.1;arc(g[0]+40,GROUND-320,380+k*40,a,a+2.4,40,GC[0],GC[1],.5+.4*u,.9);}});
// stomp cracks and lifting floor tiles 28.85–29.7+
function floorCracks(cx,t0,t){if(t<t0)return;const u=clamp((t-t0)/.5);const R=rng(2899);ctx.save();ctx.strokeStyle='rgba(6,6,10,.9)';ctx.lineCap='round';
  for(let i=0;i<10;i++){const a=(R()-.5)*3.0+(i%2?Math.PI:0),L=lerp(150,720,R())*eo(u);ctx.lineWidth=2+R()*4;ctx.beginPath();let x=cx,y=GROUND+22;ctx.moveTo(x,y);for(let k=1;k<=5;k++){x+=Math.cos(a+(R()-.5)*.6)*L/5;y+=Math.sin(a+(R()-.5)*.6)*L/5*.25+ (R()-.5)*4;ctx.lineTo(x,y);}ctx.stroke();}
  ctx.restore();}
function tiles(cx,t0,t,heightmax){if(t<t0)return;const u=t-t0;const R=rng(2900);for(let i=0;i<9;i++){const dx=(R()-.5)*900,w=lerp(110,190,R()),h=lerp(44,70,R()),rise=Math.min(1,u*2.2)*lerp(50,heightmax,R());const tilt=(R()-.5)*.55*Math.min(1,u*3);const ph=lerp(.2,.9,R());
  ctx.save();ctx.translate(cx+dx,GROUND+24-rise);ctx.rotate(tilt);
  ctx.fillStyle='rgb(42,48,60)';ctx.fillRect(-w/2,0,w,h*.45);                         // slab edge
  ctx.save();ctx.beginPath();ctx.rect(-w/2,-h*.55,w,h*.55);ctx.clip();ctx.drawImage(IMG.bg,640+i*50,990,160,60,-w/2,-h*.55,w,h*.55);ctx.fillStyle='rgba(150,162,185,.16)';ctx.fillRect(-w/2,-h*.55,w,h*.55);ctx.restore();
  ctx.strokeStyle='rgba(215,222,235,.55)';ctx.lineWidth=2;ctx.strokeRect(-w/2,-h*.55,w,h);ctx.restore();}}
// clash 29.7
const CLASHT=710/24;
function clashC(t){const z=zState(t),g=gState(t);return [(z[0]+g[0])/2,GROUND-310];}
ev(28.8,.95,(u,t)=>{const z=zState(t);floorCracks(z[0],28.8,t);tiles(z[0],28.8,t,70+200*u);},true);
ev(29.1,.6,(u,t)=>{const z=zState(t);const tx=z[0]-330,ty=GROUND-270;glow(tx,ty,140+160*u,'rgba(210,235,255,A)',.10+.22*u);for(let k=0;k<4;k++)arc(tx,ty,300*(1-u)+70+k*40,-2.2+u*9+k*1.6,-0.8+u*9+k*1.6,24,ZC[0],'rgba(240,250,255,.95)',.35+.3*u,1);});
ev(29.25,.45,(u,t)=>{const c=clashC(t);speedLines(t,c[0],c[1],30,2925,.5*u);});
ev(CLASHT-.01,2.0,(u,t0_)=>{}); // placeholder keeps array order stable
// final clash: ring, wall collapse, debris
const RW=rng(2970);const WALLCH=[];for(let i=0;i<30;i++)WALLCH.push({x:(RW()-.5)*1500,y:-120+RW()*420,sz:lerp(24,90,RW()*RW()),vx:(RW()-.5)*500,vy:lerp(-200,200,RW()),rot:RW()*6,w:(RW()-.5)*6,sh:RW()});
function wallCollapse(t,t0){if(t<t0)return;const d=(t-t0)*3.5;const c=clashC(t0);ctx.save();
  for(const w of WALLCH){const x=c[0]+w.x+w.vx*d,y=c[1]+w.y+w.vy*d+1100*d*d;const al=1-clamp((d-.25)/.05)*0;ctx.save();ctx.translate(x,y);ctx.rotate(w.rot+w.w*d);ctx.globalAlpha=1;ctx.fillStyle=`rgb(${34+w.sh*26|0},${33+w.sh*22|0},${36+w.sh*22|0})`;
    ctx.beginPath();ctx.moveTo(-w.sz,-w.sz*.5);ctx.lineTo(w.sz*.3,-w.sz*.8);ctx.lineTo(w.sz,w.sz*.2);ctx.lineTo(-w.sz*.2,w.sz*.7);ctx.closePath();ctx.fill();ctx.lineWidth=2;ctx.strokeStyle='rgba(170,175,190,.45)';ctx.stroke();ctx.restore();}ctx.restore();}
ev(CLASHT,.3,(u,t)=>{const c=clashC(CLASHT);const d=Math.max(0,t-CLASHT)*1.05;
  if(d>=0){sparks(c[0],c[1],clamp(d/.3),40,2971,520,'255,244,205');glow(c[0],c[1],340*(1-d/.3)+60,'rgba(235,245,255,A)',.95);
  ring(c[0],c[1],60+1500*eo(d/.3),90*(1-d/.3)+10,'rgba(205,230,255,A)',.9*(1-d/.3),1);ring(c[0],GROUND+10,60+1600*eo(d/.3),70*(1-d/.3)+10,'rgba(255,255,255,A)',.8*(1-d/.3),.2);}});
shk(CLASHT+.12,22,.3);
// final pressure ring rendered every frame after the clash (until end), in world space
function finalRings(t){if(t<CLASHT)return;const d=(t-CLASHT+.0001)*3.2,c=clashC(t);
  ring(c[0],c[1],80+1050*eo(d/.9),120*(1-d*.8)+16,'rgba(200,228,255,A)',clamp(1-d*.7),1);
  ring(c[0],c[1],40+700*eo(d/.7),70*(1-d*.8)+10,'rgba(255,255,255,A)',clamp(1-d*1.1)*.8,1);
  for(let k=0;k<4;k++){const r=300+k*90+900*eo(d/.9);const a0=d*5+k*1.57;arc(c[0],c[1],r,a0,a0+.9,28,'rgba(170,215,255,0)','rgba(235,248,255,.8)',clamp(1-d*.7)*.8,.75);}
  if(d<.3)sparks(c[0],c[1],clamp(d/.3),30,2972,560,'255,244,205');
  // keep the fight going: crossing arcs in the last 0.25s
  if(d>.1){const z=zState(t),g=gState(t);const uu=((t*7)%1);arc(z[0]-120,GROUND-330,300,-1.0+uu*.8,.3+uu*.8,34*(1-uu),ZC[0],ZC[1],(1-uu)*.8,1);arc(g[0]+80,GROUND-300,320,Math.PI*.8+uu*.4,Math.PI*1.35+uu*.4,30*(1-uu),GC[0],GC[1],(1-uu)*.8,1);}
}
// foreground debris (screen space, motion-blurred, passing the camera)
function fgDebris(t,t0,dur,seed,n,dirx=1){if(t<t0||t>t0+dur)return;const u=(t-t0)/dur;const R=rng(seed);ctx.save();ctx.filter='blur(5px)';
  for(let i=0;i<n;i++){const y0=lerp(60,1000,R()),x0=R()<.5?-200:W+200,sz=lerp(40,170,R()*R()),sp=lerp(1300,2600,R()),delay=R()*.35;const uu=clamp((u-delay)/(1-delay));
    const x=lerp(W*(R()),W*(R()),uu)+dirx*(uu-.5)*sp*.5,y=y0+(uu-.5)*lerp(-400,400,R())+500*uu*uu;const r=R()*6+uu*4;
    ctx.save();ctx.translate(x,y);ctx.rotate(r);ctx.fillStyle=`rgb(${22+R()*18|0},${22+R()*16|0},${26+R()*16|0})`;ctx.globalAlpha=Math.min(1,1.6*Math.sin(Math.PI*uu));
    ctx.beginPath();ctx.moveTo(-sz,-sz*.35);ctx.lineTo(sz*.2,-sz*.7);ctx.lineTo(sz,sz*.25);ctx.lineTo(-sz*.3,sz*.6);ctx.closePath();ctx.fill();ctx.restore();}
  ctx.restore();}
function expo(k,x,y){
  if(k===0){ctx.save();ctx.globalCompositeOperation='difference';ctx.fillStyle='#fff';ctx.fillRect(0,0,W,H);ctx.restore();glow(x,y,520,'rgba(255,255,255,A)',.9);}
  else if(k===1){ctx.fillStyle='rgba(2,4,10,.78)';ctx.fillRect(0,0,W,H);ctx.save();ctx.globalCompositeOperation='lighter';const R=rng(5);
    for(let i=0;i<42;i++){const a=R()*6.283,l=lerp(260,1300,R()),w=lerp(2,14,R());ctx.strokeStyle=`rgba(220,238,255,${lerp(.5,1,R())})`;ctx.lineWidth=w;ctx.beginPath();ctx.moveTo(x+Math.cos(a)*90,y+Math.sin(a)*70);ctx.lineTo(x+Math.cos(a)*l,y+Math.sin(a)*l*.8);ctx.stroke();}
    ctx.restore();glow(x,y,380,'rgba(255,255,255,A)',1);}
  else{ctx.fillStyle='rgba(235,245,255,.62)';ctx.fillRect(0,0,W,H);ring(x,y,420,120,'rgba(120,180,255,A)',1,.7);ring(x,y,700,90,'rgba(255,255,255,A)',.8,.7);}}
