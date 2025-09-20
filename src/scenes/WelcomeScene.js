/* global Phaser */
import { GAME_WIDTH, GAME_HEIGHT } from '../constants.js';
import { getRecentChangeLogEntries, formatChangeLogEntries } from '../data/changelog.js';

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

    // const prompt = this.add.text(width / 2, height * 0.82, 'Press SPACE or Click to Start', {
    //   fontFamily: 'monospace',
    //   fontSize: '48px',
    //   color: '#ffffff',
    //   stroke: '#000000',
    //   strokeThickness: 6
    // });
    // prompt.setOrigin(0.5);

    this.createChangeLogUI(width, height, frame);

    this.input.keyboard.once('keydown-SPACE', this.startGame, this);
    this.input.keyboard.once('keydown-ENTER', this.startGame, this);

    this.handlePointerDown = (pointer, currentlyOver = []) => {
      const interactedWithUI = currentlyOver.some((gameObject) => gameObject?.getData('uiElement'));
      if (interactedWithUI) {
        return;
      }

      this.input.off('pointerdown', this.handlePointerDown, this);
      this.startGame();
    };

    this.input.on('pointerdown', this.handlePointerDown, this);
    if (this.input.gamepad) {
      this.input.gamepad.once('down', this.startGame, this);
    }
  }

  createChangeLogUI(width, height, frame) {
    const button = this.add.text(width / 2, height * 0.9, 'Change Log', {
      fontFamily: 'monospace',
      fontSize: '36px',
      color: '#ffcc00',
      stroke: '#000000',
      strokeThickness: 6,
      backgroundColor: 'rgba(0, 0, 0, 0.65)',
      padding: { x: 16, y: 8 }
    });
    button.setOrigin(0.5);
    button.setInteractive({ useHandCursor: true });
    button.setData('uiElement', true);

    const panelWidth = frame.displayWidth * 0.7;
    const panelHeight = frame.displayHeight * 0.65;

    const panelBackground = this.add.rectangle(0, 0, panelWidth, panelHeight, 0x000000, 0.85);
    panelBackground.setStrokeStyle(4, 0xffffff, 0.9);
    panelBackground.setInteractive();

    const panelContainer = this.add.container(width / 2, height / 2, [panelBackground]);
    panelContainer.setDepth(10);

    const heading = this.add.text(0, -panelHeight / 2 + 24, 'Latest Updates', {
      fontFamily: 'monospace',
      fontSize: '40px',
      color: '#ffcc00',
      stroke: '#000000',
      strokeThickness: 6
    });
    heading.setOrigin(0.5, 0);
    panelContainer.add(heading);

    const updates = getRecentChangeLogEntries();
    const changeLogText = updates.length ? formatChangeLogEntries(updates) : 'No updates yet. Check back soon!';
    const updatesText = this.add.text(-panelWidth / 2 + 32, -panelHeight / 2 + 96, changeLogText, {
      fontFamily: 'monospace',
      fontSize: '28px',
      color: '#ffffff',
      wordWrap: { width: panelWidth - 64 },
      lineSpacing: 8
    });
    updatesText.setOrigin(0, 0);
    updatesText.setInteractive();
    updatesText.setData('uiElement', true);
    panelContainer.add(updatesText);

    const closeButton = this.add.text(panelWidth / 2 - 24, -panelHeight / 2 + 16, '✕', {
      fontFamily: 'monospace',
      fontSize: '32px',
      color: '#ffffff'
    });
    closeButton.setOrigin(1, 0);
    closeButton.setInteractive({ useHandCursor: true });
    closeButton.setData('uiElement', true);
    closeButton.on('pointerup', () => {
      panelContainer.setVisible(false);
    });
    panelContainer.add(closeButton);

    panelContainer.iterate((child) => child.setData && child.setData('uiElement', true));
    panelContainer.setVisible(false);

    button.on('pointerup', () => {
      const isVisible = panelContainer.visible;
      panelContainer.setVisible(!isVisible);
    });

    this.changeLogButton = button;
    this.changeLogPanel = panelContainer;
  }

  startGame() {
    if (this.changeLogPanel?.visible) {
      this.changeLogPanel.setVisible(false);
    }
    if (this.handlePointerDown) {
      this.input.off('pointerdown', this.handlePointerDown, this);
      this.handlePointerDown = null;
    }
    this.scene.start('Level1');
  }
}
