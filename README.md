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

## Level Authoring (Tiled)

This project uses [Tiled](https://www.mapeditor.org/) `.tmj` maps. Follow these conventions so your levels load and debug correctly.

### Tileset and Tile Layers

- Tileset: In Tiled, add the tileset image and name it exactly `nature-paltformer-tileset-16x16`. The game looks this up by tileset name.
- Image key: The Phaser loader maps the image to the key `tiles` via the asset manifest.
- Layers (tile):
  - `Sky` (parallax background, no collision)
  - `DecorBack` (background decoration, no collision)
  - `Ground` (main walkable terrain)
  - `Platforms` (optional one-way or floating platforms)
  - `DecorForground` (foreground decoration; note the current misspelling is intentional to match existing content)
- Collisions: For any tile layer that should collide (e.g., `Ground`, `Platforms`), add a Layer Property named `collision` (boolean) and set it to `true`. The engine will call `setCollisionByExclusion(-1)` for those layers.

### Object Layers

Create the following object layers to place entities, paths, and hazards.

- `Entities` (objects):
  - Player spawn: Either place an object named `Spawn_Player`, or any object with Property `type=spawn`.
  - Enemies: Place objects with Property `type=enemy`.
    - Supported properties:
      - `kind` (string): label for tooling/debug (e.g., `sockroach`).
      - `speed` (number): horizontal patrol speed (default `60`).
      - `pathName` (string): name of a polyline object in the `Paths` layer to use for patrol.
  - Collectibles: Place objects with Property `type=collectible`.
    - Supported properties:
      - `kind` (string): label for tooling/debug (e.g., `toast`).
      - `value` (number): how many points/toasts it’s worth (default `1`).

- `Paths` (objects):
  - Add polyline objects and give each a unique `name` (e.g., `roach_patrol_1`).
  - Enemies that specify `pathName=<object name>` will patrol along the polyline’s X positions. The engine normalizes the Y to the enemy’s spawn Y so the path stays on the ground.

- `Damage` or `Hazards` (objects):
  - Optional layer for visualizing danger zones in debug gizmos.
  - Shapes: rectangles, polygons, and polylines are supported for visualization.
  - You can also place damage objects on `Entities` with Property `type=damage` — they’ll be drawn when gizmos are on. (Note: currently used for debug; gameplay damage volumes can be wired up in future work.)

### Coordinates and Spawning Notes

- Tiled object Y-origin: The engine subtracts object height so objects align by bottom edge (spawn at `y - height`). This matches placing objects visually on the ground in Tiled.
- Camera and world bounds: World size comes from the map’s pixel dimensions. The camera auto-zooms to fit map width (`zoom = GAME_WIDTH / map.widthInPixels`).
- Falling out of the world: If the player hits the bottom world bound, death is triggered immediately.

### Asset Keys and Map Registration

- Images, audio, and tilemaps are defined in `src/assets/manifest.js`.
  - Add new tilemaps under `tilemaps: [{ key: 'levelX', url: 'src/levels/levelX/map.tmj' }]`.
  - Ensure your Tiled map references the tileset named `nature-paltformer-tileset-16x16` and that the image URL exists at `src/levels/.../*.png` with manifest key `tiles`.

### Quick Property Reference

- Layer property: `collision: true` on tile layers that should collide.
- Object properties (on `Entities`):
  - `type`: `spawn` | `enemy` | `collectible` | `damage`
  - `kind`: free-form label (e.g., `sockroach`, `toast`)
  - `speed`: number (enemy patrol speed)
  - `pathName`: string (name of a polyline in `Paths`)
  - `value`: number (collectible points)
