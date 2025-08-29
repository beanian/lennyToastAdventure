import Sockroach from '../../entities/Sockroach.js';
import { collectToast } from './HUD.js';

export function spawnEnemy(scene, kind, x, y, props, map) {
  // Ensure animations exist
  Sockroach.createAnimations(scene);
  const enemy = new Sockroach(scene, x, y, scene.player.displayHeight);
  enemy.play('sockroach_walk');
  enemy.speed = Number(props.speed ?? 60);

  // Default movement is left/right unless a patrol path is provided
  if (props.pathName) {
    const paths = map.getObjectLayer('Paths');
    const pathObj = paths?.objects.find(o => o.name === props.pathName);
    if (pathObj?.polyline) {
      // Normalize polyline points to world space once, ignoring Y so enemy stays grounded
      const baseY = enemy.y;
      const pts = pathObj.polyline.map(p => ({
        x: pathObj.x + p.x,
        y: baseY
      }));
      // Ensure patrol moves monotonically from left to right
      pts.sort((a, b) => a.x - b.x);
      enemy.patrol = pts;
      enemy.patrolIndex = 0;
      enemy.patrolDir = 1;
      // Start stationary; update loop will drive movement
      enemy.setVelocity(0, 0);
    }
  } else {
    // Start moving left by default when no path is supplied
    enemy.setVelocityX(-enemy.speed);
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
