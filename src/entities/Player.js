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

    // Store input service under a non-reserved property to avoid clashing
    // with Phaser's own `input` component on game objects
    this.inputService = inputService;
    this.jumpSound = scene.sound.add('jump');
    this.jumpCount = 0;
      
         // Movement tuning constants
      this.moveSpeed = 160;
      this.jumpSpeed = 450;
  }

  update(delta = 0, timeScale = 1) {
    const onGround = this.body.blocked.down;
    if (onGround) this.jumpCount = 0;

    if (this.inputService.left()) {
      this.setVelocityX(-160);
      this.setFlipX(true);
      if (onGround) this.play('walk', true);
    } else if (this.inputService.right()) {
      this.setVelocityX(160);
      this.setFlipX(false);
      if (onGround) this.play('walk', true);
    } else {
      this.setVelocityX(0);
      if (onGround) this.play('idle', true);
    }

    const jumpPressed = this.inputService.jumpJustPressed();
    if (jumpPressed && (onGround || this.jumpCount < 2)) {
      this.setVelocityY(-450);
      this.jumpSound.play();
      this.jumpCount++;
      this.anims.stop();
      this.setTexture('lenny_jump_1');
    }

      const speed = this.moveSpeed * timeScale;
      if (this.cursors.left.isDown) {
        this.setVelocityX(-speed);
        this.setFlipX(true);
        if (onGround) this.play('walk', true);
      } else if (this.cursors.right.isDown) {
        this.setVelocityX(speed);
        this.setFlipX(false);
        if (onGround) this.play('walk', true);
      } else {
        this.setVelocityX(0);
        if (onGround) this.play('idle', true);
      }

      const jumpPressed = Phaser.Input.Keyboard.JustDown(this.cursors.up);
      if (jumpPressed && (onGround || this.jumpCount < 2)) {
        this.setVelocityY(-this.jumpSpeed * timeScale);
        this.jumpSound.play();
        this.jumpCount++;
        this.anims.stop();
        this.setTexture('lenny_jump_1');
      }

      // Clamp velocities to prevent accumulation from collisions and time scaling
      this.body.velocity.x = Phaser.Math.Clamp(
        this.body.velocity.x,
        -this.moveSpeed,
        this.moveSpeed
      );
      this.body.velocity.y = Phaser.Math.Clamp(
        this.body.velocity.y,
        -Infinity,
        this.jumpSpeed
      );

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
