import { sfx } from '../AudioBus.js';

const SPEED_CHEAT_KEY = 'lenny-toast-speedboost';

function getSpeedMultiplier() {
  if (typeof window === 'undefined') return 1;
  try {
    return window.localStorage?.getItem(SPEED_CHEAT_KEY) === '1' ? 1.15 : 1;
  } catch (err) {
    console.warn('Unable to read speed cheat flag.', err);
    return 1;
  }
}

export default class Player extends Phaser.Physics.Arcade.Sprite {
  static createAnimations(scene) {
    scene.anims.create({
      key: 'idle',
      frames: [{ key: 'lenny_idle' }],
      frameRate: 1,
      repeat: -1
    });

    scene.anims.create({
      key: 'walk',
      frames: [
        { key: 'lenny_walk_1' },
        { key: 'lenny_walk_2' },
        { key: 'lenny_walk_3' },
        { key: 'lenny_walk_4' },
        { key: 'lenny_walk_5' },
        { key: 'lenny_walk_6' },
        { key: 'lenny_walk_7' },
        { key: 'lenny_walk_8' }
      ],
      frameRate: 30,
      repeat: -1
    });
  }

  constructor(scene, x, y, inputService) {
    super(scene, x, y, 'lenny_idle');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    const scale = 0.8;
    this.setScale(scale);
    this.setOrigin(0.5, 1);
    this.setCollideWorldBounds(true);
    this.setDepth(1);
    // Trim transparent bounds so Lenny's feet sit flush with the ground
    this.body.setSize(48 * scale, 45 * scale);
    this.body.setOffset(10 * scale, 18 * scale);

    // Store input service under a non-reserved property to avoid clashing
    // with Phaser's own `input` component on game objects
    this.inputService = inputService;
    this.moveSpeed = 160 * getSpeedMultiplier();
    this.jumpCount = 0;
  }

  update() {
    const onGround = this.body.blocked.down;
    if (onGround) this.jumpCount = 0;

    if (this.inputService.left()) {
      this.setVelocityX(-this.moveSpeed);
      this.setFlipX(true);
      if (onGround) this.play('walk', true);
    } else if (this.inputService.right()) {
      this.setVelocityX(this.moveSpeed);
      this.setFlipX(false);
      if (onGround) this.play('walk', true);
    } else {
      this.setVelocityX(0);
      if (onGround) this.play('idle', true);
    }

    const jumpPressed = this.inputService.jumpJustPressed();
    if (jumpPressed && (onGround || this.jumpCount < 2)) {
      this.setVelocityY(-450);
      sfx('jump');
      this.jumpCount++;
      this.anims.stop();
      this.setTexture('lenny_jump_1');
    }

    if (!onGround) {
      this.anims.stop();
      if (this.body.velocity.y < 0) {
        this.setTexture('lenny_jump_1');
      } else {
        this.setTexture('lenny_jump_2');
      }
    }
  }
}
