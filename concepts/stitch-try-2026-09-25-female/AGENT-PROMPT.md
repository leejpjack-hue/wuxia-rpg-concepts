# TRY-RUN B — Wuxia Stitch FEMALE cast (Jack ~20:50 HKT 2026-09-25)

ONE JOB: Generate exactly 3 Stitch concept arts via **Stitch MCP tools only**. No engine/coding. No git. No npm.

## Prompt source (mandatory)
Use the **copy-ready plate prompt** blocks from the Codex fine-tune grammar (same structure as `characters/hu-sanniang/stitch-v4/PROMPT.md`):
- `/workspace/hr/locks/antigravity-try-stitch-2026-09-25-female/mu-guiying/PROMPT.md`
- `/workspace/hr/locks/antigravity-try-stitch-2026-09-25-female/liang-hongyu/PROMPT.md`
- `/workspace/hr/locks/antigravity-try-stitch-2026-09-25-female/nie-yinniang/PROMPT.md`

For each screen, paste the copy-ready prompt with `[FRONT / LEFT SIDE / TRUE BACK / HERO]` replaced by **HERO** for a single Stitch sheet that still asks for silhouette + front/side/back orthos + material callouts + small hero pose + cast height bar (same sheet grammar as craft-note). Keep the Negative prompt intact.

Audience: interest **20–30 year old men**. PD classics only. ~20yo. Exactly ONE primary focus. DO NOT remake Hu Sanniang / Zhao Yun / Lu Zhishen / Lü Bu / tonight’s Guan Yu / Wu Song.

## Steps
1. create_project title: `Wuxia TRY 2026-09-25 Mu-Liang-Nie female`
2. generate_screen_from_text ×3 using the three copy-ready prompts (HERO sheet variant). Poll get_screen; no coding fallback if Stitch stalls — report CoS.
3. Report project id + screen ids + titles.
4. Capscreens → `/workspace/hr/locks/antigravity-try-stitch-2026-09-25-female/capscreens/`
5. Stop session. Hand PO. No Mon male duplicate.

### Screen 1 — Mu Guiying — primary 梨花枪
### Screen 2 — Liang Hongyu — primary 双刀 (drum quiet)
### Screen 3 — Nie Yinniang — primary 短剑

## Done when
3 screens exist; projectId + screen ids listed; capscreens saved; session stopped.
