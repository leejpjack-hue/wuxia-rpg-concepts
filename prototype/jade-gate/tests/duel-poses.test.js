import test from 'node:test';
import assert from 'node:assert/strict';
import manifest from '../docs/asset-manifest.json' with {type:'json'};
import { HEROES } from '../src/content/heroes.js';
import {loadDuelPoses,applyDuelPose,clearDuelPose,DUEL_POSE_CELLS} from '../src/platform/duel-poses.js';
import {sheetGrid,loadSheetManifest} from '../src/platform/sheet-anim.js';

test('each pose crops exactly its own quadrant; legacy monk cells select the attack row',()=>{
 const node={src:'assets/zhao-yun-sprite.png',dataset:{},style:{},classList:{add(){}}};
 const atlas=loadDuelPoses(manifest,'guan-yu');
 for(const [pose,position] of Object.entries({windup:'0% 0%',strike:'100% 0%',focus:'0% 100%',special:'100% 100%'})){
  assert.equal(applyDuelPose(node,atlas,pose),true);
  assert.equal(node.style.backgroundPosition,position);
  assert.equal(node.style.backgroundSize,'200% 200%');
 }
 assert.equal(applyDuelPose(node,atlas,'missing'),false);
 applyDuelPose(node,loadDuelPoses(manifest,'lu-zhishen'),'special');
 assert.equal(node.style.backgroundPosition,`${2/3*100}% 100%`);
 assert.equal(node.style.backgroundSize,'400% 300%');
});

test('the approved monk sheet supplies distinct normal and special contact poses without changing walking',()=>{
 const sheet=loadDuelPoses(manifest,'lu-zhishen');
 assert(sheet);assert.deepEqual(sheetGrid(sheet),{cols:4,rows:3});
 assert.notDeepEqual(sheet.duelPoses.strike,sheet.duelPoses.special);
 assert.deepEqual(sheet.anims.walk,loadSheetManifest(manifest,'lu-zhishen').anims.walk);
});
test('Zhao Yun isolates both complete poses and never samples the overlapping bottom row',()=>{
 const atlas=loadDuelPoses(manifest,'zhao-yun');
 assert.deepEqual(atlas.atlasSize,[1254,1254]);
 assert.deepEqual(atlas.poseRects.focus,atlas.poseRects.windup);
 assert.deepEqual(atlas.poseRects.special,atlas.poseRects.strike);
 const node={src:'assets/zhao-yun-sprite.png',dataset:{},style:{},classList:{add(){}}};
 for(const pose of Object.keys(DUEL_POSE_CELLS)) {
  applyDuelPose(node,atlas,pose);
  const [x,y,w,h]=atlas.poseRects[pose];
  assert(y+h<659,'lower figures start at y=659 and must stay outside every crop');
  assert.equal(node.style.backgroundPosition,`${x/(1254-w)*100}% ${y/(1254-h)*100}%`);
  assert.equal(node.style.aspectRatio,`${w} / ${h}`);
 }
 for(const bad of [{...atlas,atlasSize:'bad'},{...atlas,poseRects:{...atlas.poseRects,strike:[550,15,900,612]}}])assert.equal(loadDuelPoses([bad],'zhao-yun'),null);
});
test('generated duel-pose atlases are approved 2x2 cards and do not replace the monk sheet path',()=>{
 for(const id of ['zhao-yun','hu-sanniang','lu-bu','guan-yu','wu-song','mu-guiying','liang-hongyu','nie-yinniang','sun-shangxiang','gu-dasao','qin-liangyu','bao-sanniang','dian-wei','yang-zhi','venom-adept']){
  const atlas=loadDuelPoses(manifest,id);
  assert(atlas);assert.equal(atlas.id,`${id}-duel-poses`);
  assert.equal(atlas.runtimeApproved,true);
  assert.deepEqual(atlas.duelPoses,DUEL_POSE_CELLS);
  assert.deepEqual(sheetGrid(atlas),{cols:2,rows:2});
 }
 assert.equal(loadDuelPoses(manifest,'lu-zhishen').id,'lu-zhishen-sheet');
});
test('unreviewed, malformed or missing atlases safely retain the existing sprite',()=>{
 const row={id:'test-duel-poses',file:'assets/test-duel-poses.png',runtimeApproved:true,duelPoses:DUEL_POSE_CELLS};
 assert(loadDuelPoses([row],'test'));
 for(const bad of [{...row,runtimeApproved:false},{...row,runtimeApproved:undefined},{...row,duelPoses:{windup:[0,0]}},{...row,duelPoses:{...DUEL_POSE_CELLS,strike:[2,0]}}])assert.equal(loadDuelPoses([bad],'test'),null);
 assert.equal(loadDuelPoses(manifest,'missing-character'),null);
});

test('hidden novel atlases are approved 2x2 RGBA PNGs and do not replace live PNG paths', () => {
  const hidden = HEROES.filter(hero => hero.hidden);
  assert.equal(hidden.length, 20);
  for (const hero of hidden) {
    const atlas = loadDuelPoses(manifest, hero.id);
    assert(atlas, hero.id);
    assert.equal(atlas.file, `assets/${hero.id}-duel-poses.png`);
    assert.equal(atlas.runtimeApproved, true);
    assert.deepEqual(atlas.duelPoses, DUEL_POSE_CELLS);
    assert.deepEqual(sheetGrid(atlas), {cols:2, rows:2});
    assert.deepEqual(atlas.atlasSize, [1024, 1024]);
    const half = atlas.atlasSize[0] / 2;
    for (const [pose, [col, row]] of Object.entries(DUEL_POSE_CELLS)) {
      const [x, y, w, h] = atlas.poseRects[pose];
      assert(x >= col * half && y >= row * half && x + w <= (col + 1) * half && y + h <= (row + 1) * half, `${hero.id} ${pose}`);
    }
  }
  assert.equal(loadDuelPoses(manifest, 'qin-liangyu').file, 'assets/qin-liangyu-duel-poses.png');
  assert.equal(loadDuelPoses(manifest, 'guan-yu').poseRects, undefined);
});

test('Zhao Min native wind-up and focus keep full canvases while contact poses retain the existing atlas',()=>{
 const atlas=loadDuelPoses(manifest,'zhao-min');
 const classes=new Set();
 const node={src:'assets/zhao-min-sprite.png',dataset:{},style:{},classList:{add:n=>classes.add(n),remove:n=>classes.delete(n)}};
 for(const [pose,file] of [['windup','zhao-min-duel-windup'],['focus','zhao-min-sprite']]) {
  applyDuelPose(node,atlas,pose);
  assert.equal(node.style.backgroundImage,`url("assets/${file}.png")`);
  assert.equal(node.style.backgroundSize,'100% 100%');
  assert.equal(node.style.backgroundPosition,'0% 0%');
  assert.equal(node.style.aspectRatio,'');
  applyDuelPose(node,atlas,'strike');
  assert.equal(node.style.backgroundImage,'url("assets/zhao-min-duel-poses.png")');
  assert.notEqual(node.style.backgroundSize,'100% 100%');
 }
 clearDuelPose(node);
 assert.equal(node.src,'assets/zhao-min-sprite.png');
 assert.equal(node.style.backgroundImage,'');
 assert.equal(classes.has('duel-pose'),false);
});

test('separate duel poses reject unknown pose names and unreviewed or non-transparent files',()=>{
 const row=manifest.find(r=>r.id==='zhao-min-duel-poses');
 for(const poseFiles of [{missing:'assets/zhao-min-sprite.png'},{windup:'assets/not-reviewed.png'},{focus:'assets/zhao-min.jpg'}])
  assert.equal(loadDuelPoses([...manifest.filter(r=>r.id!==row.id),{...row,poseFiles}],'zhao-min'),null);
});
