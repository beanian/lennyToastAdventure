import BaseLevelScene from './BaseLevelScene.js';
import { getLevelById } from '../data/levels.js';

export default class Level1Scene extends BaseLevelScene {
  constructor() {
    const level = getLevelById('level1');
    super(level.sceneKey, level.mapKey);
    this.levelId = level.id;
    this.levelTitle = level.title;
  }
}
