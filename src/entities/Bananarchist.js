const ANIM_KEYS = {
  walk: 'Walk',
  idle: 'Idle',
  stomp: 'Stomp'
};

export default class Bananarchist extends Phaser.Physics.Arcade.Sprite {
  static createAnimations(scene) {
    const anims = scene.anims;
    if (!anims.exists(ANIM_KEYS.walk)) {
      const created = anims.createFromAseprite('bananarchist');
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
    super(scene, x, y, 'bananarchist');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    const scale = playerHeight / this.height;
    this.setScale(scale * 1.5);
    const bodyWidth = this.displayWidth * 0.9;
    const bodyHeight = this.displayHeight * 0.9;
    this.body.setSize(bodyWidth, bodyHeight);
    this.body.setOffset(
      (this.displayWidth - bodyWidth) / 2,
      (this.displayHeight - bodyHeight)+220
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
    this.waitingToTurn = false;
    this.pendingDirection = null;
    this.idleUntil = 0;
    this.alive = true;
    this.enemyKind = 'bananarchist';
    this.animKeys = ANIM_KEYS;
    this.lastDirection = -1;

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
    const now = this.scene.time.now || 0;
    if (this.waitingToTurn) {
      if (now >= this.idleUntil) {
        const resumeDir = this.pendingDirection || -this.lastDirection || -1;
        this.setVelocityX(resumeDir * this.speed);
        this.lastDirection = Math.sign(resumeDir) || -1;
        this.waitingToTurn = false;
        this.pendingDirection = null;
        this.idleUntil = 0;
      } else {
        this.setVelocityX(0);
        const idleKey = this.animKeys?.idle;
        if (idleKey && this.anims?.currentAnim?.key !== idleKey) {
          this.play(idleKey);
        }
        return;
      }
    }

    let dir = Math.sign(this.body.velocity.x);
    if (!dir) dir = this.lastDirection || -1;
    this.lastDirection = dir;
    const atLeftBound = this.x <= this.patrolLeft + 2;
    const atRightBound = this.x >= this.patrolRight - 2;
    const hitWall = this.body.blocked.left || this.body.blocked.right;
    const edge = this.body.blocked.down && this.aboutToFall();
    const shouldFlip =
      (atLeftBound && dir <= 0) ||
      (atRightBound && dir >= 0) ||
      hitWall ||
      edge;
    if (shouldFlip) {
      this.waitingToTurn = true;
      this.pendingDirection = -dir || -1;
      this.idleUntil = now + 2000;
      this.setVelocityX(0);
      const idleKey = this.animKeys?.idle;
      if (idleKey && this.anims?.currentAnim?.key !== idleKey) {
        this.play(idleKey);
      }
      return;
    }
    if (Math.abs(this.body.velocity.x) < 1) {
      const nudgeDir = this.body.blocked.left ? 1 : (this.body.blocked.right ? -1 : dir || -1);
      this.setVelocityX(nudgeDir * this.speed);
      this.lastDirection = Math.sign(nudgeDir) || this.lastDirection || -1;
    }
    if (this.body.velocity.x !== 0) {
      this.setFlipX(this.body.velocity.x < 0);
      this.lastDirection = Math.sign(this.body.velocity.x) || this.lastDirection || -1;
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

Bananarchist.ANIM_KEYS = ANIM_KEYS;
