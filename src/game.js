const LEVELS = [
  { key: 'level1', name: 'Countertop Capers', bg: 0xfdebd0 },
  { key: 'level2', name: 'Pantry Peril', bg: 0xfad7a0 },
  { key: 'level3', name: 'Fridge Freeway', bg: 0xbbe1fa },
  { key: 'level4', name: 'Sink or Swim', bg: 0xa3d5ff },
  { key: 'level5', name: 'Oven Overhang', bg: 0xffc27a },
  { key: 'level6', name: 'Spice Rack Run', bg: 0xf5b7b1 },
  { key: 'level7', name: 'Midnight Microwave', bg: 0x2c3e50 },
  { key: 'level8', name: 'Toaster Tower', bg: 0xd3d3d3 }
];

class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });

    g.fillStyle(0x5d7ca6, 1).fillRect(0, 0, 32, 32).generateTexture('lenny', 32, 32).clear();
    g.fillStyle(0xffd39b, 1).fillRect(0, 0, 16, 16).generateTexture('toast', 16, 16).clear();
    g.fillStyle(0xffc400, 1).fillRect(0, 0, 16, 16).generateTexture('goldenToast', 16, 16).clear();
    g.fillStyle(0x8b4513, 1).fillRect(0, 0, 100, 20).generateTexture('platform', 100, 20).clear();
    g.fillStyle(0x8b4513, 1).fillRect(0, 0, 800, 40).generateTexture('ground', 800, 40).clear();
    g.fillStyle(0x6b4c1e, 1).fillRect(0, 0, 32, 16).generateTexture('sockroach', 32, 16).clear();
    g.fillStyle(0x00aa00, 1).fillRect(0, 0, 32, 64).generateTexture('goal', 32, 64).destroy();
  }

  create() {
    this.scene.start('level1', { level: 0, score: 0 });
  }
}

class LevelScene extends Phaser.Scene {
  constructor(cfg) {
    super(cfg.key);
    this.cfg = cfg;
  }

  init(data) {
    this.levelIndex = data.level || 0;
    this.score = data.score || 0;
  }

  create() {
    this.cameras.main.setBackgroundColor(this.cfg.bg);

    this.platforms = this.physics.add.staticGroup();
    this.platforms.create(400, 580, 'ground');
    this.platforms.create(400, 450, 'platform');
    this.platforms.create(100, 300, 'platform');
    this.platforms.create(700, 350, 'platform');

    this.player = this.physics.add.sprite(100, 500, 'lenny');
    this.player.setBounce(0.1);
    this.player.setCollideWorldBounds(true);

    this.cursors = this.input.keyboard.createCursorKeys();

    this.toasts = this.physics.add.group();
    this.toasts.create(150, 520, 'toast');
    this.toasts.create(400, 420, 'toast');
    this.toasts.create(600, 260, 'toast');
    this.physics.add.collider(this.toasts, this.platforms);

    this.goldenToast = this.physics.add.sprite(750, 260, 'goldenToast');
    this.physics.add.collider(this.goldenToast, this.platforms);

    this.sockroach = this.physics.add.sprite(400, 520, 'sockroach');
    this.sockroach.setCollideWorldBounds(true);
    this.sockroach.setBounce(1, 0);
    this.sockroach.setVelocityX(60);
    this.physics.add.collider(this.sockroach, this.platforms);

    this.goal = this.physics.add.staticImage(770, 520, 'goal');

    const textColor = this.cfg.bg < 0x808080 ? '#ffffff' : '#000000';
    this.scoreText = this.add.text(16, 16, `${this.cfg.name} - Toast: ${this.score}`, {
      font: '16px Courier',
      fill: textColor
    });

    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.overlap(this.player, this.toasts, this.collectToast, null, this);
    this.physics.add.overlap(this.player, this.goldenToast, this.collectGolden, null, this);
    this.physics.add.collider(this.player, this.sockroach, this.hitEnemy, null, this);
    this.physics.add.overlap(this.player, this.goal, this.reachGoal, null, this);
  }

  collectToast(player, toast) {
    toast.disableBody(true, true);
    this.score += 1;
    this.scoreText.setText(`${this.cfg.name} - Toast: ${this.score}`);
  }

  collectGolden(player, toast) {
    toast.disableBody(true, true);
    this.score += 5;
    this.scoreText.setText(`${this.cfg.name} - Toast: ${this.score}`);
  }

  hitEnemy(player, enemy) {
    this.scene.restart({ level: this.levelIndex, score: this.score });
  }

  reachGoal() {
    if (this.levelIndex < LEVELS.length - 1) {
      const next = LEVELS[this.levelIndex + 1];
      this.scene.start(next.key, { level: this.levelIndex + 1, score: this.score });
    } else {
      this.scene.start('Victory', { score: this.score });
    }
  }

  update() {
    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-160);
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(160);
    } else {
      this.player.setVelocityX(0);
    }

    if (this.cursors.up.isDown && this.player.body.touching.down) {
      this.player.setVelocityY(-330);
    }

    if (this.player.y > 600) {
      this.scene.restart({ level: this.levelIndex, score: this.score });
    }
  }
}

class VictoryScene extends Phaser.Scene {
  constructor() {
    super('Victory');
  }

  create(data) {
    this.add.text(150, 200, `All toast recovered!\nScore: ${data.score}`, {
      font: '24px Courier',
      fill: '#ffffff',
      align: 'center'
    });
  }
}

const scenes = [BootScene];
LEVELS.forEach(cfg => scenes.push(new LevelScene(cfg)));
scenes.push(VictoryScene);

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  pixelArt: true,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 300 },
      debug: false
    }
  },
  scene: scenes
};

new Phaser.Game(config);
