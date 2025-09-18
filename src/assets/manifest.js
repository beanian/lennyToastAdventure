const assetUrl = (path) => new URL(`./${path}`, import.meta.url).href;
const levelUrl = (path) => new URL(`../${path}`, import.meta.url).href;

const manifest = {
  images: [
    { key: 'lenny_idle', url: new URL('./sprites/lenny/grey_idle.PNG', import.meta.url).href },
    { key: 'lenny_jump_1', url: new URL('./sprites/lenny/grey_jump_1.PNG', import.meta.url).href },
    { key: 'lenny_jump_2', url: new URL('./sprites/lenny/grey_jump_2.PNG', import.meta.url).href },
    { key: 'lenny_walk_1', url: new URL('./sprites/lenny/grey_walk_1.PNG', import.meta.url).href },
    { key: 'lenny_walk_2', url: new URL('./sprites/lenny/grey_walk_2.PNG', import.meta.url).href },
    { key: 'lenny_walk_3', url: new URL('./sprites/lenny/grey_walk_3.PNG', import.meta.url).href },
    { key: 'lenny_walk_4', url: new URL('./sprites/lenny/grey_walk_4.PNG', import.meta.url).href },
    { key: 'lenny_walk_5', url: new URL('./sprites/lenny/grey_walk_5.PNG', import.meta.url).href },
    { key: 'lenny_walk_6', url: new URL('./sprites/lenny/grey_walk_6.PNG', import.meta.url).href },
    { key: 'lenny_walk_7', url: new URL('./sprites/lenny/grey_walk_7.PNG', import.meta.url).href },
    { key: 'lenny_walk_8', url: new URL('./sprites/lenny/grey_walk_8.PNG', import.meta.url).href },
    { key: 'sockroach_walk_1', url: new URL('./sprites/sockroach/sockroach_walk_1.png', import.meta.url).href },
    { key: 'sockroach_walk_2', url: new URL('./sprites/sockroach/sockroach_walk_2.png', import.meta.url).href },
    { key: 'sockroach_walk_3', url: new URL('./sprites/sockroach/sockroach_walk_3.png', import.meta.url).href },
    { key: 'sockroach_walk_4', url: new URL('./sprites/sockroach/sockroach_walk_4.png', import.meta.url).href },
    { key: 'sockroach_walk_5', url: new URL('./sprites/sockroach/sockroach_walk_5.png', import.meta.url).href },
    { key: 'sockroach_stomp_1', url: new URL('./sprites/sockroach/sockroach_stomp_1.png', import.meta.url).href },
    { key: 'sockroach_stomp_2', url: new URL('./sprites/sockroach/sockroach_stomp_2.png', import.meta.url).href },
    { key: 'toast', url: new URL('./sprites/toast/toast_sprite.png', import.meta.url).href },
    { key: 'lenny_face', url: new URL('./sprites/lenny/lenny_face.png', import.meta.url).href },
    { key: 'game_over', url: new URL('./sprites/game/game_over.png', import.meta.url).href },
    { key: 'tiles', url: new URL('../levels/level1/nature-paltformer-tileset-16x16.png', import.meta.url).href },
    { key: 'ui_frame', url: new URL('./UI/Sprites/UI_Flat_Frame02a.png', import.meta.url).href },
    { key: 'ui_btn02_1', url: new URL('./UI/Sprites/UI_Flat_Button02a_1.png', import.meta.url).href },
    { key: 'ui_btn02_2', url: new URL('./UI/Sprites/UI_Flat_Button02a_2.png', import.meta.url).href },
    { key: 'ui_btn02_3', url: new URL('./UI/Sprites/UI_Flat_Button02a_3.png', import.meta.url).href },
    { key: 'ui_btn02_4', url: new URL('./UI/Sprites/UI_Flat_Button02a_4.png', import.meta.url).href },
    { key: 'ui_btn_plus', url: new URL('./UI/Sprites/UI_Flat_ButtonPlus01a.png', import.meta.url).href },
    { key: 'ui_btn_minus', url: new URL('./UI/Sprites/UI_Flat_ButtonMinus01a.png', import.meta.url).href }
  ],
  audio: [
    { key: 'jump', url: new URL('./audio/cartoon-jump-6462.mp3', import.meta.url).href },
    { key: 'bgm', url: new URL('./audio/Pixel Jump Groove.mp3', import.meta.url).href },
    { key: 'toastCollect', url: new URL('./audio/toast-collect.mp3', import.meta.url).href },
    { key: 'hurt', url: new URL('./audio/Hurt.wav', import.meta.url).href },
    { key: 'landEnemy', url: new URL('./audio/LandOnEnemy.wav', import.meta.url).href },
    { key: 'death', url: new URL('./audio/game-over-38511.mp3', import.meta.url).href },
    { key: 'respawn', url: new URL('./audio/a_bulldog_respawning.mp3', import.meta.url).href },
    { key: 'levelSuccess', url: new URL('./audio/level_success.mp3', import.meta.url).href },
    { key: 'ui_select', url: new URL('./audio/select_002.ogg', import.meta.url).href }
  ],
  tilemaps: [
    { key: 'level1', url: new URL('../levels/level1/level1.tmj', import.meta.url).href }
  ]
};

export default manifest;
