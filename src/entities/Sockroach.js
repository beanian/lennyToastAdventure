export default class Sockroach extends Phaser.Physics.Arcade.Sprite {
  static preload(scene) {
    for (let i = 1; i <= 6; i++) {
      scene.load.image(
        `sockroach_walk_${i}`,
        `src/assets/sprites/sockroach/sockroach_walk_${i}.png`
      );
    }
    for (let i = 1; i <= 2; i++) {
      scene.load.image(
        `sockroach_stomp_${i}`,
        `src/assets/sprites/sockroach/sockroach_stomp_${i}.png`
      );
    }
  }

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
    this.setScale(scale*0.6);
    const bodyWidth = this.displayWidth * 0.9;
    const bodyHeight = this.displayHeight * 0.9;
    this.body.setSize(bodyWidth, bodyHeight);
    this.body.setOffset(
      (this.displayWidth - bodyWidth) / 2,
      (this.displayHeight - bodyHeight) - 10
    );

    this.setFlipX(true);
    this.setCollideWorldBounds(true);
    this.setDepth(1);
    this.patrolLeft = x - 50;
    this.patrolRight = x + 50;
    this.setVelocityX(50);
    this.alive = true;
  }

  update() {
    if (this.alive === false) return;
    if (this.x <= this.patrolLeft) {
      this.setVelocityX(50);
      this.setFlipX(true);
    } else if (this.x >= this.patrolRight) {
      this.setVelocityX(-50);
      this.setFlipX(false);
    }
  }
}
