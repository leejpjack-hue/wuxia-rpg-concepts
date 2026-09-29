import { HEROES } from './src/content/heroes.js';
import { TRAILER_DURATION, TRAILER_VOICE, trailerFrame } from './src/content/trailer.js';
import { TrailerAudio } from './src/platform/trailer-audio.js';

const $ = id => document.getElementById(id), screen = $('screen'), audio = new TrailerAudio();
const words = {
  ja: { play:'再生 ▶', pause:'一時停止', resume:'再開 ▶', replay:'もう一度 ↻', loading:'準備中…', cover:'音声付きで再生', back:'ゲームへ ↗', eyebrow:'江湖の物語 · 公式ティーザー', description:'刃が交わる、その一瞬を。探索とカード決闘で紡ぐ武侠RPG。', cta:'物語を始める ↗', transcript:'ナレーション全文', footer:'十二の伝説 · 三つの章 · 一つの誓い', sound:'音声：入', muted:'音声：切', paused:'一時停止中。再開すると音声と映像が一緒に続きます。', audioError:'音声を読み込めませんでした。再生ボタンでもう一度お試しください。', imageError:'一部の画像を読み込めませんでした。ページを再読み込みしてください。', reduced:'端末の設定に合わせ、カメラ移動と光の演出を抑えています。' },
  en: { play:'Play ▶', pause:'Pause', resume:'Resume ▶', replay:'Replay ↻', loading:'Preparing…', cover:'PLAY WITH SOUND', back:'Play the game ↗', eyebrow:'A STORY OF THE JIANGHU · OFFICIAL TEASER', description:'A moment of steel. A world of legends. Explore the passes. Decide the duel.', cta:'Begin your journey ↗', transcript:'Narration transcript', footer:'TWELVE LEGENDS · THREE CHAPTERS · ONE OATH', sound:'Sound on', muted:'Sound off', paused:'Paused. Resume continues picture and sound together.', audioError:'The audio could not load. Press Play to try again.', imageError:'Some artwork could not load. Please reload the page.', reduced:'Camera movement and flashes are reduced to match your device preference.' },
};
let language = 'ja';
try { const saved = JSON.parse(localStorage.getItem('blades-profile-v2')); if (saved?.settings?.language === 'en') language = 'en'; } catch {}
let state = 'ready', ready = false, time = 0, raf = 0, generation = 0;
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
screen.classList.toggle('reduced', reduced.matches);
reduced.addEventListener('change', () => screen.classList.toggle('reduced', reduced.matches));
$('roster').innerHTML = HEROES.map((hero, i) => `<img src="assets/${hero.id}.png" alt="${hero.name}" style="--offset:${i % 2 ? 4 : -4}">`).join('');
for (let i = 0; i < 24; i++) {
  const spark = document.createElement('i'); spark.style.cssText = `--x:${i * 4.3}%;--drift:${i % 2 ? 4 : -4}`; $('embers').append(spark);
}
const shots = [...document.querySelectorAll('[data-shot]')], sparks = [...$('embers').children];
const t = key => words[language][key];
function labels() {
  document.documentElement.lang = language;
  document.title = language === 'ja' ? '四人の刃 — 10秒トレーラー' : 'Blades of the Four — 10-second trailer';
  $('trailer-language').value = language;
  screen.setAttribute('aria-label', language === 'ja' ? 'ゲームトレーラー' : 'Game trailer');
  document.querySelector('.track').setAttribute('aria-label', language === 'ja' ? '再生位置' : 'Playback progress');
  for (const [id,key] of [['back','back'],['eyebrow','eyebrow'],['description','description'],['cta','cta'],['transcript-label','transcript'],['footer-copy','footer'],['cover-label','cover']]) $(id).textContent = t(key);
  $('end-title').textContent = language === 'ja' ? '四人の刃' : 'BLADES OF THE FOUR';
  $('end-line').textContent = language === 'ja' ? '今、江湖へ。' : 'YOUR JOURNEY STARTS NOW.';
  $('transcript').textContent = TRAILER_VOICE.map(c => c[language]).join(' ');
  $('mute').textContent = t(audio.muted ? 'muted' : 'sound');
  $('mute').setAttribute('aria-pressed', String(audio.muted));
  $('play').textContent = t(state === 'loading' || !ready ? 'loading' : state === 'playing' ? 'pause' : state === 'paused' ? 'resume' : state === 'ended' ? 'replay' : 'play');
  $('play').disabled = !ready || state === 'loading'; $('cover').disabled = !ready || state === 'loading';
  $('trailer-language').disabled = state === 'loading';
}
function render(seconds, poster = false) {
  const frame = trailerFrame(poster ? 10 : seconds), { scene, progress } = frame;
  screen.dataset.scene = scene.id; screen.dataset.playback = state;
  screen.style.setProperty('--p', progress); screen.style.setProperty('--t', frame.time);
  shots.forEach(shot => shot.classList.toggle('active', shot.dataset.shot === scene.id));
  $('shot-title').textContent = scene[language][0]; $('shot-kicker').textContent = scene[language][1];
  $('subtitle').textContent = !poster && frame.voice ? frame.voice[language] : '';
  const lunge = scene.id === 'duel' ? Math.sin(Math.max(0, Math.min(1, (progress - .22) / .4)) * Math.PI) : 0;
  screen.style.setProperty('--lunge', `${lunge * 60}%`);
  screen.style.setProperty('--tilt', `${-5 + lunge * 12}deg`);
  screen.style.setProperty('--recoil', `${lunge * 16}%`);
  screen.style.setProperty('--cut', progress > .39 && progress < .63 && scene.id === 'duel' ? 1 : 0);
  screen.style.setProperty('--flash', scene.id === 'duel' && progress > .41 && progress < .46 ? .25 : 0);
  sparks.forEach((spark,i) => spark.style.setProperty('--rise', (i * 37 + frame.time * (25 + i % 5 * 9)) % 650));
  const display = `00:${String(Math.floor(seconds)).padStart(2,'0')} / 00:10`;
  $('timer').textContent = display; $('film-time').textContent = display;
  $('progress').style.width = `${seconds / TRAILER_DURATION * 100}%`;
  document.querySelector('.track').setAttribute('aria-valuenow', seconds.toFixed(1));
}
function tick() {
  if (state !== 'playing') return;
  time = Math.min(TRAILER_DURATION, audio.time); render(time);
  if (time >= TRAILER_DURATION) { state = 'ended'; audio.stop(); labels(); screen.dataset.playback = state; return; }
  raf = requestAnimationFrame(tick);
}
async function play() {
  if (!ready || state === 'loading') return;
  if (state === 'playing') return pause();
  const token = ++generation;
  if (state === 'paused') {
    await audio.resume(); if (token !== generation) return;
    state = 'playing'; $('status').textContent = ''; labels(); tick(); return;
  }
  state = 'loading'; labels(); $('status').textContent = '';
  try {
    await audio.prepare(language);
    if (token !== generation) return;
    audio.start(language); state = 'playing'; time = 0;
    $('cover').hidden = true; labels(); tick();
    if (document.hidden) pause();
  } catch {
    if (token !== generation) return;
    audio.stop(); state = 'ready'; labels(); $('status').textContent = t('audioError');
  }
}
function pause() {
  if (state !== 'playing') return;
  time = Math.min(TRAILER_DURATION, audio.time); state = 'paused';
  cancelAnimationFrame(raf); audio.pause(); render(time); labels(); $('status').textContent = t('paused');
}
$('play').onclick = play; $('cover').onclick = play;
$('mute').onclick = () => { audio.mute(!audio.muted); labels(); };
$('trailer-language').onchange = event => {
  generation++; cancelAnimationFrame(raf); audio.stop();
  language = event.target.value; state = 'ready'; time = 0; $('cover').hidden = false;
  $('status').textContent = ''; labels(); render(0,true);
};
document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
document.addEventListener('keydown', event => { if (event.code === 'Space' && !['BUTTON','SELECT','A'].includes(event.target.tagName)) { event.preventDefault(); play(); } });
window.addEventListener('pagehide', event => {
  if (event.persisted) { pause(); return; }
  generation++; cancelAnimationFrame(raf); audio.dispose();
});
labels(); render(0,true);
const loaded = await Promise.allSettled([...document.images].map(image => image.decode()));
ready = true; labels();
if (loaded.some(result => result.status === 'rejected')) $('status').textContent = t('imageError');
else if (reduced.matches) $('status').textContent = t('reduced');
