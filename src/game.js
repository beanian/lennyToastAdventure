const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  pixelArt: true,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  scene: { preload, create, update }
};

const game = new Phaser.Game(config);

function preload() {
  // Load assets here
}

function create() {
  this.add.text(10, 10, 'Lenny Toast Adventure', {
    font: '16px Courier',
    fill: '#ffffff'
  });
}

function update() {
  // Game logic goes here
}
