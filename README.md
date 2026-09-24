# Wuxia RPG concepts

Concept-art archive for a **combat-first wuxia RPG** (romance later). Public-domain cast only.

**Owner:** Jack Lee JP · **Archived:** 2026-09-22 HKT  
**Status:** Exploration DRAFT plus a playable browser combat prototype. Not shipped.

## Play Jade Gate — turn-based card RPG

The [Blades of the Four: Jade Gate](prototype/jade-gate/README.md) build now uses **one hero card versus one enemy card** with turn-based Strike, Guard, Technique and Healing tea actions. It includes Act I dialogue and checkpoints, a two-stance boss, tea-house cultivation, persistent audio settings, four-hero quick play, and 16 generated art assets. See the [implemented architecture](docs/GAME-ARCHITECTURE.md) for module contracts and remaining production work. It is a fresh 2D implementation based on the concept summary; its character/weapon interpretation is separate from the archived cast direction below.

```bash
python3 prototype/jade-gate/serve.py
```

Open **http://127.0.0.1:8765/** to play, or **http://127.0.0.1:8765/gallery.html** to browse the artwork. On macOS, double-click `prototype/jade-gate/Play.command`. The [development spec](prototype/jade-gate/docs/development-spec.md) and [complete image prompts](prototype/jade-gate/docs/image-prompts.md) are included. 3D meshes and rigs remain future work.

```bash
npm --prefix prototype/jade-gate test
npm --prefix prototype/jade-gate run check
```

## Game Story & Flow Specification

The complete 4-Act narrative bible, world lore, character arcs (Zhao Yun, Lu Zhishen, Hu Sanniang, Lü Bu), in-engine dialogue exchanges, and macro/micro progression loops live in [`docs/GAME-FLOW-AND-STORY-SPEC.md`](docs/GAME-FLOW-AND-STORY-SPEC.md).

## Procedural Rock Music & Sound Engine

A pure, zero-dependency procedural Web Audio API synthesizer (`prototype/jade-gate/audio.js`) drives an authentic, high-energy rock soundtrack:
- **Rock Instruments:** Distorted electric guitar power chords through tube-saturation overdrive curves and amp cabinet emulation, singing lead guitar riffs with expressive bends and vibrato, punchy rock bass guitar, and a complete rock drum kit (punchy acoustic kick, cracking rock snare, metallic hi-hats, and explosive crash cymbals).
- **Adaptive Interactive BGM:** Dynamic state machine shifts between heavy moody desert rock groove in Hero Select/Waystation (96 BPM), driving hard rock arena anthem during Vanguard Skirmishes (138 BPM), and high-octane speed metal / thrash duel for the Ashen Warden Boss (158 BPM double-kick barrage and screaming solos).
- **Tactile Combat SFX:** Combo-scaling pick-scrape blade whooshes, crunching steel impacts, power chord finishers, whammy dive dodges, and unique signature audio identities for all legends.
- **In-Game Controls:** Independent Sound FX and Music toggles in the header nav bar, persisting seamlessly across play sessions.

## Play the earlier prototype

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000/prototype/`. Choose a hero, move with **WASD**, attack with **J**, dodge with **K**, and spend full Flow with **L**. Touch controls are included for mobile landscape. The complete vertical-slice plan and recommended art-to-engine workflow live in [`docs/GAME-DEVELOPMENT-SPEC.md`](docs/GAME-DEVELOPMENT-SPEC.md).

## Cast

| Character | Role | Primary focus (locked) | Body (~20yo) |
|-----------|------|------------------------|--------------|
| Zhao Yun (赵云) | Swordsman | 青釭剑 / Qinggang Jian | Lean athletic |
| Lu Zhishen (鲁智深) | Staff fighter | 水磨禅杖 | Young warrior-monk mass |
| Hu Sanniang (扈三娘) | Femme fatale + combat | 日月双刀 (lasso secondary) | Agile combat beauty |
| Lü Bu (吕布) | Rival | 翎子 feathers (戟 readable) | Heavy young warlord |

## Packs stored

| Pack | Tool | What it is | Best for |
|------|------|------------|----------|
| `stitch-v2/` | Google Stitch | Key-art concept sheets (highest Jev scores) | Mood / marketing feel |
| `grok-v4/` | Grok GenerateImage | Production-style sheets (orthos + materials) | Sheet architecture reference |
| `stitch-v4/` | Google Stitch + composite | Full A–G production architecture | Turnaround / modeler handoff |

Jev snapshot (2026-09-22): Stitch v2 pass_as_done **0.67** · Grok v4 **0.43** · Stitch v4 **0.41**. Interest highest on Stitch v2 / Grok v4.

## Layout

```
characters/<id>/{stitch-v2,grok-v4,stitch-v4}/
  concept.jpg   # primary sheet
  PROMPT.md     # generation / composite prompt notes
characters/<id>/CHARACTER.md
docs/           # craft note, research, direction lock
```

## Mix later

When development starts, pick per character (or per zone) across packs — do not treat any single pack as sole SoT.
