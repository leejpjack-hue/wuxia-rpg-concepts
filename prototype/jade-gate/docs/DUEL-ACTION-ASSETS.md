# Card-duel action artwork status

1 October 2026 (HKT). **Fifteen character duel-pose atlases generated** with Codex CLI `gpt-6.1-sol` @ high using the built-in `image_gen` tool. Lu Zhishen was skipped — he keeps existing approved sheet frames.

Each new PNG is a square RGBA 2×2 atlas (≥1024px, landed at 1254×1254) with wind-up / normal strike / special focus / special strike cells. Soft cell-padding / weapon-margin issues remain on several atlases (see capscreens contact sheet); identity, alpha and pose variety passed review for runtime use.

Lu Zhishen uses his existing approved sheet: wind-up `[0,2]`, normal strike `[1,2]`, special focus `[0,2]`, special impact `[2,2]`. The contact pose stays visible through impact. His walking animation is unchanged.

| Character ID | Planned PNG | Status | Explanation |
|---|---|---|---|
| `zhao-yun` | `assets/zhao-yun-duel-poses.png` | **generated** | Built-in image_gen · Codex gpt-6.1-sol high · 1254×1254 RGBA atlas landed. |
| `lu-zhishen` | `assets/lu-zhishen-duel-poses.png` | **existing-frames** | Approved Lu Zhishen attack cells reused; no new PNG (skipped this batch). |
| `hu-sanniang` | `assets/hu-sanniang-duel-poses.png` | **generated** | Built-in image_gen · Codex gpt-6.1-sol high · 1254×1254 RGBA atlas landed. |
| `lu-bu` | `assets/lu-bu-duel-poses.png` | **generated** | Built-in image_gen · Codex gpt-6.1-sol high · 1254×1254 RGBA atlas landed. |
| `guan-yu` | `assets/guan-yu-duel-poses.png` | **generated** | Built-in image_gen · Codex gpt-6.1-sol high · 1254×1254 RGBA atlas landed. |
| `wu-song` | `assets/wu-song-duel-poses.png` | **generated** | Built-in image_gen · Codex gpt-6.1-sol high · 1254×1254 RGBA atlas landed. |
| `mu-guiying` | `assets/mu-guiying-duel-poses.png` | **generated** | Built-in image_gen · Codex gpt-6.1-sol high · 1254×1254 RGBA atlas landed. |
| `liang-hongyu` | `assets/liang-hongyu-duel-poses.png` | **generated** | Built-in image_gen · Codex gpt-6.1-sol high · 1254×1254 RGBA atlas landed. |
| `nie-yinniang` | `assets/nie-yinniang-duel-poses.png` | **generated** | Built-in image_gen · Codex gpt-6.1-sol high · 1254×1254 RGBA atlas landed. |
| `sun-shangxiang` | `assets/sun-shangxiang-duel-poses.png` | **generated** | Built-in image_gen · Codex gpt-6.1-sol high · 1254×1254 RGBA atlas landed. |
| `gu-dasao` | `assets/gu-dasao-duel-poses.png` | **generated** | Built-in image_gen · Codex gpt-6.1-sol high · 1254×1254 RGBA atlas landed. |
| `qin-liangyu` | `assets/qin-liangyu-duel-poses.png` | **generated** | Built-in image_gen · Codex gpt-6.1-sol high · 1254×1254 RGBA atlas landed. |
| `bao-sanniang` | `assets/bao-sanniang-duel-poses.png` | **generated** | Built-in image_gen · Codex gpt-6.1-sol high · 1254×1254 RGBA atlas landed. |
| `dian-wei` | `assets/dian-wei-duel-poses.png` | **generated** | Built-in image_gen · Codex gpt-6.1-sol high · 1254×1254 RGBA atlas landed. |
| `yang-zhi` | `assets/yang-zhi-duel-poses.png` | **generated** | Built-in image_gen · Codex gpt-6.1-sol high · 1254×1254 RGBA atlas landed. |
| `venom-adept` | `assets/venom-adept-duel-poses.png` | **generated** | Built-in image_gen · Codex gpt-6.1-sol high · 1254×1254 RGBA atlas landed. |

## Image contract and retry instructions

Full prompts: `prompts/duel-action-poses.json`. All sixteen prompts preserve the approved character identity and define four distinct body/weapon poses. The 2×2 native square RGBA atlas has top-left wind-up, top-right normal strike, bottom-left special focus, bottom-right special strike. Keep full bodies and weapons inside every cell, equal scale and baseline, and true alpha in the margins. No grid, labels, scenery or particles. Do not crop or resize an atlas to conceal a bad layout.

After generation: visually inspect every cell and confirm PNG alpha and margins. Save the image into `assets/` and add a manifest row with `id: <hero-id>-duel-poses`, its `file`, exact `prompt`, `method`, `runtimeApproved: true`, `contract: {minWidth:1024,minHeight:1024,square:true,alpha:true}`, and `duelPoses: {windup:[0,0],strike:[1,0],focus:[0,1],special:[1,1]}`. The game preloads approved records and the card cinematic selects them automatically. Do not change the existing walking sheets or sprites.

Rivals resolve art identity from their `art` field; named heroes use their hero atlas. A differently costumed boss such as `lu-bu-rival-sprite` must have its own reviewed `lu-bu-rival-duel-poses` atlas; do not silently replace its costume with the player portrait. Generic rivals retain current sprites until their own atlases are authored.

Use `capscreens-duel-action-poses/preview.html` to inspect the real cinematic on either side, including frozen impact frames and narrow layouts. A character without approved art is labelled as pending. Run `npm test` and `npm run check` before handing off a completed art batch.
