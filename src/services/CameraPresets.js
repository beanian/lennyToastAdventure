import { CAMERA_PRESETS, CAMERA_PRESET_ORDER } from '../constants.js';

export function resolveCameraPresetName(defaultName = 'desktop') {
  try {
    const params = new URLSearchParams(window.location.search);
    const requested = params.get('camera');
    if (requested && CAMERA_PRESETS[requested]) return requested;
  } catch (_) {}

  const width = typeof window !== 'undefined' ? window.innerWidth : 0;
  const height = typeof window !== 'undefined' ? window.innerHeight : 0;
  const isLandscape = width >= height;
  if (width > 0 && width <= 1024 && isLandscape) return 'mobileLandscape';
  return defaultName;
}

export function applyCameraPreset(scene, presetName = 'desktop') {
  const resolvedName = CAMERA_PRESETS[presetName] ? presetName : 'desktop';
  const preset = CAMERA_PRESETS[resolvedName];
  const cam = scene.cameras.main;
  cam.setZoom(preset.zoom);
  if (scene.player) {
    cam.startFollow(scene.player, true, preset.followLerp, preset.followLerp);
  }
  scene.activeCameraPreset = resolvedName;
  return resolvedName;
}

export function cycleCameraPreset(scene) {
  const current = scene.activeCameraPreset || resolveCameraPresetName();
  const currentIndex = CAMERA_PRESET_ORDER.indexOf(current);
  const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % CAMERA_PRESET_ORDER.length;
  const next = CAMERA_PRESET_ORDER[nextIndex];
  applyCameraPreset(scene, next);
  return next;
}
