import Phaser from 'phaser';/* global Phaser */
import manifest from '../assets/manifest.js';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload() {
    this.registry.set('manifest', manifest);
  }

  create() {
    this.scene.start('Preload');
  }
}
