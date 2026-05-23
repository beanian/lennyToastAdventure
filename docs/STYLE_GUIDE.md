# Lenny Toast Quest Style Guide

This guide defines the current visual target for hand-authored and Codex-generated assets. Treat the title screen as the strongest style signal, then adapt assets to remain readable in the Phaser side-scroller camera.

## Core Identity

Lenny Toast Quest is a bright, chunky pixel-art platformer with comic food characters and clean arcade UI. Assets should feel playful, readable, and slightly silly without becoming noisy.

Primary references:
- `src/assets/sprites/game/welcome_screen.png`
- `src/assets/sprites/lenny/grey_idle.PNG`
- `src/assets/sprites/toast/toast_sprite.png`
- `src/assets/sprites/bananarchist/Bananarchist 2.png`
- `src/assets/ui/Sprites/UI_Flat_Frame02a.png`
- `src/assets/ui/Sprites/UI_Flat_Button02a_1.png`
- `src/levels/level1/nature-paltformer-tileset-16x16.png`

## Palette

Use saturated arcade colors with high contrast and warm accent colors. Gameplay gets first claim on readability; UI should frame and guide, not compete with player-path clarity.

- Backgrounds: cyan sky, deep navy, sunset orange, dark charcoal.
- Primary accents: toast gold, banana yellow, warm orange, white highlights.
- UI shell: blue frames with pale cream button interiors and dark text. Avoid using the brightest cyan/blue near gameplay sky unless the UI element is clearly separated from play.
- Gameplay ground: brown soil, brick red, grass green.
- Damage/hazard colors: reserve red, magenta, or hot orange for actual danger.

Avoid low-contrast beige-on-brown combinations for gameplay-critical items. Collectibles, enemies, prompts, and hazards must read against the cyan sky and brown platforms. If a UI panel appears over gameplay, prefer dark scrims and hard outlines over more saturated cyan.

## Pixel And Outline Rules

- Use crisp pixel edges. No antialiasing blur, soft brushes, or painterly gradients on gameplay sprites.
- Main characters and enemies should have a dark outline, usually 2-4 source pixels depending on canvas size.
- Small props should still have a 1-2 pixel dark outline or a clearly darker edge.
- Runtime DOM/CSS controls should avoid soft blur, glass effects, and diffuse drop shadows. Use hard offset shadows or outlined sprites instead.
- Use simple internal shading: 2-4 tones per material is enough.
- Do not use realistic lighting, cast shadows, bloom, lens blur, or photographic texture for gameplay assets.
- UI can use the existing flat pixel-button treatment, but should keep hard edges and dark outlines.

## Scale Targets

The current camera pass makes readability depend on assets being clean at game scale. Use these targets when creating new assets:

- Player-sized characters: design for a 48-72 px source-height read. Current Lenny display height is roughly 0.8 of the source frame.
- Small enemies: design for a 0.6x player-height read.
- Collectibles: design for a 0.35x player-height read with a strong silhouette.
- HUD icons: design for about 1.0x player-height display, then simplify if the source art is much larger than gameplay sprites.
- Boss/miniboss characters: design for about 1.5x player-height display.
- Tiles: 16x16 source grid unless the level tileset changes.
- UI buttons: use 72 px minimum display height for touchable controls.
- UI panels: use scalable frame sprites where possible and avoid text baked into the image.

If an asset only looks good when zoomed in on the file, it is not ready for gameplay use.

## Typography

Current runtime text uses Courier-style monospace text with Phaser strokes. Treat Courier as an implementation fallback, not the final art direction. Keep these constraints until a bitmap/pixel font is selected:

- Button labels: short, title case, 1-2 words.
- HUD labels: numbers and icons first; avoid explanatory text during play.
- Menus: dark text on pale UI buttons, high-contrast stroked text on dark overlays.
- Generated images should not contain baked text unless the exact wording is part of the asset brief.

Longer-term, replace plain Courier with a dedicated bitmap/pixel font and apply it consistently across title/menu/HUD. Avoid mixing DOM table styling with Phaser text unless the DOM surface is visually restyled to match the UI kit.

## UI Direction

Use existing UI assets as the near-term system. The same system should eventually cover pause, changelog, rotate overlay, mobile controls, and HUD pause controls:

- Panels: `UI_Flat_Frame02a.png`
- Main buttons: `UI_Flat_Button02a_1.png` through `_4.png`
- Plus/minus controls: `UI_Flat_ButtonPlus01a.png`, `UI_Flat_ButtonMinus01a.png`

Interaction states:

- Idle: pale button interior, dark text.
- Hover/focus: slightly brighter or raised button state.
- Pressed: depressed/darker button state.
- Disabled: lowered contrast and reduced alpha.

Do not place plain text directly over empty black space for primary navigation unless it is a debug-only affordance. Soft CSS circles are acceptable as a temporary mobile-control fallback, but the target is a hard-outlined pixel UI treatment.

## Gameplay Asset Direction

Characters should have strong silhouettes and expressive faces. Food-themed objects can be absurd, but they need to communicate their gameplay role instantly.

- Lenny: grey dog, compact body, readable ears/face.
- Toast: golden, square-ish, face-forward silhouette.
- Bananarchist: yellow banana character with bold dark outline and strong pose.
- Sockroach: darker enemy; make movement and stomp state readable through pose changes.

For new enemies, use one dominant recognizable shape plus one readable gimmick. Avoid fine details that disappear at gameplay scale.

## Background And Tile Direction

Background art should support gameplay, not compete with it.

- Keep sky and far-background shapes lower contrast than characters and collectibles.
- Use decorative vines/clouds/sunset shapes sparingly near jump routes.
- Preserve obvious collision readability: solid ground should look solid; decorative tiles should not look walkable.
- Keep foreground decoration clear of the player path unless it is intentionally occluding.

## Asset Folder Conventions

Use this structure for future asset work:

- `src/assets/generated-drafts/`: raw Codex/image-generation drafts and rejected variants.
- `src/assets/sprites/`: approved gameplay sprites.
- `src/assets/ui/`: approved UI sprites, panels, buttons, and bitmap-font assets.
- `src/assets/backgrounds/`: approved standalone background layers.
- `src/assets/effects/`: approved particles, impact frames, and transient effects.
- `src/levels/`: approved tilesets and level maps.

Generated drafts must not be referenced by `src/assets/manifest.js` until reviewed and promoted.

## Generated Asset Workflow

1. Generate or edit drafts into `src/assets/generated-drafts/`.
2. Review at actual in-game scale against the current camera preset.
3. Promote accepted art into the approved asset folder.
4. Add or update `src/assets/manifest.js` only after promotion.
5. Verify in the browser before deleting or archiving the draft.

## Codex Prompt Template

Use this prompt shape for new bitmap assets:

```text
Pixel-art asset for Lenny Toast Quest.
Asset type: <sprite | UI panel | button | prop | background layer>
Subject: <specific subject>
Style: chunky readable retro pixel art matching the existing Lenny Toast Quest title screen and sprites.
Canvas: <target size or gameplay scale>, isolated subject, transparent-ready flat chroma background if transparency is needed.
Palette: saturated arcade colors, dark outline, warm toast/yellow accents where appropriate.
Constraints: no baked text unless explicitly requested, no soft shadows, no realistic rendering, no blurry edges, readable at gameplay scale.
```

## Review Checklist

Before promoting an asset:

- It is readable at the actual in-game camera zoom.
- It has a crisp silhouette and dark outline.
- It uses no unwanted text, logos, watermark, or photographic detail.
- It matches the warm arcade palette and does not create a one-note color field.
- It has transparent or cleanly removable background when needed.
- It does not clash with the title screen, current UI frame/button assets, or Lenny sprites.
- It has a stable filename and manifest key plan before code references are added.

## Known Mismatches To Address

- The title screen has richer rendering than the current in-game sky and tile background.
- Mobile controls are functional but currently use CSS circles rather than pixel-art UI assets.
- Pause/options/leaderboard panels use existing frame assets, but runtime text and DOM tables still feel generic.
- Some oversized image assets, especially title/game screens and face sprites, need later performance review.
- The HUD face icon source is much larger and more rendered than the small Lenny gameplay frames.
- Bananarchist source frames have a different pixel density than Lenny, sockroach, and toast; verify any new animation frames at runtime scale.
