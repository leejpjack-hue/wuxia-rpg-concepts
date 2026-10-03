# Trailer motion verification — 2026-10-02

The ten-second trailer now cuts to Zhao Yun, Hu Sanniang and Lu Zhishen close-ups at narration cues. Existing Zhao Yun walk frames and approved duel poses supply movement; two impacts add contact holds, blade trails, qi charge, shock rings, recoil and synchronized sound. River, mountain and citadel cuts lead into the title reveal. Japanese remains the default; the English version is available from the existing selector.

## Evidence

- `npm test`: 268 passed, zero failed. See `tests.txt`.
- `npm run check`: all modules and 111 PNG assets passed. See `check.txt`.
- Browser: Japanese and English playback both reached the 10-second ending and Replay state without console errors. Replay, pause (held at 0.2 seconds), and resume were exercised.
- Browser: inspected narration close-ups for all three heroes and the special attack using the actual renderer. Corrected an initial portrait crop that placed the forehead above the frame.
- Browser: reviewed English close-up composition at 390px width and the reduced-motion strike. Text stayed inside the frame; reduced motion removed camera shake, travel and flash effects while retaining the story/subtitles.
- Visual frames were captured inline during the session. `preview.html` reproduces each inspected shot from the production markup and shared renderer, with time, language and reduced-motion controls.
- Narration cue 2 is re-rendered locally with the established system voices to match sixteen heroes. Tests verify PCM WAV format and reasonable playback speed within each cue window.

Play: http://127.0.0.1:8766/trailer.html
Frame review: http://127.0.0.1:8766/capscreens-trailer-motion/preview.html
