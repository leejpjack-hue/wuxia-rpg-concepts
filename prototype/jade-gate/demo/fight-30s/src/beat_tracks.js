// ---------- timeline (world-time seconds) ----------
const SHOT=[ // [start,end,type]
 [0.00,0.92,'wide'],[0.92,1.46,'low'],[1.46,2.09,'ots'],[2.09,6.0,'wide']];
const HIT=50/FPS;           // 3-frame exposure at frames 50,51,52 (hit-stop)
const S=0.62, GY=880;       // sprite scale, ground y
// Zhao: [t,x,y,s]
const ZX=[[0,560,GY,S],[0.30,610,GY,S],[0.55,660,GY,S],[0.80,800,GY,S],[0.92,830,GY,S],[2.09,830,GY,S],[2.6,820,GY,S],[3.2,800,GY,S],[3.5,720,GY+30,S+0.03],[3.85,860,GY+30,S+0.03],[4.3,870,GY+10,S+0.015],[5.0,880,GY+10,S+0.015],[6.0,890,GY+10,S+0.015]];
const ZP=[[0,'zhao-parry'],[0.28,'zhao-feint'],[0.58,'zhao-exchange'],[0.84,'zhao-follow'],[1.46,'zhao-follow'],[2.09,'zhao-impact'],[2.75,'zhao-follow'],[3.15,'zhao-approach'],[3.45,'zhao-feint'],[3.80,'zhao-exchange'],[4.10,'zhao-impact'],[4.55,'zhao-follow'],[4.85,'zhao-exchange'],[5.15,'zhao-impact'],[5.55,'zhao-follow'],[5.8,'zhao-impact']];
// Guan
const GX=[[0,1560,GY,S],[0.30,1250,GY,S],[0.55,1290,GY,S],[0.92,1320,GY,S],[2.09,1300,GY,S],[2.14,1330,GY-10,S],[2.45,1500,GY-90,0.50],[2.95,1620,GY-130,0.42],[3.25,1632,GY-132,0.41],[3.45,1520,GY-60,0.50],[3.85,1290,GY,S],[4.3,1300,GY,S],[5.0,1290,GY,S],[6.0,1290,GY,S]];
const GP=[[0,'guan-exchange'],[0.30,'guan-feint'],[0.80,'guan-approach'],[2.14,'guan-follow'],[3.0,'guan-follow'],[3.28,'guan-aftermath'],[3.42,'guan-exchange'],[4.2,'guan-feint'],[4.55,'guan-exchange'],[4.95,'guan-feint'],[5.3,'guan-exchange'],[5.7,'guan-feint']];
// camera: [t, cx, cy, zoom, rollDeg]
const CAM=[[0,880,600,1.10,0],[0.92,960,590,1.20,0.4],
 [2.09,830,570,1.35,0],[2.30,930,600,1.32,-1.0],[2.95,1380,690,1.00,0.8],[3.30,1420,680,1.02,1.2],
 [3.50,1180,640,1.10,0],[3.9,1060,620,1.16,-0.8],[4.3,1020,600,1.14,-1.2],[6.0,1260,590,1.22,1.4]];
