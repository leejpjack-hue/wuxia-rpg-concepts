function camAt(t){return kf(CAM,t);}
function shotAt(t){for(const s of SHOT)if(t>=s[0]&&t<s[1])return s[2];return 'wide';}

// FX that live in world space (wide shot)
function worldFX(t,f){
  const zc=kf(ZX,t),gc=kf(GX,t);
  // --- A: guandao sweep arc + deflect spark (0.14-0.6)
  if(t>.10&&t<.62){const u=(t-.10)/.52;arc(gc[0]-120,GY-300,360,Math.PI*0.80,Math.PI*1.30,34*(1-u*.4),'rgba(120,240,150,0)','rgba(255,225,130,.95)',(1-u*.9)*.8,1);}
  if(t>=.30&&t<.62){sparks(960,GY-360,(t-.30)/.32,16,11,120,'255,250,225');glow(960,GY-360,160*(1-(t-.30)/.40),'rgba(210,235,255,A)',.9);}
  // --- slide-in dust (0.55-0.95)
  if(t>.55&&t<1.4)dust(zc[0]-60,GY+8,(t-.55)/.85,7,21,110);
  // short strike glint white (0.80-1.0)
  if(t>.78&&t<1.0){const u=(t-.78)/.22;arc(zc[0]+300,GY-330,240,-0.6,0.5,50*(1-u*.5),'rgba(255,255,255,0)','rgba(190,225,255,.95)',1-u,1);sparks(1090,GY-380,u,12,31,100,'230,245,255');}
  // --- D: shockwave after hit (HIT .. )
  const th=t-2.09;
  if(th>=0&&th<1.3){
    const u=th/1.3, tipx=1110,tipy=GY-290;
    // heavy pressure layer (dense, near sword tip, short) then wide shockwave
    if(th<.25){const p=eo(th/.25);glow(tipx,tipy,230*(.6+p),'rgba(210,235,255,A)',.95*(1-p*.6));}
    // ground shock ring (flat) – cool white / silver blue
    ring(tipx,GY+10,60+1500*eo(u),90*(1-u*.7)+20,'rgba(190,225,255,A)',1-u,.20);
    ring(tipx,GY+10,40+1100*eo(clamp(u*1.15)),60*(1-u*.7)+10,'rgba(255,255,255,A)',(1-u)*.8,.20);
    // vertical pressure disc (big circle rim facing camera, angled)
    ring(tipx+80,tipy,80+900*eo(u),60*(1-u*.8)+10,'rgba(170,215,255,A)',(1-u)*.5,1.0);
    // swirling arcs around shock edge (swirl)
    for(let k=0;k<4;k++){const r=240+k*80+900*eo(u),a0=u*5+k*1.57;arc(tipx+80,tipy+60,r,a0,a0+0.9,26,'rgba(170,215,255,0)','rgba(235,248,255,.8)',(1-u)*.8,.55);}
    // dust trail along floor in the blast direction
    dust(1250+330*eo(clamp(u*1.6)),GY-20,u,12,41,230);
    sparks(tipx,tipy,clamp(th/.5),30,51,400,'230,245,255');
  }
  // --- wall hit (t 2.92..3.6)
  const tw=t-2.93;
  if(tw>=0&&tw<1.2){const u=tw/1.2,hx=1640,hy=GY-150;
    if(tw<.22)glow(hx,hy,260*(1-tw/.22)+60,'rgba(255,240,210,A)',.95);
    ring(hx,hy,30+520*eo(clamp(u*1.4)),50*(1-u)+8,'rgba(255,245,225,A)',(1-clamp(u*1.3))*.9,.55);
    debris(hx,hy,u,34,61,520,520);
    dust(hx,hy+30,u,16,71,260);
    // fragmented wall chunks flying out of wall
    debris(hx-30,hy-50,clamp(u*1.2),14,81,300,380);
  }
  // --- Guan rebound arc (3.35-3.95): green-gold crescent leading
  if(t>3.36&&t<3.95){const u=(t-3.36)/.59,g=kf(GX,t);arc(g[0]-70,g[1]-g[2]*400,g[2]*520,Math.PI*0.55,Math.PI*1.45,46*g[2]/.62*(1-u*.3),'rgba(110,240,150,0)','rgba(255,228,140,.95)',1-u*.5,1);
    dust(g[0]+80,g[1]+4,u,6,91,160);}
  // --- Zhao sidestep streak + meet (3.45-3.95)
  if(t>3.55&&t<3.95){const u=(t-3.55)/.40;arc(zc[0]+260,GY-300,260,-0.8,0.6,56*(1-u*.4),'rgba(255,255,255,0)','rgba(190,225,255,.95)',1-u*.7,1);}
  // --- F: clash at 3.88 onward (no second exposure frame, just spark + ring)
  const tc=t-3.88;
  if(tc>=0){
    const cx=1075,cy=GY-320;
    const burst=t=>0;
    if(tc<.45){sparks(cx,cy,tc/.45,28,101,260,'255,244,205');glow(cx,cy,220*(1-tc/.45)+40,'rgba(230,240,255,A)',.9);}
    if(tc<1.3)ring(cx,GY+10,40+900*eo(tc/1.3),60*(1-tc/1.3)+8,'rgba(200,230,255,A)',(1-tc/1.3)*.85,.20);
    // continued exchange: periodic crossing arcs (white vs green-gold) in the held two-shot
    const per=(tt,ph)=>{const u=((tt-ph)%0.9+0.9)%0.9/0.9;return u};
    const u1=per(t,3.95),u2=per(t,4.4);
    arc(cx-40,cy+30,300,-0.9+u1*0.5,0.2+u1*0.5,34*(1-u1),'rgba(255,255,255,0)','rgba(200,230,255,.95)',(1-u1)*.8,1);
    arc(cx+60,cy+90,330,Math.PI*0.8+u2*0.4,Math.PI*1.3+u2*0.4,26*(1-u2),'rgba(110,240,150,0)','rgba(255,228,140,.95)',(1-u2)*.8,1);
    if(t>4.2){const k=((t-4.2)%0.55)/0.55;sparks(cx+(Math.floor((t-4.2)/0.55)%2?30:-20),cy+40,k,10,111+Math.floor((t-4.2)/0.55),150,'255,245,215');}
  }
}