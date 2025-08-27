import { VERSION, GAME_WIDTH, GAME_HEIGHT } from './constants.js';
import Boot from './scenes/Boot.js';
import Preload from './scenes/Preload.js';
import Level1Scene from './scenes/Level1Scene.js';
import UIScene from './scenes/UIScene.js';

document.title = `Lenny Toast Adventure ${VERSION}`;

const config = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  pixelArt: true,
  height: GAME_HEIGHT,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  // Camera zoom is managed in Level1Scene after the map loads
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 700 } }
  },
  scene: [Boot, Preload, Level1Scene, UIScene]
};

new Phaser.Game(config);
