/* global Phaser */
import BaseLevelScene from './BaseLevelScene.js';
import Player from '../entities/Player.js';
import Bananarchrist from '../entities/Bananarchrist.js';
import { init as audioInit, music } from '../AudioBus.js';
import InputService from '../services/InputService.js';
import MobileControls from '../services/MobileControls.js';
import { createHUD } from './systems/HUD.js';
import { setupDebug } from './systems/DebugHelpers.js';
import { GAME_WIDTH, GAME_HEIGHT } from '../constants.js';
import { resetLevelStats } from '../services/LevelStats.js';

const WORLD_WIDTH = 1600;
const WORLD_HEIGHT = 900;
const GROUND_HEIGHT = 64;

export default class BananarchristTestScene extends BaseLevelScene {
  constructor() {
    super('BananarchristTest', null);
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

    this.cameras.main.setBackgroundColor('#1d2133');

    this.enemies = this.physics.add.group();
    this.collectibles = this.physics.add.group({ allowGravity: false, immovable: true });

    Player.createAnimations(this);
    Bananarchrist.createAnimations(this);

    this.inputService = new InputService(this);
    this.mobileControls = new MobileControls(this, this.inputService);
    this.events.once('shutdown', () => {
      this.mobileControls = null;
    });
    this.events.once('destroy', () => {
      this.mobileControls = null;
    });

    const groundTop = WORLD_HEIGHT - GROUND_HEIGHT;
    const spawnX = WORLD_WIDTH * 0.25;
    const spawnY = groundTop;

    const ground = this.add
      .rectangle(WORLD_WIDTH / 2, groundTop + GROUND_HEIGHT / 2, WORLD_WIDTH, GROUND_HEIGHT, 0x3a2e22)
      .setOrigin(0.5, 0.5);
    this.physics.add.existing(ground, true);

    const backdrop = this.add
      .rectangle(WORLD_WIDTH / 2, groundTop / 2, WORLD_WIDTH, groundTop, 0x262b3d)
      .setOrigin(0.5, 0.5)
      .setDepth(-2);
    backdrop.setScrollFactor(1);

    this.player = new Player(this, spawnX, spawnY, this.inputService);
    this.spawnPoint = { x: spawnX, y: spawnY };

    const enemy = new Bananarchrist(this, WORLD_WIDTH * 0.6, spawnY-50, this.player.displayHeight, {
      speed: 70,
      range: 320
    });
    this.enemies.add(enemy);

    this.physics.add.collider(this.player, ground);
    this.physics.add.collider(this.enemies, ground);

    this.playerEnemyCollider = this.physics.add.collider(
      this.player,
      this.enemies,
      this.handlePlayerEnemy,
      null,
      this
    );

    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    const cam = this.cameras.main;
    cam.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    cam.setZoom(2);
    cam.setSize(GAME_WIDTH, GAME_HEIGHT);
    cam.startFollow(this.player, true, 0.08, 0.08);

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

    this.bgm = music('bgm', { loop: true });

    createHUD(this);
    this.resetLevelTimer();

    const debugMap = {
      getObjectLayer: () => null
    };
    setupDebug(this, debugMap, { ground, platforms: null, entities: null });

    const kb = this.input?.keyboard;
    if (kb) {
      kb.on('keydown-ESC', () => {
        this.togglePause();
      });
    }
  }
}
