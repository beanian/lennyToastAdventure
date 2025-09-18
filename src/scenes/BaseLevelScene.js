/* global Phaser */
import Player from '../entities/Player.js';
import { GAME_WIDTH, GAME_HEIGHT } from '../constants.js';
import { init as audioInit, sfx, music } from '../AudioBus.js';
import InputService from '../services/InputService.js';
import { createHUD, showLevelSuccess } from './systems/HUD.js';
import { setupDebug } from './systems/DebugHelpers.js';
import { spawnEnemy, spawnCollectible } from './systems/Spawners.js';
import MobileControls from '../services/MobileControls.js';
import { resetLevelStats, addSockroachKill, setRawLevelTime, addLifeLost } from '../services/LevelStats.js';

export default class BaseLevelScene extends Phaser.Scene {
  constructor(key, mapKey) {
    super(key);
    this.mapKey = mapKey;
  }

  resetLevelTimer() {
    this.levelTimerStart = null;
    this.levelTimerElapsed = 0;
    this.levelTimerRunning = false;
    if (typeof this.updateLevelTimerDisplay === 'function') {
      this.updateLevelTimerDisplay(0);
    }
  }

  startLevelTimer() {
    if (this.levelTimerRunning || this.isLevelComplete || this.isDead) return;
    this.levelTimerStart = this.time.now;
    this.levelTimerElapsed = 0;
    this.levelTimerRunning = true;
  }

  stopLevelTimer() {
    if (this.levelTimerRunning && this.levelTimerStart != null) {
      this.levelTimerElapsed = (this.time.now - this.levelTimerStart) / 1000;
    }
    this.levelTimerRunning = false;
    if (typeof this.updateLevelTimerDisplay === 'function') {
      this.updateLevelTimerDisplay(this.levelTimerElapsed);
    }
    return this.levelTimerElapsed;
  }

  getLevelElapsedTime() {
    if (this.levelTimerRunning && this.levelTimerStart != null) {
      return (this.time.now - this.levelTimerStart) / 1000;
    }
    return this.levelTimerElapsed || 0;
  }

  create() {
    audioInit(this);
    this.levelTimerStart = null;
    this.levelTimerElapsed = 0;
    this.levelTimerRunning = false;
    this.isLevelComplete = false;
    this.levelEndZone = null;
    resetLevelStats();
    this.sockroachKills = 0;
    // --- Map + tiles ---
    const map = this.make.tilemap({ key: this.mapKey });
    const tiles = map.addTilesetImage(
      'nature-paltformer-tileset-16x16',
      'tiles',
      map.tileWidth,
      map.tileHeight,
      0,
      0
    );

    map.createLayer('Sky', tiles, 0, 0).setDepth(-2);
    map.createLayer('DecorBack', tiles, 0, 0).setDepth(-1);
    const ground = map.createLayer('Ground', tiles, 0, 0).setDepth(0);
    const platforms =
      map.getLayerIndex('Platforms') !== -1
        ? map.createLayer('Platforms', tiles, 0, 0).setDepth(0)
        : null;
    map.createLayer('DecorForground', tiles, 0, 0).setDepth(2);
    // Object layer holding spawns, enemies, collectibles
    const entities = map.getObjectLayer('Objects');

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

    // --- Helpers for Objects layer parsing using gid -> tileset tile properties (Actors tileset)
    const FLIP_FLAGS = 0xe0000000; // Tiled flip flag mask
    const rawMap = this.cache.tilemap?.get(this.mapKey) || this.cache.json?.get(this.mapKey);
    const rawTilesets = Array.isArray(rawMap.data?.tilesets) ? rawMap.data.tilesets : [];
    const getRawTilesetForGid = gid => {
      const g = gid & ~FLIP_FLAGS;
      let candidate = null;
      for (const ts of rawTilesets) {
        if (typeof ts.firstgid !== 'number') continue;
        if (g >= ts.firstgid) {
          if (!candidate || ts.firstgid > candidate.firstgid) candidate = ts;
        }
      }
      return candidate;
    };
    const toObj = props => {
      if (!props) return {};
      if (Array.isArray(props)) return Object.fromEntries(props.map(p => [p.name, p.value]));
      return { ...props };
    };
    const getPropsFromGid = gid => {
      if (!gid) return {};
      const ts = getRawTilesetForGid(gid);
      if (!ts) return {};
      const localId = (gid & ~FLIP_FLAGS) - ts.firstgid;
      // Prefer explicit tiles array (collection-of-images tileset)
      if (Array.isArray(ts.tiles)) {
        const t = ts.tiles.find(ti => ti.id === localId);
        if (t && Array.isArray(t.properties)) return toObj(t.properties);
      }
      // Fallback to per-tileset tile properties structure, if present
      if (ts.tileproperties && ts.tileproperties[localId]) return toObj(ts.tileproperties[localId]);
      if (ts.tileProperties && ts.tileProperties[localId]) return toObj(ts.tileProperties[localId]);
      return {};
    };
    // Helper to extract a normalized type/kind from an object, preferring gid tile properties, then object properties, then name
    const getInfo = obj => {
      const tileProps = getPropsFromGid(obj.gid);
      const objProps = toObj(obj.properties);
      const props = { ...tileProps, ...objProps };
      let kind = (props.kind || '').toLowerCase();
      // type is meta; may be empty; infer spawn from kind
      let type = (props.type || '').toLowerCase();
      if (!kind) {
        const nameL = (obj.name || '').toLowerCase();
        if (/spawn|player/.test(nameL)) kind = 'player';
        else if (/sockroach|roach|enemy/.test(nameL)) kind = 'sockroach';
        else if (/toast|collect/.test(nameL)) kind = 'toast';
      }
      if (!type && kind === 'player') type = 'spawn';
      // coerce numeric strings
      if (props.speed != null) props.speed = Number(props.speed);
      if (props.value != null) props.value = Number(props.value);
      if (props.patrolWidth != null) props.patrolWidth = Number(props.patrolWidth);
      return { props, type, kind };
    };

    // --- Player spawn from Objects object layer
    let spawnX = 64;
    let spawnY = 64;
    if (entities && Array.isArray(entities.objects)) {
      // Find an explicit spawn, or fallback to first object
      let spawn = null;
      for (const obj of entities.objects) {
        const info = getInfo(obj);
        if (info.kind === 'player' || info.type === 'spawn') { spawn = obj; break; }
      }
      if (!spawn && entities.objects.length) spawn = entities.objects[0];
      if (spawn) {
        spawnX = spawn.x;
        spawnY = spawn.y - (spawn.height || 0);
      }
    }

    Player.createAnimations(this);
    // Enemy animations are created on demand in their class
    this.inputService = new InputService(this);
    this.mobileControls = new MobileControls(this, this.inputService);
    this.events.once('shutdown', () => {
      this.mobileControls = null;
    });
    this.events.once('destroy', () => {
      this.mobileControls = null;
    });
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
    // Choose a zoom that never shrinks the world below the viewport.
    // If the map is narrower/taller than the screen, zoom in to fill it.
    // If the map is larger, use 1:1 so only the current area is visible.
    let zoomW = GAME_WIDTH / Math.max(1, mapW);
    let zoomH = GAME_HEIGHT / Math.max(1, mapH);
    let zoom = Math.max(1, Math.max(zoomW, zoomH));
    zoom = Phaser.Math.Clamp(zoom, 1, 3);
    const cam = this.cameras.main;
    cam.setZoom(2);
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

    // --- Parse Objects layer: enemies + collectibles from object properties ---
    if (entities && Array.isArray(entities.objects)) {
      const groundLayers = [ground, platforms].filter(Boolean);
      entities.objects.forEach(obj => {
        const info = getInfo(obj);
        const x = obj.x;
        const y = obj.y - (obj.height || 0);
        const w = obj.width || map.tileWidth;
        const h = obj.height || map.tileHeight;
        if (info.props.levelEnd) {
          const zx = x + w / 2;
          const zy = y + h / 2;
          this.levelEndZone = this.add.zone(zx, zy, w, h);
          this.physics.add.existing(this.levelEndZone, true);
        } else if (info.kind === 'sockroach') {
          // Support optional pathName for polyline patrols; else fall back to patrolWidth or default
          spawnEnemy(this, 'sockroach', x, y, info.props, map, groundLayers);
        } else if (info.kind === 'toast') {
          spawnCollectible(this, 'toast', x, y, info.props);
        } else if (info.kind && info.kind !== 'player') {
          // Unknown kind: ignore gracefully
          if (console && console.warn) console.warn('Unknown object kind', info.kind, obj);
        }
      });
    }

    // --- UI ---
    createHUD(this);
    this.resetLevelTimer();

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
    if (!this.levelTimerRunning && !this.isLevelComplete && !this.isDead && this.inputService) {
      if (this.inputService.hasControlInput()) {
        this.startLevelTimer();
      }
    }

    if (this.isDead && this.levelTimerRunning) {
      this.stopLevelTimer();
    }

    if (this.levelTimerRunning && typeof this.updateLevelTimerDisplay === 'function') {
      this.updateLevelTimerDisplay(this.getLevelElapsedTime());
    }

    if (this.isLevelComplete) return;
    if (
      this.levelEndZone &&
      this.physics.overlap(this.player, this.levelEndZone) &&
      this.inputService.upJustPressed()
    ) {
      this.levelComplete();
      return;
    }
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

  levelComplete() {
    this.isLevelComplete = true;
    this.physics.world.pause();
    if (this.playerEnemyCollider) this.playerEnemyCollider.active = false;
    if (this.player?.body) this.player.body.enable = false;
    this.player.play('walk', true);
    sfx('levelSuccess');
    const targetX = this.levelEndZone?.x || this.player.x;
    this.tweens.add({
      targets: this.player,
      x: targetX,
      duration: 600,
      onComplete: () => {
        this.player.setVisible(false);
        const elapsed = this.stopLevelTimer();
        setRawLevelTime(elapsed);
        showLevelSuccess(this, elapsed, this.mapKey || this.scene.key);
      }
    });
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
      this.sockroachKills = addSockroachKill();
      enemy.once('animationcomplete-sockroach_stomp', () => {
        enemy.setVelocityY(-200);
        this.time.delayedCall(1000, () => enemy.destroy());
      });
    } else {
      if (this.isInvincible) return;
      sfx('hurt');
      this.health -= 1;
      addLifeLost();
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
