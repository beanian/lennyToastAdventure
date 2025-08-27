export default class Sockroach extends Phaser.Physics.Arcade.Sprite {
  static createAnimations(scene) {
    scene.anims.create({
      key: 'sockroach_walk',
      frames: [
        { key: 'sockroach_walk_1' },
        { key: 'sockroach_walk_2' },
        { key: 'sockroach_walk_3' },
        { key: 'sockroach_walk_4' },
        { key: 'sockroach_walk_5' },
        { key: 'sockroach_walk_6' }
      ],
      frameRate: 8,
      repeat: -1
    });

    scene.anims.create({
      key: 'sockroach_stomp',
      frames: [
        { key: 'sockroach_stomp_1' },
        { key: 'sockroach_stomp_2' }
      ],
      frameRate: 10,
      repeat: 0
    });
  }

    constructor(scene, x, y, playerHeight) {
      super(scene, x, y, 'sockroach_walk_1');
      scene.add.existing(this);
      scene.physics.add.existing(this);

      const scale = playerHeight / this.height;
      this.setScale(scale * 0.6);
      const bodyWidth = this.displayWidth * 0.9;
      const bodyHeight = this.displayHeight * 0.9;
      this.body.setSize(bodyWidth, bodyHeight);
      this.body.setOffset(
        (this.displayWidth - bodyWidth) / 2,
        (this.displayHeight - bodyHeight) + 22
      );

      this.setCollideWorldBounds(true);
      this.setDepth(1);
      this.patrolLeft = x - 50;
      this.patrolRight = x + 50;
      this.speed = 60;
      // Move left initially so patrol starts by going towards the left bound
      this.setVelocityX(-this.speed);
      this.alive = true;
    }

    update(delta = 0, timeScale = 1) {
      if (!this.alive) return;

      // Predict next position using delta and timeScale to avoid overshoot
      const dt = (delta / 1000) * timeScale;
      const nextX = this.x + this.body.velocity.x * dt;
      if (this.body.velocity.x < 0 && nextX <= this.patrolLeft) {
        this.x = this.patrolLeft;
        this.setVelocityX(this.speed * timeScale);
      } else if (this.body.velocity.x > 0 && nextX >= this.patrolRight) {
        this.x = this.patrolRight;
        this.setVelocityX(-this.speed * timeScale);
      }

      // Clamp horizontal velocity so physics remains deterministic
      this.body.velocity.x = Phaser.Math.Clamp(
        this.body.velocity.x,
        -this.speed * timeScale,
        this.speed * timeScale
      );

      this.flipX = this.body.velocity.x < 0;
    }
  }
