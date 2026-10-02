import test from 'node:test';
import assert from 'node:assert/strict';
import { paintMazeWalls } from '../src/presentation/maze-wall-art.js';

test('maze walls render whole props at tile scale, with biome lighting and stable world anchors', () => {
  const image = {naturalWidth:1024,naturalHeight:1024};
  const maze = {tile:320,tw:30,th:11,ox:160,oy:0,isWallTile:(i,j)=>i===2&&j===2};
  const render = cam => {
    const calls=[];
    const c={save(){},restore(){},translate:(...v)=>calls.push(['translate',...v]),scale(){},beginPath(){},ellipse(){},fill(){},
      drawImage:(...v)=>calls.push(['image',...v])};
    paintMazeWalls(c,maze,cam,image,'brightness(.52)');
    assert.equal(c.filter,'brightness(.52)');
    return calls;
  };
  const first=render({x:0,y:0}),second=render({x:100,y:100});
  assert.deepEqual(first.find(c=>c[0]==='image'),second.find(c=>c[0]==='image'));
  const draw=first.find(c=>c[0]==='image');
  assert.equal(draw.length,6); // Entire source prop, no crop into its foliage/empty alpha.
  assert.equal(draw[4],320*1.12);
  assert(first.some(c=>c[0]==='translate'&&c[1]===960&&c[2]===800));
});

test('stone acts use reviewed granite details, and night bamboo lighting differs from daylight', async () => {
 const {ROAM_SCENES}=await import('../src/content/roam-scenes.js');
 assert.match(ROAM_SCENES['bamboo-crossing'].blockerFilter,/brightness/);
 assert.equal(ROAM_SCENES['jade-gate'].blockerCrop,undefined);
 for(const id of ['mount-canglan','meridian-citadel']){
  const scene=ROAM_SCENES[id];
  assert.equal(scene.blocker,'granite-pine-blocker');
  assert.equal(scene.blockerCrop,undefined,'the supplied prop renders whole, without a ground-plate crop');
 }
});
