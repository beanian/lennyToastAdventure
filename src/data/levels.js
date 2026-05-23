export const LEVELS = [
  {
    id: 'level1',
    sceneKey: 'Level1',
    mapKey: 'level1',
    title: 'Level 1'
  }
];

export const START_LEVEL_ID = 'level1';

export function getLevelById(id) {
  return LEVELS.find(level => level.id === id) || null;
}

export function getStartLevel() {
  return getLevelById(START_LEVEL_ID);
}
