/* global Phaser */
import Player from '../entities/Player.js';
import Sockroach from '../entities/Sockroach.js';
import { GAME_WIDTH, GAME_HEIGHT, DEBUG } from '../constants.js';
import { init as audioInit, sfx, music } from '../AudioBus.js';
import InputService from '../services/InputService.js';

export default class BaseLevelScene extends Phaser.Scene {
  constructor(key, mapKey) {
    super(key);
    this.mapKey = mapKey;
  }

  create() {
    audioInit(this);
    // --- Map + tiles ---
    const map = this.make.tilemap({ key: this.mapKey });
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
    this.inputService = new InputService(this);
    this.player = new Player(this, spawnX, spawnY, this.inputService);
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
    this.bgm = music('bgm', { loop: true, volume: 0.5 });

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

    // (debug setup runs after UI is created below)

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

    // --- Debug setup (gizmos, hitboxes, state text) ---
    this.setupDebug(map, { ground, platforms, entities });
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
          e.flipX = vx > 0;
        }
      } else if (e.update) {
        e.update();
      }
    });
    // Update debug state text (cheap, short string build)
    if (this.debugText && this.debugText.visible) {
      const onGround = this.player.body?.blocked?.down;
      const vx = Math.round(this.player.body?.velocity?.x || 0);
      const vy = Math.round(this.player.body?.velocity?.y || 0);
      const anim = this.player.anims?.currentAnim?.key || this.player.texture?.key;
      this.debugText.setText(
        `DEBUG\n` +
          `pos:(${Math.round(this.player.x)},${Math.round(this.player.y)}) vel:(${vx},${vy})\n` +
          `ground:${!!onGround} jumps:${this.player.jumpCount ?? 0} inv:${!!this.isInvincible} hp:${this.health}\n` +
          `anim:${anim} enemies:${this.enemies?.getLength?.() ?? 0}`
      );
    }
  }

  handlePlayerEnemy(playerObj, enemy) {
    if (enemy.alive === false) return;

    const playerBottom = playerObj.body.bottom;
    const enemyTop = enemy.body.top;
    const falling =
      playerObj.body.velocity.y > 0 ||
      playerObj.body.prev.y < playerObj.body.y;

    if (falling && playerBottom <= enemyTop + 5) {
      sfx('landEnemy');
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
      sfx('hurt');
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
    sfx('toastCollect');
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
    sfx('death');
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
        const respawn = sfx('respawn');
        respawn.once('complete', () => {
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

  // --- Debug helpers ---
  setupDebug(map, layers) {
    // Keyboard toggles
    const kb = this.input?.keyboard;
    if (kb) {
      kb.on('keydown-F3', () => this.toggleDebug());
      kb.on('keydown-F4', () => this.toggleHitboxes());
      kb.on('keydown-F5', () => this.toggleGizmos());
      kb.on('keydown-F6', () => this.toggleStateText());
    }

    // URL param ?debug=1 to force on at start
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('debug') === '1' || params.get('debug') === 'true') {
        DEBUG.enabled = true;
      }
    } catch (_) {}

    // Create containers
    this.debugGfx = this.add.graphics().setDepth(1000);
    this.debugGfx.setScrollFactor(1);
    this.debugLabels = [];

    this.debugText = this.add
      .text(10, 90, '', { font: '14px Courier', fill: '#00ff88' })
      .setScrollFactor(0)
      .setDepth(1000);
    this.ui.add(this.debugText);

    // Physics debug graphic is owned by the world; create once
    if (!this.physics.world.debugGraphic) {
      this.physics.world.createDebugGraphic();
    }

    // Keep originals for toggles before gizmos draw
    this._mapOriginal = map;
    this._entitiesOriginal = layers.entities;

    // Initial render based on flags
    this.applyDebugFlags(map, layers);
  }

  applyDebugFlags(map, { entities }) {
    const enabled = !!DEBUG.enabled;
    // Hitboxes
    const hb = enabled && DEBUG.showHitboxes;
    this.physics.world.drawDebug = hb;
    if (this.physics.world.debugGraphic) {
      this.physics.world.debugGraphic.setVisible(hb);
    }
    // Gizmos
    const gz = enabled && DEBUG.showGizmos;
    this.debugGfx.setVisible(gz);
    this.debugGfx.clear();
    // clear old labels
    if (this.debugLabels?.length) {
      this.debugLabels.forEach(t => t.destroy());
      this.debugLabels.length = 0;
    }
    if (gz) this.drawGizmos(map, entities);
    // State text
    const st = enabled && DEBUG.showState;
    this.debugText.setVisible(st);
  }

  toggleDebug() {
    DEBUG.enabled = !DEBUG.enabled;
    const map = this._mapOriginal || this._mapCache;
    const entities = this._entitiesOriginal || this._entitiesCache;
    this.applyDebugFlags(map, { entities });
  }

  toggleHitboxes() {
    DEBUG.showHitboxes = !DEBUG.showHitboxes;
    const map = this._mapOriginal || this._mapCache;
    const entities = this._entitiesOriginal || this._entitiesCache;
    this.applyDebugFlags(map, { entities });
  }

  toggleGizmos() {
    DEBUG.showGizmos = !DEBUG.showGizmos;
    const map = this._mapOriginal || this._mapCache;
    const entities = this._entitiesOriginal || this._entitiesCache;
    this.applyDebugFlags(map, { entities });
  }

  toggleStateText() {
    DEBUG.showState = !DEBUG.showState;
    const map = this._mapOriginal || this._mapCache;
    const entities = this._entitiesOriginal || this._entitiesCache;
    this.applyDebugFlags(map, { entities });
  }

  drawGizmos(map, entitiesLayer) {
    const g = this.debugGfx;
    if (!g) return;

    // Cache inputs for toggles
    this._mapCache = map;
    this._entitiesCache = entitiesLayer;

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
            const t = this.add.text(pts[0].x - 18, pts[0].y - 18, o.name || 'path', {
              font: '12px Courier',
              color: '#00ffff'
            }).setDepth(1000).setScrollFactor(1);
            this.debugLabels.push(t);
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
          this.drawCross(g, x, y, 10, 0x55ff55);
          this.drawLabel(x + 8, y - 18, o.name || 'Spawn', '#55ff55');
        } else if (type === 'enemy') {
          this.drawCross(g, x, y, 8, 0xffaa00);
          this.drawLabel(x + 8, y - 18, props.kind || 'enemy', '#ffcc66');
        } else if (type === 'collectible') {
          this.drawCross(g, x, y, 6, 0xffcc00);
          this.drawLabel(x + 8, y - 18, props.kind || 'col', '#ffcc00');
        } else if (type === 'damage') {
          this.drawDamageObject(g, o);
        }
      });
    }

    // Layers named Damage/Hazards (optional)
    const damageLayer = map.getObjectLayer('Damage') || map.getObjectLayer('Hazards');
    if (damageLayer) {
      damageLayer.objects.forEach(o => this.drawDamageObject(g, o));
    }
  }

  drawCross(g, x, y, r, color) {
    g.lineStyle(2, color, 1);
    g.beginPath();
    g.moveTo(x - r, y);
    g.lineTo(x + r, y);
    g.moveTo(x, y - r);
    g.lineTo(x, y + r);
    g.strokePath();
  }

  drawLabel(x, y, text, color) {
    const t = this.add
      .text(x, y, text, { font: '12px Courier', color })
      .setDepth(1000)
      .setScrollFactor(1);
    this.debugLabels.push(t);
  }

  drawDamageObject(g, o) {
    g.lineStyle(2, 0xff4444, 1);
    g.fillStyle(0xff4444, 0.2);
    if (o.width && o.height) {
      g.fillRect(o.x, o.y - o.height, o.width, o.height);
      g.strokeRect(o.x, o.y - o.height, o.width, o.height);
      this.drawLabel(o.x + 4, o.y - o.height - 14, o.name || 'damage', '#ff7777');
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
      this.drawLabel(ox + 4, oy - 14, o.name || 'damage', '#ff7777');
      return;
    }
    if (o.polyline && Array.isArray(o.polyline) && o.polyline.length) {
      g.beginPath();
      g.moveTo(ox + o.polyline[0].x, oy + o.polyline[0].y);
      for (let i = 1; i < o.polyline.length; i++)
        g.lineTo(ox + o.polyline[i].x, oy + o.polyline[i].y);
      g.strokePath();
      this.drawLabel(ox + 4, oy - 14, o.name || 'damage', '#ff7777');
    }
  }
}

