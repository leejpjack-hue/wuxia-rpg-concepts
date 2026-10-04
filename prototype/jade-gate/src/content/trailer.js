// Seconds on one shared audio/visual clock; every scene owns a half-open interval.
export const TRAILER_DURATION = 10;
export const TRAILER_SCENES = [
  { id: 'pass', start: 0, end: 2.15, ja: ['灰旗に、抗え。', '翠門関 · 反撃の刻'], en: ['DEFY THE ASHEN BANNER.', 'THE JADE GATE · RISE AGAINST THE ASH'] },
  { id: 'legends', start: 2.15, end: 4.2, ja: ['十六の伝説、集結。', 'その刃に、誓いを。'], en: ['SIXTEEN LEGENDS. ONE OATH.', 'CHOOSE THE BLADE THAT DEFINES YOU.'] },
  { id: 'duel', start: 4.2, end: 6.5, ja: ['刃と札で、運命を変えろ。', '敵を読み、奥義を放て。'], en: ['MASTER THE BLADE.', 'READ YOUR RIVAL. COMMAND THE DUEL.'] },
  { id: 'journey', start: 6.5, end: 8, ja: ['江湖を駆けろ。', '四つの章。仲間と紡ぐ物語。'], en: ['YOUR LEGEND AWAITS.', 'FOUR CHAPTERS. ALLIES WORTH FIGHTING FOR.'] },
  { id: 'title', start: 8, end: 10, ja: ['四人の刃', '今、江湖へ。'], en: ['BLADES OF THE FOUR', 'YOUR JOURNEY STARTS NOW.'] },
];
export const TRAILER_VOICE = [
  { start: .25, end: 2.05, file: '1', ja: '灰旗に、抗え。', en: 'Defy the Ashen Banner.' },
  { start: 2.3, end: 4.1, file: '2', ja: '十六の伝説、集結。', en: 'Sixteen legends. One oath.' },
  { start: 4.35, end: 6.45, file: '3', ja: '刃と札で、運命を変えろ。', en: 'Master the blade. Command the duel.' },
  { start: 8.08, end: 9.92, file: '4', ja: '四人の刃。今、江湖へ。', en: 'Blades of the Four. Play now.' },
];
export const TRAILER_CARD_LABELS = {
  ja: {
    hero: '趙雲 · 白龍',
    heroSkill: '龍の突撃 / DRAGON RUSH',
    rival: '呂布 · 飛将',
    rivalSkill: 'SKYBREAKER',
    impactWord: '蒼龍破',
  },
  en: {
    hero: 'ZHAO YUN · WHITE DRAGON',
    heroSkill: 'DRAGON RUSH',
    rival: 'LÜ BU · FLYING GENERAL',
    rivalSkill: 'SKYBREAKER',
    impactWord: 'AZURE DRAGON',
  },
};

// Editorial cuts live on the same clock as the narration and sound effects.
// A focus is an existing portrait asset, never an independently timed animation.
export const TRAILER_CUTS = [
  { id: 'approach', start: 0, end: .25 },
  { id: 'oath', start: .25, end: 2.15, focus: 'zhao-yun' },
  { id: 'gather', start: 2.15, end: 2.3 },
  { id: 'crimson', start: 2.3, end: 3.2, focus: 'hu-sanniang' },
  { id: 'temple', start: 3.2, end: 4.2, focus: 'lu-zhishen' },
  { id: 'challenge', start: 4.2, end: 4.95, focus: 'zhao-yun' },
  { id: 'strike', start: 4.95, end: 5.5 },
  { id: 'charge', start: 5.5, end: 5.87 },
  { id: 'release', start: 5.87, end: 6.5 },
  { id: 'river', start: 6.5, end: 7 },
  { id: 'mountain', start: 7, end: 7.5 },
  { id: 'citadel', start: 7.5, end: 8 },
  { id: 'last-oath', start: 8, end: 8.6, focus: 'zhao-yun' },
  { id: 'reveal', start: 8.6, end: 10 },
];
export const TRAILER_IMPACTS = [
  { at: 5.18, duration: .38, power: .65 },
  { at: 5.94, duration: .52, power: 1 },
];
const clamp = value => Math.max(0, Math.min(1, value));
const ease = value => 1 - (1 - clamp(value)) ** 3;
function attackTravel(time, start, contact, hold, end) {
  if (time < start || time >= end) return 0;
  if (time < contact) return ease((time - start) / (contact - start));
  if (time < hold) return 1; // A short contact hold gives the blow weight.
  return 1 - ease((time - hold) / (end - hold));
}
export function trailerFrame(seconds, reducedMotion = false) {
  const time = Math.max(0, Math.min(TRAILER_DURATION, Number.isFinite(seconds) ? seconds : 0));
  const scene = TRAILER_SCENES.find(s => time >= s.start && time < s.end) || TRAILER_SCENES.at(-1);
  const shot = TRAILER_CUTS.find(c => time >= c.start && time < c.end) || TRAILER_CUTS.at(-1);
  const impact = TRAILER_IMPACTS.find(c => time >= c.at && time < c.at + c.duration);
  const impactProgress = impact ? clamp((time - impact.at) / impact.duration) : 1;
  const travel = Math.max(attackTravel(time, 4.99, 5.18, 5.25, 5.5), attackTravel(time, 5.87, 5.94, 6.05, 6.45));
  const pose = time < 5.08 ? 'windup' : time < 5.5 ? 'strike' : time < 5.87 ? 'focus' : 'special';
  const effects = reducedMotion ? { travel: 0, energy: 0, flash: 0, shake: 0, ring: 0, ringOpacity: 0 } : {
    travel,
    energy: shot.id === 'charge' ? clamp((time - 5.5) / .37) : impact ? 1 - impactProgress : 0,
    flash: impact ? Math.max(0, 1 - impactProgress * 5) * .28 : 0,
    shake: impact ? Math.sin(impactProgress * Math.PI * 10) * (1 - impactProgress) * impact.power : 0,
    ring: impactProgress,
    ringOpacity: impact ? (1 - impactProgress) * impact.power : 0,
  };
  return { time, scene, shot, pose, effects, shotProgress: clamp((time - shot.start) / (shot.end - shot.start)), progress: (time - scene.start) / (scene.end - scene.start), ended: time === TRAILER_DURATION,
    voice: TRAILER_VOICE.find(c => time >= c.start && time < c.end) || null };
}
