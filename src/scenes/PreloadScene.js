/* global Phaser */
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

    manifest.images.forEach(asset => this.load.image(asset.key, asset.url));
    manifest.audio.forEach(asset => this.load.audio(asset.key, asset.url));
    manifest.tilemaps.forEach(asset =>
      this.load.tilemapTiledJSON(asset.key, asset.url)
    );
  }

  create() {
    this.scene.start('Level1');
  }
}
