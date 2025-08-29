const manifest = {
  images: [
    { key: 'lenny_idle', url: 'src/assets/sprites/lenny/grey_idle.PNG' },
    { key: 'lenny_jump_1', url: 'src/assets/sprites/lenny/grey_jump_1.PNG' },
    { key: 'lenny_jump_2', url: 'src/assets/sprites/lenny/grey_jump_2.PNG' },
    { key: 'lenny_walk_1', url: 'src/assets/sprites/lenny/grey_walk_1.PNG' },
    { key: 'lenny_walk_2', url: 'src/assets/sprites/lenny/grey_walk_2.PNG' },
    { key: 'lenny_walk_3', url: 'src/assets/sprites/lenny/grey_walk_3.PNG' },
    { key: 'lenny_walk_4', url: 'src/assets/sprites/lenny/grey_walk_4.PNG' },
    { key: 'lenny_walk_5', url: 'src/assets/sprites/lenny/grey_walk_5.PNG' },
    { key: 'lenny_walk_6', url: 'src/assets/sprites/lenny/grey_walk_6.PNG' },
    { key: 'lenny_walk_7', url: 'src/assets/sprites/lenny/grey_walk_7.PNG' },
    { key: 'lenny_walk_8', url: 'src/assets/sprites/lenny/grey_walk_8.PNG' },
    { key: 'sockroach_walk_1', url: 'src/assets/sprites/sockroach/sockroach_walk_1.png' },
    { key: 'sockroach_walk_2', url: 'src/assets/sprites/sockroach/sockroach_walk_2.png' },
    { key: 'sockroach_walk_3', url: 'src/assets/sprites/sockroach/sockroach_walk_3.png' },
    { key: 'sockroach_walk_4', url: 'src/assets/sprites/sockroach/sockroach_walk_4.png' },
    { key: 'sockroach_walk_5', url: 'src/assets/sprites/sockroach/sockroach_walk_5.png' },
    { key: 'sockroach_stomp_1', url: 'src/assets/sprites/sockroach/sockroach_stomp_1.png' },
    { key: 'sockroach_stomp_2', url: 'src/assets/sprites/sockroach/sockroach_stomp_2.png' },
    { key: 'toast', url: 'src/assets/sprites/toast/toast_sprite.png' },
    { key: 'lenny_face', url: 'src/assets/sprites/lenny/lenny_face.png' },
    { key: 'game_over', url: 'src/assets/sprites/game/game_over.png' },
    { key: 'tiles', url: 'src/levels/level1/nature-paltformer-tileset-16x16.png' }
    ,
    // UI assets
    { key: 'ui_frame', url: 'src/assets/UI/Sprites/UI_Flat_Frame02a.png' },
    { key: 'ui_btn02_1', url: 'src/assets/UI/Sprites/UI_Flat_Button02a_1.png' },
    { key: 'ui_btn02_2', url: 'src/assets/UI/Sprites/UI_Flat_Button02a_2.png' },
    { key: 'ui_btn02_3', url: 'src/assets/UI/Sprites/UI_Flat_Button02a_3.png' },
    { key: 'ui_btn02_4', url: 'src/assets/UI/Sprites/UI_Flat_Button02a_4.png' },
    { key: 'ui_btn_plus', url: 'src/assets/UI/Sprites/UI_Flat_ButtonPlus01a.png' },
    { key: 'ui_btn_minus', url: 'src/assets/UI/Sprites/UI_Flat_ButtonMinus01a.png' }
  ],
  audio: [
    { key: 'jump', url: 'src/assets/audio/cartoon-jump-6462.mp3' },
    { key: 'bgm', url: 'src/assets/audio/Pixel Jump Groove.mp3' },
    { key: 'toastCollect', url: 'src/assets/audio/toast-collect.mp3' },
    { key: 'hurt', url: 'src/assets/audio/Hurt.wav' },
    { key: 'landEnemy', url: 'src/assets/audio/LandOnEnemy.wav' },
    { key: 'death', url: 'src/assets/audio/game-over-38511.mp3' },
    { key: 'respawn', url: 'src/assets/audio/a_bulldog_respawning.mp3' },
    { key: 'ui_select', url: 'src/assets/audio/select_002.ogg' }
  ],
  tilemaps: [
    { key: 'level1', url: 'src/levels/level1/level1.tmj' }
  ]
};

export default manifest;
