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
  return { ...row, anims: legacy ? row.anims : { poses: { frames: Object.values(cells) } } };
}

export function applyDuelPose(node, atlas, pose) {
  if (!atlas || !applySheetFrame(node, atlas, atlas.duelPoses[pose])) return false;
  node.classList.add('duel-pose');
  node.dataset.duelPose = pose;
  return true;
}

export function clearDuelPose(node) {
  clearSheetFrame(node);
  node?.classList?.remove('duel-pose');
  if (node?.dataset) delete node.dataset.duelPose;
}
