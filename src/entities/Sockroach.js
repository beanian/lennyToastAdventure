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

  constructor(scene, x, y, playerHeight, { speed = 60, range = 200, map, groundLayers = [] } = {}) {
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
    this.spawnX = x;
    this.range = range;
    this.patrolLeft = x - range / 2;
    this.patrolRight = x + range / 2;
    this.speed = speed;
    this.map = map;
    this.groundLayers = groundLayers;
    // Move left initially
    this.setVelocityX(-this.speed);
    this.alive = true;
  }

  aboutToFall() {
    // Look one step ahead and slightly below the feet
    const dir = Math.sign(this.body.velocity.x || -1) || -1;
    const aheadX = this.x + dir * (this.body.width / 2 + 2);
    const belowY = this.body.bottom + 2;
    // Check if any ground layer has a tile at this position
    for (const layer of this.groundLayers) {
      const t = this.map.getTileAtWorldXY(aheadX, belowY, false, this.scene.cameras.main, layer);
      if (t && t.collides) return false;
    }
    return true;
  }

  update() {
    if (!this.alive) return;
    const dir = Math.sign(this.body.velocity.x || -1) || -1;
    // Reverse on patrol bounds or when blocked or about to fall
    if (
      this.x <= this.patrolLeft ||
      this.x >= this.patrolRight ||
      this.body.blocked.left ||
      this.body.blocked.right ||
      this.aboutToFall()
    ) {
      const newDir = -dir;
      this.setVelocityX(newDir * this.speed);
    }
    this.flipX = this.body.velocity.x > 0;
  }
}
