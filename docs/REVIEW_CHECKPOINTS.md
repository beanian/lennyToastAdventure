# Review Checkpoints

Use these checkpoints after UI, camera, mobile-control, level, or asset-loading changes.

## Local Server

```bash
npm run dev
```

Open `http://127.0.0.1:5180/?debug=1`.

## Required Viewports

Capture screenshots into `review-screenshots/` with these filenames:

- `desktop-welcome.png`: `1440x900`, welcome screen.
- `desktop-gameplay.png`: `1440x900`, Level 1 after player input starts the timer.
- `desktop-pause.png`: `1440x900`, pause overlay.
- `mobile-landscape-gameplay.png`: `852x393`, gameplay with touch controls visible.
- `mobile-portrait-blocker.png`: `393x852`, rotate prompt visible and controls hidden.

## Pass Criteria

- No browser console errors.
- Canvas is visible and nonblank.
- Lenny, enemies, collectibles, and prompts are readable at the tested viewport.
- Touch controls do not cover the player, level-end prompt, pause UI, or critical hazards.
- Portrait blocker appears only when the viewport is portrait-sized.
- Debug-only entry points are hidden unless `?debug=1` is present.

## Build Check

```bash
npm run build
```

The current build may warn about large chunks. Treat new errors or missing asset warnings as blockers.
