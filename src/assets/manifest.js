const assetUrl = (path) => new URL(`./${path}`, import.meta.url).href;
const levelUrl = (path) => new URL(`../${path}`, import.meta.url).href;

const manifest = {
  images: [
    { key: 'lenny_idle', url: assetUrl('sprites/lenny/grey_idle.PNG') },
    { key: 'lenny_jump_1', url: assetUrl('sprites/lenny/grey_jump_1.PNG') },
    { key: 'lenny_jump_2', url: assetUrl('sprites/lenny/grey_jump_2.PNG') },
    { key: 'lenny_walk_1', url: assetUrl('sprites/lenny/grey_walk_1.PNG') },
    { key: 'lenny_walk_2', url: assetUrl('sprites/lenny/grey_walk_2.PNG') },
    { key: 'lenny_walk_3', url: assetUrl('sprites/lenny/grey_walk_3.PNG') },
    { key: 'lenny_walk_4', url: assetUrl('sprites/lenny/grey_walk_4.PNG') },
    { key: 'lenny_walk_5', url: assetUrl('sprites/lenny/grey_walk_5.PNG') },
    { key: 'lenny_walk_6', url: assetUrl('sprites/lenny/grey_walk_6.PNG') },
    { key: 'lenny_walk_7', url: assetUrl('sprites/lenny/grey_walk_7.PNG') },
    { key: 'lenny_walk_8', url: assetUrl('sprites/lenny/grey_walk_8.PNG') },
    { key: 'sockroach_walk_1', url: assetUrl('sprites/sockroach/sockroach_walk_1.png') },
    { key: 'sockroach_walk_2', url: assetUrl('sprites/sockroach/sockroach_walk_2.png') },
    { key: 'sockroach_walk_3', url: assetUrl('sprites/sockroach/sockroach_walk_3.png') },
    { key: 'sockroach_walk_4', url: assetUrl('sprites/sockroach/sockroach_walk_4.png') },
    { key: 'sockroach_walk_5', url: assetUrl('sprites/sockroach/sockroach_walk_5.png') },
    { key: 'sockroach_stomp_1', url: assetUrl('sprites/sockroach/sockroach_stomp_1.png') },
    { key: 'sockroach_stomp_2', url: assetUrl('sprites/sockroach/sockroach_stomp_2.png') },
    { key: 'toast', url: assetUrl('sprites/toast/toast_sprite.png') },
    { key: 'lenny_face', url: assetUrl('sprites/lenny/lenny_face.png') },
    { key: 'game_over', url: assetUrl('sprites/game/game_over.png') },
    { key: 'tiles', url: levelUrl('levels/level1/nature-paltformer-tileset-16x16.png') },
    // UI assets
    { key: 'ui_frame', url: assetUrl('UI/Sprites/UI_Flat_Frame02a.png') },
    { key: 'ui_btn02_1', url: assetUrl('UI/Sprites/UI_Flat_Button02a_1.png') },
    { key: 'ui_btn02_2', url: assetUrl('UI/Sprites/UI_Flat_Button02a_2.png') },
    { key: 'ui_btn02_3', url: assetUrl('UI/Sprites/UI_Flat_Button02a_3.png') },
    { key: 'ui_btn02_4', url: assetUrl('UI/Sprites/UI_Flat_Button02a_4.png') },
    { key: 'ui_btn_plus', url: assetUrl('UI/Sprites/UI_Flat_ButtonPlus01a.png') },
    { key: 'ui_btn_minus', url: assetUrl('UI/Sprites/UI_Flat_ButtonMinus01a.png') }
  ],
  audio: [
    { key: 'jump', url: assetUrl('audio/cartoon-jump-6462.mp3') },
    { key: 'bgm', url: assetUrl('audio/Pixel Jump Groove.mp3') },
    { key: 'toastCollect', url: assetUrl('audio/toast-collect.mp3') },
    { key: 'hurt', url: assetUrl('audio/Hurt.wav') },
    { key: 'landEnemy', url: assetUrl('audio/LandOnEnemy.wav') },
    { key: 'death', url: assetUrl('audio/game-over-38511.mp3') },
    { key: 'respawn', url: assetUrl('audio/a_bulldog_respawning.mp3') },
    { key: 'levelSuccess', url: assetUrl('audio/level_success.mp3') },
    { key: 'ui_select', url: assetUrl('audio/select_002.ogg') }
  ],
  tilemaps: [
    { key: 'level1', url: levelUrl('levels/level1/level1.tmj') }
  ]
};

export default manifest;
