export const VERSION = 'v1.1.7';
export const GAME_WIDTH = 1920;
export const GAME_HEIGHT = 1080;
export const CAMERA_PRESETS = {
  wide: {
    name: 'wide',
    zoom: 2,
    followLerp: 0.08
  },
  desktop: {
    name: 'desktop',
    zoom: 3,
    followLerp: 0.1
  },
  mobileLandscape: {
    name: 'mobileLandscape',
    zoom: 2.75,
    followLerp: 0.12
  },
  close: {
    name: 'close',
    zoom: 3.5,
    followLerp: 0.14
  }
};
export const CAMERA_PRESET_ORDER = ['wide', 'desktop', 'mobileLandscape', 'close'];
// Global debug flags (mutable at runtime)
export const DEBUG = {
  enabled: false, // master switch
  showGizmos: true, // patrol paths, spawns, damage volumes
  showHitboxes: true, // Arcade Physics bodies
  showState: true // player/enemy state text
};
