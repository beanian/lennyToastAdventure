export default class Sockroach extends Phaser.Physics.Arcade.Sprite {
  static createAnimations(scene) {
    const anims = scene.anims;
    if (!anims.exists('sockroach_walk')) {
      anims.create({
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
    }

    if (!anims.exists('sockroach_stomp')) {
      anims.create({
        key: 'sockroach_stomp',
        frames: [
          { key: 'sockroach_stomp_1' },
          { key: 'sockroach_stomp_2' }
        ],
        frameRate: 10,
        repeat: 0
      });
    }
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
    this.speed = Number.isFinite(speed) && speed > 0 ? speed : 60;
    this.map = map;
    this.groundLayers = groundLayers;
    this.edgeCooldownUntil = 0;
    // Move left initially
    this.setVelocityX(-this.speed);
    this.alive = true;
  }

  hasGroundAt(x, y) {
    for (const layer of this.groundLayers) {
      const t = this.map.getTileAtWorldXY(x, y, false, this.scene.cameras.main, layer);
      if (t && (t.collides || t.index > -1)) return true;
    }
    return false;
  }

  aboutToFall() {
    // Look one step ahead and slightly below the feet
    const dir = Math.sign(this.body.velocity.x || -1) || -1;
    const aheadX = this.x + dir * (this.body.width / 2 + 2);
    const belowY = this.body.bottom + 2;
    // Sample a few points to be robust to thin tiles/edges
    const offsets = [0, 3 * dir, -3 * dir];
    for (const off of offsets) {
      if (this.hasGroundAt(aheadX + off, belowY)) return false;
    }
    return true;
  }

  update() {
    if (!this.alive) return;
    const dir = Math.sign(this.body.velocity.x || -1) || -1;
    const now = this.scene.time.now || 0;
    const atLeftBound = this.x <= this.patrolLeft + 2;
    const atRightBound = this.x >= this.patrolRight - 2;
    const hitWall = this.body.blocked.left || this.body.blocked.right;
    const edge = this.body.blocked.down && this.aboutToFall();
    const shouldFlip = atLeftBound || atRightBound || hitWall || edge;
    if (shouldFlip && now >= this.edgeCooldownUntil) {
      const newDir = -dir || -1;
      this.setVelocityX(newDir * this.speed);
      this.edgeCooldownUntil = now + 200; // debounce flips
    }
    // Nudge if somehow stopped
    if (Math.abs(this.body.velocity.x) < 1) {
      const nudgeDir = this.body.blocked.left ? 1 : (this.body.blocked.right ? -1 : dir || -1);
      this.setVelocityX(nudgeDir * this.speed);
    }
    this.flipX = this.body.velocity.x > 0;
  }
}
