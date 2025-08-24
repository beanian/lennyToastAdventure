import { VERSION } from './constants.js';
import MainScene from './scenes/MainScene.js';

document.title = `Lenny Toast Adventure ${VERSION}`;

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  pixelArt: true,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 1000 },
      debug: false
    }
  },
  scene: MainScene
};

new Phaser.Game(config);
