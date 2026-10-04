import manifest from './docs/asset-manifest.json' with {type:'json'};
import { TrailerView } from './src/presentation/trailer-view.js';
import { TRAILER_DURATION, TRAILER_VOICE, TRAILER_CARD_LABELS } from './src/content/trailer.js';
import { TrailerAudio } from './src/platform/trailer-audio.js';

const $ = id => document.getElementById(id), screen = $('screen'), audio = new TrailerAudio(), view = new TrailerView(document, manifest);

const words = {
  ja: {
    play: '再生 ▶',
    pause: '一時停止',
    resume: '再開 ▶',
    replay: 'もう一度 ↻',
    loading: '準備中…',
    cover: '音声付きで再生',
    coverReplay: 'もう一度再生',
    coverHint: '10 SEC · MUSIC + VOICE',
    brandTitle: '四人の刃',
    brandSub: '武侠カードRPG',
    back: 'ゲームへ ↗',
    eyebrow: '江湖の物語 · 公式ティーザー',
    description: '刃が交わる、その一瞬を。探索とカード決闘で紡ぐ武侠RPG。',
    cta: '物語を始める ↗',
    transcript: 'ナレーション全文',
    footer: '十六の伝説 · 四つの章 · 一つの誓い',
    sound: '音声：入',
    muted: '音声：切',
    paused: '一時停止中。再開すると音声と映像が一緒に続きます。',
    audioError: '音声を読み込めませんでした。再生ボタンでもう一度お試しください。',
    imageError: '一部の画像を読み込めませんでした。ページを再読み込みしてください。',
    reduced: '端末の設定に合わせ、カメラ移動と光の演出を抑えています。',
    duelHeroName: TRAILER_CARD_LABELS.ja.hero,
    duelHeroSkill: TRAILER_CARD_LABELS.ja.heroSkill,
    duelRivalName: TRAILER_CARD_LABELS.ja.rival,
    duelRivalSkill: TRAILER_CARD_LABELS.ja.rivalSkill,
    impactWord: TRAILER_CARD_LABELS.ja.impactWord,
    endKicker: 'BLADES OF THE FOUR',
    endTitle: '四人の刃',
    endLine: '今、江湖へ。',
  },
  en: {
    play: 'Play ▶',
    pause: 'Pause',
    resume: 'Resume ▶',
    replay: 'Replay ↻',
    loading: 'Preparing…',
    cover: 'PLAY WITH SOUND',
    coverReplay: 'REPLAY',
    coverHint: '10 SEC · MUSIC + VOICE',
    brandTitle: 'BLADES OF THE FOUR',
    brandSub: 'A WUXIA CARD RPG',
    back: 'Play the game ↗',
    eyebrow: 'A STORY OF THE JIANGHU · OFFICIAL TEASER',
    description: 'A moment of steel. A world of legends. Explore the passes. Decide the duel.',
    cta: 'Begin your journey ↗',
    transcript: 'Narration transcript',
    footer: 'SIXTEEN LEGENDS · FOUR CHAPTERS · ONE OATH',
    sound: 'Sound on',
    muted: 'Sound off',
    paused: 'Paused. Resume continues picture and sound together.',
    audioError: 'The audio could not load. Press Play to try again.',
    imageError: 'Some artwork could not load. Please reload the page.',
    reduced: 'Camera movement and flashes are reduced to match your device preference.',
    duelHeroName: TRAILER_CARD_LABELS.en.hero,
    duelHeroSkill: TRAILER_CARD_LABELS.en.heroSkill,
    duelRivalName: TRAILER_CARD_LABELS.en.rival,
    duelRivalSkill: TRAILER_CARD_LABELS.en.rivalSkill,
    impactWord: TRAILER_CARD_LABELS.en.impactWord,
    endKicker: 'A WUXIA CARD RPG',
    endTitle: 'BLADES OF THE FOUR',
    endLine: 'YOUR JOURNEY STARTS NOW.',
  },
};

let language = 'ja';
try {
  const saved = JSON.parse(localStorage.getItem('blades-profile-v2'));
  if (saved?.settings?.language === 'en') language = 'en';
} catch {}

let state = 'ready', ready = false, time = 0, raf = 0, generation = 0;
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
screen.classList.toggle('reduced', reduced.matches);
reduced.addEventListener('change', () => render(time, state === 'ready'));

const t = key => words[language][key];

function labels() {
  document.documentElement.lang = language;
  document.title = language === 'ja' ? '四人の刃 — 10秒トレーラー' : 'Blades of the Four — 10-second trailer';
  const langSelect = $('trailer-language');
  if (langSelect) langSelect.value = language;
  screen.setAttribute('aria-label', language === 'ja' ? 'ゲームトレーラー' : 'Game trailer');
  document.querySelector('.track')?.setAttribute('aria-label', language === 'ja' ? '再生位置' : 'Playback progress');

  for (const [id, key] of [
    ['back', 'back'],
    ['eyebrow', 'eyebrow'],
    ['description', 'description'],
    ['cta', 'cta'],
    ['transcript-label', 'transcript'],
    ['footer-copy', 'footer'],
  ]) {
    const el = $(id);
    if (el) el.textContent = t(key);
  }

  const brandEl = $('brand-text');
  if (brandEl) brandEl.innerHTML = `<span>${t('brandTitle')}</span><small>${t('brandSub')}</small>`;

  const heroNameEl = $('duel-hero-name');
  if (heroNameEl) heroNameEl.textContent = t('duelHeroName');
  const heroSkillEl = $('duel-hero-skill');
  if (heroSkillEl) heroSkillEl.textContent = t('duelHeroSkill');

  const rivalNameEl = $('duel-rival-name');
  if (rivalNameEl) rivalNameEl.textContent = t('duelRivalName');
  const rivalSkillEl = $('duel-rival-skill');
  if (rivalSkillEl) rivalSkillEl.textContent = t('duelRivalSkill');

  const impactEl = $('impact-word');
  if (impactEl) impactEl.textContent = t('impactWord');

  const endKickerEl = $('end-kicker');
  if (endKickerEl) endKickerEl.textContent = t('endKicker');
  const endTitleEl = $('end-title');
  if (endTitleEl) endTitleEl.textContent = t('endTitle');
  const endLineEl = $('end-line');
  if (endLineEl) endLineEl.textContent = t('endLine');

  const coverLabelEl = $('cover-label');
  if (coverLabelEl) coverLabelEl.textContent = t(state === 'ended' ? 'coverReplay' : 'cover');
  const coverIconEl = $('cover-icon');
  if (coverIconEl) coverIconEl.textContent = state === 'ended' ? '↻' : '▶';
  const coverHintEl = $('cover-hint');
  if (coverHintEl) coverHintEl.textContent = t('coverHint');

  const transcriptEl = $('transcript');
  if (transcriptEl) transcriptEl.textContent = TRAILER_VOICE.map(c => c[language]).join(' ');

  const muteBtn = $('mute');
  if (muteBtn) {
    muteBtn.textContent = t(audio.muted ? 'muted' : 'sound');
    muteBtn.setAttribute('aria-pressed', String(audio.muted));
  }

  const playBtn = $('play');
  if (playBtn) {
    playBtn.textContent = t(state === 'loading' || !ready ? 'loading' : state === 'playing' ? 'pause' : state === 'paused' ? 'resume' : state === 'ended' ? 'replay' : 'play');
    playBtn.disabled = !ready || state === 'loading';
  }

  const coverBtn = $('cover');
  if (coverBtn) coverBtn.disabled = !ready || state === 'loading';

  if (langSelect) langSelect.disabled = state === 'loading';
}

function render(seconds, poster = false) {
  view.render(seconds, language, { poster, reduced: reduced.matches, state });
  if (language === 'en' && $('portrait-name')?.textContent === 'LU ZHISHEN') {
    const roleEl = $('portrait-role');
    if (roleEl && roleEl.textContent === 'THE TEMPLE STORM') roleEl.textContent = 'THE FLOWER MONK';
  }
}

function tick() {
  if (state !== 'playing') return;
  time = Math.min(TRAILER_DURATION, audio.time);
  render(time);
  if (time >= TRAILER_DURATION) {
    state = 'ended';
    audio.stop();
    screen.dataset.playback = state;
    $('cover').hidden = false;
    labels();
    return;
  }
  raf = requestAnimationFrame(tick);
}

async function play() {
  if (!ready || state === 'loading') return;
  if (state === 'playing') return pause();
  const token = ++generation;
  if (state === 'paused') {
    await audio.resume();
    if (token !== generation) return;
    state = 'playing';
    screen.dataset.playback = state;
    $('status').textContent = '';
    labels();
    tick();
    return;
  }
  state = 'loading';
  labels();
  $('status').textContent = '';
  try {
    await audio.prepare(language);
    if (token !== generation) return;
    audio.start(language);
    state = 'playing';
    time = 0;
    $('cover').hidden = true;
    screen.dataset.playback = state;
    labels();
    tick();
    if (document.hidden) pause();
  } catch {
    if (token !== generation) return;
    audio.stop();
    state = 'ready';
    labels();
    $('status').textContent = t('audioError');
  }
}

function pause() {
  if (state !== 'playing') return;
  time = Math.min(TRAILER_DURATION, audio.time);
  state = 'paused';
  cancelAnimationFrame(raf);
  audio.pause();
  render(time);
  screen.dataset.playback = state;
  labels();
  $('status').textContent = t('paused');
}

$('play').onclick = play;
$('cover').onclick = e => { e.stopPropagation(); play(); };
screen.onclick = e => {
  if (e.target.closest('button, select, a')) return;
  if (!ready || state === 'loading') return;
  if (state === 'playing') pause();
  else play();
};

$('mute').onclick = () => { audio.mute(!audio.muted); labels(); };

$('trailer-language').onchange = event => {
  generation++;
  cancelAnimationFrame(raf);
  audio.stop();
  language = event.target.value;
  state = 'ready';
  time = 0;
  $('cover').hidden = false;
  $('status').textContent = '';
  labels();
  render(0, true);
};

document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });

document.addEventListener('keydown', event => {
  if (['BUTTON', 'SELECT', 'A', 'INPUT'].includes(event.target.tagName)) return;
  if (event.code === 'Space' || event.code === 'KeyK') {
    event.preventDefault();
    if (state === 'playing') pause();
    else play();
  } else if (event.code === 'KeyM') {
    event.preventDefault();
    audio.mute(!audio.muted);
    labels();
  } else if (event.code === 'KeyR') {
    event.preventDefault();
    if (ready && state !== 'loading') {
      generation++;
      cancelAnimationFrame(raf);
      audio.stop();
      state = 'ready';
      time = 0;
      play();
    }
  }
});

window.addEventListener('pagehide', event => {
  if (event.persisted) { pause(); return; }
  generation++;
  cancelAnimationFrame(raf);
  audio.dispose();
});

labels();
render(0, true);

const frameImages = view.assetFiles.map(file => { const image = new Image(); image.src = file; return image; });
const loaded = await Promise.allSettled([...document.images, ...frameImages].map(image => image.decode()));
ready = true;
labels();

if (loaded.some(result => result.status === 'rejected')) $('status').textContent = t('imageError');
else if (reduced.matches) $('status').textContent = t('reduced');
