import { trailerFrame, TRAILER_DURATION } from '../content/trailer.js';
import { loadDuelPoses, applyDuelPose } from '../platform/duel-poses.js';
import { loadRoamSheetManifest, sampleAnim, applySheetFrame } from '../platform/sheet-anim.js';

const identities = {
  'zhao-yun': { ja: ['白龍 · 常山の誓い', '趙雲'], en: ['THE WHITE DRAGON', 'ZHAO YUN'] },
  'hu-sanniang': { ja: ['紅月 · 二振りの刃', '扈三娘'], en: ['THE CRIMSON MOON', 'HU SANNIANG'] },
  'lu-zhishen': { ja: ['花和尚 · 揺るがぬ力', '魯智深'], en: ['THE TEMPLE STORM', 'LU ZHISHEN'] },
};
const locations = {
  river: { ja: '幽篁夜渡 / 竹林の渡河', en: 'THE WHISPERING CROSSING' },
  mountain: { ja: '滄嵐絶頂 / 雲上の決戦', en: 'THE HEIGHTS OF CANGLAN' },
  citadel: { ja: '天脈城 / 最後の誓い', en: 'THE IMPERIAL MERIDIAN' },
};

/** All movement is sampled from audio time. Pausing freezes every visual layer. */
export class TrailerView {
  constructor(document, manifest) {
    this.$ = id => document.getElementById(id);
    this.screen = this.$('screen');
    this.shots = [...this.screen.querySelectorAll('[data-shot]')];
    this.portraits = [...this.screen.querySelectorAll('[data-focus]')];
    this.heroPoses = loadDuelPoses(manifest, 'zhao-yun');
    this.walk = loadRoamSheetManifest(manifest, 'zhao-yun');
    this.assetFiles = [...new Set([this.heroPoses?.file, ...(this.walk?.frameFiles || [])].filter(Boolean))];
    for (let i = 0; i < 28; i++) {
      const spark = document.createElement('i');
      spark.style.cssText = `--x:${i * 3.7}%;--drift:${i % 2 ? 4 : -4}`;
      this.$('embers').append(spark);
    }
    this.sparks = [...this.$('embers').children];
    this.track = document.querySelector('.track');
  }
  render(seconds, language = 'ja', { poster = false, reduced = false, state = 'ready' } = {}) {
    const frame = trailerFrame(poster ? 10 : seconds, reduced);
    const { scene, shot, effects } = frame;
    const screen = this.screen;
    screen.dataset.scene = scene.id;
    screen.dataset.cut = shot.id;
    screen.dataset.playback = state;
    screen.dataset.focus = shot.focus || '';
    screen.classList.toggle('reduced', reduced);
    const values = { p: frame.progress, q: frame.shotProgress, t: frame.time,
      travel: effects.travel, energy: effects.energy, flash: effects.flash,
      shake: `${effects.shake * 9}px`, ring: effects.ring, 'ring-opacity': effects.ringOpacity,
      wipe: reduced || poster ? 0 : Math.max(0, 1 - frame.shotProgress * 16) };
    for (const [key, value] of Object.entries(values)) screen.style.setProperty(`--${key}`, value);
    this.shots.forEach(node => node.classList.toggle('active', node.dataset.shot === scene.id));
    this.portraits.forEach(node => node.classList.toggle('active', node.dataset.focus === shot.focus));
    this.$('closeup').classList.toggle('active', !!shot.focus);
    if (shot.focus) {
      const [role, name] = identities[shot.focus][language];
      this.$('portrait-role').textContent = role;
      this.$('portrait-name').textContent = name;
    }
    this.$('shot-title').textContent = scene[language][0];
    this.$('shot-kicker').textContent = scene[language][1];
    this.$('subtitle').textContent = !poster && frame.voice ? frame.voice[language] : '';
    this.$('location').textContent = locations[shot.id]?.[language] || '';
    if (scene.id === 'duel') applyDuelPose(this.$('duel-hero'), this.heroPoses, reduced ? 'windup' : frame.pose);
    if (scene.id === 'pass' && this.walk) applySheetFrame(this.$('wanderer'), this.walk, sampleAnim(this.walk.anims.walk, reduced ? 0 : frame.time));
    this.sparks.forEach((spark,i) => spark.style.setProperty('--rise', (i * 37 + frame.time * (35 + i % 5 * 12)) % 650));
    const time = poster ? 0 : frame.time;
    const display = `00:${String(Math.floor(time)).padStart(2,'0')} / 00:10`;
    this.$('timer').textContent = display; this.$('film-time').textContent = display;
    this.$('progress').style.width = `${time / TRAILER_DURATION * 100}%`;
    this.track.setAttribute('aria-valuenow', time.toFixed(1));
    return frame;
  }
}
