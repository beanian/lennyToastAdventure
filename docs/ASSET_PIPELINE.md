# Lenny Toast Quest Asset Pipeline

This pipeline keeps generated art useful without letting drafts leak into the shipped game. It pairs with `docs/STYLE_GUIDE.md`; that file is the source of truth for shape language, palette, line weight, and tone.

## Folder Flow

1. Generate drafts into `src/assets/generated-drafts/<pack-name>/`.
2. Review and reject weak variants in place.
3. Promote approved files into a runtime folder:
   - `src/assets/ui/` for buttons, panels, icons, and mobile controls.
   - `src/assets/sprites/` for characters, enemies, collectibles, and props.
   - `src/assets/backgrounds/` for parallax or scenic layers.
   - `src/assets/effects/` for particles, flashes, dust, and impact art.
4. Add only promoted assets to `src/assets/manifest.js`.
5. Update the matching scene or UI system to load from the manifest.

Generated draft files should include the pack name, asset key, size, and variant:

```text
ui-polish-01_button_idle_96x32_v01.png
ui-polish-01_button_hover_96x32_v02.png
level-end-01_sign_128x96_v03.png
```

## Review Checklist

- Reads clearly at the final in-game size.
- Uses the warm toast-and-jam palette from the style guide without becoming monochrome.
- Keeps edges soft and chunky, with high-contrast silhouettes.
- Avoids photorealism, gritty texture, tiny line detail, and muddy gradients.
- Matches the current side-scroller camera angle.
- Has transparent background when it is a sprite, UI control, prop, or effect.
- Leaves enough empty padding for hover, pressed, and hitbox states.
- Does not duplicate a UI symbol that already exists in the project unless it is replacing that symbol.

## Prompt Pattern

Use this structure with Codex image generation. The game is pixel art, so prompts must explicitly reject painterly or high-resolution illustration output.

```text
Create a transparent PNG game asset for Lenny Toast Quest.
Style reference: follow docs/STYLE_GUIDE.md. Pixel art breakfast adventure, chunky readable silhouette, warm golden toast colors, jam-red accent, cream highlights, hard pixel edges, limited palette, playful but clean.
Asset: <specific asset>.
Camera/use: <side-scroller world prop | UI overlay | mobile touch control>.
Final size: <pixel dimensions>.
Constraints: transparent background, no text unless requested, no photorealism, no painterly shading, no soft brush texture, no antialiasing, no drop shadow baked outside the asset bounds, readable at 1x.
```

For stateful UI assets, generate all states in one pack with identical dimensions and consistent padding.

## First UI Polish Pack

Generate these as transparent PNGs, then promote approved variants to `src/assets/ui/`.

| Asset key | Size | Prompt detail |
| --- | ---: | --- |
| `pause_panel` | 320x220 | A compact parchment-toast pause panel, lightly toasted corners, jam-red trim, soft cream center, no text. |
| `button_idle` | 144x40 | Toast-shaped UI button, golden crust edge, cream center, subtle soft outline, no text. |
| `button_hover` | 144x40 | Same button, slightly brighter cream center and jam-red accent glow, no text. |
| `button_pressed` | 144x40 | Same button, subtly compressed, darker crust underside, no text. |
| `button_disabled` | 144x40 | Same button, desaturated and lower contrast, no text. |
| `mobile_left` | 72x72 | Circular toast-crust touch control with a clear left arrow symbol, transparent background. |
| `mobile_right` | 72x72 | Circular toast-crust touch control with a clear right arrow symbol, transparent background. |
| `mobile_jump` | 72x72 | Circular toast-crust touch control with a clear upward jump arrow symbol, transparent background. |

## First Gameplay Polish Pack

Generate these as transparent PNGs, then promote approved variants to the matching runtime folder.

| Asset key | Size | Runtime folder | Prompt detail |
| --- | ---: | --- | --- |
| `level_end_sign` | 128x96 | `src/assets/sprites/` | Pixel-art wooden kitchen sign with toast-shaped topper, blank sign face, readable side-scroller prop. |
| `checkpoint` | 96x96 | `src/assets/sprites/` | Pixel-art toaster checkpoint with a warm glow slot and tiny flag, no text. |
| `toast_variant_1` | 48x48 | `src/assets/sprites/` | Pixel-art collectible toast slice with butter shine, chunky outline, high readability. |
| `toast_variant_2` | 48x48 | `src/assets/sprites/` | Pixel-art collectible toast slice with jam swirl, same silhouette family as variant 1. |
| `hazard_warning` | 64x64 | `src/assets/sprites/` | Small pixel-art jam-red warning prop with breakfast-themed shape, no text, readable at 1x. |
| `background_clouds` | 512x192 | `src/assets/backgrounds/` | Pixel-art breakfast-sky cloud band, tileable horizontally, gentle cream highlights. |
| `foreground_grass` | 512x96 | `src/assets/backgrounds/` | Chunky pixel-art grassy foreground strip with toast-colored flowers, tileable horizontally. |

## Enemy Sprite Prompt Template

Use this for any character, enemy, or collectible that needs to match the current pixel-art game assets:

```text
Create a pixel-art side-scroller sprite for Lenny Toast Quest on a perfectly flat solid #00ff00 chroma-key background.
Style reference: follow docs/STYLE_GUIDE.md and the current sprite scale. Pixel art only: hard square pixels, limited palette, crisp silhouette, no painterly shading, no antialiasing, no soft brush texture, no vector-smooth curves, no 3D render.
Asset: <enemy or character description>.
Final sprite target: <64x64 | 96x96 | 128x128>, centered with generous padding.
Pose: side-view or three-quarter side-view, sprite-sheet compatible, readable at native scale.
Constraints: no text, no watermark, no cast shadow, no floor plane, no detached fragments unless they are separate effect sprites, do not use #00ff00 in the subject.
```

## Promotion Notes

When a draft is approved, move it out of `generated-drafts` and rename it to the manifest key:

```text
src/assets/ui/button_idle.png
src/assets/sprites/level_end_sign.png
```

Then add or update a manifest entry. Keep names stable because scenes should depend on semantic keys, not generator filenames.

## Codex Work Item Template

Use this task format when asking Codex to generate a pack:

```text
Generate the First UI Polish Pack from docs/ASSET_PIPELINE.md.
Place all drafts in src/assets/generated-drafts/ui-polish-01/.
After generation, review the set against docs/STYLE_GUIDE.md and docs/ASSET_PIPELINE.md.
Do not wire the assets into the game until I approve promoted variants.
```
