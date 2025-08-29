const sfxCache = {};
let soundManager;
let currentMusic = null;
let sfxVolume = 1.0;
let musicVolume = 0.5;

export function init(scene) {
  soundManager = scene.sound;
  // Load persisted volumes
  try {
    const sv = parseFloat(localStorage.getItem('sfxVolume'));
    const mv = parseFloat(localStorage.getItem('musicVolume'));
    if (!Number.isNaN(sv)) sfxVolume = Math.max(0, Math.min(1, sv));
    if (!Number.isNaN(mv)) musicVolume = Math.max(0, Math.min(1, mv));
  } catch (_) {}
}

export function sfx(key, config) {
  if (!soundManager) return null;
  let sound = sfxCache[key];
  if (!sound) {
    sound = soundManager.add(key, config);
    sfxCache[key] = sound;
  }
  // Apply global SFX volume
  try { sound.setVolume(sfxVolume); } catch (_) {}
  if (!sound.isPlaying) {
    sound.play();
  }
  return sound;
}

export function music(key, config = { loop: true }) {
  if (!soundManager) return null;
  if (currentMusic && currentMusic.key === key && currentMusic.sound.isPlaying) {
    // ensure volume reflects current setting
    try { currentMusic.sound.setVolume(musicVolume); } catch (_) {}
    return currentMusic.sound;
  }
  if (currentMusic && currentMusic.sound.isPlaying) {
    currentMusic.sound.stop();
  }
  const opts = { ...config };
  if (typeof opts.volume !== 'number') opts.volume = musicVolume;
  const sound = soundManager.add(key, opts);
  sound.play();
  currentMusic = { key, sound };
  return sound;
}

export function setSfxVolume(v) {
  sfxVolume = Math.max(0, Math.min(1, Number(v) || 0));
  // Apply to all cached sfx
  Object.values(sfxCache).forEach(s => {
    try { s.setVolume(sfxVolume); } catch (_) {}
  });
  try { localStorage.setItem('sfxVolume', String(sfxVolume)); } catch (_) {}
}

export function getSfxVolume() {
  return sfxVolume;
}

export function setMusicVolume(v) {
  musicVolume = Math.max(0, Math.min(1, Number(v) || 0));
  if (currentMusic?.sound) {
    try { currentMusic.sound.setVolume(musicVolume); } catch (_) {}
  }
  try { localStorage.setItem('musicVolume', String(musicVolume)); } catch (_) {}
}

export function getMusicVolume() {
  return musicVolume;
}
