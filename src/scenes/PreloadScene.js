/* global Phaser */
import { VERSION } from '../constants.js';

function bust(url) {
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}v=${VERSION}`;
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

    // Images/audio: load as-is (server already disables cache)
    manifest.images.forEach(asset => this.load.image(asset.key, asset.url));
    manifest.audio.forEach(asset => this.load.audio(asset.key, asset.url));
    // Tilemaps: append version to ensure the latest map loads
    manifest.tilemaps.forEach(asset =>
      this.load.tilemapTiledJSON(asset.key, bust(asset.url))
    );
  }

  create() {
    this.scene.start('Level1');
  }
}
