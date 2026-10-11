const clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,x));
const lerp=(a,b,t)=>a+(b-a)*t;
const eo=t=>1-Math.pow(1-clamp(t),3), ei=t=>Math.pow(clamp(t),3), eio=t=>{t=clamp(t);return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2};
function rng(seed){let s=seed>>>0;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296}}
// keyframes: [t, v...] -> interpolate with easing 'e' of segment end
function kf(tr,t){ if(t<=tr[0][0])return tr[0].slice(1); for(let i=1;i<tr.length;i++){ if(t<=tr[i][0]){const a=tr[i-1],b=tr[i],u=eio((t-a[0])/(b[0]-a[0])); return a.slice(1).map((v,k)=>lerp(v,b[k+1],u));}} return tr[tr.length-1].slice(1);}
function pose(list,t){let n=list[0][1];for(const [tt,nm] of list){if(t>=tt-1e-6)n=nm;}return n;}

function shadow(x,y,w,a=.5){ctx.save();ctx.translate(x,y);ctx.scale(1,.16);const g=ctx.createRadialGradient(0,0,0,0,0,w);g.addColorStop(0,`rgba(0,0,0,${a})`);g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,w,0,7);ctx.fill();ctx.restore();}
function arc(cx,cy,r,a0,a1,wd,c1,c2,al=1,ry=1){ // tapered crescent, additive
  ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=al;ctx.translate(cx,cy);ctx.scale(1,ry);
  const N=36;ctx.beginPath();
  for(let i=0;i<=N;i++){const u=i/N,a=lerp(a0,a1,u),w=wd*Math.sin(Math.PI*u)**0.8;const rr=r+w/2;ctx.lineTo(Math.cos(a)*rr,Math.sin(a)*rr);}
  for(let i=N;i>=0;i--){const u=i/N,a=lerp(a0,a1,u),w=wd*Math.sin(Math.PI*u)**0.8;const rr=r-w/2;ctx.lineTo(Math.cos(a)*rr,Math.sin(a)*rr);}
  ctx.closePath();const g=ctx.createLinearGradient(Math.cos(a0)*r,Math.sin(a0)*r,Math.cos(a1)*r,Math.sin(a1)*r);g.addColorStop(0,c1);g.addColorStop(1,c2);ctx.fillStyle=g;ctx.fill();ctx.restore();}
function glow(x,y,r,col,al=1){r=Math.max(.5,r);ctx.save();ctx.globalCompositeOperation='lighter';const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,col.replace('A',al));g.addColorStop(1,col.replace('A',0));ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,7);ctx.fill();ctx.restore();}
function ring(x,y,r,wd,col,al,ry=1,rot=0){r=Math.max(2,r);wd=Math.max(1,wd);ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=clamp(al);ctx.translate(x,y);ctx.rotate(rot);ctx.scale(1,ry);
  const g=ctx.createRadialGradient(0,0,Math.max(1,r-wd),0,0,r+wd*.3);g.addColorStop(0,col.replace('A',0));g.addColorStop(.72,col.replace('A',.9));g.addColorStop(1,col.replace('A',0));ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,r+wd*.3,0,7);ctx.fill();ctx.restore();}
function sparks(x,y,t,n,seed,len=140,col='255,250,235'){const R=rng(seed);ctx.save();ctx.globalCompositeOperation='lighter';ctx.lineCap='round';
  for(let i=0;i<n;i++){const a=R()*6.283,v=lerp(.4,1,R()),d=len*v*eo(t),d0=d*.55;const al=1-clamp(t);ctx.strokeStyle=`rgba(${col},${al})`;ctx.lineWidth=2+R()*3*(1-t);ctx.beginPath();ctx.moveTo(x+Math.cos(a)*d0,y+Math.sin(a)*d0*.8);ctx.lineTo(x+Math.cos(a)*d,y+Math.sin(a)*d*.8);ctx.stroke();}ctx.restore();}
function debris(x,y,t,n,seed,spread=420,up=520){const R=rng(seed);ctx.save();
  for(let i=0;i<n;i++){const a=-Math.PI/2+(R()-.5)*2.6,v=lerp(.3,1,R()),sz=lerp(5,26,R()*R());
    const px=x+Math.cos(a)*spread*v*t*1.6,py=y+Math.sin(a)*up*v*t+600*t*t*v;const rot=R()*6+t*8*(R()-.5);const al=1-clamp((t-.5)*2);
    ctx.save();ctx.translate(px,py);ctx.rotate(rot);ctx.globalAlpha=al;ctx.fillStyle=`rgb(${60+R()*40|0},${55+R()*35|0},${52+R()*30|0})`;
    ctx.beginPath();ctx.moveTo(-sz,-sz*.4);ctx.lineTo(sz*.2,-sz*.8);ctx.lineTo(sz,sz*.2);ctx.lineTo(-sz*.3,sz*.7);ctx.closePath();ctx.fill();ctx.restore();}ctx.restore();}
function dust(x,y,t,n,seed,sz=160){const R=rng(seed);ctx.save();
  for(let i=0;i<n;i++){const a=R()*6.283,d=R()*sz*(.4+t*1.6),r=lerp(40,120,R())*(.6+t*1.4),px=x+Math.cos(a)*d,py=y+Math.sin(a)*d*.55-t*80*R();
    const al=.30*(1-clamp(t))*Math.min(1,t*8+.3);const g=ctx.createRadialGradient(px,py,0,px,py,r);g.addColorStop(0,`rgba(120,125,135,${al})`);g.addColorStop(1,'rgba(120,125,135,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(px,py,r,0,7);ctx.fill();}ctx.restore();}
function speedLines(t,cx,cy,n,seed,al=.55){const R=rng(seed);ctx.save();ctx.globalCompositeOperation='lighter';
  for(let i=0;i<n;i++){const a=R()*6.283,r0=lerp(300,620,R())+((t*900)%200)*0.0,r1=r0+lerp(160,520,R());ctx.strokeStyle=`rgba(225,240,255,${al*lerp(.3,1,R())})`;ctx.lineWidth=1+R()*3;ctx.beginPath();ctx.moveTo(cx+Math.cos(a)*r0,cy+Math.sin(a)*r0*.65);ctx.lineTo(cx+Math.cos(a)*r1,cy+Math.sin(a)*r1*.65);ctx.stroke();}ctx.restore();}
function vignette(a=.5){const g=ctx.createRadialGradient(W/2,H/2,H*.35,W/2,H/2,H*1.0);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,`rgba(0,0,0,${a})`);ctx.fillStyle=g;ctx.fillRect(0,0,W,H);}
// embers (foreground parallax)
function embers(t,camx,camz){const R=rng(777);ctx.save();ctx.globalCompositeOperation='lighter';
  for(let i=0;i<46;i++){const bx=R()*W,by=R()*H,sp=lerp(20,70,R()),ph=R()*6.28,sz=lerp(1.5,4.5,R());const x=((bx-camx*1.5*.12+Math.sin(t*1.5+ph)*30)%(W+80)+W+80)%(W+80)-40,y=((by-t*sp*3)%H+H)%H;ctx.fillStyle=`rgba(255,${150+R()*60|0},70,${.5*R()+.2})`;ctx.beginPath();ctx.arc(x,y,sz,0,7);ctx.fill();}ctx.restore();}
