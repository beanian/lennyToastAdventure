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
let healthText;
let hurtSound;
let landEnemySound;
let isInvincible = false;
const spawnPoint = { x: 100, y: 450 };

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
    (sockroach.displayHeight - bodyHeight)
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

  cursors = this.input.keyboard.createCursorKeys();
  jumpSound = this.sound.add('jump');
  deathSound = this.sound.add('death');
  respawnSound = this.sound.add('respawn');
  hurtSound = this.sound.add('hurt');
  landEnemySound = this.sound.add('landEnemy');
  bgm = this.sound.add('bgm', { loop: true, volume: 0.5 });
  bgm.play();

  this.add.text(10, 10, `Lenny Toast Adventure Test ${VERSION}`, {
    font: '16px Courier',
    fill: '#ffffff'
  });
  healthText = this.add.text(10, 30, `Health: ${health}`, {
    font: '16px Courier',
    fill: '#ffffff'
  });
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
      healthText.setText(`Health: ${health}`);
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
  const falling = playerObj.body.velocity.y > 0;

  console.log('Player-Enemy collision', {
    playerBottom,
    enemyTop,
    playerVelocityY: playerObj.body.velocity.y,
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
    healthText.setText(`Health: ${health}`);
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

