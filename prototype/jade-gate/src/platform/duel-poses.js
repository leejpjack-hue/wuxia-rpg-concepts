import { applySheetFrame, clearSheetFrame } from './sheet-anim.js';

// Card-only atlas. Each cell changes the body/weapon pose; roaming keeps its own art.
export const DUEL_POSE_CELLS = {
  windup: [0, 0], strike: [1, 0], focus: [0, 1], special: [1, 1],
};

export function loadDuelPoses(manifest, fighterId) {
  const row = manifest?.find(entry => entry.id === `${fighterId}-duel-poses` && entry.runtimeApproved === true)
    || manifest?.find(entry => entry.id === `${fighterId}-sheet` && entry.runtimeApproved !== false && entry.duelPoses);
  if (!row?.file || !row.duelPoses) return null;
  const cells = row.duelPoses;
  const legacy = row.id.endsWith('-sheet');
  if (!Object.keys(DUEL_POSE_CELLS).every(key => Array.isArray(cells[key]) &&
    cells[key].length === 2 && cells[key].every((n, axis) => Number.isInteger(n) && n >= 0 && n < (legacy ? [4, 3][axis] : 2)))) return null;
  if (row.poseRects && (!Array.isArray(row.atlasSize) || !row.atlasSize.every(n => Number.isInteger(n) && n > 0) || row.atlasSize.length !== 2 ||
    !Object.keys(DUEL_POSE_CELLS).every(key => {
      const r = row.poseRects[key];
      return Array.isArray(r) && r.length === 4 && r.every(Number.isInteger) && r[0] >= 0 && r[1] >= 0 && r[2] > 0 && r[3] > 0 &&
        r[0] + r[2] <= row.atlasSize[0] && r[1] + r[3] <= row.atlasSize[1];
    }))) return null;
  // Individually approved native PNGs can replace poses as the new set arrives.
  if (row.poseFiles && (typeof row.poseFiles !== 'object' || Array.isArray(row.poseFiles) ||
    !Object.entries(row.poseFiles).every(([pose, file]) => Object.hasOwn(DUEL_POSE_CELLS, pose) &&
      typeof file === 'string' && manifest.some(entry => entry.file === file && entry.runtimeApproved === true && entry.contract?.square && entry.contract?.alpha)))) return null;
  return { ...row, anims: legacy ? row.anims : { poses: { frames: Object.values(cells) } } };
}

export function applyDuelPose(node, atlas, pose) {
  const cell = atlas?.duelPoses?.[pose];
  const file = atlas?.poseFiles?.[pose];
  const source = file ? { file, anims: { poses: { frames: [[0, 0]] } } } : atlas;
  if (!cell || !applySheetFrame(node, source, file ? { col: 0, row: 0 } : { col: cell[0], row: cell[1] })) return false;
  const rect = file ? null : atlas.poseRects?.[pose];
  node.style.aspectRatio = '';
  if (rect) {
    const [x, y, w, h] = rect, [aw, ah] = atlas.atlasSize;
    // Reviewed pixel bounds isolate irregularly laid-out art without touching the source PNG.
    node.style.backgroundSize = `${aw / w * 100}% ${ah / h * 100}%`;
    node.style.backgroundPosition = `${aw === w ? 0 : x / (aw - w) * 100}% ${ah === h ? 0 : y / (ah - h) * 100}%`;
    node.style.aspectRatio = `${w} / ${h}`;
  }
  node.classList.add('duel-pose');
  node.dataset.duelPose = pose;
  return true;
}

export function clearDuelPose(node) {
  clearSheetFrame(node);
  if (node?.style) node.style.aspectRatio = '';
  node?.classList?.remove('duel-pose');
  if (node?.dataset) delete node.dataset.duelPose;
}
