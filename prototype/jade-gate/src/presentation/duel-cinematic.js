import assetManifest from "../../docs/asset-manifest.json" with { type: "json" };
import { loadSheetManifest, sampleAnim, applySheetFrame, clearSheetFrame } from "../platform/sheet-anim.js";
import { signatureById } from "../content/expansion.js";
import { signatureArtFor, specialArtFor, expansionArtAvailable } from "../content/expansion-art.js";

/** Film cuts: ordered [beat, atMs] pairs. Only the closing `end` beat completes the film. */
export const CUTS = {
  still: [['prepare', 0], ['strike', 0], ['impact', 60], ['reply', 120], ['end', 220]],
  strike: [['prepare', 0], ['strike', 180], ['impact', 480], ['reply', 930], ['end', 1450]],
  special: [['prepare', 0], ['focus', 280], ['strike', 1180], ['impact', 1480], ['reply', 2300], ['end', 2950]],
  assist: [['prepare', 0], ['flash', 80], ['impact', 380], ['end', 900]],
  intro: [['open', 0], ['clash', 620], ['out', 1600], ['end', 1900]],
};
export const cutFor = (action, reduced) =>
  reduced ? CUTS.still
    : (action === 'technique' || action === 'signature') ? CUTS.special
    : CUTS.strike;

/** A cancellable presentation timeline. Damage is committed only after the final frame. */
export class StrikeTimeline {
  constructor(schedule = (fn, ms) => setTimeout(fn, ms), unschedule = id => clearTimeout(id)) {
    this.schedule = schedule; this.unschedule = unschedule; this.timers = []; this.generation = 0;
  }
  cancel() { this.generation++; this.timers.forEach(this.unschedule); this.timers = []; }
  play(cut, beat, complete) {
    this.cancel();
    const generation = this.generation;
    const [[first], ...rest] = cut;
    beat(first, 0);
    for (const [name, ms] of rest) this.timers.push(this.schedule(() => {
      if (generation !== this.generation) return;
      if (name === 'end') { this.cancel(); complete(); } else beat(name, ms);
    }, ms));
  }
}

const STREAKS = '<i></i>'.repeat(7);

function setActionArt(node, artId) {
  const img = node?.querySelector?.('.film-action-art');
  if (!img) return false;
  if (!artId || !expansionArtAvailable(artId)) {
    img.hidden = true;
    if (typeof img.removeAttribute === 'function') img.removeAttribute('src');
    else img.src = '';
    img.className = 'film-action-art';
    return false;
  }
  img.hidden = false;
  img.src = `assets/${artId}.png`;
  img.className = `film-action-art art-${artId}`;
  return true;
}

function clearActionArt(node) {
  setActionArt(node, null);
}

export class DuelCinematic {
  constructor(document, table, cue, translate = text => text, timeline = new StrikeTimeline(), manifest = assetManifest) {
    this.manifest = manifest; this.document = document; this.cue = cue; this.t = translate; this.timeline = timeline;
    this.node = document.createElement('div'); this.node.className = 'strike-film'; this.node.hidden = true;
    this.node.setAttribute('aria-hidden', 'true');
    this.node.innerHTML = `<div class="film-camera"><div class="film-backdrop"></div><div class="film-aura"></div><div class="film-floor"></div><img class="film-actor film-hero" alt=""><img class="film-actor film-enemy" alt=""><div class="film-trail"></div><div class="film-ring"></div><div class="film-sparks">✦</div></div><div class="film-lines">${STREAKS}</div><div class="film-seal"></div><img class="film-action-art" alt="" hidden><div class="film-slash"></div><div class="film-flash"></div><div class="film-plate film-plate-hero"><small></small><b></b></div><div class="film-plate film-plate-enemy"><small></small><b></b></div><div class="film-bars"></div><div class="film-title"></div><div class="film-number"></div><div class="film-caption"></div>`;
    table.appendChild(this.node);
  }
  cancel() {
    this.timeline.cancel();
    clearSheetFrame(this.node.querySelector('.film-hero'));
    clearActionArt(this.node);
    this.node.hidden = true;
  }
  cast(className, hero, enemy) {
    const node = this.node;
    node.hidden = false;
    node.className = className;
    node.style.setProperty('--strike-color', hero.color);
    const filmHero = node.querySelector('.film-hero');
    clearSheetFrame(filmHero);
    clearActionArt(node);
    filmHero.src = filmHero.dataset.stillSrc = `assets/${hero.id}-sprite.png`;
    this.sheet = loadSheetManifest(this.manifest, hero.id);
    node.querySelector('.film-enemy').src = `assets/${enemy.art}.png`;
    node.querySelector('.film-seal').textContent = hero.cn || '';
    node.querySelector('.film-number').textContent = '';
    return node;
  }
  /** Opening shot of a duel. Presentation only: any action cuts straight to its own film. */
  intro(hero, enemy, ambush, reduced) {
    if (reduced) { this.cancel(); return; }
    const node = this.cast(`strike-film film-intro style-${hero.id}${ambush ? ' ambush' : ''}`, hero, enemy);
    for (const [side, fighter] of [['hero', hero], ['enemy', enemy]]) {
      node.querySelector(`.film-plate-${side} small`).textContent = this.t(fighter.title);
      node.querySelector(`.film-plate-${side} b`).textContent = this.t(fighter.name);
    }
    node.querySelector('.film-title').textContent = '對';
    node.querySelector('.film-caption').textContent = '';
    this.timeline.play(CUTS.intro, beat => {
      node.dataset.phase = beat;
      if (beat === 'open') this.cue({type: 'dodge'});
      if (beat === 'clash') {
        this.cue({type: 'duel_open'});
        node.querySelector('.film-caption').textContent = this.t(ambush ? 'AMBUSH · THE RIVAL REELS' : 'THE DUEL BEGINS');
      }
    }, () => { this.cancel(); });
  }
  play(action, hero, enemy, result, reduced, complete) {
    const node = this.cast(`strike-film style-${hero.id} action-${action}${reduced ? ' film-reduced' : ''}`, hero, enemy);
    const signature = action === 'signature' ? signatureById(hero.id) : null;
    const title = action === 'technique' ? hero.skill
      : action === 'signature' ? (signature?.name || hero.skill)
      : ({attack:'BLADES MEET', guard:'IRON RESOLVE', tea:'A MOMENT OF RESPITE'}[action]);
    node.querySelector('.film-title').textContent = this.t(title);
    const caption = node.querySelector('.film-caption'), number = node.querySelector('.film-number');
    caption.textContent = this.t(hero.name);
    const filmHero = node.querySelector('.film-hero'), sheet = this.sheet;
    const attack = !reduced && ['attack', 'technique', 'signature'].includes(action) ? sheet?.anims.attack : null;
    const cut = [...cutFor(action, reduced)];
    const strikeAt = cut.find(([phase]) => phase === 'strike')[1];
    const sigArt = action === 'signature' && !reduced ? signatureArtFor(hero.id) : null;
    if (sigArt) setActionArt(node, sigArt);
    const specialArt = !reduced && result.intent === 'special' ? specialArtFor(enemy) : null;
    // The rival's counter mirrors the hero's beats: reply coils, counter dashes, counter-impact lands.
    const counter = !reduced && result.incoming > 0;
    if (counter) {
      node.classList.add(`counter-${result.intent || 'strike'}`);
      const replyAt = cut.find(([phase]) => phase === 'reply')[1];
      const counterAt = replyAt + 180;
      const hitAt = counterAt + 300;
      cut.push(['counter', counterAt], ['counter-impact', hitAt]);
      cut[cut.findIndex(([phase]) => phase === 'end')] = ['end', hitAt + 620];
      cut.sort((a, b) => a[1] - b[1]);
    }
    if (attack?.frames?.length) {
      const frameMs = 1000 / (attack.fps > 0 ? attack.fps : 1);
      const impactAt = cut.find(([phase]) => phase === 'impact')[1];
      const stopAt = Math.min(strikeAt + attack.frames.length * frameMs, impactAt);
      for (let i = 1; i < attack.frames.length && strikeAt + i * frameMs < stopAt; i++) {
        cut.push(['attack-frame', strikeAt + i * frameMs]);
      }
      if (stopAt < impactAt) cut.push(['attack-end', stopAt]);
      cut.sort((a, b) => a[1] - b[1]);
    }
    this.timeline.play(cut, (phase, atMs) => {
      if (attack && (phase === 'strike' || phase === 'attack-frame')) {
        // Nudge exact frame boundaries past floating-point subtraction error.
        applySheetFrame(filmHero, sheet, sampleAnim(attack, (atMs - strikeAt) / 1000 + 1e-9));
      }
      if (['attack-end', 'impact', 'reply'].includes(phase)) clearSheetFrame(filmHero);
      if (phase === 'attack-frame' || phase === 'attack-end') return;
      node.dataset.phase = phase;
      if (phase === 'focus') {
        this.cue({type:'charge'});
        if (sigArt) setActionArt(node, sigArt);
      }
      if (phase === 'strike') {
        this.cue({type: {attack:'strike', technique:'special', signature:'special', guard:'dodge', tea:'heal'}[action], param:hero.id});
        if (sigArt && action === 'signature') setActionArt(node, sigArt);
      }
      if (phase === 'impact') {
        if (result.damage) this.cue({type: result.lethal ? 'finisher' : 'hit', param: enemy.type});
        number.textContent = result.damage ? `−${result.damage}` : result.heal ? `+${result.heal}` : this.t('Guard');
        caption.textContent = this.t(result.lethal ? 'FINISHING BLOW' : result.stunned ? 'STAGGERED' : action === 'technique' || action === 'signature' ? 'GUARD PIERCED' : 'IMPACT');
        node.classList.toggle('finisher', result.lethal);
        if (sigArt) clearActionArt(node);
      }
      if (phase === 'reply') {
        node.classList.toggle('counter', result.incoming > 0);
        number.textContent = counter ? '' : result.incoming ? `−${result.incoming}` : '';
        caption.textContent = this.t(result.lethal ? 'RIVAL DEFEATED' : result.stunned ? 'ENEMY STUNNED · NO REPLY' : result.incoming ? `${enemy.name} · COUNTERSTRIKE` : 'THE ENEMY HOLDS GUARD');
        if (result.incoming && !counter) this.cue({type:'hurt'});
        if (counter) this.cue({type:'enemy_windup'});
        if (specialArt) setActionArt(node, specialArt);
      }
      if (phase === 'counter') {
        this.cue({type:'strike'});
        if (specialArt) setActionArt(node, specialArt);
      }
      if (phase === 'counter-impact') {
        number.textContent = `−${result.incoming}`;
        this.cue({type:'hurt'});
        if (specialArt) clearActionArt(node);
      }
    }, () => { this.cancel(); complete(); });
  }
  /**
   * WU-PARTY-09I assist flash: short film with follower sprite + oath emblem when available.
   * Domain commit stays in the caller (assistStrike after complete).
   */
  assistFlash({ follower, oath, damage }, hero, enemy, reduced, complete) {
    if (reduced) { this.cancel(); complete(); return; }
    const node = this.cast(`strike-film film-assist style-${hero.id} action-assist`, hero, enemy);
    if (follower?.id) node.querySelector('.film-hero').src = `assets/${follower.id}-sprite.png`;
    const oathArt = oath?.id ? `oath-${oath.id}` : null;
    if (oathArt) setActionArt(node, oathArt);
    node.querySelector('.film-title').textContent = this.t(oath?.name || 'Assist');
    node.querySelector('.film-caption').textContent = this.t(follower?.name || hero.name);
    const number = node.querySelector('.film-number');
    number.textContent = '';
    const cut = [...CUTS.assist];
    this.timeline.play(cut, phase => {
      node.dataset.phase = phase;
      if (phase === 'flash') {
        this.cue({type:'strike'});
        if (oathArt) setActionArt(node, oathArt);
      }
      if (phase === 'impact') {
        number.textContent = damage ? `−${damage}` : '';
        node.querySelector('.film-caption').textContent = this.t(
          oath ? `${follower?.name || 'Ally'} · ${oath.name}` : `${follower?.name || 'Ally'} assists`
        );
        this.cue({type:'hit'});
      }
    }, () => { this.cancel(); complete(); });
  }
}
