// Seconds on one shared audio/visual clock; every scene owns a half-open interval.
export const TRAILER_DURATION = 10;
export const TRAILER_SCENES = [
  { id: 'pass', start: 0, end: 2.15, ja: ['灰旗に、抗え。', '翠門関 · 反撃の刻'], en: ['DEFY THE ASHEN BANNER.', 'THE JADE GATE · RISE AGAINST THE ASH'] },
  { id: 'legends', start: 2.15, end: 4.2, ja: ['十二の伝説、集結。', 'その刃に、誓いを。'], en: ['TWELVE LEGENDS. ONE OATH.', 'CHOOSE THE BLADE THAT DEFINES YOU.'] },
  { id: 'duel', start: 4.2, end: 6.5, ja: ['刃と札で、運命を変えろ。', '敵を読み、奥義を放て。'], en: ['MASTER THE BLADE.', 'READ YOUR RIVAL. COMMAND THE DUEL.'] },
  { id: 'journey', start: 6.5, end: 8, ja: ['江湖を駆けろ。', '三つの章。仲間と紡ぐ物語。'], en: ['YOUR LEGEND AWAITS.', 'THREE CHAPTERS. ALLIES WORTH FIGHTING FOR.'] },
  { id: 'title', start: 8, end: 10, ja: ['四人の刃', '今、江湖へ。'], en: ['BLADES OF THE FOUR', 'YOUR JOURNEY STARTS NOW.'] },
];
export const TRAILER_VOICE = [
  { start: .25, end: 2.05, file: '1', ja: '灰旗に、抗え。', en: 'Defy the Ashen Banner.' },
  { start: 2.3, end: 4.1, file: '2', ja: '十二の伝説、集結。', en: 'Twelve legends. One oath.' },
  { start: 4.35, end: 6.45, file: '3', ja: '刃と札で、運命を変えろ。', en: 'Master the blade. Command the duel.' },
  { start: 8.08, end: 9.92, file: '4', ja: '四人の刃。今、江湖へ。', en: 'Blades of the Four. Play now.' },
];
export function trailerFrame(seconds) {
  const time = Math.max(0, Math.min(TRAILER_DURATION, Number.isFinite(seconds) ? seconds : 0));
  const scene = TRAILER_SCENES.find(s => time >= s.start && time < s.end) || TRAILER_SCENES.at(-1);
  return { time, scene, progress: (time - scene.start) / (scene.end - scene.start), ended: time === TRAILER_DURATION,
    voice: TRAILER_VOICE.find(c => time >= c.start && time < c.end) || null };
}
