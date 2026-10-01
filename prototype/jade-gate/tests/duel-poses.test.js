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
 for(const id of ['zhao-yun','hu-sanniang'])assert.equal(loadDuelPoses(manifest,id),null);
});
test('unreviewed, malformed or missing atlases safely retain the existing sprite',()=>{
 const row={id:'test-duel-poses',file:'assets/test-duel-poses.png',runtimeApproved:true,duelPoses:DUEL_POSE_CELLS};
 assert(loadDuelPoses([row],'test'));
 for(const bad of [{...row,runtimeApproved:false},{...row,runtimeApproved:undefined},{...row,duelPoses:{windup:[0,0]}},{...row,duelPoses:{...DUEL_POSE_CELLS,strike:[2,0]}}])assert.equal(loadDuelPoses([bad],'test'),null);
 assert.equal(loadDuelPoses(manifest,'missing-character'),null);
});
