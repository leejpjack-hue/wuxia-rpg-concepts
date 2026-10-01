# Card duel cinematic — action imagery

Proof pack for wiring existing expansion/sheet art into the card-mode strike film.

**Base tip:** `4dc3dd95` (`origin/main`)  
**Branch:** `feat/card-duel-cinematic`

## What shipped

| Beat | Asset wiring |
|------|----------------|
| Strike | Existing `*-sheet.png` attack frames (unchanged path) |
| Signature (key 5) | `sig-{archetype}` motif on focus/strike via `.film-action-art`; special cut |
| Enemy special counter | `special-{kind}` motif on reply/counter when `intent === 'special'` |
| Assist flash | Follower sprite + `oath-{id}` emblem; short film before `assistStrike` |

No new art generated — all files from the expansion batch / sheets already on `main`.

Also: `preview()` now includes `signature` so the UI film path can play before `act("signature", { silent: true })`.

## Ordered capscreens

| # | File | Beat |
|---|------|------|
| 1 | `01-signature-focus.png` | Scale Guard focus with `sig-counter` emblem |
| 2 | `02-attack-strike.png` | Attack strike film (Zhao vs Guard) |
| 3 | `03-special-counter.png` | Counter-special with `special-guard` telegraph |
| 4 | `04-assist-flash.png` | Assist flash — Guan Yu + Changshan Vow oath |

Harness: `harness.html?beat=…` (local proof only).

## Verify

```bash
cd prototype/jade-gate
npm test
npm run check
```
