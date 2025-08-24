const VERSION = 'v1.0.6';
document.title = `Lenny Toast Adventure ${VERSION}`;

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  pixelArt: true,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 1000 },
      debug: false
    }
  },
  scene: { preload, create, update }
};

const game = new Phaser.Game(config);

let player;
let cursors;
let jumpSound;
let jumpCount = 0;
let deathSound;
let respawnSound;
let bgm;
let isDead = false;
let sockroach;
let sockroachCollider;
let health = 3;
let healthIcons;
let hurtSound;
let landEnemySound;
let isInvincible = false;
const spawnPoint = { x: 100, y: 450 };
let toastSound;
let toasts;
let toastCount = 0;
let toastStack;
let toastNumberText;
const toastStackBase = { x: 780, y: 80 };
const toastSliceHeight = 20;
const healthBase = { x: 10, y: 30 };
const healthSliceSpacing = 25;

function preload() {
  // Lenny sprites
  this.load.image('lenny_idle', 'src/assets/sprites/lenny/grey_idle.PNG');
  this.load.image('lenny_jump_1', 'src/assets/sprites/lenny/grey_jump_1.PNG');
  this.load.image('lenny_jump_2', 'src/assets/sprites/lenny/grey_jump_2.PNG');
  for (let i = 1; i <= 8; i++) {
    this.load.image(
      `lenny_walk_${i}`,
      `src/assets/sprites/lenny/grey_walk_${i}.PNG`
    );
  }

  // Sockroach sprites
  for (let i = 1; i <= 6; i++) {
    this.load.image(
      `sockroach_walk_${i}`,
      `src/assets/sprites/sockroach/sockroach_walk_${i}.png`
    );
  }
  for (let i = 1; i <= 2; i++) {
    this.load.image(
      `sockroach_stomp_${i}`,
      `src/assets/sprites/sockroach/sockroach_stomp_${i}.png`
    );
  }

  // Toast sprite
  this.load.image('toast', 'src/assets/sprites/toast/toast_sprite.png');

  // Audio
  this.load.audio(
    'jump',
    'src/assets/audio/cartoon-jump-6462.mp3'
  );
  this.load.audio('death', 'src/assets/audio/game-over-38511.mp3');
  this.load.audio('respawn', 'src/assets/audio/a_bulldog_respawning.mp3');
  this.load.audio('bgm', 'src/assets/audio/Pixel Jump Groove.mp3');
  this.load.audio('hurt', 'src/assets/audio/Hurt.wav');
  this.load.audio('landEnemy', 'src/assets/audio/LandOnEnemy.wav');
  this.load.audio('toastCollect', 'src/assets/audio/toast-collect.mp3');
}

function create() {
  // Animations
  this.anims.create({
    key: 'idle',
    frames: [{ key: 'lenny_idle' }],
    frameRate: 1,
    repeat: -1
  });

  this.anims.create({
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

  this.anims.create({
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

  this.anims.create({
    key: 'sockroach_stomp',
    frames: [
      { key: 'sockroach_stomp_1' },
      { key: 'sockroach_stomp_2' }
    ],
    frameRate: 10,
    repeat: 0
  });

  // Player setup
  player = this.physics.add.sprite(spawnPoint.x, spawnPoint.y, 'lenny_idle');
  player.setCollideWorldBounds(true);
  player.setDepth(1);
  // Trim transparent bounds so Lenny's feet sit flush with the ground
  player.body.setSize(48, 45);
  player.body.setOffset(10, 6);

  // Simple play test area: ground, platform, kill block and sockroach
  const ground = this.add.rectangle(400, 580, 800, 40, 0x8B4513);
  ground.setDepth(-1);
  this.physics.add.existing(ground, true);

  const platform = this.add.rectangle(400, 400, 200, 20, 0x8B4513);
  platform.setDepth(-1);
  this.physics.add.existing(platform, true);

  const killBlock = this.add.rectangle(600, 540, 40, 40, 0xff0000);
  killBlock.setDepth(-1);
  this.physics.add.existing(killBlock, true);
  // Toast collectibles
  toasts = this.physics.add.group({ allowGravity: false, immovable: true });
  const toastPositions = [
    { x: 200, y: 520 },
    { x: 450, y: 360 },
    { x: 650, y: 520 }
  ];
  toastPositions.forEach(pos => {
    const toast = toasts.create(pos.x, pos.y, 'toast');
    const toastScale = (player.displayHeight / toast.height) * 0.5;
    toast.setScale(toastScale);
    toast.bobTween = this.tweens.add({
      targets: toast,
      y: pos.y - 10,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  });
  // Sockroach setup
  sockroach = this.physics.add.sprite(300, 528, 'sockroach_walk_1');
  sockroach.play('sockroach_walk');
  const sockroachScale = player.displayHeight / sockroach.height;
  sockroach.setScale(sockroachScale);
  // Align sockroach body so it walks on the ground like Lenny
  const bodyWidth = sockroach.displayWidth * 0.9;
  const bodyHeight = sockroach.displayHeight * 0.9;
  sockroach.body.setSize(bodyWidth, bodyHeight);
  sockroach.body.setOffset(
    (sockroach.displayWidth - bodyWidth) / 2,
    (sockroach.displayHeight - bodyHeight)-10
  );
  sockroach.setFlipX(true);
  sockroach.setCollideWorldBounds(true);
  sockroach.setDepth(1);
  sockroach.patrolLeft = 250;
  sockroach.patrolRight = 550;
  sockroach.setVelocityX(50);
  sockroachCollider = this.physics.add.collider(sockroach, ground);

  this.physics.add.collider(player, ground);
  this.physics.add.collider(player, platform);
  this.physics.add.collider(player, sockroach, handlePlayerEnemy, null, this);
  this.physics.add.overlap(player, killBlock, playerDie, null, this);
  this.physics.add.overlap(player, toasts, collectToast, null, this);

  cursors = this.input.keyboard.createCursorKeys();
  jumpSound = this.sound.add('jump');
  deathSound = this.sound.add('death');
  respawnSound = this.sound.add('respawn');
  hurtSound = this.sound.add('hurt');
  landEnemySound = this.sound.add('landEnemy');
  toastSound = this.sound.add('toastCollect');
  bgm = this.sound.add('bgm', { loop: true, volume: 0.5 });
  bgm.play();

  this.add.text(10, 10, `Lenny Toast Adventure Test ${VERSION}`, {
    font: '16px Courier',
    fill: '#ffffff'
  });
  healthIcons = this.add.group();
  for (let i = 0; i < health; i++) {
    const slice = this.add.sprite(
      healthBase.x + i * healthSliceSpacing,
      healthBase.y,
      'toast'
    );
    slice.setScale(0.5);
    slice.setOrigin(0, 0);
    this.tweens.add({
      targets: slice,
      y: '-=2',
      yoyo: true,
      repeat: -1,
      duration: 800,
      ease: 'Sine.easeInOut'
    });
    healthIcons.add(slice);
  }

  toastStack = this.add.group();
  toastNumberText = this.add
    .text(toastStackBase.x - 20, toastStackBase.y - 40, toastCount.toString(), {
      font: '16px Courier',
      fill: '#8B4513',
      stroke: '#FFD700',
      strokeThickness: 2
    })
    .setOrigin(1, 0);
}

function refreshHealthUI(scene) {
  const current = healthIcons.getLength();
  if (current > health) {
    for (let i = current; i > health; i--) {
      const slice = healthIcons.getChildren()[i - 1];
      healthIcons.remove(slice);
      scene.tweens.add({
        targets: slice,
        x: slice.x + 30,
        y: slice.y + 30,
        angle: 45,
        alpha: 0,
        duration: 500,
        onComplete: () => slice.destroy()
      });
      const crumbs = scene.add.particles('toast');
      crumbs
        .createEmitter({
          speed: { min: -50, max: 50 },
          scale: { start: 0.1, end: 0 },
          lifespan: 300
        })
        .explode(10, slice.x, slice.y);
      scene.time.delayedCall(300, () => crumbs.destroy());
    }
  } else if (current < health) {
    for (let i = current; i < health; i++) {
      const slice = scene.add.sprite(
        healthBase.x + i * healthSliceSpacing,
        healthBase.y,
        'toast'
      );
      slice.setScale(0.5);
      slice.setOrigin(0, 0);
      scene.tweens.add({
        targets: slice,
        x: slice.x,
        y: slice.y,
        scaleX: { from: 0, to: 0.5 },
        scaleY: { from: 0, to: 0.5 },
        duration: 300,
        ease: 'Back.out'
      });
      scene.tweens.add({
        targets: slice,
        y: '-=2',
        yoyo: true,
        repeat: -1,
        duration: 800,
        ease: 'Sine.easeInOut'
      });
      healthIcons.add(slice);
    }
  }
  healthIcons.getChildren().forEach(s => {
    if (health <= 1) {
      s.setTint(0x5c4033);
    } else {
      s.clearTint();
    }
  });
}

function addToastSlice(scene) {
  const idx = toastStack.getLength();
  const slice = scene.add.sprite(
    toastStackBase.x,
    toastStackBase.y + 30,
    'toast'
  );
  slice.setScale(0.5);
  slice.setOrigin(1, 1);
  toastStack.add(slice);
  scene.tweens.add({
    targets: slice,
    y: toastStackBase.y - idx * toastSliceHeight,
    duration: 400,
    ease: 'Bounce.easeOut'
  });
  const crumbs = scene.add.particles('toast');
  crumbs
    .createEmitter({
      speed: { min: -30, max: 30 },
      scale: { start: 0.1, end: 0 },
      lifespan: 300
    })
    .explode(5, toastStackBase.x, toastStackBase.y - idx * toastSliceHeight);
  scene.time.delayedCall(300, () => crumbs.destroy());
  toastNumberText.setText(toastCount.toString());
  scene.tweens.add({
    targets: toastNumberText,
    scale: { from: 1.2, to: 1 },
    duration: 200,
    ease: 'Sine.easeOut'
  });
  if ([10, 50, 100].includes(toastCount)) {
    scene.tweens.add({
      targets: toastStack.getChildren(),
      scaleX: '+=0.1',
      scaleY: '+=0.1',
      yoyo: true,
      duration: 200
    });
  }
}

function playerDie() {
  if (isDead) return;
  isDead = true;
  bgm.stop();
  deathSound.play();
  player.setVelocity(0, 0);
  player.anims.stop();
  player.setTexture('lenny_idle');

  this.tweens.add({
    targets: player,
    alpha: 0,
    angle: 180,
    duration: 4000,
    onComplete: () => {
      player.setAngle(0);
      player.setPosition(spawnPoint.x, spawnPoint.y);
      jumpCount = 0;
      health = 3;
      refreshHealthUI(this);
      respawnSound.play();
      respawnSound.once('complete', () => {
        bgm.setVolume(0);
        bgm.play();
        this.tweens.add({
          targets: bgm,
          volume: 0.5,
          duration: 1000
        });
      });
      this.tweens.add({
        targets: player,
        alpha: 1,
        duration: 500,
        onComplete: () => {
          isDead = false;
        }
      });
    }
  });
}

function handlePlayerEnemy(playerObj, enemy) {
  if (enemy.alive === false) return;

  const playerBottom = playerObj.body.bottom;
  const enemyTop = enemy.body.top;
  const falling =
    playerObj.body.velocity.y > 0 || playerObj.body.prev.y < playerObj.body.y;

  console.log('Player-Enemy collision', {
    playerBottom,
    enemyTop,
    playerVelocityY: playerObj.body.velocity.y,
    previousY: playerObj.body.prev.y,
    falling
  });

  if (falling && playerBottom <= enemyTop + 5) {
    console.log('Player stomped enemy');
    landEnemySound.play();
    enemy.alive = false;
    enemy.play('sockroach_stomp');
    enemy.setVelocity(0, 0);
    playerObj.setVelocityY(-300);
    sockroachCollider.destroy();
    enemy.body.checkCollision.none = true;
    enemy.setCollideWorldBounds(false);
    enemy.once('animationcomplete-sockroach_stomp', () => {
      enemy.setVelocityY(-200);
      this.time.delayedCall(1000, () => enemy.destroy());
    });
  } else {
    console.log('Player hit by enemy');
    if (isInvincible) return;
    hurtSound.play();
    health -= 1;
    refreshHealthUI(this);
    isInvincible = true;
    playerObj.setTint(0xff0000);
    this.time.addEvent({
      delay: 100,
      repeat: 5,
      callback: () => {
        playerObj.visible = !playerObj.visible;
      }
    });
    this.time.delayedCall(1000, () => {
      isInvincible = false;
      playerObj.clearTint();
      playerObj.visible = true;
    });
    if (health <= 0) {
      playerDie.call(this);
    }
  }
}

function collectToast(playerObj, toast) {
  toast.bobTween.stop();
  toast.body.enable = false;
  this.tweens.add({
    targets: toast,
    scale: toast.scale * 1.5,
    alpha: 0,
    duration: 300,
    onComplete: () => toast.destroy()
  });
  toastSound.play();
  toastCount += 1;
  addToastSlice(this);
}

function update() {
  if (isDead) return;

  const onGround = player.body.blocked.down;
  if (onGround) jumpCount = 0;

  if (cursors.left.isDown) {
    player.setVelocityX(-160);
    player.setFlipX(true);
    if (onGround) player.play('walk', true);
  } else if (cursors.right.isDown) {
    player.setVelocityX(160);
    player.setFlipX(false);
    if (onGround) player.play('walk', true);
  } else {
    player.setVelocityX(0);
    if (onGround) player.play('idle', true);
  }

  const jumpPressed = Phaser.Input.Keyboard.JustDown(cursors.up);
  if (jumpPressed && (onGround || jumpCount < 2)) {
    player.setVelocityY(-450);
    jumpSound.play();
    jumpCount++;
    player.anims.stop();
    player.setTexture('lenny_jump_1');
  }

  if (!onGround) {
    player.anims.stop();
    if (player.body.velocity.y < 0) {
      player.setTexture('lenny_jump_1');
    } else {
      player.setTexture('lenny_jump_2');
    }
  }

  if (sockroach && sockroach.alive !== false) {
    if (sockroach.x <= sockroach.patrolLeft) {
      sockroach.setVelocityX(50);
      sockroach.setFlipX(true);
    } else if (sockroach.x >= sockroach.patrolRight) {
      sockroach.setVelocityX(-50);
      sockroach.setFlipX(false);
    }
  }
}

