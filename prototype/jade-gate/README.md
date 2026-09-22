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

## Playable content

Four heroes have distinct health, speed, damage, reach, attack timing and techniques. Three encounters introduce guards, ranged archers, and the Ashen Warden. Attacks build Flow, third-chain finishers increase damage, enemies telegraph attacks, health drops restore 18 HP, and two upgrade choices shape a run. Victory, defeat, retry, pause, local per-hero best scores and win counts are implemented. Sound effects are synthesized locally with Web Audio.

Art includes 4 hero portraits, 4 transparent hero sprites, 4 front/side/back modeling sheets with equipment/material references, 3 transparent enemy sprites, and 1 painted arena. Open `gallery.html` through the server. All exact prompts and file paths are in `docs/asset-manifest.json`; generated using the built-in image_gen tool.

## Project structure

- `core.js`: hero stats, hit geometry, upgrades, encounter setup.
- `game.js`: combat controller, input, AI, UI and save data.
- `render.js`: depth-sorted sprites, arena, telegraphs and effects.
- `tests/combat.test.js`: core and controller regression tests.
- `docs/development-spec.md`: implemented scope and 3D handoff.

## Validation

Run `npm test` and `npm run check` with Node installed. Tests exercise real controller code using a DOM adapter: all hero techniques, cooldowns, damage immunity, upgrade persistence, wave progression, victory, defeat and retry. Browser verification additionally covers rendering, loaded artwork, keyboard technique/pause, and console errors. Tests do not establish final game balance or full device compatibility.

## Current limits

This is a 2D canvas action prototype with painted depth, single-pose sprites and procedural movement/attack effects. It does not contain 3D meshes, skeletal animation, an open world, inventory, quest dialogue, or a full campaign. Generated turnaround sheets need a modeler's consistency review before production. The earlier prototype and concept archive remain in the parent repository. This standalone build does not replace their files.
