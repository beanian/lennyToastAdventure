import { VERSION, GAME_WIDTH, GAME_HEIGHT, DEBUG } from './constants.js';
import BootScene from './scenes/BootScene.js';
import PreloadScene from './scenes/PreloadScene.js';
import WelcomeScene from './scenes/WelcomeScene.js';
import Level1Scene from './scenes/Level1Scene.js';
import BananarchistTestScene from './scenes/BananarchistTestScene.js';
import { PHYSICS_TUNING } from './data/gameTuning.js';

document.title = `Lenny Toast Quest ${VERSION}`;

const LEVEL_SCENES = [Level1Scene];
const DEBUG_SCENES = [BananarchistTestScene];

const config = {
  type: Phaser.AUTO,
  parent: 'game-root',
  width: GAME_WIDTH,
  pixelArt: true,
  backgroundColor: '#000000',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_WIDTH,
    height: GAME_HEIGHT
  },
  // Camera zoom is managed by level scenes after the map loads.
  input: { gamepad: true },
  dom: { createContainer: true },
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: PHYSICS_TUNING.gravityY }, debug: DEBUG.enabled }
  },
  scene: [BootScene, PreloadScene, WelcomeScene, ...LEVEL_SCENES, ...DEBUG_SCENES]
};

new Phaser.Game(config);
