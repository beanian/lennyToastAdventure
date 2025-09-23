const ANIM_KEYS = {
  walk: 'Walk',
  idle: 'Idle',
  stomp: 'Stomp'
};

export default class Bananarchrist extends Phaser.Physics.Arcade.Sprite {
  static createAnimations(scene) {
    const anims = scene.anims;
    if (!anims.exists(ANIM_KEYS.walk)) {
      const created = anims.createFromAseprite('bananarchrist');
      // Ensure the looping behaviour of the imported clips matches gameplay expectations.
      created
        ?.filter(anim => anim?.key)
        ?.forEach(anim => {
          if (anim.key === ANIM_KEYS.walk || anim.key === ANIM_KEYS.idle) {
            anim.repeat = -1;
          }
          if (anim.key === ANIM_KEYS.idle) {
            anim.yoyo = true;
          }
        });
    }
  }

  constructor(scene, x, y, playerHeight, { speed = 60, range = 200, map, groundLayers = [] } = {}) {
    super(scene, x, y, 'bananarchrist');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    const scale = playerHeight / this.height;
    this.setScale(scale * 1.5);
    const bodyWidth = this.displayWidth * 0.9;
    const bodyHeight = this.displayHeight * 0.9;
    this.body.setSize(bodyWidth, bodyHeight);
    this.body.setOffset(
      (this.displayWidth - bodyWidth) / 2,
      (this.displayHeight - bodyHeight) -18
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
    this.alive = true;
    this.enemyKind = 'bananarchrist';
    this.animKeys = ANIM_KEYS;

    // Move left initially
    this.setVelocityX(-this.speed);
    this.play(this.animKeys.idle, true);
  }

  hasGroundAt(x, y) {
    if (!this.map || !Array.isArray(this.groundLayers) || this.groundLayers.length === 0) {
      return true;
    }
    for (const layer of this.groundLayers) {
      const t = this.map.getTileAtWorldXY(x, y, false, this.scene.cameras.main, layer);
      if (t && (t.collides || t.index > -1)) return true;
    }
    return false;
  }

  aboutToFall() {
    const dir = Math.sign(this.body.velocity.x || -1) || -1;
    const aheadX = this.x + dir * (this.body.width / 2 + 2);
    const belowY = this.body.bottom + 2;
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
      this.edgeCooldownUntil = now + 200;
    }
    if (Math.abs(this.body.velocity.x) < 1) {
      const nudgeDir = this.body.blocked.left ? 1 : (this.body.blocked.right ? -1 : dir || -1);
      this.setVelocityX(nudgeDir * this.speed);
    }
    if (this.body.velocity.x !== 0) {
      this.setFlipX(this.body.velocity.x < 0);
    }

    const stompKey = this.animKeys?.stomp;
    if (this.anims?.currentAnim?.key === stompKey) return;
    const vx = this.body.velocity.x;
    if (Math.abs(vx) > 2) {
      const walkKey = this.animKeys?.walk;
      if (walkKey && this.anims?.currentAnim?.key !== walkKey) {
        this.play(walkKey);
      }
    } else {
      const idleKey = this.animKeys?.idle;
      if (idleKey && this.anims?.currentAnim?.key !== idleKey) {
        this.play(idleKey);
      }
    }
  }
}

Bananarchrist.ANIM_KEYS = ANIM_KEYS;
