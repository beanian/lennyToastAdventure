/* global Phaser */
import { GAME_WIDTH, GAME_HEIGHT } from '../../constants.js';
import { sfx, getMusicVolume, setMusicVolume, getSfxVolume, setSfxVolume, previewMusicVolume, previewSfxVolume } from '../../AudioBus.js';
import { getLeaderboard, addRun } from '../../services/LeaderboardService.js';

export function createHUD(scene) {
  // Core state
  scene.health = 3;
  scene.isDead = false;
  scene.isInvincible = false;
  scene.toastCount = 0;

  // UI container pinned to screen
  scene.ui = scene.add.container(0, 0).setScrollFactor(0).setDepth(10);

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
  scene.toastCount += toast.value;
  scene.toastText.setText(`${scene.toastCount}`);
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

  const panelW = Math.min(720, GAME_WIDTH * 0.9);
  const panelH = Math.min(540, GAME_HEIGHT * 0.9);
  const panel = scene.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2 + panelH);
  const panelBg = scene.add.image(0, 0, 'ui_frame');
  panelBg.setDisplaySize(panelW, panelH);
  const title = scene.add
    .text(0, -panelH / 2 + 40, 'LEVEL COMPLETE', { font: 'bold 36px Courier', color: '#111' })
    .setOrigin(0.5);
  const toastTxt = scene.add
    .text(0, -40, `Toasts: ${scene.toastCount}`, { font: 'bold 26px Courier', color: '#111' })
    .setOrigin(0.5);
  const timeTxt = scene.add
    .text(0, 20, `Time: ${timeTaken.toFixed(2)}s`, { font: 'bold 26px Courier', color: '#111' })
    .setOrigin(0.5);

  const leaderboardTitle = scene.add
    .text(0, 70, 'FASTEST RUNS', { font: 'bold 24px Courier', color: '#111' })
    .setOrigin(0.5, 0);
  const leaderboardText = scene.add
    .text(0, 110, '', {
      font: '22px Courier',
      color: '#111',
      align: 'center'
    })
    .setOrigin(0.5, 0);

  const saveStatus = scene.add
    .text(0, panelH / 2 - 140, '', { font: '20px Courier', color: '#117722' })
    .setOrigin(0.5);

  panel.add([panelBg, title, toastTxt, timeTxt, leaderboardTitle, leaderboardText, saveStatus]);

  const makeButton = (label, x, y, onClick) => {
    const w = Math.min(260, panelW - 80);
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

  const btnY = panelH / 2 - 60;
  let hasSavedRun = false;
  let saveInFlight = false;

  const formDom = scene.add
    .dom(0, btnY - 110)
    .createFromHTML(`
      <form style="display:flex; gap:8px; align-items:center; font-family: Courier, monospace;">
        <input
          type="text"
          name="playerName"
          maxlength="20"
          placeholder="Enter your name"
          style="flex:1; padding:8px 10px; font-size:18px; border:2px solid #111; border-radius:6px;"
        />
        <button type="submit" style="padding:8px 16px; font-size:18px; border:2px solid #111; border-radius:6px; background:#ffcc00; cursor:pointer;">
          Save
        </button>
      </form>
    `);
  formDom.setOrigin(0.5);
  formDom.setVisible(false);
  panel.add(formDom);

  const gap = 150;
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
    if (!entries || entries.length === 0) {
      leaderboardText.setText('No runs saved yet.');
      return;
    }
    const formatted = entries
      .slice(0, 5)
      .map((entry, index) => `${index + 1}. ${entry.name} - ${entry.time.toFixed(2)}s`)
      .join('\n');
    leaderboardText.setText(formatted);
  };

  const refreshLeaderboard = async () => {
    leaderboardText.setText('Loading leaderboard...');
    try {
      const entries = await getLeaderboard(resolvedLevelId);
      updateLeaderboardDisplay(entries);
    } catch (err) {
      console.error('Failed to load leaderboard.', err);
      leaderboardText.setText('Unable to load leaderboard.');
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
        const { entries, entry, rank } = await addRun(resolvedLevelId, sanitizedName, timeTaken);
        updateLeaderboardDisplay(entries);
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
  // Pause physics to freeze gameplay, keep timers/tweens active for UI
  scene.physics.world.pause();
  if (scene.playerEnemyCollider) scene.playerEnemyCollider.active = false;

  const overlay = scene.add.container(0, 0).setScrollFactor(0).setDepth(9000);
  const dim = scene.add
    .rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.6)
    .setOrigin(0, 0);
  overlay.add(dim);

  // Panel shell
  const panelW = Math.min(720, GAME_WIDTH * 0.9);
  const panelH = Math.min(440, GAME_HEIGHT * 0.85);
  const panelX = GAME_WIDTH / 2;
  const panelY = GAME_HEIGHT / 2;
  const panel = scene.add.container(panelX, panelY);
  const panelBg = scene.add.image(0, 0, 'ui_frame');
  panelBg.setDisplaySize(panelW, panelH);
  const title = scene.add.text(0, -panelH / 2 + 40, 'PAUSED', { font: 'bold 36px Courier', color: '#111' }).setOrigin(0.5);
  panel.add([panelBg, title]);

  // Helper to make a button
  const makeButton = (label, x, y, onClick) => {
    const w = Math.min(260, panelW - 80);
    const h = 72;
    const btn = scene.add.container(x, y);
    const img = scene.add.image(0, 0, 'ui_btn02_1');
    img.setDisplaySize(w, h);
    const txt = scene.add.text(0, 0, label, { font: 'bold 26px Courier', color: '#111' }).setOrigin(0.5);
    const zone = scene.add.zone(0, 0, w, h).setOrigin(0.5).setInteractive({ useHandCursor: true });
    btn.add([img, txt, zone]);
    btn.setSize(w, h);
    zone.on('pointerover', () => img.setTexture('ui_btn02_2'));
    zone.on('pointerout', () => img.setTexture('ui_btn02_1'));
    zone.on('pointerdown', () => { img.setTexture('ui_btn02_3'); sfx('ui_select'); });
    zone.on('pointerup', () => { img.setTexture('ui_btn02_2'); onClick(); });
    return btn;
  };

  // Main menu container
  const main = scene.add.container(0, 0);
  const rowY = -panelH / 2 + 120;
  main.add(makeButton('Resume', 0, rowY, () => hidePauseMenu(scene)));
  main.add(makeButton('Options', 0, rowY + 80, () => {
    main.setVisible(false);
    options.setVisible(true);
  }));
  main.add(makeButton('Retry', 0, rowY + 160, () => {
    overlay.destroy();
    scene.isPaused = false;
    scene.physics.world.resume();
    scene.scene.restart();
  }));
  main.add(makeButton('Quit', 0, rowY + 240, () => {
    try { window.location.href = window.location.href.split('?')[0]; } catch (_) { scene.game.destroy(true); }
  }));
  panel.add(main);

  // Options container (hidden initially)
  const options = scene.add.container(0, 0);
  options.setVisible(false);
  const optTitle = scene.add.text(0, -panelH / 2 + 110, 'OPTIONS', { font: 'bold 28px Courier', color: '#111' }).setOrigin(0.5);
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
  const saveBack = makeButton('Save & Back', 0, panelH / 2 - 80, () => {
    setMusicVolume(pendingMusic);
    setSfxVolume(pendingSfx);
    options.setVisible(false);
    main.setVisible(true);
  });
  options.add(saveBack);
  panel.add(options);

  overlay.add(panel);
  scene.ui.add(overlay);
  scene.pauseUI = overlay;
}

export function hidePauseMenu(scene) {
  if (!scene.isPaused) return;
  scene.isPaused = false;
  if (scene.pauseUI) {
    scene.pauseUI.destroy();
    scene.pauseUI = null;
  }
  scene.physics.world.resume();
  if (!scene.isDead) {
    if (scene.playerEnemyCollider) scene.playerEnemyCollider.active = true;
    if (scene.player?.body) scene.player.body.enable = true;
  }
}

export function togglePause(scene) {
  if (scene.isPaused) hidePauseMenu(scene); else showPauseMenu(scene);
}
