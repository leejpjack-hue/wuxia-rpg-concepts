# Jade Gate Trailer Remake Verification

This directory contains verification evidence for the remake of the 10-second trailer (`trailer.html`, `trailer.js`, `src/content/trailer.js`).

## What Changed in the Remake

1. **Header & Brand Alignment**:
   - Replaced plain text header with the canonical game seal and brand lockup (`.brand`, `.seal`, `.brand-text`), matching `index.html`.
   - Localized brand subtitle (`四人の刃 · 武侠カードRPG` / `BLADES OF THE FOUR · A WUXIA CARD RPG`).

2. **Clean 60fps Playback & Compositing**:
   - Added GPU promotion (`will-change: transform`) and isolated compositing layers for smooth 60fps animations.
   - Cleaned up subtitle and kicker transitions.

3. **Bilingual Duel Cards & Impact Effects**:
   - Exported `TRAILER_CARD_LABELS` in `src/content/trailer.js` with structured hero names, skill names, and impact typography.
   - Localized Zhao Yun and Lü Bu's cards during duel cuts, with proper names and skill lines in both Japanese and English.
   - Localized the special attack impact banner (`蒼龍破` / `AZURE DRAGON BREAKER`).
   - Aligned Lu Zhishen's English title to canonical "THE FLOWER MONK".

4. **Title Lockup & Typography Fix**:
   - Fixed English title screen duplication bug where `BLADES OF THE FOUR` was rendered as both kicker and title. It now properly displays `A WUXIA CARD RPG` kicker above `BLADES OF THE FOUR` title and `YOUR JOURNEY STARTS NOW.` tagline.

5. **Direct Screen Click & Replay Controls**:
   - The entire `#screen` area is interactive: clicking toggles play/pause, or replays when ended.
   - Re-displays `#cover` with `↻` Replay prompt upon completion so users don't have to hunt for small transport buttons.
   - Added keyboard shortcuts: `Space` / `KeyK` (play/pause), `KeyM` (mute), `KeyR` (replay).

6. **Preserved Assets & Content Integrity**:
   - Zero added, modified, or removed asset/image files. Used exclusively existing assets.
   - Retained canonical cast (Zhao Yun, Guan Yu, Hu Sanniang, Qin Liangyu, Lü Bu, Lu Zhishen) and 5 scenes within 10-second duration.

## Verification Evidence

- **npm test**: All 288 tests pass (100% green). See `tests.txt`.
- **npm run check**: All modules, 263 PNG/SVG assets, and 3 action sheets validated. See `check.txt`.
- **Browser Playback**: Tested automated and interactive playback to 10s end in both Japanese and English. Replay, pause/resume, mute toggling, and language selection verified.
- **Capscreens**:
  - `contact-sheet.png`: Visual overview of all key moments and states.
  - `poster-ja.png` / `poster-en.png`: Initial load state with brand seal and cover CTA.
  - `pass-ja.png` (Scene 1: Jade Gate Pass entrance).
  - `legends-ja.png` / `closeup-hu-ja.png` (Scene 2: Hero introductions and narration close-ups).
  - `duel-strike-ja.png` / `duel-special-ja.png` / `duel-special-en.png` (Scene 3: Duel action, clash, and special impact banner).
  - `journey-citadel-ja.png` (Scene 4: Jianghu journey panorama).
  - `title-ja.png` / `title-en.png` (Scene 5: Final title card lockup).
  - `ended-ja.png` / `ended-en.png`: Completion state showing replay prompt.
- **Interactive Review**:
  - `preview.html`: Review every shot, frame slider, language toggle, and reduced-motion mode.
