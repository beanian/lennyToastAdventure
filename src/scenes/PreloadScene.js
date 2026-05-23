/* global Phaser */
import { VERSION } from '../constants.js';

function bust(url) {
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}v=${VERSION}`;
}

function loadImages(scene, images = []) {
  images.forEach(asset => scene.load.image(asset.key, asset.url));
}

function loadAseprites(scene, aseprites = []) {
  aseprites.forEach(asset =>
    scene.load.aseprite(asset.key, asset.textureURL, asset.atlasURL)
  );
}

function loadAudio(scene, audio = []) {
  audio.forEach(asset => scene.load.audio(asset.key, asset.url));
}

function loadTilemaps(scene, tilemaps = []) {
  tilemaps.forEach(asset =>
    scene.load.tilemapTiledJSON(asset.key, bust(asset.url))
  );
}

export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super('Preload');
  }

  preload() {
    const manifest = this.registry.get('manifest');

    const { width, height } = this.scale;
    const progressBar = this.add.graphics();
    this.load.on('progress', value => {
      progressBar.clear();
      progressBar.fillStyle(0xffffff, 1);
      progressBar.fillRect(0, height / 2, width * value, 30);
    });

    // Keep these phases separate so scene-specific loading can be moved out
    // incrementally without changing asset declarations.
    loadImages(this, manifest.images);
    loadAseprites(this, manifest.aseprites);
    loadAudio(this, manifest.audio);
    loadTilemaps(this, manifest.tilemaps);
  }

  create() {
    this.scene.start('Welcome');
  }
}
