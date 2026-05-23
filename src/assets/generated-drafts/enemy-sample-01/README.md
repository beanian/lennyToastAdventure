# Enemy Sample 01: Crumb Gremlin

Generated as a draft asset using `docs/ASSET_PIPELINE.md`.

## Files

- `enemy-sample-01_crumb-gremlin_1024x1024_chromakey_v01.png`: original generated chroma-key draft. Rejected: too painterly for the pixel-art game.
- `enemy-sample-01_crumb-gremlin_1024x1024_alpha_v01.png`: processed transparent PNG draft. Rejected: too painterly for the pixel-art game.
- `enemy-sample-01_crumb-gremlin_1024x1024_chromakey_v02.png`: regenerated pixel-art chroma-key draft.
- `enemy-sample-01_crumb-gremlin_1024x1024_alpha_v02.png`: regenerated transparent pixel-art draft.
- `enemy-sample-01_crumb-gremlin_96x96_alpha_v02_preview.png`: nearest-neighbor 96x96 preview for judging native game readability.
- `enemy-sample-01_crumb-gremlin_sheet_chromakey_v03.png`: four-frame chroma-key sprite-sheet draft.
- `enemy-sample-01_crumb-gremlin_sheet_alpha_v03.png`: four-frame transparent sprite-sheet draft.
- `enemy-sample-01_crumb-gremlin_idle_96x96_alpha_v03.png`: sliced idle frame.
- `enemy-sample-01_crumb-gremlin_walk_1_96x96_alpha_v03.png`: sliced walk frame 1.
- `enemy-sample-01_crumb-gremlin_walk_2_96x96_alpha_v03.png`: sliced walk frame 2.
- `enemy-sample-01_crumb-gremlin_stomped_96x96_alpha_v03.png`: sliced stomped frame.
- `enemy-sample-01_crumb-gremlin_sheet_384x96_alpha_v03_preview.png`: native-scale preview sheet for quick review.

## Prompt

Create one sample side-scroller enemy sprite named crumb gremlin for a cozy cartoon breakfast adventure game. The enemy is a small mischievous burnt-toast crumb with two tiny legs, jam-red angry eyebrows, sesame-like crumbs, and a chunky readable silhouette. It should feel like it belongs near the current sockroach and toast collectible style while remaining visually distinct.

Style: 2D cartoon game sprite, soft ink outline, warm golden toast colors, darker toasted edges, cream highlights, playful but clean.

Constraints: one enemy only, no text, no watermark, no UI, transparent-ready silhouette, crisp edges, readable at 64x64 game scale.

## Review Notes

### v01

- Strong silhouette and readable enemy expression.
- Palette matches the toast-and-jam direction from the style guide.
- Larger than runtime scale; downsample and test at 64x64 or 96x96 before promotion.
- The floating crumb fragments may need cleanup if the enemy should use a single tight hitbox.
- Rejected as production direction because it is polished cartoon illustration, not pixel art.

### v02

- Much closer to the game direction: hard pixel blocks, simpler palette, no detached fragments.
- Reads clearly at 96x96 and should be tested in-scene at 64x64 before promotion.
- Silhouette is compact enough for a simple body hitbox.
- Still generated at high resolution first; if promoted, use the 96x96 preview as the starting point or regenerate directly as a small sprite sheet.

### v03

- Adds an idle frame, two walk frames, and a stomped frame with consistent 96x96 framing.
- The walk frames are subtle but usable for a first in-game prototype.
- The stomped frame reads clearly and keeps the same palette.
- Before promotion, test the frame cadence in Phaser and consider hand-cleaning the feet for stronger walk motion.
