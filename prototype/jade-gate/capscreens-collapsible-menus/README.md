# Collapsible game menus — 2026-10-03

The settings/navigation disclosure and exploration controls/map disclosure both start closed. Their Japanese and English summary labels localize with the app. Mouse clicks and native Enter/Space keyboard activation expand them; gameplay movement keys remain available while a summary has focus. The header panel overlays the page content and stays behind pause dialogs.

## Verification

- `npm test`: 272 passed, zero failed. See `tests.txt`.
- `npm run check`: all JavaScript modules, 111 PNG images, both assets for all 16 heroes and three action sheets passed. See `check.txt`.
- `git diff --check`: passed.
- Local browser at `http://127.0.0.1:8766/`: both `details.open` states were false in a fresh exploration view. Verified the header panel with click, collapse with Space, and both panels with Space/Enter; pause overlay appeared above the open header menu. The exploration panel expanded to show the D-pad, party health, route map and action buttons.
- At 390px width, the Japanese and English header labels, language picker, links and toggles fit within the viewport. The viewport was reset after review.
- Browser console: no errors.

The review used the shipped game page and native disclosure controls. Local gameplay frames were captured inline during the task; the test and asset-check output is attached here for repository review.
