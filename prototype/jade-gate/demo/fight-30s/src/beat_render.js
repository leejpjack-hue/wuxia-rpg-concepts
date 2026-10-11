function renderBeat(t,f){
  const tq=Math.floor(t*12+1e-6)/12;   // characters on twos
  const shot=shotAt(t);
  ctx.fillStyle='#000';ctx.fillRect(0,0,W,H);
  if(shot==='wide'){
    const cam=camAt(t);
    // camera shake: wall hit and impact
    let sh=0;const th=t-2.09,tw=t-2.93;if(th>=0&&th<.3)sh=18*(1-th/.3);if(tw>=0&&tw<.4)sh=Math.max(sh,22*(1-tw/.4));if(t>3.88&&t<4.15)sh=Math.max(sh,12*(1-(t-3.88)/.27));
    const R=rng(f*7+3);const cc=[cam[0]+(R()-.5)*sh,cam[1]+(R()-.5)*sh,cam[2],cam[3]];
    worldBegin(cc);
    const z=kf(ZX,tq),g=kf(GX,tq);
    shadow(z[0]+30,z[1]+4,230*z[2]/S,.55);shadow(g[0]-10,g[1]+4,230*g[2]/S,.55);
    // draw far one first (smaller y first)
    const zs={n:pose(ZP,tq),x:z[0],y:z[1],s:z[2]},gs={n:pose(GP,tq),x:g[0],y:g[1],s:g[2]};
    // slight squash on landing/hit
    const list=[gs,zs].sort((a,b)=>a.y-b.y);
    for(const o of list)sprite(o.n,o.x,o.y,o.s);
    worldFX(t,f);
    worldEnd();
    embers(t,cam[0],cam[2]);
    // edge shock swirl in screen space (as camera retreats)
    const th2=t-2.09;if(th2>0&&th2<1.2){const u=th2/1.2;ctx.save();ctx.globalCompositeOperation='lighter';
      for(let k=0;k<5;k++){const a0=-1.2+k*0.35+u*4,rr=H*.78+k*40;ctx.strokeStyle=`rgba(205,230,255,${(1-u)*.5})`;ctx.lineWidth=5-k*.6;ctx.beginPath();ctx.ellipse(W*.5,H*.5,W*.52+k*30,rr,0,a0,a0+0.7);ctx.stroke();}ctx.restore();}
    if(th2>0&&th2<.7)speedLines(t,W*.3,H*.55,28,5+f,.5*(1-th2/.7));
    vignette(.45);
  }else if(shot==='low'){
    const u=(t-.92)/.54, z=lerp(1.0,1.20,eo(u));
    ctx.save();ctx.translate(W/2,H/2);ctx.scale(z,z);ctx.translate(-lerp(960,1020,u),-lerp(540,520,u));
    ctx.drawImage(IMG.low,0,0,W,H);
    // glints: sword edge flash then guandao crescent
    const fx=(x,y)=>{};
    arc(560,430,420,-1.35,-0.35,30,'rgba(255,255,255,0)','rgba(200,230,255,.95)',clamp(1-Math.abs(u-.35)*3)*.9,1);
    arc(1280,480,360,Math.PI*0.85,Math.PI*1.30,24,'rgba(110,240,150,0)','rgba(255,228,140,.95)',clamp(1-Math.abs(u-.7)*3)*.85,1);
    glow(1150,470,200,'rgba(235,245,255,A)',clamp(u*1.2-.4)*.8);
    ctx.restore();
    speedLines(t,W*.5,H*.5,14,9+f,.28*u);
    vignette(.5);
  }else if(shot==='ots'){
    const u=(t-1.46)/(2.09-1.46), z=lerp(1.0,1.55,eio(u*.9+.1*u));
    const sh=(u>.85)?6*Math.sin(f*2.2):0;
    ctx.save();ctx.translate(W/2+sh,H/2);ctx.scale(z,z);ctx.translate(-lerp(900,1190,u),-lerp(520,530,u));
    ctx.drawImage(IMG.ots,0,0,W,H);
    // pressure gathering: converging arcs on sword tip (1106,628) in image space
    if(u>.35){const p=(u-.35)/.65;glow(1106,628,120+220*(1-p),'rgba(210,235,255,A)',.35+.55*p);
      for(let k=0;k<3;k++)arc(1106,628,200*(1-p)+60+k*55,-2.2+p*3+k,-0.9+p*3+k,24,'rgba(190,225,255,0)','rgba(240,250,255,.95)',.6*p,1);}
    // guard lock spark (shaft)
    if(u>.55){const p=(u-.55)/.45;sparks(1150,520,(p*3)%1,10,200+Math.floor(p*3),110,'255,245,215');}
    ctx.restore();
    speedLines(t,W*.55,H*.5,32,13+(f%3),.30+.55*u);
    vignette(.55);
  }
}
