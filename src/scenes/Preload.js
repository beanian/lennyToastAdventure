import manifest from '../assets/manifest.js';
import Player from '../entities/Player.js';
import Sockroach from '../entities/Sockroach.js';

export default class Preload extends Phaser.Scene {
  constructor() {
    super('Preload');
  }

  preload() {
    manifest.forEach(asset => {
      const { type, key, url, data } = asset;
      if (this.load[type]) {
        this.load[type](key, url, data);
      }
    });

    this.load.tilemapTiledJSON('level1', 'src/data/level1/level1.tmj');
    this.load.image('tiles', 'src/assets/sprites/nature-paltformer-tileset-16x16.png');

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
    this.scene.start('Level1');
    this.scene.start('UIScene');
  }
}
