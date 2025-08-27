const sfxCache = {};
let soundManager;
let currentMusic = null;

export function init(scene) {
  soundManager = scene.sound;
}

export function sfx(key, config) {
  if (!soundManager) return null;
  let sound = sfxCache[key];
  if (!sound) {
    sound = soundManager.add(key, config);
    sfxCache[key] = sound;
  }
  if (!sound.isPlaying) {
    sound.play();
  }
  return sound;
}

export function music(key, config = { loop: true }) {
  if (!soundManager) return null;
  if (currentMusic && currentMusic.key === key && currentMusic.sound.isPlaying) {
    return currentMusic.sound;
  }
  if (currentMusic && currentMusic.sound.isPlaying) {
    currentMusic.sound.stop();
  }
  const sound = soundManager.add(key, config);
  sound.play();
  currentMusic = { key, sound };
  return sound;
}
