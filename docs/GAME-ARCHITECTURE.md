# Blades of the Four — card RPG architecture

## Current direction

The playable browser build is a wuxia RPG with two phases per encounter. The hero first roams an illustrated pass with button-driven movement while rivals patrol; walking into a rival starts a turn-based card duel of one hero card versus one enemy card, with deliberate action choices. The four-act story, heroes, dialogue, Renown, cultivation, and checkpoint structure remain the campaign foundation. Act I is playable; Acts II–IV remain visibly gated.

## Runtime

```mermaid
flowchart LR
  Boot[game.js] --> Session[GameSession]
  Boot --> View[GameView: menus and story]
  Boot --> Duel[DuelView: two cards and actions]
  Boot --> Audio[AudioDirector]
  Session --> Combat[createCardCombat]
  Combat --> Content[duels.js: rivals and techniques]
  Session --> Progress[Progression and cultivation]
  Session --> Saves[SaveStore]
  Session --> Bus[EventBus]
  Combat --> Bus
  Bus --> View
  Bus --> Duel
  Bus --> Audio
  Audio --> Synth[Procedural rock audio]
```

The composition root injects `createCardCombat` into `GameSession`. The session owns campaign state, dialogue, encounter boundaries, rewards and persistence. Combat owns turns, rival intentions, damage, Flow, and victory/defeat signals. Neither domain module reads the DOM, a timer or browser storage.

| Module | Responsibility |
|---|---|
| `src/content/duels.js` | Act I pass rosters, enemy stats/patterns, hero technique effects |
| `src/domain/roam.js` | Button-driven hero movement, deterministic rival patrols, contact hand-off; fixed 60 Hz step |
| `src/domain/card-combat.js` | One explicit action plus at most one enemy reply; one duel per contacted rival; no idle damage |
| `src/domain/session.js` | Scene transitions; injected combat factory; encounter preparation; upgrades and saves |
| `src/presentation/view.js` | Roster, dialogue, disciplines, pause, results, tea house; screen visibility and focus |
| `src/presentation/roam-view.js` | Pass scene, sprite placement, d-pad/WASD input, requestAnimationFrame stepping |
| `src/presentation/duel-view.js` | Two-card display, accessible meters, intent preview, action buttons, keyboard and short visual animations |
| `roam.css` | Pass stage, sprite scaling, d-pad buttons and touch behavior |
| `duel.css` | Responsive table, cards, action panel and reduced-motion behavior |
| `src/platform/save-store.js` | Versioned profiles, corruption checks, legacy migration, concurrent-tab protection |
| `src/platform/audio-director.js` | Story/battle cues routed to the existing procedural audio engine |
| `game.js` | Wiring, optional art loading and browser lifecycle; no simulation loop |

The old canvas renderer and real-time combat remain as archived modules with their existing regression coverage; the browser root does not import them. Roaming reuses the shared fixed-step clock for identical 30/120 FPS simulation, and the d-pad follows the archived input controller's pointer-capture pattern. The session's default combat factory remains the legacy engine for compatibility; browser consumers must inject the card factory.

## Combat contract

Each encounter opens on the pass: the hero and that encounter's rivals (from `duels.js` rosters) move with directional input, rivals patrol near their posts, and contact starts a duel with exactly two cards on the table — the chosen hero and the contacted rival. Winning removes that rival from the pass and returns to roaming, without giving the next rival a free attack. Act I has two swordsmen in encounter one, an archer and a swordsman in encounter two, then the Warden alone. Healing tea is one shared pot per encounter.

1. Inspect the rival's next move and its exact incoming damage.
2. Choose Strike, Guard, Technique or Healing tea.
3. Resolve the hero action. A defeated rival cannot retaliate.
4. If the rival survives, resolve its displayed reply exactly once, then reveal the next intention.
5. Win the duel to return to the pass, then repeat until the field is clear. Inside a duel there is no timer, automatic attack, hit chance or damage while waiting; on the pass there is no combat damage — only contact matters.

| Action | Rule |
|---|---|
| Strike | Hero damage × run power. Gain 12 Flow plus discipline bonus. Rival guard halves normal damage. |
| Guard | Reduce this reply's damage by 80%, rounded to an integer. Gain 20 Flow. |
| Technique | Spend 40 Flow (30 with Still water). Use the selected hero's effect; pierce rival guard. |
| Healing tea | Once per encounter, recover up to 30 health. Rival still replies. Disabled at full health or with no tea. |

Zhao Yun deals double damage and halves the reply. Lu Zhishen deals 1.6× damage, restores 10 health and stuns the reply. Hu Sanniang deals 2.4× damage and restores 8 health. Lü Bu deals 2.8× damage. Techniques are disabled when unaffordable; invalid actions consume nothing.

Each defeated rival grants Renown, restores 12 health and grants 8 Flow. Disciplines apply between encounters, then restore 22 health and 20 Flow. The Warden increases outgoing damage by 20% after crossing half health, visible in the next intent preview. These are initial balance values, not final difficulty claims.

## Scene and presentation rules

- `menu`: roster visible and interactive; battle and modal hidden.
- `playing`: battle visible and interactive; roster and modal hidden. Rendering returns before any result-dialogue branch.
- `dialogue`, `paused`, `upgrade`, `waystation`, `victory`, `defeat`: battle beneath a populated modal, with background battle controls inert.
- Only explicit `victory` and `defeat` states create a result screen.
- Modal action buttons consistently target `modal-actions`, matching the shipped HTML.
- Button errors appear in an alert outside the hidden screens. Saved audio/motion settings apply on initial load.
- A brief visual animation disables repeat input, but cannot damage the player or change a turn. Reduced motion removes the animation.
- Keys 1–4 match the action buttons. Escape pauses/resumes. Held-key repeats are ignored.
- Missing artwork reports a retryable notice but cannot block a mechanically playable duel.

These rules address the previous empty menu overlay, missing action container, combat-to-defeat fallthrough, permanently hidden battle screen and stale inert states. Presentation regression tests use actual HTML IDs and an injected document adapter; browser checks cover real layout and clicks.

## Campaign and saves

`blades-profile-v2` continues to store settings, records, Renown wallet, cultivation ranks, unlocks, completed acts/runs and checkpoint. Existing saves are preserved. Checkpoints restart the current encounter or restore a dialogue, discipline choice or tea house; they do not restore mid-duel health, rival HP, intent or used tea. Old arena checkpoints enter the equivalent card encounter with saved starting stats. Optional `turns` defaults to zero on legacy saves.

The roster is nine heroes: the original four plus Guan Yu, Wu Song, Mu Guiying, Liang Hongyu and Nie Yinniang from the 2026-09-25 Stitch try-run (card art only; they roam as framed standee tokens). Quick play allows every hero and updates personal records, but awards no permanent currency or unlocks. Campaign completes Act I through arrival dialogue, three encounters, two discipline choices, Warden dialogue, resolution, and tea-house cultivation. Reloading the tea house does not award victory twice. Cultivation applies on the next new campaign run. Lü Bu's campaign unlock still depends on the future Act III.

Writes continue to detect another tab's newer save, preserve corrupt/future-version data, and report session-only play when storage is unavailable. Browser QA uses a separate localhost origin so the user's normal 127.0.0.1 campaign progress is not replaced.

## Validation and scope

Run `npm test` and `npm run check` in `prototype/jade-gate`. Card tests cover idle safety, pause, exact replies, Flow affordability, guard, tea exhaustion, hero techniques, no post-defeat retaliation, all-hero completions, checkpoint recovery, cultivation, idempotent rewards and retry. UI tests cover the original screen/modal regressions. Existing legacy combat, save and audio tests remain.

Browser acceptance: roster → campaign dialogue → the pass (move by buttons and WASD) → contact starts first card duel → win returns to the pass → disciplines → Warden stance change → resolution → tea house → purchase → reload/Continue; also pause/resume from both the pass and a duel, and Quick play. Check narrow layouts, pass sprites, card portraits, keyboard controls and reduced motion.

Delivered: local browser card RPG with Act I, nine heroes, persistent progression, procedural soundtrack and 22 illustrated assets. Deferred: later acts, open-world exploration, equipment inventory, narrative branching, new card illustrations matching the revised weapon canon, 3D meshes/rigs and a Godot port.
