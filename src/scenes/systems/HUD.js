/* global Phaser */
import { GAME_WIDTH, GAME_HEIGHT } from '../../constants.js';
import { sfx } from '../../AudioBus.js';

export function createHUD(scene) {
  // Core state
  scene.health = 3;
  scene.isDead = false;
  scene.isInvincible = false;
  scene.toastCount = 0;

  // UI container pinned to screen
  scene.ui = scene.add.container(0, 0).setScrollFactor(0).setDepth(10);

  // Health icons
  createHealthIcons(scene);

  // Toast counter
  const toastSrc = scene.textures.get('toast').getSourceImage();
  const toastScale = (scene.player.displayHeight / toastSrc.height) * 1;
  const lastHealth = scene.healthIcons[scene.healthIcons.length - 1];
  const toastX = lastHealth.x + lastHealth.displayWidth + 20;
  const toastY = lastHealth.y;
  scene.toastIcon = scene.add
    .image(toastX, toastY, 'toast')
    .setOrigin(0, 0)
    .setScale(toastScale)
    .setDepth(10)
    .setScrollFactor(0);
  scene.ui.add(scene.toastIcon);

  scene.toastText = scene.add
    .text(
      scene.toastIcon.x + scene.toastIcon.displayWidth + 5,
      scene.toastIcon.y + scene.toastIcon.displayHeight / 2,
      `${scene.toastCount}`,
      {
        font: 'bold 32px Courier',
        fill: '#ffcc00'
      }
    )
    .setOrigin(0, 0.5)
    .setStroke('#000', 4)
    .setDepth(10)
    .setScrollFactor(0);
  scene.ui.add(scene.toastText);

  // Render UI elements with dedicated camera
  const cam = scene.cameras.main;
  cam.ignore(scene.ui);
  scene.uiCam = scene.cameras
    .add(0, 0, GAME_WIDTH, GAME_HEIGHT, true)
    .setScroll(0, 0);
  scene.uiCam.ignore(scene.children.list.filter(obj => obj !== scene.ui));

  // Backwards-compatible helpers on scene
  scene.createHealthIcons = () => createHealthIcons(scene);
  scene.removeHealthIcon = () => removeHealthIcon(scene);
  scene.resetHealthIcons = () => resetHealthIcons(scene);
  scene.playerDie = () => playerDie(scene);
  scene.collectToast = toast => collectToast(scene, toast);
}

export function createHealthIcons(scene) {
  const srcImage = scene.textures.get('lenny_face').getSourceImage();
  const scale = (scene.player.displayHeight / srcImage.height) * 1;
  scene.healthIcons = [];
  for (let i = 0; i < scene.health; i++) {
    const x = 10 + i * (srcImage.width * scale + 5);
    const icon = scene.add
      .image(x, 30, 'lenny_face')
      .setOrigin(0, 0)
      .setScale(scale)
      .setDepth(10)
      .setScrollFactor(0);
    scene.ui.add(icon);
    scene.healthIcons.push(icon);
  }
}

export function removeHealthIcon(scene) {
  const icon = scene.healthIcons.pop();
  if (!icon) return;
  scene.tweens.add({
    targets: icon,
    y: icon.y - 20,
    angle: 360,
    scale: 0,
    alpha: 0,
    duration: 500,
    ease: 'Cubic.easeIn',
    onComplete: () => icon.destroy()
  });
}

export function resetHealthIcons(scene) {
  if (scene.healthIcons) {
    scene.healthIcons.forEach(icon => icon.destroy());
  }
  createHealthIcons(scene);
}

export function collectToast(scene, toast) {
  toast.bobTween.stop();
  toast.body.enable = false;
  scene.tweens.add({
    targets: toast,
    scale: toast.scale * 1.5,
    alpha: 0,
    duration: 300,
    onComplete: () => toast.destroy()
  });
  sfx('toastCollect');
  scene.toastCount += toast.value;
  scene.toastText.setText(`${scene.toastCount}`);
  scene.tweens.add({
    targets: scene.toastText,
    scale: { from: 1.3, to: 1 },
    duration: 200,
    ease: 'Cubic.easeOut'
  });
}

export function playerDie(scene) {
  if (scene.isDead) return;
  scene.isDead = true;
  scene.bgm.stop();
  sfx('death');
  scene.player.setVelocity(0, 0);
  scene.player.anims.stop();
  scene.player.setTexture('lenny_idle');

  scene.tweens.add({
    targets: scene.player,
    alpha: 0,
    angle: 180,
    duration: 4000,
    onComplete: () => {
      scene.player.setAngle(0);
      scene.player.setPosition(scene.spawnPoint.x, scene.spawnPoint.y);
      scene.player.jumpCount = 0;
      scene.health = 3;
      resetHealthIcons(scene);
      const respawn = sfx('respawn');
      respawn.once('complete', () => {
        scene.bgm.setVolume(0);
        scene.bgm.play();
        scene.tweens.add({
          targets: scene.bgm,
          volume: 0.5,
          duration: 1000
        });
      });
      scene.tweens.add({
        targets: scene.player,
        alpha: 1,
        duration: 500,
        onComplete: () => {
          scene.isDead = false;
        }
      });
    }
  });
}

