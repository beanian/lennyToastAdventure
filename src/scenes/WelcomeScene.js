/* global Phaser */
import { GAME_WIDTH, GAME_HEIGHT } from '../constants.js';

export default class WelcomeScene extends Phaser.Scene {
  constructor() {
    super('Welcome');
  }

  create() {
    const width = this.scale?.width || GAME_WIDTH;
    const height = this.scale?.height || GAME_HEIGHT;

    this.cameras.main.setBackgroundColor('#000000');

    const frame = this.add.image(width / 2, height / 2, 'ui_frame');
    const maxFrameWidth = width * 0.8;
    const maxFrameHeight = height * 0.8;
    const frameScale = Math.min(maxFrameWidth / frame.width, maxFrameHeight / frame.height);
    frame.setScale(frameScale);

    const welcomeImage = this.add.image(width / 2, height / 2, 'welcome_screen');
    const innerWidth = frame.displayWidth * 0.88;
    const innerHeight = frame.displayHeight * 0.88;
    const welcomeScale = Math.min(innerWidth / welcomeImage.width, innerHeight / welcomeImage.height);
    welcomeImage.setScale(welcomeScale);

    const prompt = this.add.text(width / 2, height * 0.85, 'Press SPACE or Click to Start', {
      fontFamily: 'monospace',
      fontSize: '48px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 6
    });
    prompt.setOrigin(0.5);

    this.input.keyboard.once('keydown-SPACE', this.startGame, this);
    this.input.keyboard.once('keydown-ENTER', this.startGame, this);
    this.input.once('pointerdown', this.startGame, this);
    if (this.input.gamepad) {
      this.input.gamepad.once('down', this.startGame, this);
    }
  }

  startGame() {
    this.scene.start('Level1');
  }
}
