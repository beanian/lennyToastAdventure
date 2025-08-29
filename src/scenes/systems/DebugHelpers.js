/* global Phaser */
import { DEBUG } from '../../constants.js';

export function setupDebug(scene, map, layers) {
  // Keyboard toggles
  const kb = scene.input?.keyboard;
  if (kb) {
    kb.on('keydown-F3', () => toggleDebug(scene));
    kb.on('keydown-F4', () => toggleHitboxes(scene));
    kb.on('keydown-F5', () => toggleGizmos(scene));
    kb.on('keydown-F6', () => toggleStateText(scene));
  }

  // URL param ?debug=1 to force on at start
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('debug') === '1' || params.get('debug') === 'true') {
      DEBUG.enabled = true;
    }
  } catch (_) {}

  // Create containers
  scene.debugGfx = scene.add.graphics().setDepth(1000);
  scene.debugGfx.setScrollFactor(1);
  scene.debugLabels = [];

  scene.debugText = scene.add
    .text(10, 90, '', { font: '14px Courier', fill: '#00ff88' })
    .setScrollFactor(0)
    .setDepth(1000);
  scene.ui.add(scene.debugText);

  // Physics debug graphic is owned by the world; create once
  if (!scene.physics.world.debugGraphic) {
    scene.physics.world.createDebugGraphic();
  }

  // Keep originals for toggles before gizmos draw
  scene._mapOriginal = map;
  scene._entitiesOriginal = layers.entities;

  // Initial render based on flags
  applyDebugFlags(scene, map, layers);
}

export function applyDebugFlags(scene, map, { entities }) {
  const enabled = !!DEBUG.enabled;
  // Hitboxes
  const hb = enabled && DEBUG.showHitboxes;
  scene.physics.world.drawDebug = hb;
  if (scene.physics.world.debugGraphic) {
    scene.physics.world.debugGraphic.setVisible(hb);
  }
  // Gizmos
  const gz = enabled && DEBUG.showGizmos;
  scene.debugGfx.setVisible(gz);
  scene.debugGfx.clear();
  // clear old labels
  if (scene.debugLabels?.length) {
    scene.debugLabels.forEach(t => t.destroy());
    scene.debugLabels.length = 0;
  }
  if (gz) drawGizmos(scene, map, entities);
  // State text
  const st = enabled && DEBUG.showState;
  scene.debugText.setVisible(st);
}

export function toggleDebug(scene) {
  DEBUG.enabled = !DEBUG.enabled;
  const map = scene._mapOriginal || scene._mapCache;
  const entities = scene._entitiesOriginal || scene._entitiesCache;
  applyDebugFlags(scene, map, { entities });
}

export function toggleHitboxes(scene) {
  DEBUG.showHitboxes = !DEBUG.showHitboxes;
  const map = scene._mapOriginal || scene._mapCache;
  const entities = scene._entitiesOriginal || scene._entitiesCache;
  applyDebugFlags(scene, map, { entities });
}

export function toggleGizmos(scene) {
  DEBUG.showGizmos = !DEBUG.showGizmos;
  const map = scene._mapOriginal || scene._mapCache;
  const entities = scene._entitiesOriginal || scene._entitiesCache;
  applyDebugFlags(scene, map, { entities });
}

export function toggleStateText(scene) {
  DEBUG.showState = !DEBUG.showState;
  const map = scene._mapOriginal || scene._mapCache;
  const entities = scene._entitiesOriginal || scene._entitiesCache;
  applyDebugFlags(scene, map, { entities });
}

export function drawGizmos(scene, map, entitiesLayer) {
  const g = scene.debugGfx;
  if (!g) return;

  // Cache inputs for toggles
  scene._mapCache = map;
  scene._entitiesCache = entitiesLayer;

  // Paths layer (patrols)
  const paths = map.getObjectLayer('Paths');
  if (paths) {
    g.lineStyle(2, 0x00ffff, 0.9);
    g.fillStyle(0x00ffff, 0.25);
    paths.objects.forEach(o => {
      if (o.polyline && Array.isArray(o.polyline)) {
        const ox = o.x;
        const oy = o.y;
        const pts = o.polyline.map(p => ({ x: ox + p.x, y: oy + p.y }));
        if (pts.length > 1) {
          g.beginPath();
          g.moveTo(pts[0].x, pts[0].y);
          for (let i = 1; i < pts.length; i++) g.lineTo(pts[i].x, pts[i].y);
          g.strokePath();
          pts.forEach(p => g.fillCircle(p.x, p.y, 4));
          // Label
          g.lineStyle(1, 0x003333, 1);
          g.strokeRect(pts[0].x - 20, pts[0].y - 18, 58, 14);
          const t = scene.add
            .text(pts[0].x - 18, pts[0].y - 18, o.name || 'path', {
              font: '12px Courier',
              color: '#00ffff'
            })
            .setDepth(1000)
            .setScrollFactor(1);
          scene.debugLabels.push(t);
        }
      }
    });
  }

  // Spawn points and enemies/collectibles markers
  if (entitiesLayer) {
    entitiesLayer.objects.forEach(o => {
      const props = Object.fromEntries((o.properties || []).map(p => [p.name, p.value]));
      const type = (props.type || o.type || '').toLowerCase();
      const isSpawn = type === 'spawn' || /spawn/i.test(o.name || '');
      const x = o.x;
      const y = o.y - (o.height || 0);
      if (isSpawn) {
        drawCross(scene, g, x, y, 10, 0x55ff55);
        drawLabel(scene, x + 8, y - 18, o.name || 'Spawn', '#55ff55');
      } else if (type === 'enemy') {
        drawCross(scene, g, x, y, 8, 0xffaa00);
        drawLabel(scene, x + 8, y - 18, props.kind || 'enemy', '#ffcc66');
      } else if (type === 'collectible') {
        drawCross(scene, g, x, y, 6, 0xffcc00);
        drawLabel(scene, x + 8, y - 18, props.kind || 'col', '#ffcc00');
      } else if (type === 'damage') {
        drawDamageObject(scene, g, o);
      }
    });
  }

  // Layers named Damage/Hazards (optional)
  const damageLayer = map.getObjectLayer('Damage') || map.getObjectLayer('Hazards');
  if (damageLayer) {
    damageLayer.objects.forEach(o => drawDamageObject(scene, g, o));
  }
}

export function drawCross(scene, g, x, y, r, color) {
  g.lineStyle(2, color, 1);
  g.beginPath();
  g.moveTo(x - r, y);
  g.lineTo(x + r, y);
  g.moveTo(x, y - r);
  g.lineTo(x, y + r);
  g.strokePath();
}

export function drawLabel(scene, x, y, text, color) {
  const t = scene.add
    .text(x, y, text, { font: '12px Courier', color })
    .setDepth(1000)
    .setScrollFactor(1);
  scene.debugLabels.push(t);
}

export function drawDamageObject(scene, g, o) {
  g.lineStyle(2, 0xff4444, 1);
  g.fillStyle(0xff4444, 0.2);
  if (o.width && o.height) {
    g.fillRect(o.x, o.y - o.height, o.width, o.height);
    g.strokeRect(o.x, o.y - o.height, o.width, o.height);
    drawLabel(scene, o.x + 4, o.y - o.height - 14, o.name || 'damage', '#ff7777');
    return;
  }
  const ox = o.x;
  const oy = o.y;
  if (o.polygon && Array.isArray(o.polygon) && o.polygon.length) {
    g.beginPath();
    g.moveTo(ox + o.polygon[0].x, oy + o.polygon[0].y);
    for (let i = 1; i < o.polygon.length; i++)
      g.lineTo(ox + o.polygon[i].x, oy + o.polygon[i].y);
    g.closePath();
    g.fillPath();
    g.strokePath();
    drawLabel(scene, ox + 4, oy - 14, o.name || 'damage', '#ff7777');
    return;
  }
  if (o.polyline && Array.isArray(o.polyline) && o.polyline.length) {
    g.beginPath();
    g.moveTo(ox + o.polyline[0].x, oy + o.polyline[0].y);
    for (let i = 1; i < o.polyline.length; i++)
      g.lineTo(ox + o.polyline[i].x, oy + o.polyline[i].y);
    g.strokePath();
    drawLabel(scene, ox + 4, oy - 14, o.name || 'damage', '#ff7777');
  }
}

