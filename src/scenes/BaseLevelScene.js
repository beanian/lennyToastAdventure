/* global Phaser */
import Player from '../entities/Player.js';
import { GAME_WIDTH, GAME_HEIGHT } from '../constants.js';
import { init as audioInit, sfx, music } from '../AudioBus.js';
import InputService from '../services/InputService.js';
import { createHUD } from './systems/HUD.js';
import { setupDebug } from './systems/DebugHelpers.js';
import { spawnEnemy, spawnCollectible } from './systems/Spawners.js';

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
    // Enemy animations are created on demand in their class
    this.inputService = new InputService(this);
    this.player = new Player(this, spawnX, spawnY, this.inputService);
    this.spawnPoint = { x: spawnX, y: spawnY };

    // --- Colliders ---
    this.physics.add.collider(this.player, ground);
    if (platforms) this.physics.add.collider(this.player, platforms);
    this.playerEnemyCollider = this.physics.add.collider(
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

    // Trigger death if player hits the bottom world bound (fell off level)
    if (this.player.body) {
      this.player.body.onWorldBounds = true;
      this._onWorldBounds = (body, up, down) => {
        if (body?.gameObject === this.player && down) {
          this.playerDie();
        }
      };
      this.physics.world.on('worldbounds', this._onWorldBounds, this);
      this.events.once('shutdown', () => {
        const world = this.physics?.world;
        if (world) {
          world.off('worldbounds', this._onWorldBounds, this);
        }
        this._onWorldBounds = null;
      });
    }

    // --- Enemy vs ground/platforms ---
    this.physics.add.collider(this.enemies, ground);
    if (platforms) this.physics.add.collider(this.enemies, platforms);

    // --- Audio ---
    // Use persisted music volume (do not override)
    this.bgm = music('bgm', { loop: true });

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
          spawnEnemy(this, kind, x, y, props, map);
        } else if (type === 'collectible') {
          spawnCollectible(this, kind, x, y, props);
        }
      });
    }

    // --- UI ---
    createHUD(this);

    // --- Debug setup (gizmos, hitboxes, state text) ---
    setupDebug(this, map, { ground, platforms, entities });

    // Pause toggle (ESC)
    const kb = this.input?.keyboard;
    if (kb) {
      kb.on('keydown-ESC', () => {
        this.togglePause();
      });
    }
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
    if (this.isDead) return;
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
}

