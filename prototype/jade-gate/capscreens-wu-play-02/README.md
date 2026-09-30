# WU-PLAY-02 — Quick Play demo loop capscreens + smoke

Proof pack for the intentional Quick Play demo loop end-to-end.
**No new gameplay systems** — evidence only that pick 3 → bamboo roam → duel → swap → next rival is demo-ready.

Base tip: `b1d989b77aac7c6006367eec715eaf9bd2f48fe8` (WU-PLAY-01 merged). Soft UX (swap cue, demo beat copy) already on tip — captured here, not re-implemented.

## Ordered capscreens

| # | File | Beat |
|---|------|------|
| 1 | `01-qp-select-3-lead-badge.png` | QP select exactly 3 with **Lead** badge (+ Follower 1/2 chips) |
| 2 | `02-bamboo-roam-party-hud.png` | Bamboo roam with party HUD (3 HP chips) + follower sprites |
| 3 | `03-duel-lead-1v1.png` | Contact → duel lead 1v1 (Zhao Yun vs Ashen Swordsman) |
| 4 | `04-post-duel-swap-cue.png` | Post-duel swap cue pulse + toast “Tap a follower chip…” |
| 5 | `05-new-lead-next-rival.png` | New lead (Hu Sanniang) on pass approaching remaining rival |

## Smoke checklist (local repro)

Serve the prototype, then walk the five beats by hand (or re-run the headless capture).

```bash
cd prototype/jade-gate
python3 serve.py   # http://127.0.0.1:8765
```

1. **QP select 3 + lead badge**
   - Choose **Quick play** → pick Zhao Yun, Hu Sanniang, Lu Zhishen (exactly 3).
   - Confirm first pick shows **Lead** chip; others **Follower N**; journey summary shows demo beat `Pick 3 → roam bamboo → duel → tap follower chip to swap → next rival · 3/3`.
2. **Bamboo roam + party HUD**
   - **Begin journey**. Roam canvas shows lead + 2 followers; `#roam-health` has 3 `.party-hp-chip` (lead class on first).
3. **Contact → duel 1v1**
   - Walk into a swordsman (or begin duel). Duel UI shows lead vs one rival, `DUEL 1 / 2`, your turn.
4. **Post-duel swap cue**
   - Win the duel. Back on the pass with rivals left: follower chips pulse `swap-cue`; toast invites chip tap.
5. **New lead → next rival**
   - Tap a follower chip. Lead HUD / toast updates; walk toward remaining rival (spawn markers / rival sprite ahead). Mid-duel swap remains blocked.

### Headless capture (optional)

```bash
# with serve.py already on :8765
node /path/to/cap-wu-play-02.mjs   # playwright-core + chromium headless
```

Uses `window.__jadeSession` (PLAY-01) for reliable duel begin/win; product code unchanged for this story.

## Verify

```bash
cd prototype/jade-gate
npm test
npm run check
```

Act unlocks untouched. Out of scope: assist/tag-in, new art, maze third pocket (CAM-10), duel card redesign.
