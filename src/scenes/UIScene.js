import Hud from '../ui/Hud.js';

export default class UIScene extends Phaser.Scene {
  constructor() {
    super('UIScene');
  }

  create() {
    this.hud = new Hud(this);
  }
}
