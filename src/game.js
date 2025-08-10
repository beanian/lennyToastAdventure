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

  // Audio
  this.load.audio(
    'jump',
    'src/assets/audio/cartoon-jump-6462.mp3'
  );
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

  // Player setup
  player = this.physics.add.sprite(100, 450, 'lenny_idle');
  player.setCollideWorldBounds(true);

  // Simple test area: ground and a platform
  const ground = this.add.rectangle(400, 580, 800, 40, 0x8B4513);
  this.physics.add.existing(ground, true);

  const platform = this.add.rectangle(400, 400, 200, 20, 0x8B4513);
  this.physics.add.existing(platform, true);

  this.physics.add.collider(player, ground);
  this.physics.add.collider(player, platform);

  cursors = this.input.keyboard.createCursorKeys();
  jumpSound = this.sound.add('jump');

  this.add.text(10, 10, 'Lenny Toast Adventure Test', {
    font: '16px Courier',
    fill: '#ffffff'
  });
}

function update() {
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
}

