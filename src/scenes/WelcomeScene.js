/* global Phaser */
import { GAME_WIDTH, GAME_HEIGHT } from '../constants.js';
import { getRecentChangeLogEntries, formatChangeLogEntries } from '../data/changelog.js';
import { getStartLevel } from '../data/levels.js';
import {
  init as audioInit,
  sfx,
  getMusicVolume,
  setMusicVolume,
  getSfxVolume,
  setSfxVolume,
  previewMusicVolume,
  previewSfxVolume
} from '../AudioBus.js';
import { getLeaderboard } from '../services/LeaderboardService.js';

const isDebugEnabled = () => {
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get('debug') === '1' || params.get('debug') === 'true';
  } catch (_) {
    return false;
  }
};

const escapeHtml = value => {
  if (value === null || value === undefined) return '';
  return String(value).replace(/[&<>"']/g, char => {
    switch (char) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      case "'":
        return '&#39;';
      default:
        return char;
    }
  });
};

export default class WelcomeScene extends Phaser.Scene {
  constructor() {
    super('Welcome');
  }

  create() {
    audioInit(this);
    this.width = this.scale?.width || GAME_WIDTH;
    this.height = this.scale?.height || GAME_HEIGHT;
    this.menuItems = [];
    this.selectedMenuIndex = 0;
    this.activePanel = null;
    this.transitioning = false;

    this.cameras.main.setBackgroundColor('#000000');
    this.cameras.main.fadeIn(250, 0, 0, 0);

    const frame = this.add.image(this.width / 2, this.height / 2, 'ui_frame');
    const maxFrameWidth = this.width * 0.8;
    const maxFrameHeight = this.height * 0.8;
    const frameScale = Math.min(maxFrameWidth / frame.width, maxFrameHeight / frame.height);
    frame.setScale(frameScale);
    frame.setVisible(false);

    const welcomeImage = this.add.image(this.width / 2, this.height / 2, 'welcome_screen');
    const innerWidth = frame.displayWidth * 0.96;
    const innerHeight = frame.displayHeight * 0.96;
    const welcomeScale = Math.min(innerWidth / welcomeImage.width, innerHeight / welcomeImage.height);
    welcomeImage.setScale(welcomeScale);

    this.createTitleLogo();
    this.createMainMenu();
    this.createPanels(frame);
    if (isDebugEnabled()) {
      this.createSecretTestButton();
    }
    this.bindMenuInput();
    this.setSelectedMenuIndex(0);
  }

  createMainMenu() {
    const menuX = this.width / 2;
    const rowCenters = [
      this.height * 0.659,
      this.height * 0.724,
      this.height * 0.79,
      this.height * 0.855
    ];
    this.mainMenu = this.add.container(0, 0).setDepth(5);

    const startButton = this.createMenuButton('Start', menuX, rowCenters[0], 300, () => this.startGame(), {
      fontSize: 36,
      hitWidth: 440,
      hitHeight: 58
    });
    this.menuItems.push(startButton);
    this.mainMenu.add([startButton.leftMarker, startButton.rightMarker, startButton.text, startButton.zone]);

    [
      ['Options', () => this.showPanel('options')],
      ['Leaderboard', () => this.showPanel('leaderboard')],
      ['Change Log', () => this.showPanel('changelog')]
    ].forEach(([label, action], index) => {
      const button = this.createMenuButton(label, menuX, rowCenters[index + 1], 360, action, {
        fontSize: 30,
        hitWidth: 440,
        hitHeight: 58
      });
      this.menuItems.push(button);
      this.mainMenu.add([button.leftMarker, button.rightMarker, button.text, button.zone]);
    });
  }

  createTitleLogo() {
    const titleTop = this.add.text(this.width / 2, this.height * 0.17, "LENNY'S TOAST", {
      fontFamily: 'monospace',
      fontSize: '92px',
      fontStyle: 'bold',
      color: '#ffcc00',
      stroke: '#3b1608',
      strokeThickness: 12
    }).setOrigin(0.5);
    const titleBottom = this.add.text(this.width / 2, this.height * 0.285, 'QUEST', {
      fontFamily: 'monospace',
      fontSize: '132px',
      fontStyle: 'bold',
      color: '#ffcc00',
      stroke: '#3b1608',
      strokeThickness: 14
    }).setOrigin(0.5);
    titleTop.setDepth(4);
    titleBottom.setDepth(4);
  }

  createPanels(frame) {
    this.panels = {};
    this.createOptionsPanel(frame);
    this.createLeaderboardPanel(frame);
    this.createChangelogPanel(frame);
  }

  createMenuButton(label, x, y, width, onClick, options = {}) {
    const fontSize = options.fontSize || 30;
    const hitWidth = options.hitWidth || width;
    const hitHeight = options.hitHeight || 64;
    const text = this.add.text(x, y, label, {
      fontFamily: 'monospace',
      fontSize: `${fontSize}px`,
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 6
    });
    text.setOrigin(0.5);
    text.setData('uiElement', true);

    const leftMarker = this.add.text(x - hitWidth / 2 + 14, y, '>', {
      fontFamily: 'monospace',
      fontSize: `${fontSize}px`,
      color: '#ffcc00',
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5);
    const rightMarker = this.add.text(x + hitWidth / 2 - 14, y, '<', {
      fontFamily: 'monospace',
      fontSize: `${fontSize}px`,
      color: '#ffcc00',
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5);
    leftMarker.setVisible(false);
    rightMarker.setVisible(false);

    const zone = this.add
      .zone(x, y, hitWidth, hitHeight)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    zone.setData('uiElement', true);

    const button = { leftMarker, rightMarker, text, zone, onClick };
    zone.on('pointerover', () => {
      const index = this.menuItems.indexOf(button);
      if (index !== -1) this.setSelectedMenuIndex(index);
    });
    zone.on('pointerdown', () => {
      sfx('ui_select');
    });
    zone.on('pointerup', () => {
      onClick();
    });

    return button;
  }

  createPanelShell(frame, titleText) {
    const panelWidth = frame.displayWidth * 0.72;
    const panelHeight = frame.displayHeight * 0.68;
    const panel = this.add.container(this.width / 2, this.height / 2).setDepth(20);
    const panelBackground = this.add.rectangle(0, 0, panelWidth, panelHeight, 0x000000, 0.86);
    panelBackground.setStrokeStyle(4, 0xffffff, 0.9);
    panelBackground.setInteractive();
    panelBackground.setData('uiElement', true);

    const heading = this.add.text(0, -panelHeight / 2 + 26, titleText, {
      fontFamily: 'monospace',
      fontSize: '40px',
      color: '#ffcc00',
      stroke: '#000000',
      strokeThickness: 6
    });
    heading.setOrigin(0.5, 0);

    const closeButton = this.add.text(panelWidth / 2 - 24, -panelHeight / 2 + 16, 'X', {
      fontFamily: 'monospace',
      fontSize: '32px',
      color: '#ffffff'
    });
    closeButton.setOrigin(1, 0);
    closeButton.setInteractive({ useHandCursor: true });
    closeButton.setData('uiElement', true);
    closeButton.on('pointerup', () => {
      sfx('ui_select');
      this.hideActivePanel();
    });

    panel.add([panelBackground, heading, closeButton]);
    panel.setVisible(false);
    panel.setAlpha(0);
    return { panel, panelWidth, panelHeight };
  }

  createOptionsPanel(frame) {
    const { panel, panelWidth, panelHeight } = this.createPanelShell(frame, 'Options');
    let pendingMusic = getMusicVolume();
    let pendingSfx = getSfxVolume();

    const makeVolumeRow = (label, y, getValue, setValue, previewValue) => {
      const group = this.add.container(0, y);
      const labelText = this.add.text(-panelWidth / 2 + 72, 0, label, {
        fontFamily: 'monospace',
        fontSize: '26px',
        color: '#ffffff'
      }).setOrigin(0, 0.5);
      const valueText = this.add.text(0, 0, `${Math.round(getValue() * 100)}%`, {
        fontFamily: 'monospace',
        fontSize: '28px',
        color: '#ffcc00'
      }).setOrigin(0.5);

      const changeValue = delta => {
        const nextValue = Phaser.Math.Clamp(getValue() + delta, 0, 1);
        setValue(nextValue);
        previewValue(nextValue);
        valueText.setText(`${Math.round(nextValue * 100)}%`);
        sfx('ui_select');
      };

      const minus = this.createIconButton('-', -150, 0, () => changeValue(-0.1));
      const plus = this.createIconButton('+', 150, 0, () => changeValue(0.1));
      group.add([labelText, valueText, ...minus, ...plus]);
      return group;
    };

    const musicRow = makeVolumeRow(
      'Music',
      -40,
      () => pendingMusic,
      value => (pendingMusic = value),
      value => previewMusicVolume(value)
    );
    const sfxRow = makeVolumeRow(
      'SFX',
      50,
      () => pendingSfx,
      value => (pendingSfx = value),
      value => previewSfxVolume(value)
    );
    const save = this.createPanelButton('Save & Back', 0, panelHeight / 2 - 82, 260, () => {
      setMusicVolume(pendingMusic);
      setSfxVolume(pendingSfx);
      this.hideActivePanel();
    });
    panel.add([musicRow, sfxRow, save.bg, save.text]);
    this.panels.options = panel;
  }

  createLeaderboardPanel(frame) {
    const { panel, panelWidth, panelHeight } = this.createPanelShell(frame, 'Leaderboard');
    const bodyWidth = Math.floor(panelWidth - 96);
    const bodyHeight = Math.floor(panelHeight - 190);
    const leaderboardDom = this.add.dom(0, -panelHeight / 2 + 104).createFromHTML(`
      <div style="
        width:${bodyWidth}px;
        max-height:${bodyHeight}px;
        overflow-y:auto;
        font-family: Courier, monospace;
        color:#ffffff;
        box-sizing:border-box;
      ">
        <table style="width:100%; border-collapse:collapse;">
          <thead>
            <tr>
              <th style="text-align:left; padding:6px 8px; font-size:22px; color:#ffcc00;">Rank</th>
              <th style="text-align:left; padding:6px 8px; font-size:22px; color:#ffcc00;">Player</th>
              <th style="text-align:right; padding:6px 8px; font-size:22px; color:#ffcc00;">Time</th>
            </tr>
          </thead>
          <tbody class="leaderboard-body">
            <tr><td colspan="3" style="padding:16px 8px; text-align:center; font-size:22px;">Loading leaderboard...</td></tr>
          </tbody>
        </table>
      </div>
    `);
    leaderboardDom.setOrigin(0.5, 0);
    leaderboardDom.setData('uiElement', true);
    panel.add(leaderboardDom);

    const back = this.createPanelButton('Back', 0, panelHeight / 2 - 82, 220, () => this.hideActivePanel());
    panel.add([back.bg, back.text]);
    panel.leaderboardBody = leaderboardDom.node.querySelector('.leaderboard-body');
    this.panels.leaderboard = panel;
  }

  createChangelogPanel(frame) {
    const { panel, panelWidth, panelHeight } = this.createPanelShell(frame, 'Latest Updates');
    const updates = getRecentChangeLogEntries();
    const changeLogText = updates.length ? formatChangeLogEntries(updates) : 'No updates yet. Check back soon!';
    const updatesText = this.add.text(-panelWidth / 2 + 42, -panelHeight / 2 + 102, changeLogText, {
      fontFamily: 'monospace',
      fontSize: '28px',
      color: '#ffffff',
      wordWrap: { width: panelWidth - 84 },
      lineSpacing: 8
    });
    updatesText.setOrigin(0, 0);
    updatesText.setInteractive();
    updatesText.setData('uiElement', true);

    const back = this.createPanelButton('Back', 0, panelHeight / 2 - 82, 220, () => this.hideActivePanel());
    panel.add([updatesText, back.bg, back.text]);
    this.panels.changelog = panel;
  }

  createPanelButton(label, x, y, width, onClick) {
    const bg = this.add.image(x, y, 'ui_btn02_1');
    bg.setDisplaySize(width, 72);
    bg.setInteractive({ useHandCursor: true });
    bg.setData('uiElement', true);
    const text = this.add.text(x, y, label, {
      fontFamily: 'monospace',
      fontSize: '28px',
      color: '#111111'
    }).setOrigin(0.5);
    text.setData('uiElement', true);
    bg.on('pointerover', () => bg.setTexture('ui_btn02_2'));
    bg.on('pointerout', () => bg.setTexture('ui_btn02_1'));
    bg.on('pointerdown', () => {
      bg.setTexture('ui_btn02_3');
      sfx('ui_select');
    });
    bg.on('pointerup', () => {
      bg.setTexture('ui_btn02_2');
      onClick();
    });
    return { bg, text };
  }

  createIconButton(label, x, y, onClick) {
    const bg = this.add.image(x, y, label === '+' ? 'ui_btn_plus' : 'ui_btn_minus');
    bg.setDisplaySize(72, 72);
    bg.setInteractive({ useHandCursor: true });
    bg.setData('uiElement', true);
    bg.on('pointerdown', onClick);
    return [bg];
  }

  bindMenuInput() {
    const keyboard = this.input.keyboard;
    keyboard.on('keydown-UP', () => this.moveSelection(-1));
    keyboard.on('keydown-W', () => this.moveSelection(-1));
    keyboard.on('keydown-DOWN', () => this.moveSelection(1));
    keyboard.on('keydown-S', () => this.moveSelection(1));
    keyboard.on('keydown-ENTER', () => this.activateSelection());
    keyboard.on('keydown-SPACE', () => this.activateSelection());
    keyboard.on('keydown-ESC', () => {
      if (this.activePanel) this.hideActivePanel();
    });

    if (this.input.gamepad) {
      this.input.gamepad.on('down', (_pad, button, value) => {
        const index = button?.index;
        if (index === 12) this.moveSelection(-1);
        if (index === 13) this.moveSelection(1);
        if (index === 0 || index === 9) this.activateSelection();
        if (index === 1 && this.activePanel) this.hideActivePanel();
      });
    }
  }

  moveSelection(delta) {
    if (this.activePanel || !this.menuItems.length) return;
    const nextIndex = Phaser.Math.Wrap(this.selectedMenuIndex + delta, 0, this.menuItems.length);
    this.setSelectedMenuIndex(nextIndex);
    sfx('ui_select');
  }

  setSelectedMenuIndex(index) {
    this.selectedMenuIndex = index;
    this.menuItems.forEach((item, itemIndex) => {
      const isSelected = itemIndex === index;
      item.leftMarker.setVisible(isSelected);
      item.rightMarker.setVisible(isSelected);
      item.text.setColor(isSelected ? '#ffcc00' : '#ffffff');
      item.text.setScale(isSelected ? 1.06 : 1);
    });
  }

  activateSelection() {
    if (this.activePanel) return;
    const item = this.menuItems[this.selectedMenuIndex];
    if (!item) return;
    sfx('ui_select');
    item.onClick();
  }

  showPanel(panelName) {
    const panel = this.panels[panelName];
    if (!panel) return;
    if (this.activePanel && this.activePanel !== panel) this.activePanel.setVisible(false);
    this.activePanel = panel;
    panel.setVisible(true);
    panel.setAlpha(0);
    this.tweens.add({ targets: panel, alpha: 1, duration: 180 });
    if (panelName === 'leaderboard') this.refreshLeaderboard();
  }

  hideActivePanel() {
    if (!this.activePanel) return;
    const panel = this.activePanel;
    this.activePanel = null;
    this.tweens.add({
      targets: panel,
      alpha: 0,
      duration: 120,
      onComplete: () => panel.setVisible(false)
    });
  }

  async refreshLeaderboard() {
    const panel = this.panels.leaderboard;
    const body = panel?.leaderboardBody;
    if (!body) return;
    body.innerHTML = '<tr><td colspan="3" style="padding:16px 8px; text-align:center; font-size:22px;">Loading leaderboard...</td></tr>';
    try {
      const entries = await getLeaderboard(getStartLevel().id);
      if (!entries.length) {
        body.innerHTML = '<tr><td colspan="3" style="padding:16px 8px; text-align:center; font-size:22px;">No runs saved yet.</td></tr>';
        return;
      }
      body.innerHTML = entries.slice(0, 25).map((entry, index) => `
        <tr>
          <td style="padding:6px 8px; font-size:21px; font-weight:bold;">${index + 1}.</td>
          <td style="padding:6px 8px; font-size:21px;">${escapeHtml(entry.name || 'Player')}</td>
          <td style="padding:6px 8px; font-size:21px; text-align:right;">${Number(entry.time || 0).toFixed(2)}s</td>
        </tr>
      `).join('');
    } catch (err) {
      console.error('Failed to load main menu leaderboard.', err);
      body.innerHTML = '<tr><td colspan="3" style="padding:16px 8px; text-align:center; font-size:22px;">Unable to load leaderboard.</td></tr>';
    }
  }

  createSecretTestButton() {
    const button = this.add.text(this.width * 0.98, this.height * 0.08, 'Bananarchist Test', {
      fontFamily: 'monospace',
      fontSize: '28px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 6,
      backgroundColor: 'rgba(0, 0, 0, 0.65)',
      padding: { x: 12, y: 8 }
    });
    button.setOrigin(1, 0.5);
    button.setInteractive({ useHandCursor: true });
    button.setData('uiElement', true);
    button.on('pointerover', () => button.setStyle({ color: '#ffcc00' }));
    button.on('pointerout', () => button.setStyle({ color: '#ffffff' }));
    button.on('pointerup', () => {
      sfx('ui_select');
      this.startBananarchistTest();
    });
    this.secretTestButton = button;
  }

  cleanupAndHideUI() {
    Object.values(this.panels || {}).forEach(panel => panel.setVisible(false));
  }

  startGame() {
    if (this.transitioning) return;
    this.transitioning = true;
    this.cleanupAndHideUI();
    this.cameras.main.fadeOut(220, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start(getStartLevel().sceneKey);
    });
  }

  startBananarchistTest() {
    if (this.transitioning) return;
    this.transitioning = true;
    this.cleanupAndHideUI();
    this.cameras.main.fadeOut(220, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start('BananarchistTest');
    });
  }
}
