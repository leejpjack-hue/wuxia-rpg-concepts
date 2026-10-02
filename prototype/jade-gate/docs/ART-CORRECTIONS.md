# Character and maze art corrections — 2026-10-02

## Delivered

- Fixed the card pose renderer: `[col,row]` data is converted to `{col,row}` before CSS cropping. Invalid coordinates are rejected instead of producing `NaN%` positions.
- Zhao Yun's 1254×1254 source duel atlas has overlapping lower figures. Reviewed `poseRects` isolate the two complete upper figures; focus reuses wind-up and special reuses strike with existing technique choreography. Native proportions and the original PNG are preserved. The user accepted these card attacks and deferred replacing their artwork.
- Imported the user's four separate 1254×1254 transparent Zhao Yun walking PNGs unchanged. The reviewed `zhao-yun-walk` manifest record lists `frameFiles` in supplied order, loops at 8fps, and displays each complete PNG without atlas cropping. Movement of either the lead or a follower uses the sequence; stopping restores the original standing sprite. The damaged legacy Zhao Yun 4×3 action sheet remains disabled.
- Imported the user's transparent `granite-pine-blocker.png` unchanged. Stages III and IV render the complete rock-and-pine silhouette instead of cropping the mountain ground plate. Stage IV retains its darker lighting. Stages I and II retain bamboo props, with cool moonlit lighting in Stage II. Collision and maze routes are unchanged.
- All four walking frames and the granite prop preload with the game assets.

## Supplied files

| Source basename | Game asset |
|---|---|
| `ChatGPT Image 2 Oct 2026, 22_38_24-1.png` | `assets/zhao-yun-walk.png` |
| `ChatGPT Image 2 Oct 2026, 22_38_34-2.png` | `assets/zhao-yun-walk-02.png` |
| `ChatGPT Image 2 Oct 2026, 22_38_39-3.png` | `assets/zhao-yun-walk-03.png` |
| `ChatGPT Image 2 Oct 2026, 22_38_43-4.png` | `assets/zhao-yun-walk-04.png` |
| `ChatGPT Image 2 Oct 2026, 22_27_42.png` | `assets/granite-pine-blocker.png` |

## Generation status

Earlier built-in requests for replacement walk, duel, and rock artwork failed with network errors. No API/CLI fallback was used. Walking and rock assets are now supplied by the user and integrated. Replacement duel art remains deferred at the user's request; the accepted card correction remains in use.

## Future walking assets

Register a reviewed `<hero-id>-walk` record with `runtimeApproved:true`, a square RGBA contract, and `anims.walk` containing four coordinates in reading order `[[0,0],[1,0],[0,1],[1,1]]` at 8fps. Supply either one cell-safe 2×2 atlas, or `frameFiles` listing four separate full-frame PNG paths. Separate frames must share canvas dimensions, consistent scale, feet baseline, facing, costume, and weapon grip. Every complete person and weapon must be visible without crossing an atlas cell boundary. Register and preload each separate PNG as its own reviewed `role:"walk-frame"` asset. Do not enable an unreviewed or overlapping sheet.

## Local proof

`capscreens-art-corrections/preview.html` uses the actual exploration renderer for stage palettes, walking, standing, and individual-frame inspection. `capscreens-duel-action-poses/preview.html` exercises the existing card cut callbacks. Verification logs and the review record are in `capscreens-art-corrections/`.
