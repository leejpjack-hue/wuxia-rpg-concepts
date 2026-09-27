# Blades of the Four — a wuxia card RPG

A local wuxia RPG that mixes button-driven movement with turn-based duels: walk the mountain pass, and when you meet a rival the fight becomes one hero card versus one enemy card. Follow the Jade Gate story, read each rival's next move, choose your action, learn disciplines and spend earned Renown on permanent cultivation.

## Play locally

Run `python3 serve.py` here and open http://127.0.0.1:8765/. On macOS, double-click `Play.command`. No npm installation, API key, account or build step is needed. Keep the server running; Ctrl+C stops it.

## How to travel and fight

Between duels you roam the pass. Move the hero with the on-screen arrow buttons or **WASD / arrow keys**; rivals patrol their own ground. Walking into a swordsman starts that rival's card duel, and winning removes them from the pass. Clear every rival to finish the encounter. **Esc** pauses.

Archers fight entirely in real time. Their amber aiming line locks before release: move away or **Space / K** to dodge, close in and **J / 1** to strike, or **E / 3** for a longer-range technique. Touch buttons provide the same actions. Characters and patrol targets stay on the stone courtyard.

Inside a card duel:

- **1 — Strike:** deal weapon damage and build Flow.
- **2 — Guard:** block 80% of the rival's next attack and gain 20 Flow.
- **3 — Technique:** spend Flow on your hero's signature attack. All techniques pierce guard.
- **4 — Healing tea:** recover up to 30 health once per encounter and clear bleed/poison; the rival still replies.
- **Esc — Pause/resume.** Mouse and touch buttons offer the same choices.

Each card action plays a short combat sequence with weapon trails, impact numbers and a counterstrike. Dragon Rush dashes with afterimages, Mountain Bell creates a shockwave, Crimson Waltz makes twin passes, and Skybreaker delivers a heavy cleave. The five newer heroes also have distinct strikes: Guan Yu’s sweeping dragon cleave, Wu Song’s staff slam, Mu Guiying’s repeated spear thrusts, Liang Hongyu’s crosscuts and shock rings, and Nie Yinniang’s shadow dash. Finishing blows complete before leaving the duel; pause cancels an unfinished animation without consuming the turn. Reduced motion uses a short static sequence.

Only an action advances a duel turn — no timers or idle damage inside a duel. The rival's next move and exact damage are shown before you choose. Defeating a rival restores 12 health and 8 Flow and returns you to the pass; one pot of healing tea is shared across the whole encounter. Choose a discipline between encounters. Reduced motion, sound/music and volume controls are in the menu/header.

Music is synthesized in the browser. Each scene has a 32-bar arrangement with changing melody and instrumentation, lasting roughly 49–80 seconds before it loops. The soundtrack resumes its place after switching tabs; volume and music toggles are in Settings.

## Engagement on the pass

The pass and the duel are one fight. **First blood**: land a real-time strike on a swordsman before contact and they open the duel reeling — their first reply is lost. **Sneak (C)**: crouch to halve your speed and shrink the archers' watchful range (Nie Yinniang, the Hidden Blade, sneaks closest of all); sneaking into a rival ambushes the duel the same way. First-blood rivals glow on the pass.

## Meridian cultivation

The tea house trades Renown for acupoints on a meridian map: the Conception Vessel (health), Governing Vessel (Flow) and Girding Vessel (power) run three points each in order, and three crossing cavities unlock gated perks — Dantian Core (cheaper techniques), Phoenix Eye (a fourth curio choice) and Dragon's Cavity (a second pot of tea every encounter). Legacy flat-track saves migrate onto their vessel points automatically.

## Rival status effects

Rivals do more than strike and guard. **Rending Slash** (Scarred Bandit) opens a bleed that ignores guard for two turns; the **Venom Adept** poisons over three turns and siphons your Flow; the **Iron Pugilist's** pommel smash stuns you and steals a whole turn; the **Ashen Priest** mends its wounds and washes away your poisons; twin strikes land two blows you can blunt separately. Status chips show under each health bar, healing tea is the cleanse, and two curios weaponize it back at the rival: the Venom Vial poisons through techniques, the Rending Fang opens bleeds on every fourth strike.

## RPG progression

Campaign walks a **branching pass map**: after the opening vanguard, each row forks between an archer ambush, an **elite** gate guard (hardened rivals that drop a **curio**), a wayside event with a risk/reward choice, a roadside rest, or a straight duel, before the Warden closes the act. Curios are run-scoped relics (heal-on-guard, strike cadences, cheaper techniques, next-intent sight…) drafted from elite victories and event boxes; they show as glyph chips beside your renown. Quick play stays linear across all five encounters with no map or curios. Act I includes arrival dialogue, three map rows, disciplines after every fight, a two-stance Warden duel, resolution and the tea house. Spend Renown there on health, starting Flow and weapon power. Cultivation applies on your next new campaign run.

Continue restores the saved encounter boundary or story/upgrade/tea-house scene, not a mid-turn snapshot. Existing arena saves carry over to the equivalent card encounter. Progress and settings stay in this browser. Quick play offers all nine heroes without changing campaign currency or unlocks. Lü Bu remains locked in the campaign until the planned Act III; Guan Yu, Wu Song, Mu Guiying, Liang Hongyu and Nie Yinniang appear only in Quick Play, with full-body key art and transparent gameplay sprites. Campaign starts with Zhao Yun, Lu Zhishen and Hu Sanniang. Existing records and currency are preserved; checkpoints for Quick Play-only heroes are removed. Acts II–IV are in development.

## Architecture and validation

See [character image requirements](docs/character-image-requirements.md) before adding another hero, [architecture](docs/architecture.md) for module contracts and [the art gallery](gallery.html) for all game artwork and modeling references. The browser root uses `ground.js`, `roam.js`, `card-combat.js`, `roam-view.js`, `duel-view.js` and the cancellable `duel-cinematic.js` timeline; roaming reuses the fixed-step clock for identical 30/120 FPS simulation. The older canvas renderer and real-time combat remain as reference modules.

Run `npm test` and `npm run check`. Tests cover card rules, roaming determinism and contact hand-off, all nine heroes, campaign completion, save recovery, rewards, purchases, scene/modal regressions, and the retained legacy combat/audio contracts. Browser checks cover actual dialogue, roaming, duels, upgrades, pause/resume and saved tea-house progression.

This is a playable Act I prototype. Movement covers the single duel-selection pass, not open-world exploration; there is no equipment inventory, later acts, 3D characters or Godot project yet. Existing artwork still needs a canon-alignment pass, notably Zhao Yun's sword.

## Language and hero selection

Japanese is the default for new and existing profiles without a language preference. The header language selector switches immediately between Japanese and English and saves the choice. Menus, biographies, story dialogue, combat controls, journals and gallery labels share `src/locales/`; new user-facing content should include a Japanese entry and a localization test. Hero biographies contain roughly 30 English words and an equivalent Japanese description, shown on the selected card and beside the start button.

The motion preference initially follows the operating system, then respects the saved in-game toggle. Enable Motion to see full strike sequences; reduced motion keeps the same turn and damage rules with a short static presentation.
