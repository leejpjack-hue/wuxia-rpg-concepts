# Art review and regeneration instructions — 3 October 2026

Reviewed local `main` at **3ff8521**, Act V — the Rift and the Hall of Twenty. Scope: all 20 new hidden characters, Qin Liangyu / Gu Dasao / Bao Sanniang's updated looks, and the current stage materials. This delivery contains an audit, comparison sheets and prompts. Game code and runtime images were not changed; generation was not attempted.

> Follow-up: Zhao Min's user-generated full-body ready sprite and raised-knee wind-up are integrated. Ready art also supplies special focus; cinematic stills use transparent art and close-ups keep her face visible. Only STRIKE and SPECIAL contact images remain pending. The original audit and before-images below are retained.

## Priority order

1. **Regenerate 14 incomplete duel sets** in the table below. Shipped cutouts lack complete legs/feet; changing crop bounds cannot restore anatomy absent from the PNG. Start with Act V boss **Zhao Min**, then Jia Yucun and Bao Zheng. Generate four separate full-body transparent poses per character.
2. **Recover alpha on three sheets**: Qin Liangyu, Gu Dasao and Bao Sanniang. Complete bodies and weapons exist, but their black backgrounds are actual RGB pixels. Clean Qin's neighbouring-cell cloth fragment too. Use the included regeneration prompts only if careful matting cannot recover them.
3. **Create two missing Act V backgrounds**, `otherworld-ground.png` and `otherworld.png`. These are planned assets, not corrupted files; the code explicitly reuses the red Meridian Citadel painting.
4. **Fix cinematic still-image selection during integration.** All 20 hidden characters now have transparent sprites, but `stillSrc()` prefers `keyArt`; `cast()` still contains an obsolete “no sprites” comment. The rival displays an opaque landscape studio portrait before its reply pose. This is a renderer/data-selection problem. Do not regenerate approved portraits to solve it.

The 20 keys are 1280×720 JPEGs. Their duel PNGs are 1024×1024 RGBA, but alpha format does not prove complete anatomy. The manifest records matting from 1280×720 JPEG sheets and resampling. Original JPEG duel sheets are not present in this checkout, so the exact point where limbs were lost cannot be established. The shipped PNGs visibly lack them either way. Avoid stretching a landscape sheet into a square; fit each pose proportionally inside its own square cell.

## Character decisions and prompts

Each prompt file contains five complete copy-and-paste requests: optional idle, wind-up, normal strike, special focus, special strike. Attach the named approved key to each request. The six KEEP sets are usable starting points, not final animation approvals.

| Character | Decision | Findings | Prompts |
|---|---|---|---|
| 贾政 Jia Zheng | Keep; optional polish | Full body survives; white fan normal stroke is present. Special drops the visible fan and costume has more embroidery than the key. Optional continuity polish only. | [jia-zheng](prompts/jia-zheng.txt) |
| 贾雨村 Jia Yucun | **Regenerate four poses** | All four duel crops end at the torso; roam sprite has no legs. Special darkens/changes the shirt. | [jia-yucun](prompts/jia-yucun.txt) |
| 包拯 Bao Zheng | **Regenerate four poses** | All four poses lack complete lower bodies; alpha matte fades through dark clothing. Face looks younger than the moustached key. | [bao-zheng](prompts/bao-zheng.txt) |
| 狄仁杰 Di Renjie | **Regenerate four poses** | Every action crop is upper body; the round token disappears in strike/special. | [di-renjie](prompts/di-renjie.txt) |
| 况钟 Kuang Zhong | **Regenerate four poses** | Wind-up/strike cut at the hips; focus lacks feet; coin-chain identity differs from old court-tablet metadata. | [kuang-zhong](prompts/kuang-zhong.txt) |
| 范进 Fan Jin | **Regenerate four poses** | Lower body is absent; sleeves/clothing partially disappear into the matte. | [fan-jin](prompts/fan-jin.txt) |
| 鲁肃 Lu Su | **Regenerate four poses** | All poses lack complete legs; bamboo baton conflicts with the long-spear description. | [lu-su](prompts/lu-su.txt) |
| 荀彧 Xun Yu | **Regenerate four poses** | All four action crops end at waist/hips. Game says fan but pictures are unarmed. | [xun-yu](prompts/xun-yu.txt) |
| 宋江 Song Jiang | **Regenerate four poses** | All four poses are torso crops; a sabre is described in the game but absent in this art. | [song-jiang](prompts/song-jiang.txt) |
| 吴用 Wu Yong | Keep; optional polish | Complete long-robed silhouette survives. Baked dark circular strokes reduce clarity; optional clean export and stronger normal/special distinction. | [wu-yong](prompts/wu-yong.txt) |
| 贾元春 Jia Yuanchun | Keep; optional polish | Full bodies survive. Special is mainly the normal palm with a baked chain effect; no palace fan in the art. Optional choreography polish. | [jia-yuanchun](prompts/jia-yuanchun.txt) |
| 薛宝钗 Xue Baochai | Keep; optional polish | Full body readable. Special repeats the normal kick; optional stronger special pose. No court tablet in the pictures. | [xue-baochai](prompts/xue-baochai.txt) |
| 林黛玉 Lin Daiyu | **Regenerate four poses** | Wind-up/strike lack legs; focus/special lack feet. Folded fan changes to a book across poses. | [lin-daiyu](prompts/lin-daiyu.txt) |
| 王熙凤 Wang Xifeng | **Regenerate four poses** | Kick poses truncate supporting leg; focus is full body and can supply a temporary idle sprite. | [wang-xifeng](prompts/wang-xifeng.txt) |
| 貂蝉 Diaochan | Keep; optional polish | Full body survives. Baked smoky rings partly dominate the special; optional clean silhouette/VFX separation. | [diaochan](prompts/diaochan.txt) |
| 杨玉环 Yang Yuhuan | Keep; optional polish | Complete poses; special almost duplicates strike. Optional choreography improvement, not urgent repair. | [yang-yuhuan](prompts/yang-yuhuan.txt) |
| 甄嬛 Zhen Huan | **Regenerate four poses** | All poses truncate lower legs. Key has pale outfit; duel is darker green with substantially different styling. | [zhen-huan](prompts/zhen-huan.txt) |
| 宜修 Empress Yixiu | **Regenerate four poses** | Wind-up/strike truncate legs; focus/special are fuller. Special introduces a long gold pin/sword. Full focus can supply temporary idle. | [empress-yixiu](prompts/empress-yixiu.txt) |
| 华妃 Hua Fei | **Regenerate four poses** | All action poses truncate lower legs; no paired sabers as described in code. | [hua-fei](prompts/hua-fei.txt) |
| 赵敏 Zhao Min | **Regenerate four poses** | Wind-up/strike/special truncate supporting leg; focus is complete. Special repeats normal kick; twin jian absent. | [zhao-min](prompts/zhao-min.txt) |
| 秦良玉 Qin Liangyu | **Recover alpha first** | Duel atlas is RGB with solid black background. Neighbouring-cell red cloth fragments are visible; roam sprite retains a stray fragment. Recover alpha/clean per-cell first. | [qin-liangyu](prompts/qin-liangyu.txt) |
| 顧大嫂 Gu Dasao | **Recover alpha first** | Duel atlas is RGB with a solid black background; bodies and cleavers are present. Recover transparency before paying for regeneration. | [gu-dasao](prompts/gu-dasao.txt) |
| 鮑三娘 Bao Sanniang | **Recover alpha first** | Duel atlas is RGB with a solid black background; full bodies and spear remain. Recover alpha; special resembles normal thrust. | [bao-sanniang](prompts/bao-sanniang.txt) |

The 14 incomplete roam sprites repeat their cropped wind-up poses. Do not pay for two separate repairs because both filenames are bad: a regenerated complete wind-up can supply a provisional sprite. A separate calm idle is better for exploration. Alternatively, recut the complete approved key; Wang Xifeng, Empress Yixiu and Zhao Min also have complete focus poses usable as temporary idles. Recutting preserves identity without generation but cannot invent new fine detail beyond the source resolution.

**Keep all 23 approved keys.** Keep the accepted Zhao Yun card correction and user-supplied walking frames. No urgent replacement is justified by the inspected Stage I–III plates, bamboo/granite props or Stage IV Sentinel/Acolyte/Sovereign sprites.

## Visual comparisons

Columns are **key → current roam sprite → wind-up → normal strike → special focus → special strike**. Review sheets use actual manifest `poseRects`, not a guessed equal grid. Checkerboard is added only to these inspection images; source PNGs are unchanged.

- [Sheet 1: Jia Zheng / Jia Yucun / Bao Zheng / Di Renjie](characters-01.jpg)
- [Sheet 2: Kuang Zhong / Fan Jin / Lu Su / Xun Yu](characters-02.jpg)
- [Sheet 3: Song Jiang / Wu Yong / Jia Yuanchun / Xue Baochai](characters-03.jpg)
- [Sheet 4: Lin Daiyu / Wang Xifeng / Diaochan / Yang Yuhuan](characters-04.jpg)
- [Sheet 5: Zhen Huan / Empress Yixiu / Hua Fei / Zhao Min](characters-05.jpg)
- [Sheet 6: updated Qin Liangyu / Gu Dasao / Bao Sanniang](characters-06.jpg)
- [Stage plates and blocker props](scenes.jpg)

## Weapon descriptions disagree with the new pictures

Prompts preserve the approved new visual direction. Several older weapon labels and manifest descriptions specify different equipment or costumes. If the game-design weapon is intended instead, replace the equipment and all four choreography instructions consistently while preserving the approved face/outfit. Do not mix an unarmed set with one unrelated sword pose. This report does not silently change the game design.

| Character | `heroes.js` weapon | Current visible action art |
|---|---|---|
| Jia Zheng | Court tablet | Folding fan |
| Jia Yucun | Court tablet | Bamboo baton |
| Bao Zheng | Judge's blade | Straight sword — broadly aligned |
| Di Renjie | Scholar's fan | Round golden token |
| Kuang Zhong | Court tablet | Brass coin chain |
| Fan Jin | Scholar's fan | Scroll |
| Lu Su | Long spear | Short bamboo baton |
| Xun Yu | Scholar's fan | Unarmed palms |
| Song Jiang | Chinese sabre | Unarmed punches |
| Wu Yong | Scholar's fan | Folding fan — broadly aligned |
| Jia Yuanchun | Palace fan | Unarmed palms |
| Xue Baochai | Court tablet | Unarmed kicks |
| Lin Daiyu | Soft sword | Folded fan / book |
| Wang Xifeng | Paired sabers | Unarmed kicks |
| Diaochan | Concealed short sword | Ribbons/palms; no visible blade |
| Yang Yuhuan | Palace fan | Unarmed punches |
| Zhen Huan | Soft sword | Unarmed palms |
| Empress Yixiu | Palace fan | Palms / slim golden weapon |
| Hua Fei | Paired sabers | Unarmed punches |
| Zhao Min | Twin jian | Unarmed kicks |

## Stage materials to generate

Current code has **five acts**. Act IV's Citadel images exist. Act V's street, examination hall, lattice round and causeway are story beats within one act, not four additional acts. See `../ASSET-REQUIREMENTS.md` §10.

| Priority | Filename / prompt | Purpose and required integration |
|---|---|---|
| **Required new** | [otherworld-ground.png](prompts/otherworld-ground.txt) | Act V repeatable exploration street. Register `otherworld-ground`; set `ROAM_SCENES.otherworld.art`; review camera crop, paving scale and repetition. |
| **Required new** | [otherworld.png](prompts/otherworld.txt) | Act V card-duel hall backdrop. Register `otherworld`; change Act V `arena` from `meridian-citadel` to `otherworld`. |
| Recommended companion | [otherworld-blocker.png](prompts/otherworld-blocker.txt) | Pale lattice/rubble whole prop; the current granite/pine prop looks unrelated to the hall. Register and wire scene `blocker`; reset/review old hue filter. |
| Recommended Act IV polish | [meridian-citadel-ground.png](prompts/meridian-citadel-ground.txt) | Flat repeatable marble floor avoids repeating perspective courtyard/stairs. Retain existing `meridian-citadel.png` for duels; register and wire new roam art. |
| Recommended Act IV polish | [meridian-citadel-blocker.png](prompts/meridian-citadel-blocker.txt) | Broken marble/red-lacquer palace prop instead of mountain pine rubble. Register and wire `blocker`. |
| Optional story reveal | [hall-of-twenty-key.png](prompts/hall-of-twenty-key.txt) | Twenty-desk establishing shot. Needs a dialogue backdrop slot before it displays. |
| Optional finale | [cloud-causeway-key.png](prompts/cloud-causeway-key.txt) | Bridge-home establishing shot. Needs a finale/dialogue backdrop slot before it displays. |

Do not generate `maze-wall-otherworld.png` first. That optional requirement describes an **opaque tileable texture**; the current maze renderer draws a **whole transparent prop** per collision tile. An opaque wall texture needs a separate rendering path. Renaming it to the prop filename would create square blocks.

## How to generate the character images

1. Open the relevant prompt file. Attach its named approved key from `assets/`. The existing duel atlas can be a second motion/equipment reference, but must not dictate missing limbs or a black backdrop. The key controls face, age, costume and proportions.
2. Generate **one image per request**, not a montage. For a better exploration sprite use the optional IDLE request. Keep both feet planted and weapon compact. Preserve the adult short skirts / cropped Chinese-style tops where already present in the approved reference; do not replace the look with unrelated dynasty regalia.
3. Generate WINDUP, STRIKE, FOCUS and SPECIAL separately using the full prompts. Attach the same key every time. After approving wind-up, also attach it for consistency. Special must change arms, torso, knees and weapon stance; adding glow to the normal pose is not enough.
4. Request a native **1024×1024 or larger square PNG**, with true transparent alpha and consistent size across all images. Keep larger native squares if supplied. Download originals, not screenshot previews or JPEG conversions; upscaling a small crop does not restore detail.
5. Raw delivery names: `<id>-duel-windup.png`, `<id>-duel-strike.png`, `<id>-duel-focus.png`, `<id>-duel-special.png`. Optional idle: `<id>-sprite.png`. Raw duel names are delivery files, **not registered runtime filenames**.
6. Four separate images are safer. For a direct atlas, request **2048×2048, exactly 2×2 equal square cells**, TL wind-up / TR strike / BL focus / BR special. Every cell must keep full figure/weapon inside its own padding. Reject uneven grids and cross-cell overlaps.

**Acceptance checklist:** same face/hair/clothing/equipment; complete head, hands, both legs, shoes and weapon; 8–10% clear edge margin; consistent body scale/foot baseline; readable at ~140px height; no detached cloth island, neighbouring person, signature, red seal, logo or baked smoke disc; distinct normal/special poses. Verify transparency on light and dark backgrounds: a painted checkerboard is not alpha.

Generate right-facing art only. The game mirrors it for the rival; no separate left-facing set is required.

## Integration instructions after you return the images

- Preserve original approved keys. To fix cinematic rectangles, use reviewed transparent sprites for actors while keeping opaque keys in selection/gallery.
- Pack four 1024-square pose images on a **2048-square RGBA canvas** at `(0,0)`, `(1024,0)`, `(0,1024)`, `(1024,1024)`. Keep common native canvases, body scale and baseline. Do not independently stretch tight crop boxes to fill cells. Larger native squares can pack into the corresponding doubled-size atlas.
- Final runtime path: `assets/<id>-duel-poses.png`. Update the existing manifest row, actual `atlasSize`, standard `duelPoses` and alpha/square contract. **Remove/review old `poseRects`**; they describe old pixels and cannot be reused on a replacement. Clean equal-cell atlases do not need them.
- Review/register any new idle. For Qin, remove the neighbouring red-cloth island from wind-up and its derived sprite without erasing her actual cape. For the three RGB sheets, matte each cell carefully and inspect dark fabric/white spear/cleaver edges. Never make every black pixel transparent; this erases clothing and hair.
- Fix cinematic `stillSrc()`/`cast()` to choose transparent sprites for hidden actors. Review intro, prepare, guard/tea, hero attack, rival reply/special and reduced motion. Generation cannot fix selecting the wrong file.
- New scenes need both manifest registration and scene wiring. Copying a PNG alone will not display it. Review `tileWidth`, `artHeight`, `topCrop`, repeated seams, props and navigable ground in real gameplay. Story keys need the backdrop support noted above.
- Keep detached sparks, smoke rings and glows in game VFX layers wherever possible.
- Run `npm test` and `npm run check` in `prototype/jade-gate`; inspect all four poses on both sides in `capscreens-duel-action-poses/preview.html`, explore at normal scale, and capture evidence before a PR.

## Recorded checks and limits

- Visually inspected seven comparison sheets: 23 keys, 23 sprites, 92 actual runtime pose crops and main stage materials. Also inspected whole Jia Yucun, Zhao Min and Qin Liangyu atlases.
- Actual cinematic preview confirms Zhao Min's cut-off supporting leg, Qin's RGB black rectangle, and the hidden rival studio-portrait rectangle before reply.
- `npm test`: **283 passed, 0 failed**. [Output](test-output.txt).
- `npm run check`: passed; reports **171 images**. [Output](check-output.txt). It explicitly exempts the three RGB sheets and checks PNG colour type rather than actual transparent pixels. Green checks cannot substitute for visual acceptance.
- [Structured decisions](inventory.json), [crop/bounds measurements](pose-metrics.json). Edge-contact numbers are triage only, not automatic regeneration decisions.
- No code fixes or replacement image generation were performed in this audit.
