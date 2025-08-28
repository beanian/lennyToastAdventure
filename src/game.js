import { VERSION, GAME_WIDTH, GAME_HEIGHT, DEBUG } from './constants.js';
import BootScene from './scenes/BootScene.js';
import PreloadScene from './scenes/PreloadScene.js';
import Level1Scene from './scenes/Level1Scene.js';

document.title = `Lenny Toast Adventure ${VERSION}`;

const config = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  pixelArt: true,
  height: GAME_HEIGHT,
  // Camera zoom is managed in Level1Scene after the map loads
  input: { gamepad: true },
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 700 }, debug: DEBUG.enabled }
  },
  scene: [BootScene, PreloadScene, Level1Scene]
};

new Phaser.Game(config);
