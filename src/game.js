import { VERSION } from './constants.js';
import Level1Scene from './scenes/Level1Scene.js';

document.title = `Lenny Toast Adventure ${VERSION}`;

const config = {
  type: Phaser.AUTO,
  width: 1920,
  height: 1080,
  // If you designed the map for a chunkier look, enable zoom: 2
  // zoom: 2,
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 700 } }
  },
  scene: [Level1Scene]
};

new Phaser.Game(config);
