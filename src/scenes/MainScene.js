import { VERSION } from '../constants.js';
import Player from '../entities/Player.js';
import Sockroach from '../entities/Sockroach.js';

export default class MainScene extends Phaser.Scene {
  constructor() {
    super('MainScene');
    this.spawnPoint = { x: 0, y: 0 };
  }

  preload() {
    Player.preload(this);
    Sockroach.preload(this);
    this.load.image('toast', 'src/assets/sprites/toast/toast_sprite.png');
    this.load.image('lenny_face', 'src/assets/sprites/lenny/lenny_face.png');
    this.load.audio('death', 'src/assets/audio/game-over-38511.mp3');
    this.load.audio('respawn', 'src/assets/audio/a_bulldog_respawning.mp3');
    this.load.audio('bgm', 'src/assets/audio/Pixel Jump Groove.mp3');
    this.load.audio('hurt', 'src/assets/audio/Hurt.wav');
    this.load.audio('landEnemy', 'src/assets/audio/LandOnEnemy.wav');
    this.load.audio('toastCollect', 'src/assets/audio/toast-collect.mp3');
    this.load.image('tiles', 'src/assets/tileset_placeholder.png');
    this.load.tilemapTiledJSON('level', 'src/tilemaps/lennyTest.tmj');
  }

  create() {
    Player.createAnimations(this);
    Sockroach.createAnimations(this);

    const map = this.make.tilemap({ key: 'level' });
    const tileset = map.addTilesetImage(
      'nature-paltformer-tileset-16x16',
      'tiles'
    );

    this.collisionLayers = [];
    map.layers.forEach(layerData => {
      if (layerData.type !== 'tilelayer') return;
      const layer = map.createLayer(layerData.name, tileset, 0, 0);
      if (
        layerData.properties &&
        layerData.properties.find(p => p.name === 'collision' && p.value === true)
      ) {
        layer.setCollisionByExclusion([-1]);
        this.collisionLayers.push(layer);
      }
    });

    const objectLayer = map.getObjectLayer('Entities');
    const enemySpawns = [];
    const toastSpawns = [];
    objectLayer.objects.forEach(obj => {
      const props = Object.fromEntries(
        (obj.properties || []).map(p => [p.name, p.value])
      );
      if (props.type === 'spawn' && props.kind === 'player') {
        this.spawnPoint = { x: obj.x, y: obj.y };
      } else if (props.type === 'enemy' && props.kind === 'sockroach') {
        enemySpawns.push({ x: obj.x, y: obj.y });
      } else if (props.type === 'collectible' && props.kind === 'toast') {
        toastSpawns.push({ x: obj.x, y: obj.y });
      }
    });

    this.player = new Player(this, this.spawnPoint.x, this.spawnPoint.y);

    this.toasts = this.physics.add.group({ allowGravity: false, immovable: true });
    toastSpawns.forEach(pos => {
      const toast = this.toasts.create(pos.x, pos.y, 'toast');
      const toastScale = (this.player.displayHeight / toast.height) * 0.5;
      toast.setScale(toastScale);
      toast.bobTween = this.tweens.add({
        targets: toast,
        y: pos.y - 10,
        duration: 800,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    });

    if (enemySpawns.length > 0) {
      const pos = enemySpawns[0];
      this.sockroach = new Sockroach(
        this,
        pos.x,
        pos.y,
        this.player.displayHeight
      );
      this.sockroachColliders = this.collisionLayers.map(layer =>
        this.physics.add.collider(this.sockroach, layer)
      );
      this.physics.add.collider(
        this.player,
        this.sockroach,
        this.handlePlayerEnemy,
        null,
        this
      );
    }

    this.collisionLayers.forEach(layer =>
      this.physics.add.collider(this.player, layer)
    );
    this.physics.add.overlap(
      this.player,
      this.toasts,
      this.collectToast,
      null,
      this
    );

    this.deathSound = this.sound.add('death');
    this.respawnSound = this.sound.add('respawn');
    this.hurtSound = this.sound.add('hurt');
    this.landEnemySound = this.sound.add('landEnemy');
    this.toastSound = this.sound.add('toastCollect');
    this.bgm = this.sound.add('bgm', { loop: true, volume: 0.5 });
    this.bgm.play();

    this.health = 3;
    this.isDead = false;
    this.isInvincible = false;
    this.toastCount = 0;

    this.add.text(10, 10, `Lenny Toast Adventure Test ${VERSION}`, {
      font: '16px Courier',
      fill: '#ffffff'
    });
    this.createHealthIcons();
    const toastSrc = this.textures.get('toast').getSourceImage();
    const toastScale = (this.player.displayHeight / toastSrc.height) * 0.5;
    const lastHealth = this.healthIcons[this.healthIcons.length - 1];
    const toastX = lastHealth.x + lastHealth.displayWidth + 20;
    const toastY = lastHealth.y;
    this.toastIcon = this.add
      .image(toastX, toastY, 'toast')
      .setOrigin(0, 0)
      .setScale(toastScale);
    this.toastText = this.add
      .text(
        this.toastIcon.x + this.toastIcon.displayWidth + 5,
        this.toastIcon.y + this.toastIcon.displayHeight / 2,
        `${this.toastCount}`,
        {
          font: 'bold 24px Courier',
          fill: '#ffcc00'
        }
      )
      .setOrigin(0, 0.5)
      .setStroke('#000', 4);
    this.toastText.setShadow(2, 2, '#000', 2, true, true);
  }

  playerDie() {
    if (this.isDead) return;
    this.isDead = true;
    this.bgm.stop();
    this.deathSound.play();
    this.player.setVelocity(0, 0);
    this.player.anims.stop();
    this.player.setTexture('lenny_idle');

    this.tweens.add({
      targets: this.player,
      alpha: 0,
      angle: 180,
      duration: 4000,
      onComplete: () => {
        this.player.setAngle(0);
        this.player.setPosition(this.spawnPoint.x, this.spawnPoint.y);
        this.player.jumpCount = 0;
        this.health = 3;
        this.resetHealthIcons();
        this.respawnSound.play();
        this.respawnSound.once('complete', () => {
          this.bgm.setVolume(0);
          this.bgm.play();
          this.tweens.add({
            targets: this.bgm,
            volume: 0.5,
            duration: 1000
          });
        });
        this.tweens.add({
          targets: this.player,
          alpha: 1,
          duration: 500,
          onComplete: () => {
            this.isDead = false;
          }
        });
      }
    });
  }

  handlePlayerEnemy(playerObj, enemy) {
    if (enemy.alive === false) return;

    const playerBottom = playerObj.body.bottom;
    const enemyTop = enemy.body.top;
    const falling =
      playerObj.body.velocity.y > 0 || playerObj.body.prev.y < playerObj.body.y;

    if (falling && playerBottom <= enemyTop + 5) {
      this.landEnemySound.play();
      enemy.alive = false;
      enemy.play('sockroach_stomp');
      enemy.setVelocity(0, 0);
      playerObj.setVelocityY(-300);
      if (this.sockroachColliders) {
        this.sockroachColliders.forEach(c => c.destroy());
      }
      enemy.body.checkCollision.none = true;
      enemy.setCollideWorldBounds(false);
      enemy.once('animationcomplete-sockroach_stomp', () => {
        enemy.setVelocityY(-200);
        this.time.delayedCall(1000, () => enemy.destroy());
      });
    } else {
      if (this.isInvincible) return;
      this.hurtSound.play();
      this.health -= 1;
      this.removeHealthIcon();
      this.isInvincible = true;
      playerObj.setTint(0xff0000);
      this.time.addEvent({
        delay: 100,
        repeat: 5,
        callback: () => {
          playerObj.visible = !playerObj.visible;
        }
      });
      this.time.delayedCall(1000, () => {
        this.isInvincible = false;
        playerObj.clearTint();
        playerObj.visible = true;
      });
      if (this.health <= 0) {
        this.playerDie();
      }
    }
  }

  collectToast(playerObj, toast) {
    toast.bobTween.stop();
    toast.body.enable = false;
    this.tweens.add({
      targets: toast,
      scale: toast.scale * 1.5,
      alpha: 0,
      duration: 300,
      onComplete: () => toast.destroy()
    });
    this.toastSound.play();
    this.toastCount += 1;
    this.toastText.setText(`${this.toastCount}`);
    this.tweens.add({
      targets: this.toastText,
      scale: { from: 1.3, to: 1 },
      duration: 200,
      ease: 'Cubic.easeOut'
    });
  }

  createHealthIcons() {
    const srcImage = this.textures.get('lenny_face').getSourceImage();
    const scale = (this.player.displayHeight / srcImage.height) * 0.5;
    this.healthIcons = [];
    for (let i = 0; i < this.health; i++) {
      const x = 10 + i * (srcImage.width * scale + 5);
      const icon = this.add.image(x, 30, 'lenny_face').setOrigin(0, 0);
      icon.setScale(scale);
      this.healthIcons.push(icon);
    }
  }

  removeHealthIcon() {
    const icon = this.healthIcons.pop();
    if (!icon) return;
    this.tweens.add({
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

  resetHealthIcons() {
    if (this.healthIcons) {
      this.healthIcons.forEach(icon => icon.destroy());
    }
    this.createHealthIcons();
  }

  update() {
    if (this.isDead) return;
    this.player.update();
    if (this.sockroach && this.sockroach.alive !== false) {
      this.sockroach.update();
    }
  }
}
