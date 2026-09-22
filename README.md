# Wuxia RPG concepts

Concept-art archive for a **combat-first wuxia RPG** (romance later). Public-domain cast only.

**Owner:** Jack Lee JP · **Archived:** 2026-09-22 HKT  
**Status:** Exploration DRAFT — mix packs when development starts. Not an engine / not shipped.

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
