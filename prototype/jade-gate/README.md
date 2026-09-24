# Blades of the Four — a wuxia card RPG

A local, turn-based RPG with one hero card facing one enemy card. Follow the Jade Gate story, read each rival's next move, choose your action, learn disciplines and spend earned Renown on permanent cultivation.

## Play locally

Run `python3 serve.py` here and open http://127.0.0.1:8765/. On macOS, double-click `Play.command`. No npm installation, API key, account or build step is needed. Keep the server running; Ctrl+C stops it.

## How to fight

- **1 — Strike:** deal weapon damage and build Flow.
- **2 — Guard:** block 80% of the rival's next attack and gain 20 Flow.
- **3 — Technique:** spend Flow on your hero's signature attack. All techniques pierce guard.
- **4 — Healing tea:** recover up to 30 health once per encounter; the rival still replies.
- **Esc — Pause/resume.** Mouse and touch buttons offer the same choices.

Only an action advances a turn. The rival's next move and exact damage are shown before you choose. Defeating a rival restores 12 health and 8 Flow; the next rival arrives on your turn. Choose a discipline between encounters. Reduced motion, sound/music and volume controls are in the menu/header.

## RPG progression

Campaign includes Act I arrival dialogue, two initial encounters, two discipline choices, a two-stance Warden duel, resolution and the tea house. Spend Renown there on health, starting Flow and weapon power. Cultivation applies on your next new campaign run.

Continue restores the saved encounter boundary or story/upgrade/tea-house scene, not a mid-turn snapshot. Existing arena saves carry over to the equivalent card encounter. Progress and settings stay in this browser. Quick play offers all four heroes without changing campaign currency or unlocks. Lü Bu remains locked in the campaign until the planned Act III. Acts II–IV are in development.

## Architecture and validation

See [architecture](docs/architecture.md) for module contracts and [the art gallery](gallery.html) for the 16 generated images and modeling references. The browser root uses `card-combat.js` and `duel-view.js`; older canvas/arena modules remain as reference and are not part of the current play loop.

Run `npm test` and `npm run check`. Tests cover card rules, all four heroes, campaign completion, save recovery, rewards, purchases, scene/modal regressions, and the retained legacy combat/audio contracts. Browser checks cover actual dialogue, duels, upgrades, pause/resume and saved tea-house progression.

This is a playable Act I prototype. It does not yet include open-world movement, an equipment inventory, later acts, 3D characters or a Godot project. Existing artwork still needs a canon-alignment pass, notably Zhao Yun's sword.
