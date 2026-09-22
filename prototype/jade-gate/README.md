# Blades of the Four — Jade Gate

A fresh, local wuxia combat RPG prototype built from the supplied concept summary. This is a new implementation; the earlier source repository was unavailable.

## Play

Run `python3 serve.py` in this folder, then open http://127.0.0.1:8765. On macOS, `Play.command` starts the same server and opens the game. Python 3 is required. Stop the server with Ctrl+C. No npm installation, external assets, account, API key, or build step is needed.

The server listens only on this computer's loopback interface. Keep it running while playing. Another process on port 8765 must be stopped or use `python3 -m http.server 8766 --bind 127.0.0.1` from this directory and open the corresponding address.

## Controls

- WASD or arrow keys: move.
- J (hold), primary click, or Strike button: attack; a nearby target is automatically faced.
- K or Space: dodge with a brief invulnerable window.
- L or E: hero technique; costs 40 Flow, reduced to 30 by Still water.
- Escape or Pause: pause/resume. Switching away automatically pauses.
- Touch: hold direction buttons; tap Dodge/Technique or hold Strike.
- Sound and reduced-motion buttons are available in the header.

## Campaign foundation

Choose Campaign for Act I dialogue, saved encounter checkpoints, permanent Renown, and tea-house cultivation. Continue restores the encounter boundary or saved dialogue/upgrade/tea-house scene. Choose Quick play to test all four heroes without permanent bonuses. Lü Bu is locked in campaign until the future Act III duel. Acts II–IV are visibly in development.

The Warden has two combat phases. Third-swing finishers, hit-stop buffering and perfect evade Flow rewards are implemented. Sound/music preferences and master/music/effects volume levels persist. Corrupt or newer saves and conflicting writes from another tab are preserved with a visible warning.

See [architecture](docs/architecture.md) for the dependency graph, scene/event contracts, save schema and implementation boundaries.

## Playable content

Four heroes have distinct health, speed, damage, reach, attack timing and techniques. Three encounters introduce guards, ranged archers, and the Ashen Warden. Attacks build Flow, third-chain finishers increase damage, enemies telegraph attacks, health drops restore 18 HP, and two upgrade choices shape a run. Victory, defeat, retry, pause, local per-hero best scores and win counts are implemented. Sound effects are synthesized locally with Web Audio.

Art includes 4 hero portraits, 4 transparent hero sprites, 4 front/side/back modeling sheets with equipment/material references, 3 transparent enemy sprites, and 1 painted arena. Open `gallery.html` through the server. All exact prompts and file paths are in `docs/asset-manifest.json`; generated using the built-in image_gen tool.

## Project structure

- `game.js`: browser composition root and frame/page lifecycle.
- `src/content`: heroes, acts, encounters, dialogue and progression definitions.
- `src/engine`: events, state machine and fixed simulation clock.
- `src/domain`: session, combat, AI, encounters and progression rules.
- `src/platform`: input, assets, save storage and audio adapters.
- `src/presentation`: UI scenes/HUD and canvas rendering.
- `audio.js`: procedural instrument and SFX synthesis backend.
- `tests`: direct module tests for gameplay and architecture contracts.

## Validation

Run `npm test` and `npm run check` with Node installed. No installation or build is needed. CI runs the same commands. Tests cover all techniques, enemy damage, boss phases, campaign dialogue/upgrade/tea-house flow, save migration and corruption, duplicate rewards, purchases, pause/retry, asset failures, fixed-step determinism and audio scheduling. Browser verification checks actual rendering, input, Continue and audio controls. These checks do not establish final balance or full device compatibility.

## Current limits

This is a 2D canvas action prototype with painted depth, single-pose sprites and procedural movement/attack effects. It does not contain 3D meshes, skeletal animation, an open world, inventory, or the complete four-act campaign. Act I dialogue and progression are implemented. Generated turnaround sheets need a modeler's consistency review before production. The earlier prototype and concept archive remain in the parent repository. This standalone build does not replace their files.
