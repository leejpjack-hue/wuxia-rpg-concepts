// ----- D (18–24) -----
const EXD=[[18.25,'Z','zhao-exchange','guan-exchange'],[18.85,'G','zhao-parry','guan-follow'],[19.30,'Z','zhao-impact','guan-feint']];
const [ZPD,GPD]=posesFrom(EXD,'zhao-impact','guan-feint',18.0);
const ZD=T([[19.62,890,GROUND+10,S+.015],[19.85,880,GROUND+10,S+.015],[20.0,740,GROUND-170,S],[20.2,650,GROUND-40,S],[20.3,630,GROUND,S],[21.0,640,GROUND],[22.4,650,GROUND],[22.65,860,GROUND],[22.78,860,GROUND],[23.0,770,GROUND],[23.6,810,GROUND],[24.0,820,GROUND],[24.2,810,GROUND],[24.35,700,GROUND],[24.8,590,GROUND],
 [24.81,600,GROUND+6,S,0,1.12,.78],[25.0,720,GROUND+6,S,0,1.12,.78],[25.12,1010,GROUND+6,S,0,1.12,.78],[25.2,1010,GROUND,S],[25.3,1010,GROUND-60],[25.45,1040,GROUND-250],[25.6,1060,GROUND-420],[25.8,1090,GROUND-400],[26.0,1000,GROUND-520],[26.4,860,GROUND-380],[26.8,770,GROUND-120],[27.0,745,GROUND]]);
const GD=T([[19.62,1290,GROUND],[19.75,1290,GROUND],[19.95,1120,GROUND],[20.4,1060,GROUND],[20.9,1100,GROUND],[21.1,1120,GROUND],[22.4,1120,GROUND],[22.65,1170,GROUND],[22.78,1170,GROUND],[23.0,1250,GROUND],[23.6,1260,GROUND],[24.0,1260,GROUND],
 [24.12,1210,GROUND-210,S,30],[24.22,1150,GROUND-290,S,55],[24.40,1090,GROUND,S,0],[24.75,960,GROUND],[24.9,900,GROUND-330],[25.0,840,GROUND-200],[25.1,790,GROUND],
 [25.2,790,GROUND-80,S,-15],[25.35,700,GROUND-430,S,-170],[25.5,640,GROUND-570,S,-300],[25.6,690,GROUND-580,S,-430],
 [25.75,640,GROUND-640,S,-420],[26.0,520,GROUND-560,S,-390],[26.4,410,GROUND-300,S,-370],[26.8,370,GROUND-100,S,-360],[27.0,345,GROUND-40,S,-360],[27.25,310,GROUND,S,-360]]);
const ZPDx=[[19.62,'zhao-impact'],[19.85,'zhao-feint'],[20.25,'zhao-follow'],[22.4,'zhao-exchange'],[22.55,'zhao-impact'],[22.95,'zhao-follow'],[24.0,'zhao-follow'],[24.2,'zhao-parry'],[24.85,'zhao-exchange'],[25.0,'zhao-exchange',1],[25.15,'zhao-feint',1],[25.45,'zhao-parry',1],[25.8,'zhao-impact',1],[26.2,'zhao-follow',1],[26.7,'zhao-feint',1],[27.0,'zhao-exchange',1]];
const GPDx=[[19.62,'guan-feint'],[19.75,'guan-exchange'],[20.3,'guan-follow'],[20.7,'guan-feint'],[21.1,'guan-exchange'],[22.4,'guan-follow'],[22.55,'guan-follow'],[22.95,'guan-feint'],[23.6,'guan-exchange'],[24.12,'guan-follow'],[24.40,'guan-exchange'],[24.75,'guan-follow'],[24.83,'guan-follow',1],[24.92,'guan-follow'],[25.0,'guan-exchange',1],[25.1,'guan-exchange',1],[25.2,'guan-follow',1],[25.5,'guan-follow',1],[25.62,'guan-exchange',1],[26.0,'guan-follow',1],[26.5,'guan-feint',1],[27.0,'guan-follow',1]];
// ----- F (27–30): Guan left (flipped), Zhao right (flipped) -----
const EXF=[[27.20,'G','zhao-exchange','guan-follow'],[27.45,'Z','zhao-impact','guan-exchange'],[27.80,'G','zhao-parry','guan-exchange'],[28.05,'Z','zhao-feint','guan-feint'],[28.25,'Z','zhao-impact','guan-follow'],[28.55,'G','zhao-parry','guan-exchange'],[28.95,'X','zhao-exchange','guan-follow'],[29.28,'X','zhao-impact','guan-exchange']];
const [ZPFl,GPFl]=posesFrom(EXF,'zhao-follow','guan-feint',27.25);
const mF=t=>lerp(520,640,clamp((t-27)/2.6));
function fOff(t){const [a,b]=offs(EXF,t,-1,70);const cv=eio((t-28.8)/.78);return [a-38*cv,b+38*cv];} // Z moves left (toward Guan) when it attacks
// ---- state functions ----
function zState(t){
  if(t<5.5){const o=offs(EXA,t,1);return [mA(t)-210+o[0],GROUND-6*Math.abs(Math.sin(t*5.5)),S,0,1,1];}
  if(t<7.76)return kf(ZB,t);
  if(t<9.36)return zRoll(t);
  if(t<9.36+.02)return [300,GROUND,S,0,1,1];
  if(t<10.0){const x=lerp(300,425,eio((t-9.36)/.55));return [x,GROUND,S,0,1,1];}
  if(t<11.5){return orbChars(t).z;}
  if(t<12.0)return [425,GROUND,S,0,1,1];
  if(t<18.0){const k=kf(ZX,t-12);return [k[0],k[1],k[2],0,1,1];}
  if(t<19.62){const o=offs(EXD,t,1);return [890+o[0],GROUND+10,S+.015,0,1,1];}
  if(t<27.0)return kf(ZD,t);
  const o=fOff(t),m=mF(t);const sq=(t>=27.2&&t<27.45)?[1.1,.8]:[1,1];
  return [m+215+o[0],GROUND,S,0,sq[0],sq[1]];}
function gState(t){
  if(t<5.5){const o=offs(EXA,t,1);return [mA(t)+210+o[1],GROUND-6*Math.abs(Math.sin(t*5.5+1)),S,0,1,1];}
  if(t<10.0)return kf(GBr,t);
  if(t<11.5)return orbChars(t).g;
  if(t<12.0)return [1005,GROUND,S,0,1,1];
  if(t<18.0){const k=kf(GX,t-12);return [k[0],k[1],k[2],0,1,1];}
  if(t<19.62){const o=offs(EXD,t,1);return [1290+o[1],GROUND,S,0,1,1];}
  if(t<27.25)return kf(GD,t);
  const o=fOff(t),m=mF(t);return [m-215+o[1],GROUND,S,0,1,1];}
function zPose(t){
  if(t<5.5)return [pose(ZPA,t),false];
  if(t<10.0)return [pose(ZPB,t),false];
  if(t<11.5){const o=orbChars(t);const cyc=['zhao-exchange','zhao-feint','zhao-impact','zhao-follow'];return [cyc[Math.floor(t*6)%4],o.flip];}
  if(t<12.0)return ['zhao-exchange',false];
  if(t<18.0)return [pose(ZP,t-12),false];
  if(t<19.62)return [pose(ZPD,t),false];
  if(t<27.0)return poseF(ZPDx,t);
  return [pose(ZPFl,t),true];}
function gPose(t){
  if(t<5.5)return [pose(GPA,t),false];
  if(t<10.0)return [pose(GPB,t),false];
  if(t<11.5){const o=orbChars(t);const cyc=['guan-exchange','guan-follow','guan-feint','guan-exchange'];return [cyc[Math.floor(t*6+1)%4],o.flip];}
  if(t<12.0)return ['guan-feint',false];
  if(t<18.0)return [pose(GP,t-12),false];
  if(t<19.62)return [pose(GPD,t),false];
  if(t<27.25)return poseF(GPDx,t);
  return [pose(GPFl,t),true];}
// ---- camera (global) ----
const CAMA=(t)=>{const m=mA(t);return [m-50,620,lerp(1.38,1.06,eio(t/5.2)),0.7*Math.sin(t*1.7)];};
const CAMHOLE=T([[5.49,1060,583,1.9,0],[6.0,980,610,1.32,0],[6.45,900,620,1.16,0],[7.0,840,610,1.18,0]]);
const CAMB=T([[7.0,840,610,1.18,0],[7.46,760,640,1.2,0],[8.2,520,700,1.2,-1],[9.0,430,700,1.3,0],[9.7,520,650,1.28,1.2],[10.0,715,620,1.12,0]]);
function camOrbit(t){const th=orbit(t);return [OC,640,1.12+.05*Math.sin(th),5*Math.sin(2*th)];}
const CAMD=T([[18.0,1260,590,1.22,1.4],[18.6,1160,600,1.26,-1],[19.5,1120,590,1.3,.8],[19.9,1100,590,1.18,0],[20.2,950,560,1.0,0],[21.0,930,590,1.02,0],[22.4,940,590,1.3,0],[22.7,1000,590,1.34,1.2],[23.1,1000,600,1.22,-.8],[24.0,1040,610,1.12,0],
 [24.3,980,620,1.15,1],[24.8,820,640,1.1,-1],[25.1,880,600,1.12,0],[25.4,900,430,1.0,6],[25.9,860,250,.88,-12],[26.3,740,300,.9,14],[26.6,600,420,1.0,-6],[26.9,640,600,1.3,0],[27.1,590,650,1.38,0]]);
function camF(t){const m=mF(t);let z=1.38,roll=0,cx=m,cy=640;
  if(t<28.0){z=lerp(1.38,1.3,(t-27)/1);cx=m+10;roll=1*Math.sin(t*6);}
  else if(t<28.8){const u=(t-28.0)/.8;z=lerp(1.3,1.18,eio(u));cx=m+130*Math.sin(u*Math.PI);roll=6*Math.sin(u*Math.PI*2);}
  else if(t<29.5833){const u=(t-28.8)/.783;z=lerp(1.18,1.55,eio(u));cx=lerp(m,m+30,u);cy=lerp(640,610,u);roll=lerp(0,-2,u);}
  else{const u=clamp((t-29.5833)/.29);z=lerp(1.55,.98,eo(u));cx=lerp(m+30,m+15,u);cy=lerp(610,600,u);roll=2.5*u;}
  return [cx,cy,z,roll];}
function camAtG(t){
  if(t<5.49)return CAMA(t);
  if(t<7.0)return kf(CAMHOLE,t);
  if(t<10.0)return kf(CAMB,t);
  if(t<11.5)return camOrbit(t);
  if(t<12.0)return [OC,620,1.2+.1*(t-11.5),0];
  if(t<18.0)return kf(CAM,t-12);
  if(t<27.0)return kf(CAMD,t);
  return camF(t);}
