# WU-PARTY-09I — Assist strike once per duel

Proof pack for FREEZE from #74 / #76: one free Assist under rival intent, after lead deals outgoing damage, once per duel. No Flow cost, no follower duel HP, no tag-in. HUD chips stay between-encounter `swapLead` only (PLAY-01).

**Damage constant:** `ASSIST_DAMAGE = 8` (modest vs hero strikes ~19–40).

## Ordered capscreens

| # | File | Beat |
|---|------|------|
| 1 | `01-assist-btn-under-intent.png` | Assist enabled under rival intent after lead strike |
| 2 | `02-assist-damage-notice.png` | After Assist: rival HP −8 + notice naming Hu Sanniang |
| 3 | `03-assist-btn-disabled-after-use.png` | Assist button disabled / “Assist used” |

## Verify

```bash
cd prototype/jade-gate
npm test
npm run check
```
