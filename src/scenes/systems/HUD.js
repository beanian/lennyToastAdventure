/* global Phaser */
import { GAME_WIDTH, GAME_HEIGHT } from '../../constants.js';
import { sfx, getMusicVolume, setMusicVolume, getSfxVolume, setSfxVolume, previewMusicVolume, previewSfxVolume } from '../../AudioBus.js';
import { shouldEnableControls } from '../../services/MobileControls.js';
import { getLeaderboard, addRun } from '../../services/LeaderboardService.js';
import { getLevelStats, addToast, setToastCount } from '../../services/LevelStats.js';

const formatTimer = seconds => {
  const total = Math.max(0, Number(seconds) || 0);
  const minutes = Math.floor(total / 60);
  const secs = Math.floor(total % 60);
  const tenths = Math.floor((total * 10) % 10);
  const paddedSecs = secs.toString().padStart(2, '0');
  return `${minutes}:${paddedSecs}.${tenths}`;
};

export function createHUD(scene) {
  // Core state
  scene.health = 3;
  scene.isDead = false;
  scene.isInvincible = false;
  scene.toastCount = 0;
  scene.sockroachKills = scene.sockroachKills || 0;
  setToastCount(scene.toastCount);

  // UI container pinned to screen
  scene.ui = scene.add.container(0, 0).setScrollFactor(0).setDepth(10);

  // Discreet pause button for touch-friendly pause access
  const inputManager = scene.input?.manager;
  const touchManager = inputManager?.touch;
  const globalObj = typeof window !== 'undefined' ? window : null;
  const hasTouchEvent = !!(
    globalObj &&
    ('ontouchstart' in globalObj || globalObj?.navigator?.maxTouchPoints > 0)
  );
  const prefersCoarsePointer = !!(
    globalObj?.matchMedia && globalObj.matchMedia('(pointer: coarse)').matches
  );
  const mobileControlsEnabled = typeof shouldEnableControls === 'function' ? shouldEnableControls() : false;
  const hasTouchSupport =
    !!touchManager?.supported ||
    hasTouchEvent ||
    prefersCoarsePointer ||
    mobileControlsEnabled;

  if (hasTouchSupport) {
    const btnSize = 72;
    const btn = scene.add.container(GAME_WIDTH - btnSize / 2 - 12, btnSize / 2 + 12);
    btn.setScrollFactor(0).setDepth(15);

    const bg = scene.add.image(0, 0, 'ui_btn02_1');
    bg.setDisplaySize(btnSize, btnSize);
    bg.setAlpha(0.65);

    const icon = scene.add.text(0, 0, 'II', { font: 'bold 28px Courier', color: '#111' }).setOrigin(0.5);

    const zone = scene.add
      .zone(0, 0, btnSize, btnSize)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    zone.on('pointerover', () => bg.setTexture('ui_btn02_2'));
    zone.on('pointerout', () => bg.setTexture('ui_btn02_1'));
    zone.on('pointerdown', () => {
      bg.setTexture('ui_btn02_3');
      sfx('ui_select');
    });
    zone.on('pointerup', () => {
      bg.setTexture('ui_btn02_1');
      scene.togglePause();
    });

    btn.add([bg, icon, zone]);
    scene.ui.add(btn);
    scene.pauseButton = btn;
  }

  // Health icons
  createHealthIcons(scene);

  // Toast counter
  const toastSrc = scene.textures.get('toast').getSourceImage();
  const toastScale = (scene.player.displayHeight / toastSrc.height) * 1;
  const lastHealth = scene.healthIcons[scene.healthIcons.length - 1];
  const toastX = lastHealth.x + lastHealth.displayWidth + 20;
  const toastY = lastHealth.y;
  scene.toastIcon = scene.add
    .image(toastX, toastY, 'toast')
    .setOrigin(0, 0)
    .setScale(toastScale)
    .setDepth(10)
    .setScrollFactor(0);
  scene.ui.add(scene.toastIcon);

  scene.toastText = scene.add
    .text(
      scene.toastIcon.x + scene.toastIcon.displayWidth + 5,
      scene.toastIcon.y + scene.toastIcon.displayHeight / 2,
      `${scene.toastCount}`,
      {
        font: 'bold 32px Courier',
        fill: '#ffcc00'
      }
    )
    .setOrigin(0, 0.5)
    .setStroke('#000', 4)
    .setDepth(10)
    .setScrollFactor(0);
  scene.ui.add(scene.toastText);

  scene.levelTimerText = scene.add
    .text(GAME_WIDTH / 2, 18, formatTimer(0), {
      font: 'bold 32px Courier',
      fill: '#ffffff'
    })
    .setOrigin(0.5, 0)
    .setStroke('#000', 4)
    .setDepth(10)
    .setScrollFactor(0);
  scene.ui.add(scene.levelTimerText);

  // Render UI elements with dedicated camera
  const cam = scene.cameras.main;
  cam.ignore(scene.ui);
  scene.uiCam = scene.cameras
    .add(0, 0, GAME_WIDTH, GAME_HEIGHT, true)
    .setScroll(0, 0);
  scene.uiCam.ignore(scene.children.list.filter(obj => obj !== scene.ui));

  // Backwards-compatible helpers on scene
  scene.createHealthIcons = () => createHealthIcons(scene);
  scene.removeHealthIcon = () => removeHealthIcon(scene);
  scene.resetHealthIcons = () => resetHealthIcons(scene);
  scene.playerDie = () => playerDie(scene);
  scene.collectToast = toast => collectToast(scene, toast);
  scene.showPauseMenu = () => showPauseMenu(scene);
  scene.hidePauseMenu = () => hidePauseMenu(scene);
  scene.togglePause = () => togglePause(scene);
  scene.showLevelSuccess = (time, levelId) => showLevelSuccess(scene, time, levelId);
  scene.updateLevelTimerDisplay = seconds => {
    if (!scene.levelTimerText) return;
    scene.levelTimerText.setText(formatTimer(seconds));
  };
}

export function createHealthIcons(scene) {
  const srcImage = scene.textures.get('lenny_face').getSourceImage();
  const scale = (scene.player.displayHeight / srcImage.height) * 1;
  scene.healthIcons = [];
  for (let i = 0; i < scene.health; i++) {
    const x = 10 + i * (srcImage.width * scale + 5);
    const icon = scene.add
      .image(x, 30, 'lenny_face')
      .setOrigin(0, 0)
      .setScale(scale)
      .setDepth(10)
      .setScrollFactor(0);
    scene.ui.add(icon);
    scene.healthIcons.push(icon);
  }
}

export function removeHealthIcon(scene) {
  const icon = scene.healthIcons.pop();
  if (!icon) return;
  scene.tweens.add({
    targets: icon,
    y: icon.y - 20,
    angle: 360,
    scale: 0,
    alpha: 0,
    duration: 500,
    ease: 'Cubic.easeIn',
    onComplete: () => icon.destroy()
  });
}

export function resetHealthIcons(scene) {
  if (scene.healthIcons) {
    scene.healthIcons.forEach(icon => icon.destroy());
  }
  createHealthIcons(scene);
}

export function collectToast(scene, toast) {
  toast.bobTween.stop();
  toast.body.enable = false;
  scene.tweens.add({
    targets: toast,
    scale: toast.scale * 1.5,
    alpha: 0,
    duration: 300,
    onComplete: () => toast.destroy()
  });
  sfx('toastCollect');
  const totalToasts = addToast(toast.value);
  scene.toastCount = totalToasts;
  scene.toastText.setText(`${totalToasts}`);
  scene.tweens.add({
    targets: scene.toastText,
    scale: { from: 1.3, to: 1 },
    duration: 200,
    ease: 'Cubic.easeOut'
  });
}

export function playerDie(scene) {
  if (scene.isDead) return;
  scene.isDead = true;
  // Disable player collisions to prevent further hurt sounds
  if (scene.playerEnemyCollider) scene.playerEnemyCollider.active = false;
  if (scene.player?.body) scene.player.body.enable = false;
  scene.bgm.stop();
  sfx('death');
  scene.player.setVelocity(0, 0);
  scene.player.anims.stop();
  scene.player.setTexture('lenny_idle');

  scene.tweens.add({
    targets: scene.player,
    alpha: 0,
    angle: 180,
    duration: 1200,
    onComplete: () => {
      // show game over overlay with actions
      showGameOver(scene);
    }
  });
}

export function showGameOver(scene) {
  // Dim background overlay
  const overlay = scene.add.container(0, 0).setScrollFactor(0).setDepth(10000);
  const dim = scene.add
    .rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.6)
    .setOrigin(0, 0);
  overlay.add(dim);

  // Game over image centered, animated
  const img = scene.add.image(GAME_WIDTH / 2, -200, 'game_over');
  const maxW = GAME_WIDTH * 0.9;
  const maxH = GAME_HEIGHT * 0.6;
  const scale = Math.min(maxW / img.width, maxH / img.height);
  img.setScale(scale);
  img.setAlpha(0);
  overlay.add(img);

  const targetY = GAME_HEIGHT / 2;
  scene.tweens.add({
    targets: img,
    y: targetY,
    alpha: 1,
    duration: 600,
    ease: 'Back.easeOut'
  });

  // Buttons (styled like pause menu) side-by-side under the image
  const btnY = targetY + img.displayHeight / 2 + 40;
  const makeButton = (label, x, y, onClick) => {
    const w = Math.min(260, GAME_WIDTH * 0.35);
    const h = 72;
    const btn = scene.add.container(x, y);
    const imgBtn = scene.add.image(0, 0, 'ui_btn02_1');
    imgBtn.setDisplaySize(w, h);
    const txt = scene.add.text(0, 0, label, { font: 'bold 26px Courier', color: '#111' }).setOrigin(0.5);
    const zone = scene.add.zone(0, 0, w, h).setOrigin(0.5).setInteractive({ useHandCursor: true });
    btn.add([imgBtn, txt, zone]);
    btn.setSize(w, h);
    zone.on('pointerover', () => imgBtn.setTexture('ui_btn02_2'));
    zone.on('pointerout', () => imgBtn.setTexture('ui_btn02_1'));
    zone.on('pointerdown', () => { imgBtn.setTexture('ui_btn02_3'); sfx('ui_select'); });
    zone.on('pointerup', () => { imgBtn.setTexture('ui_btn02_2'); onClick(); });
    overlay.add(btn);
    return btn;
  };

  const gap = 160; // horizontal spacing from center
  makeButton('Retry', GAME_WIDTH / 2 - gap, btnY, () => {
    overlay.destroy();
    scene.scene.restart();
  });
  makeButton('Quit', GAME_WIDTH / 2 + gap, btnY, () => {
    try {
      window.location.href = window.location.href.split('?')[0];
    } catch (_) {
      scene.game.destroy(true);
    }
  });

  // Attach to UI so UI camera renders it
  scene.ui.add(overlay);
  scene.gameOverUI = overlay;
}

export function showLevelSuccess(scene, timeTaken, levelId) {
  const resolvedLevelId = levelId || scene.mapKey || scene.scene.key || 'default';
  const loadLastName = () => {
    if (typeof window === 'undefined') return '';
    try {
      return window.localStorage?.getItem('lenny-toast-lastname') || '';
    } catch (err) {
      console.warn('Unable to load previous leaderboard name.', err);
      return '';
    }
  };
  const storeLastName = name => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage?.setItem('lenny-toast-lastname', name);
    } catch (err) {
      console.warn('Unable to store leaderboard name.', err);
    }
  };

  const overlay = scene.add.container(0, 0).setScrollFactor(0).setDepth(10000);
  const dim = scene.add
    .rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.6)
    .setOrigin(0, 0);
  overlay.add(dim);

  const safeMargin = Math.max(32, GAME_HEIGHT * 0.08);
  const panelMaxHeight = GAME_HEIGHT - safeMargin * 2;
  const panelW = Math.min(900, GAME_WIDTH * 0.95);
  const desiredPanelH = 720;
  let panelH = Math.min(desiredPanelH, panelMaxHeight);
  if (panelMaxHeight >= 420) {
    panelH = Math.max(panelH, 420);
  }
  if (panelH <= 0) {
    panelH = Math.min(desiredPanelH, GAME_HEIGHT - safeMargin);
  }
  const panel = scene.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2 + panelH);
  const panelBg = scene.add.image(0, 0, 'ui_frame');
  panelBg.setDisplaySize(panelW, panelH);
  const title = scene.add
    .text(0, -panelH / 2 + 40, 'LEVEL COMPLETE', { font: 'bold 36px Courier', color: '#111' })
    .setOrigin(0.5);
  const stats = getLevelStats();
  const toastCount = stats.toastCount || 0;
  const sockroachKills = stats.sockroachKills || 0;
  const rawTime = stats.rawLevelTime > 0 ? stats.rawLevelTime : timeTaken;
  const toastSavings = toastCount * 0.1;
  const sockroachSavings = sockroachKills * 0.25;
  const livesLost = stats.livesLost || 0;
  const lifePenalty = livesLost * 1;
  const finalTime = Math.max(0, rawTime - toastSavings - sockroachSavings + lifePenalty);
  const formatSeconds = value => `${value.toFixed(2)}s`;

  const buttonHeight = 72;
  const bottomMargin = Math.max(28, panelH * 0.08);
  const btnY = panelH / 2 - bottomMargin - buttonHeight / 2;
  const formOffset = buttonHeight + 26;
  const formY = btnY - formOffset;
  const formEstimatedHeight = 56;
  const saveStatusY = formY - formEstimatedHeight / 2 - 24;
  const titleGap = 36;
  const contentTop = -panelH / 2 + 40 + titleGap;
  const contentBottom = saveStatusY - 24;
  const contentHeight = Math.max(40, contentBottom - contentTop);
  const contentWidth = panelW - 80;

  const resultsHtml = `
    <div class="success-content" style="
      width:${Math.floor(contentWidth)}px;
      max-height:${Math.floor(contentHeight)}px;
      overflow-y:auto;
      padding-right:8px;
      box-sizing:border-box;
      font-family: Courier, monospace;
      color:#111;
    ">
      <section style="margin-bottom:18px;">
        <h3 style="margin:0 0 12px; font-size:24px; font-weight:bold; text-align:left;">Results</h3>
        <div style="display:flex; justify-content:space-between; gap:12px; margin-bottom:8px; font-size:22px; font-weight:bold;">
          <span style="flex:1; min-width:0;">Toasts collected</span>
          <span style="text-align:right; white-space:nowrap;">${toastCount}</span>
        </div>
        <div style="display:flex; justify-content:space-between; gap:12px; font-size:22px; font-weight:bold;">
          <span style="flex:1; min-width:0;">Sockroaches defeated</span>
          <span style="text-align:right; white-space:nowrap;">${sockroachKills}</span>
        </div>
        <div style="display:flex; justify-content:space-between; gap:12px; font-size:22px; font-weight:bold;">
          <span style="flex:1; min-width:0;">Lives lost</span>
          <span style="text-align:right; white-space:nowrap;">${livesLost}</span>
        </div>
      </section>
      <section style="margin-bottom:18px;">
        <h3 style="margin:0 0 12px; font-size:24px; font-weight:bold; text-align:left;">Time</h3>
        <div style="display:flex; justify-content:space-between; gap:12px; margin-bottom:6px; font-size:20px;">
          <span style="flex:1; min-width:0;">Raw time</span>
          <span style="text-align:right; white-space:nowrap;">${formatSeconds(rawTime)}</span>
        </div>
        <div style="display:flex; justify-content:space-between; gap:12px; font-size:22px; font-weight:bold; color:#0a6622;">
          <span style="flex:1; min-width:0;">Final time</span>
          <span style="text-align:right; white-space:nowrap;">${formatSeconds(finalTime)}</span>
        </div>
        <details style="margin-top:14px; font-size:18px;">
          <summary style="cursor:pointer; font-size:20px; font-weight:bold;">Show calculation</summary>
          <div style="margin-top:12px;">
            <div style="display:flex; justify-content:space-between; gap:12px; margin-bottom:8px; font-size:20px;">
              <span style="flex:1; min-width:0;">Time saved (toasts)</span>
              <span style="text-align:right; white-space:nowrap;">${toastCount} × 0.10s = ${toastSavings.toFixed(2)}s</span>
            </div>
            <div style="display:flex; justify-content:space-between; gap:12px; margin-bottom:12px; font-size:20px;">
              <span style="flex:1; min-width:0;">Time saved (Sockroaches)</span>
              <span style="text-align:right; white-space:nowrap;">${sockroachKills} × 0.25s = ${sockroachSavings.toFixed(2)}s</span>
            </div>
            <div style="display:flex; justify-content:space-between; gap:12px; margin-bottom:12px; font-size:20px; color:#aa1111;">
              <span style="flex:1; min-width:0;">Time penalty (lives lost)</span>
              <span style="text-align:right; white-space:nowrap;">${livesLost} × 1.00s = ${lifePenalty.toFixed(2)}s</span>
            </div>
          </div>
        </details>
      </section>
      <section>
        <h3 style="margin:0 0 12px; font-size:24px; font-weight:bold; text-align:left;">Fastest Runs</h3>
        <div class="leaderboard-entries" style="font-size:20px; line-height:1.35; white-space:pre-wrap; word-break:break-word;">Loading leaderboard...</div>
      </section>
    </div>
  `;

  const resultsDom = scene.add.dom(0, contentTop).createFromHTML(resultsHtml);
  resultsDom.setOrigin(0.5, 0);
  const leaderboardEntriesEl = resultsDom?.node?.querySelector('.leaderboard-entries');

  const saveStatus = scene.add
    .text(0, saveStatusY, '', { font: '20px Courier', color: '#117722' })
    .setOrigin(0.5);

  panel.add([panelBg, title, resultsDom, saveStatus]);

  // Compute a responsive button width that fits three side-by-side
  const btnW = Math.min(260, Math.floor((panelW - 80) / 3));

  const makeButton = (label, x, y, onClick) => {
    const w = btnW;
    const h = 72;
    const btn = scene.add.container(x, y);
    const imgBtn = scene.add.image(0, 0, 'ui_btn02_1');
    imgBtn.setDisplaySize(w, h);
    const txt = scene.add.text(0, 0, label, { font: 'bold 26px Courier', color: '#111' }).setOrigin(0.5);
    const zone = scene.add.zone(0, 0, w, h).setOrigin(0.5).setInteractive({ useHandCursor: true });
    btn.add([imgBtn, txt, zone]);
    btn.setSize(w, h);
    zone.on('pointerover', () => imgBtn.setTexture('ui_btn02_2'));
    zone.on('pointerout', () => imgBtn.setTexture('ui_btn02_1'));
    zone.on('pointerdown', () => {
      if (!btn.enabled) return;
      imgBtn.setTexture('ui_btn02_3');
      sfx('ui_select');
    });
    zone.on('pointerup', () => {
      if (!btn.enabled) return;
      imgBtn.setTexture('ui_btn02_2');
      onClick();
    });

    btn.enabled = true;
    btn.setEnabled = value => {
      btn.enabled = value;
      if (value) {
        zone.setInteractive({ useHandCursor: true });
        btn.setAlpha(1);
      } else {
        zone.disableInteractive();
        btn.setAlpha(0.6);
      }
    };

    return btn;
  };

  let hasSavedRun = false;
  let saveInFlight = false;

  const formDom = scene.add
    .dom(0, formY)
    .createFromHTML(`
      <form style="display:flex; gap:8px; align-items:center; font-family: Courier, monospace; width:${Math.floor(contentWidth)}px; max-width:${Math.floor(contentWidth)}px;">
        <input
          type="text"
          name="playerName"
          maxlength="20"
          placeholder="Enter your name"
          style="flex:1; min-width:0; padding:8px 10px; font-size:18px; border:2px solid #111; border-radius:6px;"
        />
        <button type="submit" style="padding:8px 16px; font-size:18px; border:2px solid #111; border-radius:6px; background:#ffcc00; cursor:pointer; white-space:nowrap;">
          Save
        </button>
      </form>
    `);
  formDom.setOrigin(0.5);
  formDom.setVisible(false);
  panel.add(formDom);

  // Space buttons so they don't overlap: center-to-center >= width + padding
  const gap = btnW + 20;
  const nextBtn = makeButton('Next Level', -gap, btnY, () => {
    overlay.destroy();
    scene.scene.restart();
  });
  const saveBtn = makeButton('Save Run', 0, btnY, () => {
    if (hasSavedRun) {
      saveStatus.setColor('#117722');
      saveStatus.setText('Run already saved.');
      return;
    }
    if (!formDom) return;
    formDom.setVisible(true);
    saveStatus.setColor('#117722');
    saveStatus.setText('');
    const input = formDom.node.querySelector('input[name="playerName"]');
    if (input) {
      input.value = loadLastName();
      input.focus();
      input.select();
    }
  });
  const quitBtn = makeButton('Quit', gap, btnY, () => {
    try {
      window.location.href = window.location.href.split('?')[0];
    } catch (_) {
      scene.game.destroy(true);
    }
  });

  panel.add([nextBtn, saveBtn, quitBtn]);

  const updateLeaderboardDisplay = entries => {
    if (!leaderboardEntriesEl) return;
    if (!entries || entries.length === 0) {
      leaderboardEntriesEl.textContent = 'No runs saved yet.';
      return;
    }
    const formatted = entries
      .slice(0, 10)
      .map((entry, index) => `${index + 1}. ${entry.name} - ${entry.time.toFixed(2)}s`)
      .join('\n');
    leaderboardEntriesEl.textContent = formatted;
  };

  const refreshLeaderboard = async () => {
    if (leaderboardEntriesEl) {
      leaderboardEntriesEl.textContent = 'Loading leaderboard...';
    }
    try {
      const entries = await getLeaderboard(resolvedLevelId);
      updateLeaderboardDisplay(entries);
      scene.latestLeaderboardEntries = entries;
      scene.latestLeaderboardLevelId = resolvedLevelId;
    } catch (err) {
      console.error('Failed to load leaderboard.', err);
      if (leaderboardEntriesEl) {
        leaderboardEntriesEl.textContent = 'Unable to load leaderboard.';
      }
    }
  };

  refreshLeaderboard();

  formDom.addListener('submit');
  formDom.on('submit', event => {
    event.preventDefault();
    if (saveInFlight || hasSavedRun) return;

    const input = event.target.querySelector('input[name="playerName"]');
    const rawName = input?.value ?? '';
    const trimmedName = rawName.trim();
    if (!trimmedName) {
      saveStatus.setColor('#aa1111');
      saveStatus.setText('Please enter a name.');
      return;
    }

    const sanitizedName = trimmedName.slice(0, 20);
    saveInFlight = true;
    saveBtn.setEnabled(false);
    saveStatus.setColor('#117722');
    saveStatus.setText('Saving run...');

    (async () => {
      try {
        const { entries, entry, rank } = await addRun(resolvedLevelId, sanitizedName, finalTime);
        updateLeaderboardDisplay(entries);
        scene.latestLeaderboardEntries = entries;
        scene.latestLeaderboardLevelId = resolvedLevelId;
        storeLastName(entry?.name || sanitizedName);
        hasSavedRun = true;
        formDom.setVisible(false);
        if (typeof formDom.node.reset === 'function') formDom.node.reset();
        if (rank > 0 && rank <= 5) {
          saveStatus.setColor('#117722');
          saveStatus.setText(`Run saved! New rank #${rank}.`);
        } else if (rank > 0) {
          saveStatus.setColor('#117722');
          saveStatus.setText(`Run saved! Current rank #${rank}.`);
        } else {
          saveStatus.setColor('#117722');
          saveStatus.setText('Run saved to leaderboard!');
        }
      } catch (err) {
        console.error('Failed to save run to leaderboard.', err);
        saveStatus.setColor('#aa1111');
        saveStatus.setText('Unable to save run. Please try again.');
        if (!hasSavedRun) {
          saveBtn.setEnabled(true);
        }
      } finally {
        saveInFlight = false;
      }
    })();
  });

  overlay.add(panel);
  overlay.setAlpha(0);
  scene.tweens.add({ targets: overlay, alpha: 1, duration: 300 });
  scene.tweens.add({ targets: panel, y: GAME_HEIGHT / 2, duration: 600, ease: 'Back.easeOut' });

  scene.ui.add(overlay);
  scene.levelSuccessUI = overlay;
}

export function showPauseMenu(scene) {
  if (scene.isDead || scene.isPaused) return;
  scene.isPaused = true;
  if (scene.pauseButton) scene.pauseButton.setVisible(false);
  // Pause physics to freeze gameplay, keep timers/tweens active for UI
  scene.physics.world.pause();
  if (scene.playerEnemyCollider) scene.playerEnemyCollider.active = false;

  const resolvedLevelId = scene.mapKey || scene.scene.key || 'default';

  const overlay = scene.add.container(0, 0).setScrollFactor(0).setDepth(9000);
  const dim = scene.add
    .rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.6)
    .setOrigin(0, 0);
  overlay.add(dim);

  // Panel shell
  const panelW = Math.min(720, GAME_WIDTH * 0.9);
  const panelH = Math.min(620, GAME_HEIGHT * 0.9);
  const panelX = GAME_WIDTH / 2;
  const panelY = GAME_HEIGHT / 2;
  const panel = scene.add.container(panelX, panelY);
  const panelBg = scene.add.image(0, 0, 'ui_frame');
  panelBg.setDisplaySize(panelW, panelH);
  const title = scene.add.text(0, -panelH / 2 + 50, 'PAUSED', { font: 'bold 36px Courier', color: '#111' }).setOrigin(0.5);
  panel.add([panelBg, title]);

  // Helper to make a button
  const makeButton = (label, x, y, onClick) => {
    const w = Math.min(280, panelW - 100);
    const h = 64;
    const btn = scene.add.container(x, y);
    const img = scene.add.image(0, 0, 'ui_btn02_1');
    img.setDisplaySize(w, h);
    const txt = scene.add.text(0, 0, label, { font: 'bold 24px Courier', color: '#111' }).setOrigin(0.5);
    const zone = scene.add.zone(0, 0, w, h).setOrigin(0.5).setInteractive({ useHandCursor: true });
    btn.add([img, txt, zone]);
    btn.setSize(w, h);
    zone.on('pointerover', () => img.setTexture('ui_btn02_2'));
    zone.on('pointerout', () => img.setTexture('ui_btn02_1'));
    zone.on('pointerdown', () => { img.setTexture('ui_btn02_3'); sfx('ui_select'); });
    zone.on('pointerup', () => { img.setTexture('ui_btn02_2'); onClick(); });
    return btn;
  };

  let leaderboard;
  let leaderboardEntries;
  let refreshLeaderboard;

  // Main menu container
  const main = scene.add.container(0, 0);
  const buttonConfigs = [
    { label: 'Resume', onClick: () => hidePauseMenu(scene) },
    {
      label: 'Options',
      onClick: () => {
        main.setVisible(false);
        options.setVisible(true);
      }
    },
    {
      label: 'Leaderboard',
      onClick: () => {
        main.setVisible(false);
        leaderboard.setVisible(true);
        refreshLeaderboard();
      }
    },
    {
      label: 'Retry',
      onClick: () => {
        scene.pauseOverlayCleanup?.();
        scene.pauseOverlayCleanup = null;
        scene.pauseUI = null;
        scene.isPaused = false;
        scene.physics.world.resume();
        scene.scene.restart();
      }
    },
    {
      label: 'Quit',
      onClick: () => {
        scene.pauseOverlayCleanup?.();
        scene.pauseOverlayCleanup = null;
        scene.pauseUI = null;
        try {
          window.location.href = window.location.href.split('?')[0];
        } catch (_) {
          scene.game.destroy(true);
        }
      }
    }
  ];
  const buttonAreaTop = -panelH / 2 + 140;
  const buttonAreaBottom = panelH / 2 - 130;
  const buttonAreaHeight = buttonAreaBottom - buttonAreaTop;
  const buttonSpacing = buttonConfigs.length > 1 ? buttonAreaHeight / (buttonConfigs.length - 1) : 0;
  buttonConfigs.forEach((cfg, index) => {
    const y = Phaser.Math.Clamp(buttonAreaTop + buttonSpacing * index, buttonAreaTop, buttonAreaBottom);
    main.add(makeButton(cfg.label, 0, y, cfg.onClick));
  });
  panel.add(main);

  // Options container (hidden initially)
  const options = scene.add.container(0, 0);
  options.setVisible(false);
  const optTitle = scene.add.text(0, -panelH / 2 + 120, 'OPTIONS', { font: 'bold 28px Courier', color: '#111' }).setOrigin(0.5);
  options.add(optTitle);

  // Pending volumes start from current levels
  let pendingMusic = getMusicVolume();
  let pendingSfx = getSfxVolume();

  const makeVolumeControl = (label, y, getter, setter, getPending, setPending) => {
    const group = scene.add.container(0, y);
    const lbl = scene.add.text(-panelW / 2 + 40, 0, label, { font: 'bold 22px Courier', color: '#111' }).setOrigin(0, 0.5);
    const valueText = scene.add.text(0, 0, `${Math.round(getPending() * 100)}%`, { font: 'bold 24px Courier', color: '#111' }).setOrigin(0.5);
    const minus = scene.add.image(-140, 0, 'ui_btn_minus');
    minus.setDisplaySize(72, 72);
    // Capture base scale after setting display size so hover scaling is relative
    const minusBaseX = minus.scaleX;
    const minusBaseY = minus.scaleY;
    const minusZone = scene.add.zone(-140, 0, 72, 72).setOrigin(0.5).setInteractive({ useHandCursor: true });
    minusZone.on('pointerover', () => minus.setScale(minusBaseX * 1.05, minusBaseY * 1.05));
    minusZone.on('pointerout', () => minus.setScale(minusBaseX, minusBaseY));
    minusZone.on('pointerdown', () => {
      const v = Math.max(0, getPending() - 0.1);
      setPending(v);
      // Live preview without persisting
      if (label.toLowerCase().includes('music')) previewMusicVolume(v); else previewSfxVolume(v);
      valueText.setText(`${Math.round(v * 100)}%`);
      sfx('ui_select');
    });
    const plus = scene.add.image(140, 0, 'ui_btn_plus');
    plus.setDisplaySize(72, 72);
    const plusBaseX = plus.scaleX;
    const plusBaseY = plus.scaleY;
    const plusZone = scene.add.zone(140, 0, 72, 72).setOrigin(0.5).setInteractive({ useHandCursor: true });
    plusZone.on('pointerover', () => plus.setScale(plusBaseX * 1.05, plusBaseY * 1.05));
    plusZone.on('pointerout', () => plus.setScale(plusBaseX, plusBaseY));
    plusZone.on('pointerdown', () => {
      const v = Math.min(1, getPending() + 0.1);
      setPending(v);
      // Live preview without persisting
      if (label.toLowerCase().includes('music')) previewMusicVolume(v); else previewSfxVolume(v);
      valueText.setText(`${Math.round(v * 100)}%`);
      sfx('ui_select');
    });
    group.add([lbl, valueText, minus, plus, minusZone, plusZone]);
    return group;
  };

  const musicCtl = makeVolumeControl('Background Music', -10, getMusicVolume, setMusicVolume, () => pendingMusic, v => pendingMusic = v);
  const sfxCtl = makeVolumeControl('SFX', 50, getSfxVolume, setSfxVolume, () => pendingSfx, v => pendingSfx = v);
  options.add([musicCtl, sfxCtl]);

  // Save & Back button
  const saveBack = makeButton('Save & Back', 0, panelH / 2 - 90, () => {
    setMusicVolume(pendingMusic);
    setSfxVolume(pendingSfx);
    options.setVisible(false);
    main.setVisible(true);
  });
  options.add(saveBack);
  panel.add(options);

  // Leaderboard container (hidden initially)
  leaderboard = scene.add.container(0, 0);
  leaderboard.setVisible(false);
  const leaderboardTitle = scene.add
    .text(0, -panelH / 2 + 120, 'LEADERBOARD', { font: 'bold 28px Courier', color: '#111' })
    .setOrigin(0.5);
  const leaderboardListTop = -panelH / 2 + 170;
  const leaderboardListHeight = panelH - 280;
  leaderboardEntries = scene.add
    .text(-panelW / 2 + 50, leaderboardListTop, 'Loading leaderboard...', {
      font: '18px Courier',
      color: '#111',
      align: 'left'
    })
    .setOrigin(0, 0);
  leaderboardEntries.setWordWrapWidth(panelW - 120);
  leaderboardEntries.setLineSpacing(4);
  const leaderboardMaskShape = scene.make.graphics({ x: 0, y: 0, add: false });
  leaderboardMaskShape.fillStyle(0xffffff, 1);
  leaderboardMaskShape.fillRect(-panelW / 2 + 50, leaderboardListTop, panelW - 100, leaderboardListHeight);
  const leaderboardMask = leaderboardMaskShape.createGeometryMask();
  leaderboardEntries.setMask(leaderboardMask);
  leaderboardMaskShape.destroy();
  const leaderboardBack = makeButton('Back', 0, panelH / 2 - 90, () => {
    leaderboard.setVisible(false);
    main.setVisible(true);
  });
  leaderboard.add([leaderboardTitle, leaderboardEntries, leaderboardBack]);
  panel.add(leaderboard);

  const updateLeaderboardDisplay = entries => {
    const normalized = Array.isArray(entries) ? entries : [];
    if (normalized.length === 0) {
      leaderboardEntries.setText('No runs saved yet.');
      return;
    }

    const formatted = normalized
      .slice(0, 25)
      .map((entry, index) => `${String(index + 1).padStart(2, '0')}. ${entry.name} - ${formatTimer(entry.time)}`)
      .join('\n');
    leaderboardEntries.setText(formatted);
  };

  const resolveLeaderboardIds = () => {
    const ids = [];
    if (resolvedLevelId) ids.push(resolvedLevelId);
    const mapKey = scene.mapKey;
    if (mapKey && !ids.includes(mapKey)) ids.push(mapKey);
    const sceneKey = scene.scene?.key;
    if (sceneKey && !ids.includes(sceneKey)) ids.push(sceneKey);
    const cachedId = scene.latestLeaderboardLevelId;
    if (cachedId && !ids.includes(cachedId)) ids.push(cachedId);
    if (ids.length === 0) ids.push('default');
    return ids;
  };

  const showCachedLeaderboardIfAvailable = idsToTry => {
    if (
      scene.latestLeaderboardEntries &&
      Array.isArray(scene.latestLeaderboardEntries) &&
      scene.latestLeaderboardEntries.length > 0 &&
      scene.latestLeaderboardLevelId &&
      idsToTry.includes(scene.latestLeaderboardLevelId)
    ) {
      updateLeaderboardDisplay(scene.latestLeaderboardEntries);
      return true;
    }
    return false;
  };

  refreshLeaderboard = async () => {
    const idsToTry = resolveLeaderboardIds();
    const showedCached = showCachedLeaderboardIfAvailable(idsToTry);
    if (!showedCached) {
      leaderboardEntries.setText('Loading leaderboard...');
    }

    let finalEntries = null;
    let lastError = null;
    for (const levelId of idsToTry) {
      try {
        const entries = await getLeaderboard(levelId);
        if (!Array.isArray(entries)) continue;
        if (!finalEntries || finalEntries.length === 0) {
          finalEntries = entries;
        }
        if (entries.length > 0) {
          finalEntries = entries;
          scene.latestLeaderboardEntries = entries;
          scene.latestLeaderboardLevelId = levelId;
          break;
        }
      } catch (err) {
        lastError = err;
      }
    }

    if (finalEntries) {
      updateLeaderboardDisplay(finalEntries);
      return;
    }

    if (lastError) {
      console.error('Failed to load leaderboard.', lastError);
      leaderboardEntries.setText('Unable to load leaderboard.');
    } else {
      leaderboardEntries.setText('No runs saved yet.');
    }
  };

  if (scene.pauseOverlayCleanup) {
    scene.pauseOverlayCleanup();
    scene.pauseOverlayCleanup = null;
  }
  const cleanupOverlay = () => {
    if (scene.pauseUILeaderboardMask) {
      scene.pauseUILeaderboardMask.destroy();
      scene.pauseUILeaderboardMask = null;
    }
    if (overlay.scene) {
      overlay.destroy();
    }
  };
  scene.pauseUILeaderboardMask = leaderboardMask;
  scene.pauseOverlayCleanup = cleanupOverlay;
  overlay.add(panel);
  scene.ui.add(overlay);
  scene.pauseUI = overlay;
}

export function hidePauseMenu(scene) {
  if (!scene.isPaused) return;
  scene.isPaused = false;
  if (scene.pauseButton) scene.pauseButton.setVisible(true);
  if (scene.pauseOverlayCleanup) {
    scene.pauseOverlayCleanup();
    scene.pauseOverlayCleanup = null;
  } else if (scene.pauseUI) {
    scene.pauseUI.destroy();
  }
  scene.pauseUI = null;
  scene.physics.world.resume();
  if (!scene.isDead) {
    if (scene.playerEnemyCollider) scene.playerEnemyCollider.active = true;
    if (scene.player?.body) scene.player.body.enable = true;
  }
}

export function togglePause(scene) {
  if (scene.isPaused) hidePauseMenu(scene); else showPauseMenu(scene);
}
