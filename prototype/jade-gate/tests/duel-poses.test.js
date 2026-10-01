import test from 'node:test';
import assert from 'node:assert/strict';
import manifest from '../docs/asset-manifest.json' with {type:'json'};
import {loadDuelPoses,DUEL_POSE_CELLS} from '../src/platform/duel-poses.js';
import {sheetGrid,loadSheetManifest} from '../src/platform/sheet-anim.js';

test('the approved monk sheet supplies distinct normal and special contact poses without changing walking',()=>{
 const sheet=loadDuelPoses(manifest,'lu-zhishen');
 assert(sheet);assert.deepEqual(sheetGrid(sheet),{cols:4,rows:3});
 assert.notDeepEqual(sheet.duelPoses.strike,sheet.duelPoses.special);
 assert.deepEqual(sheet.anims.walk,loadSheetManifest(manifest,'lu-zhishen').anims.walk);
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
