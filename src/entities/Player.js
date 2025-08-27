export default class Player extends Phaser.Physics.Arcade.Sprite {
  static preload(scene) {
    scene.load.image('lenny_idle', 'src/assets/sprites/lenny/grey_idle.PNG');
    scene.load.image('lenny_jump_1', 'src/assets/sprites/lenny/grey_jump_1.PNG');
    scene.load.image('lenny_jump_2', 'src/assets/sprites/lenny/grey_jump_2.PNG');
    for (let i = 1; i <= 8; i++) {
      scene.load.image(
        `lenny_walk_${i}`,
        `src/assets/sprites/lenny/grey_walk_${i}.PNG`
      );
    }
    scene.load.audio('jump', 'src/assets/audio/cartoon-jump-6462.mp3');
  }

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
      frameRate: 12,
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

    this.input = inputService;
    this.jumpSound = scene.sound.add('jump');
    this.jumpCount = 0;
  }

  update() {
    const onGround = this.body.blocked.down;
    if (onGround) this.jumpCount = 0;

    if (this.input.left()) {
      this.setVelocityX(-160);
      this.setFlipX(true);
      if (onGround) this.play('walk', true);
    } else if (this.input.right()) {
      this.setVelocityX(160);
      this.setFlipX(false);
      if (onGround) this.play('walk', true);
    } else {
      this.setVelocityX(0);
      if (onGround) this.play('idle', true);
    }

    const jumpPressed = this.input.jumpJustPressed();
    if (jumpPressed && (onGround || this.jumpCount < 2)) {
      this.setVelocityY(-450);
      this.jumpSound.play();
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
