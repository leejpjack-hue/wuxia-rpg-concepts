/** A cancellable presentation timeline. Damage is committed only after the final frame. */
export class StrikeTimeline {
  constructor(schedule = (fn, ms) => setTimeout(fn, ms), unschedule = id => clearTimeout(id)) {
    this.schedule = schedule; this.unschedule = unschedule; this.timers = []; this.generation = 0;
  }
  cancel() { this.generation++; this.timers.forEach(this.unschedule); this.timers = []; }
  play(special, reduced, phase, complete) {
    this.cancel();
    const generation = this.generation;
    const at = (time, callback) => this.timers.push(this.schedule(() => {
      if (generation === this.generation) callback();
    }, time));
    phase('prepare');
    at(reduced ? 0 : special ? 450 : 180, () => phase('strike'));
    at(reduced ? 60 : special ? 1050 : 530, () => phase('impact'));
    at(reduced ? 120 : special ? 1550 : 930, () => phase('reply'));
    at(reduced ? 220 : special ? 2150 : 1450, () => { this.cancel(); complete(); });
  }
}

export class DuelCinematic {
  constructor(document, table, cue, translate = text => text) {
    this.document = document; this.cue = cue; this.t = translate; this.timeline = new StrikeTimeline();
    this.node = document.createElement('div'); this.node.className = 'strike-film'; this.node.hidden = true;
    this.node.setAttribute('aria-hidden', 'true');
    this.node.innerHTML = `<div class="film-title"></div><div class="film-floor"></div><img class="film-actor film-hero" alt=""><img class="film-actor film-enemy" alt=""><div class="film-trail"></div><div class="film-ring"></div><div class="film-sparks">✦</div><div class="film-number"></div><div class="film-caption"></div>`;
    table.appendChild(this.node);
  }
  cancel() { this.timeline.cancel(); this.node.hidden = true; }
  play(action, hero, enemy, result, reduced, complete) {
    const node = this.node;
    node.dataset.phase = "prepare";
    node.hidden = false;
    node.className = `strike-film style-${hero.id} action-${action}${reduced ? ' film-reduced' : ''}`;
    node.style.setProperty('--strike-color', hero.color);
    node.querySelector('.film-hero').src = `assets/${hero.id}-sprite.png`;
    node.querySelector('.film-enemy').src = `assets/${enemy.art}.png`;
    node.querySelector('.film-title').textContent = this.t(action === 'technique' ? hero.skill : ({attack:'BLADES MEET', guard:'IRON RESOLVE', tea:'A MOMENT OF RESPITE'}[action]));
    const caption = node.querySelector('.film-caption'), number = node.querySelector('.film-number');
    number.textContent = ''; caption.textContent = this.t(hero.name);
    this.timeline.play(action === 'technique', reduced, phase => {
      node.dataset.phase = phase;
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
    }, () => { node.hidden = true; complete(); });
  }
}
