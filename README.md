# Lenny Toast Adventure

This project uses the [Phaser](https://phaser.io/) framework to build a pixel art side-scrolling game that runs in desktop and mobile browsers.

## Development

Install dependencies and start a local server:

```bash
npm install
npm start
```

Then open http://localhost:8080 in your browser to view the placeholder game scene.

## Debugging

- Toggle all debug on/off: press `F3` or add `?debug=1` to the URL.
- Toggle hitboxes: `F4` (Arcade Physics body debug).
- Toggle gizmos: `F5` (patrol paths, spawn points, damage volumes).
- Toggle state text: `F6` (player position/velocity/jumps/anim and enemy count).

When gizmos are enabled, patrol paths from the `Paths` object layer are drawn, spawn points from the `Entities` layer are marked, and any objects with `type=damage` or layers named `Damage`/`Hazards` are visualized.
