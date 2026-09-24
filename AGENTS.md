# Wuxia RPG — agent control (Jack lock 24 Sep 2026)

This repo is operated under **pstack / poteto-mode rigor** (same bar as OpenCode Build) plus **capscreens before any PR**.

Account plugin `pstack` is installed for Jack. Sessions in Antigravity **must** inherit this file and `.cursor/rules/wuxia-pstack-capscreen.mdc`. Do not ship under a silent missing control.

## SoT

- Docs: `docs/GAME-ARCHITECTURE.md`, `docs/GAME-FLOW-AND-STORY-SPEC.md`, `docs/GAME-DEVELOPMENT-SPEC.md`
- Engine: `prototype/jade-gate/`
- Cap: 3 stories/day (weekday Antigravity Ops routine)
- PR handoff: Product Owner only — never open or hand a PR without capscreens

## Every code / build slice

1. **One job.** Unslopped. Verified. No inventing product goals outside SoT docs.
2. **Data shape first.** Name the structure before code.
3. **Prove it works.** Run the real check for this repo (`npm test` / platform tests under `prototype/jade-gate/`). Record pass/fail in the session. "It compiles" is not enough.
4. **Capscreens mandatory** before opening a PR or handing a link to Product Owner:
   - UI state after the change, or
   - repro fixed, or
   - local proof (test output / gameplay frame)
   - Attach paths or upload evidence with the PR handoff. Missing capscreens = do not open/hand the PR.
5. **Obvious malfunctions** after a change: reproduce, root-cause, fix, recapture, then PR. Do not hand off broken.

## Principles to apply (pstack leaf skills by name)

Prefer these over vibes: `principle-prove-it-works`, `principle-fix-root-causes`, `principle-sequence-verifiable-units`, `principle-test-behavior-not-implementation`, `principle-model-the-domain`, `principle-laziness-protocol`, `principle-subtract-before-you-add`, `unslop`.

When Antigravity cannot load Cursor pstack plugin skills, treat the names above as the checklist and follow this file literally.

## PR bar

- Branch from current `main`
- Small verifiable units (story-sized)
- Local tests green + capscreens attached
- One-line summary + evidence paths for Product Owner
- Non-blocking follow-ups stay notes, not silent ship risks

## Anti-patterns

- PR without capscreens or without recorded local test/check
- Flipping Act II `available: true` before checkpoint key alignment (`night-heron-*` vs `heron-*`)
- Whole-disk probes, token-in-URL fetches, force-push, permission widening
