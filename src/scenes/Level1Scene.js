/* global Phaser */
import Player from '../entities/Player.js';
import Sockroach from '../entities/Sockroach.js';
import { GAME_WIDTH, GAME_HEIGHT } from '../constants.js';

export default class Level1Scene extends Phaser.Scene {
  constructor() {
    super('Level1');
  }

  preload() {
    this.load.tilemapTiledJSON(
      'level1',
      'src/levels/level1/lennyTest.tmj'
    );
    this.load.image(
      'tiles',
      'src/levels/level1/nature-paltformer-tileset-16x16.png'
    );

    Player.preload(this);
    Sockroach.preload(this);
    this.load.image('toast', 'src/assets/sprites/toast/toast_sprite.png');
    this.load.image('lenny_face', 'src/assets/sprites/lenny/lenny_face.png');

    this.load.audio('bgm', 'src/assets/audio/Pixel Jump Groove.mp3');
    this.load.audio('toastCollect', 'src/assets/audio/toast-collect.mp3');
    this.load.audio('hurt', 'src/assets/audio/Hurt.wav');
    this.load.audio('landEnemy', 'src/assets/audio/LandOnEnemy.wav');
    this.load.audio('death', 'src/assets/audio/game-over-38511.mp3');
    this.load.audio('respawn', 'src/assets/audio/a_bulldog_respawning.mp3');
  }

  create() {
    // --- Map + tiles ---
    const map = this.make.tilemap({ key: 'level1' });
    const tiles = map.addTilesetImage(
      'nature-paltformer-tileset-16x16',
      'tiles'
    );

    map.createLayer('Sky', tiles, 0, 0).setDepth(-2);
    map.createLayer('DecorBack', tiles, 0, 0).setDepth(-1);
    const ground = map.createLayer('Ground', tiles, 0, 0).setDepth(0);
    const platforms =
      map.getLayerIndex('Platforms') !== -1
        ? map.createLayer('Platforms', tiles, 0, 0).setDepth(0)
        : null;
    map.createLayer('DecorForground', tiles, 0, 0).setDepth(2);

    // Enable collision for any layer marked with a `collision` property
    const enableCollision = layer => {
      const props = layer.layer.properties || [];
      const collides = props.some(p => p.name === 'collision' && p.value === true);
      if (collides) {
        layer.setCollisionByExclusion(-1);
      }
    };
    enableCollision(ground);
    if (platforms) enableCollision(platforms);

    // --- Groups ---
    this.enemies = this.physics.add.group();
    this.collectibles = this.physics.add.group({ allowGravity: false, immovable: true });

    // --- Player spawn from Entities layer ---
    const entities = map.getObjectLayer('Entities');
    let spawnX = 64;
    let spawnY = 64;
    if (entities) {
      const spawn = entities.objects.find(
        o =>
          o.name === 'Spawn_Player' ||
          (o.properties || []).some(
            p => p.name === 'type' && p.value === 'spawn'
          )
      );
      if (spawn) {
        spawnX = spawn.x;
        spawnY = spawn.y - (spawn.height || 0);
      }
    }

    Player.createAnimations(this);
    Sockroach.createAnimations(this);
    this.player = new Player(this, spawnX, spawnY);
    this.spawnPoint = { x: spawnX, y: spawnY };

    // --- Colliders ---
    this.physics.add.collider(this.player, ground);
    if (platforms) this.physics.add.collider(this.player, platforms);
    this.physics.add.collider(
      this.player,
      this.enemies,
      this.handlePlayerEnemy,
      null,
      this
    );

    // --- World & camera bounds ---
    const mapW = map.widthInPixels;
    const mapH = map.heightInPixels;
    const zoom = GAME_WIDTH / mapW;
    const cam = this.cameras.main;
    cam.setZoom(zoom);
    cam.setBounds(0, 0, mapW, mapH);
    this.physics.world.setBounds(0, 0, mapW, mapH);
    cam.setSize(GAME_WIDTH, GAME_HEIGHT);
    cam.startFollow(this.player, true, 0.08, 0.08);

    // --- Enemy vs ground/platforms ---
    this.physics.add.collider(this.enemies, ground);
    if (platforms) this.physics.add.collider(this.enemies, platforms);

    // --- Audio ---
    this.toastSound = this.sound.add('toastCollect');
    this.bgm = this.sound.add('bgm', { loop: true, volume: 0.5 });
    this.hurtSound = this.sound.add('hurt');
    this.landEnemySound = this.sound.add('landEnemy');
    this.deathSound = this.sound.add('death');
    this.respawnSound = this.sound.add('respawn');
    this.bgm.play();

    // --- Parse Entities: enemies + collectibles ---
    if (entities) {
      entities.objects.forEach(obj => {
        const props = Object.fromEntries(
          (obj.properties || []).map(p => [p.name, p.value])
        );
        const type = (props.type || obj.type || '').toLowerCase();
        const kind = (props.kind || '').toLowerCase();
        const x = obj.x;
        const y = obj.y - (obj.height || 0);

        if (type === 'enemy') {
          this.spawnEnemy(kind, x, y, props, map);
        } else if (type === 'collectible') {
          this.spawnCollectible(kind, x, y, props);
        }
      });
    }

    // --- UI ---
    // Create a container for UI elements so they stay visible when the camera moves
    this.ui = this.add.container(0, 0).setScrollFactor(0).setDepth(10);

    this.health = 3;
    this.isDead = false;
    this.isInvincible = false;
    this.toastCount = 0;
    this.createHealthIcons();

    const toastSrc = this.textures.get('toast').getSourceImage();
    const toastScale = (this.player.displayHeight / toastSrc.height) * 1;
    const lastHealth = this.healthIcons[this.healthIcons.length - 1];
    const toastX = lastHealth.x + lastHealth.displayWidth + 20;
    const toastY = lastHealth.y;
    this.toastIcon = this.add
      .image(toastX, toastY, 'toast')
      .setOrigin(0, 0)
      .setScale(toastScale)
      .setDepth(10)
      .setScrollFactor(0);
    this.ui.add(this.toastIcon);

    this.toastText = this.add
      .text(
        this.toastIcon.x + this.toastIcon.displayWidth + 5,
        this.toastIcon.y + this.toastIcon.displayHeight / 2,
        `${this.toastCount}`,
        {
          font: 'bold 32px Courier',
          fill: '#ffcc00'
        }
      )
      .setOrigin(0, 0.5)
      .setStroke('#000', 4)
      .setDepth(10)
      .setScrollFactor(0);
    this.ui.add(this.toastText);

    // Render UI elements with a dedicated camera so they're
    // unaffected by the main camera's scrolling and zoom
    cam.ignore(this.ui);
    this.uiCam = this.cameras
      .add(0, 0, GAME_WIDTH, GAME_HEIGHT, true)
      .setScroll(0, 0);
    this.uiCam.ignore(this.children.list.filter(obj => obj !== this.ui));
  }

  spawnEnemy(kind, x, y, props, map) {
    const enemy = new Sockroach(this, x, y, this.player.displayHeight);
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

    this.enemies.add(enemy);
    return enemy;
  }

  spawnCollectible(kind, x, y, props) {
    const toast = this.collectibles.create(x, y, 'toast').setOrigin(0, 1);
    const scale = (this.player.displayHeight / toast.height) * 0.35;
    toast.setScale(scale);
    // Ensure the physics body matches the visual size and remains static
    toast.body.setSize(toast.width * scale, toast.height * scale);
    toast.body.setOffset(0, toast.height * (1 - scale));
    toast.setImmovable(true);
    toast.value = Number(props.value ?? 1);
    toast.bobTween = this.tweens.add({
      targets: toast,
      y: y - 10,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    this.physics.add.overlap(this.player, toast, () => {
      this.collectToast(toast);
    });
    return toast;
  }

  update() {
    this.player.update();
    this.enemies.children.iterate(e => {
      if (!e || e.alive === false) return;
      if (e.patrol && e.patrol.length >= 2) {
        // Determine the next waypoint based on current index and direction
        let nextIndex = e.patrolIndex + e.patrolDir;
        if (!e.patrol[nextIndex]) {
          // Reverse direction at the ends of the path
          e.patrolDir *= -1;
          nextIndex = e.patrolIndex + e.patrolDir;
        }
        const target = e.patrol[nextIndex];
        const dx = target.x - e.x;
        const dist = Math.abs(dx);
        if (dist < 2) {
          e.patrolIndex = nextIndex;
          e.setVelocityX(0);
        } else {
          const vx = Math.sign(dx) * e.speed;
          e.setVelocityX(vx);
          e.flipX = vx < 0;
        }
      } else if (e.update) {
        e.update();
      }
    });
  }

  handlePlayerEnemy(playerObj, enemy) {
    if (enemy.alive === false) return;

    const playerBottom = playerObj.body.bottom;
    const enemyTop = enemy.body.top;
    const falling =
      playerObj.body.velocity.y > 0 ||
      playerObj.body.prev.y < playerObj.body.y;

    if (falling && playerBottom <= enemyTop + 5) {
      this.landEnemySound.play();
      enemy.alive = false;
      enemy.play('sockroach_stomp');
      enemy.setVelocity(0, 0);
      playerObj.setVelocityY(-300);
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

  collectToast(toast) {
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
    this.toastCount += toast.value;
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
    const scale = (this.player.displayHeight / srcImage.height) * 1;
    this.healthIcons = [];
    for (let i = 0; i < this.health; i++) {
      const x = 10 + i * (srcImage.width * scale + 5);
      const icon = this.add
        .image(x, 30, 'lenny_face')
        .setOrigin(0, 0)
        .setScale(scale)
        .setDepth(10)
        .setScrollFactor(0);
      this.ui.add(icon);
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
}
