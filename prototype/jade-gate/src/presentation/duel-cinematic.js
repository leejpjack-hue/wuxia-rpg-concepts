import assetManifest from "../../docs/asset-manifest.json" with { type: "json" };
import { loadSheetManifest, sampleAnim, applySheetFrame, clearSheetFrame } from "../platform/sheet-anim.js";

/** Film cuts: ordered [beat, atMs] pairs. Only the closing `end` beat completes the film. */
export const CUTS = {
  still: [['prepare', 0], ['strike', 0], ['impact', 60], ['reply', 120], ['end', 220]],
  strike: [['prepare', 0], ['strike', 180], ['impact', 480], ['reply', 930], ['end', 1450]],
  special: [['prepare', 0], ['focus', 280], ['strike', 1180], ['impact', 1480], ['reply', 2300], ['end', 2950]],
  intro: [['open', 0], ['clash', 620], ['out', 1600], ['end', 1900]],
};
export const cutFor = (action, reduced) => reduced ? CUTS.still : action === 'technique' ? CUTS.special : CUTS.strike;

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

export class DuelCinematic {
  constructor(document, table, cue, translate = text => text, timeline = new StrikeTimeline(), manifest = assetManifest) {
    this.manifest = manifest; this.document = document; this.cue = cue; this.t = translate; this.timeline = timeline;
    this.node = document.createElement('div'); this.node.className = 'strike-film'; this.node.hidden = true;
    this.node.setAttribute('aria-hidden', 'true');
    this.node.innerHTML = `<div class="film-camera"><div class="film-backdrop"></div><div class="film-aura"></div><div class="film-floor"></div><img class="film-actor film-hero" alt=""><img class="film-actor film-enemy" alt=""><div class="film-trail"></div><div class="film-ring"></div><div class="film-sparks">✦</div></div><div class="film-lines">${STREAKS}</div><div class="film-seal"></div><div class="film-slash"></div><div class="film-flash"></div><div class="film-plate film-plate-hero"><small></small><b></b></div><div class="film-plate film-plate-enemy"><small></small><b></b></div><div class="film-bars"></div><div class="film-title"></div><div class="film-number"></div><div class="film-caption"></div>`;
    table.appendChild(this.node);
  }
  cancel() { this.timeline.cancel(); clearSheetFrame(this.node.querySelector('.film-hero')); this.node.hidden = true; }
  cast(className, hero, enemy) {
    const node = this.node;
    node.hidden = false;
    node.className = className;
    node.style.setProperty('--strike-color', hero.color);
    const filmHero = node.querySelector('.film-hero');
    clearSheetFrame(filmHero);
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
    node.querySelector('.film-title').textContent = this.t(action === 'technique' ? hero.skill : ({attack:'BLADES MEET', guard:'IRON RESOLVE', tea:'A MOMENT OF RESPITE'}[action]));
    const caption = node.querySelector('.film-caption'), number = node.querySelector('.film-number');
    caption.textContent = this.t(hero.name);
    const filmHero = node.querySelector('.film-hero'), sheet = this.sheet;
    const attack = !reduced && ['attack', 'technique'].includes(action) ? sheet?.anims.attack : null;
    const cut = [...cutFor(action, reduced)];
    const strikeAt = cut.find(([phase]) => phase === 'strike')[1];
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
      if (phase === 'focus') this.cue({type:'charge'});
      if (phase === 'strike') this.cue({type: {attack:'strike', technique:'special', guard:'dodge', tea:'heal'}[action], param:hero.id});
      if (phase === 'impact') {
        if (result.damage) this.cue({type: result.lethal ? 'finisher' : 'hit', param: enemy.type});
        number.textContent = result.damage ? `−${result.damage}` : result.heal ? `+${result.heal}` : this.t('Guard');
        caption.textContent = this.t(result.lethal ? 'FINISHING BLOW' : result.stunned ? 'STAGGERED' : action === 'technique' ? 'GUARD PIERCED' : 'IMPACT');
        node.classList.toggle('finisher', result.lethal);
      }
      if (phase === 'reply') {
        node.classList.toggle('counter', result.incoming > 0);
        number.textContent = result.incoming ? `−${result.incoming}` : '';
        caption.textContent = this.t(result.lethal ? 'RIVAL DEFEATED' : result.stunned ? 'ENEMY STUNNED · NO REPLY' : result.incoming ? `${enemy.name} · COUNTERSTRIKE` : 'THE ENEMY HOLDS GUARD');
        if (result.incoming) this.cue({type:'hurt'});
      }
    }, () => { this.cancel(); complete(); });
  }
}
