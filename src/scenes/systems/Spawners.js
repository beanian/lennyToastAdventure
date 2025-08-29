import Sockroach from '../../entities/Sockroach.js';
import { collectToast } from './HUD.js';

export function spawnEnemy(scene, kind, x, y, props, map, groundLayers = []) {
  // Ensure animations exist
  Sockroach.createAnimations(scene);
  const speed = Number(props.speed ?? 50);
  const range = Number(props.patrolWidth ?? props.range ?? 160);
  const enemy = new Sockroach(scene, x, y, scene.player.displayHeight, { speed, range, map, groundLayers });
  enemy.play('sockroach_walk');
  // Optional pathName: build patrol along polyline in 'Paths' layer
  const pathName = (props.pathName || '').trim();
  if (pathName) {
    const paths = map.getObjectLayer('Paths');
    const pathObj = paths?.objects.find(o => o.name === pathName);
    if (pathObj?.polyline) {
      const baseY = enemy.y;
      const pts = pathObj.polyline.map(p => ({ x: pathObj.x + p.x, y: baseY }));
      pts.sort((a, b) => a.x - b.x);
      enemy.patrol = pts;
      enemy.patrolIndex = 0;
      enemy.patrolDir = 1;
      enemy.setVelocity(0, 0);
    }
  }
  scene.enemies.add(enemy);
  return enemy;
}

export function spawnCollectible(scene, kind, x, y, props) {
  const toast = scene.collectibles.create(x, y, 'toast').setOrigin(0, 1);
  const scale = (scene.player.displayHeight / toast.height) * 0.35;
  toast.setScale(scale);
  // Ensure the physics body matches the visual size and remains static
  toast.body.setSize(toast.width * scale, toast.height * scale);
  toast.body.setOffset(0, toast.height * (1 - scale));
  toast.setImmovable(true);
  toast.value = Number(props.value ?? 1);
  toast.bobTween = scene.tweens.add({
    targets: toast,
    y: y - 10,
    duration: 800,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut'
  });

  scene.physics.add.overlap(scene.player, toast, () => {
    collectToast(scene, toast);
  });
  return toast;
}
