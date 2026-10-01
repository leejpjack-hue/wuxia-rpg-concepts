# Card-duel action artwork status

1 October 2026. **No new images were generated in this pass.** Built-in image generation failed for Zhao Yun and Hu Sanniang. A smaller Guan Yu retry was cancelled when the user asked to mark failed images in the list. API/CLI fallback was not used.

Lu Zhishen uses his existing approved sheet: wind-up `[0,2]`, normal strike `[1,2]`, special focus `[0,2]`, special impact `[2,2]`. The contact pose stays visible through impact. His walking animation is unchanged. Zhao Yun and Hu Sanniang's old sheets remain disabled: the former crops limbs/weapons; the latter has baked checkerboard artifacts.

The other fifteen heroes still use their existing sprites until reviewed action artwork is supplied. Their camera, weapon trails and movement continue. Signatures now inherit each hero's technique choreography; Venom Adept has her own lunge. The runtime supports separate hero and rival poses, assist poses, reduced motion, and cancellation cleanup.

| Character ID | Planned PNG | Status | Explanation |
|---|---|---|---|
| `zhao-yun` | `assets/zhao-yun-duel-poses.png` | **failed** | Built-in image generation returned a network error. |
| `lu-zhishen` | `assets/lu-zhishen-duel-poses.png` | **existing-frames** | Approved Lu Zhishen attack cells are reused for card-only poses; no new PNG generated. |
| `hu-sanniang` | `assets/hu-sanniang-duel-poses.png` | **failed** | Built-in image generation returned a network error. |
| `lu-bu` | `assets/lu-bu-duel-poses.png` | **not-attempted** | Generation deferred at the user request. |
| `guan-yu` | `assets/guan-yu-duel-poses.png` | **cancelled** | Retry stopped after the user requested that failed images only be listed. |
| `wu-song` | `assets/wu-song-duel-poses.png` | **not-attempted** | Generation deferred at the user request. |
| `mu-guiying` | `assets/mu-guiying-duel-poses.png` | **not-attempted** | Generation deferred at the user request. |
| `liang-hongyu` | `assets/liang-hongyu-duel-poses.png` | **not-attempted** | Generation deferred at the user request. |
| `nie-yinniang` | `assets/nie-yinniang-duel-poses.png` | **not-attempted** | Generation deferred at the user request. |
| `sun-shangxiang` | `assets/sun-shangxiang-duel-poses.png` | **not-attempted** | Generation deferred at the user request. |
| `gu-dasao` | `assets/gu-dasao-duel-poses.png` | **not-attempted** | Generation deferred at the user request. |
| `qin-liangyu` | `assets/qin-liangyu-duel-poses.png` | **not-attempted** | Generation deferred at the user request. |
| `bao-sanniang` | `assets/bao-sanniang-duel-poses.png` | **not-attempted** | Generation deferred at the user request. |
| `dian-wei` | `assets/dian-wei-duel-poses.png` | **not-attempted** | Generation deferred at the user request. |
| `yang-zhi` | `assets/yang-zhi-duel-poses.png` | **not-attempted** | Generation deferred at the user request. |
| `venom-adept` | `assets/venom-adept-duel-poses.png` | **not-attempted** | Generation deferred at the user request. |

## Image contract and retry instructions

Full prompts: `prompts/duel-action-poses.json`. All sixteen prompts preserve the approved character identity and define four distinct body/weapon poses. The 2×2 native square RGBA atlas has top-left wind-up, top-right normal strike, bottom-left special focus, bottom-right special strike. Keep full bodies and weapons inside every cell, equal scale and baseline, and true alpha in the margins. No grid, labels, scenery or particles. Do not crop or resize an atlas to conceal a bad layout.

After generation: visually inspect every cell and confirm PNG alpha and margins. Save the image into `assets/` and add a manifest row with `id: <hero-id>-duel-poses`, its `file`, exact `prompt`, `method`, `runtimeApproved: true`, `contract: {minWidth:1024,minHeight:1024,square:true,alpha:true}`, and `duelPoses: {windup:[0,0],strike:[1,0],focus:[0,1],special:[1,1]}`. The game preloads approved records and the card cinematic selects them automatically. Do not change the existing walking sheets or sprites.

Rivals resolve art identity from their `art` field; named heroes use their hero atlas. A differently costumed boss such as `lu-bu-rival-sprite` must have its own reviewed `lu-bu-rival-duel-poses` atlas; do not silently replace its costume with the player portrait. Generic rivals retain current sprites until their own atlases are authored.

Use `capscreens-duel-action-poses/preview.html` to inspect the real cinematic on either side, including frozen impact frames and narrow layouts. A character without approved art is labelled as pending. Run `npm test` and `npm run check` before handing off a completed art batch.
