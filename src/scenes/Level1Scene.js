/* global Phaser */
export default class Level1Scene extends Phaser.Scene {
  constructor() {
    super('Level1');
  }

  preload() {
    this.load.tilemapTiledJSON('level1', 'src/levels/level1/lennyTest.tmj');
    this.load.image('tiles', 'src/levels/level1/nature-paltformer-tileset-16x16.png');

    // Placeholder single-frame sprites
    this.load.image('toast', 'src/assets/sprites/toast/toast_sprite.png');
    this.load.image('sockroach', 'src/assets/sprites/sockroach/sockroach_walk_1.png');
    this.load.image('player', 'src/assets/sprites/lenny/grey_idle.PNG');
  }

  create() {
    // --- Map + tiles ---
    const map = this.make.tilemap({ key: 'level1' });
    const tiles = map.addTilesetImage('nature-paltformer-tileset-16x16', 'tiles');

    const sky = map.createLayer('Sky', tiles, 0, 0);
    const decorBack = map.createLayer('DecorBack', tiles, 0, 0);
    const ground = map.createLayer('Ground', tiles, 0, 0);
    const platforms = map.getLayerIndex('Platforms') !== -1
      ? map.createLayer('Platforms', tiles, 0, 0)
      : null;
    const decorFront = map.createLayer('DecorForground', tiles, 0, 0);

    // Collision by tile property
    ground.setCollisionByProperty({ collision: true });
    if (platforms) platforms.setCollisionByProperty({ collision: true });

    // --- Groups ---
    this.enemies = this.physics.add.group();
    this.collectibles = this.physics.add.group();

    // --- Player spawn from Entities layer ---
    const entities = map.getObjectLayer('Entities');
    let spawnX = 64, spawnY = 64;
    if (entities) {
      const spawn = entities.objects.find(o =>
        o.name === 'Spawn_Player' ||
        (o.properties || []).some(p => p.name === 'type' && p.value === 'spawn')
      );
      if (spawn) {
        spawnX = spawn.x;
        spawnY = spawn.y - (spawn.height || 0);
      }
    }

    this.player = this.physics.add
      .sprite(spawnX, spawnY, 'player')
      .setOrigin(0, 1)
      .setCollideWorldBounds(true);

    // --- Colliders ---
    this.physics.add.collider(this.player, ground);
    if (platforms) this.physics.add.collider(this.player, platforms);

    // --- World & camera bounds ---
    const mapW = map.widthInPixels;
    const mapH = map.heightInPixels;
    this.cameras.main.setBounds(0, 0, mapW, mapH);
    this.physics.world.setBounds(0, 0, mapW, mapH);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

    // --- Enemy vs ground/platforms ---
    this.physics.add.collider(this.enemies, ground);
    if (platforms) this.physics.add.collider(this.enemies, platforms);

    // --- Parse Entities: enemies + collectibles ---
    if (entities) {
      entities.objects.forEach(obj => {
        const props = Object.fromEntries(
          (obj.properties || []).map(p => [p.name, p.value])
        );
        const type = (props.type || obj.type || '').toLowerCase();
        const kind = (props.kind || '').toLowerCase();
        const x = obj.x;
        const y = obj.y - (obj.height || 0);

        if (type === 'enemy') {
          this.spawnEnemy(kind, x, y, props, map);
        } else if (type === 'collectible') {
          this.spawnCollectible(kind, x, y, props);
        }
      });
    }

    // --- Player basic controls (POC) ---
    this.cursors = this.input.keyboard.createCursorKeys();
  }

  spawnEnemy(kind, x, y, props, map) {
    const enemy = this.enemies.create(x, y, 'sockroach').setOrigin(0, 1);
    enemy.setCollideWorldBounds(true);
    enemy.speed = Number(props.speed ?? 60);

    if (props.pathName) {
      const paths = map.getObjectLayer('Paths');
      const pathObj = paths?.objects.find(o => o.name === props.pathName);
      if (pathObj?.polyline) {
        enemy.patrol = pathObj.polyline.map(p => ({
          x: pathObj.x + p.x,
          y: pathObj.y + p.y
        }));
        enemy.patrolIndex = 0;
      }
    }

    return enemy;
  }

  spawnCollectible(kind, x, y, props) {
    const toast = this.collectibles.create(x, y, 'toast').setOrigin(0, 1);
    toast.value = Number(props.value ?? 1);

    this.physics.add.overlap(this.player, toast, () => {
      toast.disableBody(true, true);
    });
    return toast;
  }

  update() {
    const speed = 150;
    const onGround =
      this.player.body?.blocked.down || this.player.body?.touching.down;

    this.player.setVelocityX(0);
    if (this.cursors.left.isDown) this.player.setVelocityX(-speed);
    if (this.cursors.right.isDown) this.player.setVelocityX(speed);
    if (this.cursors.up.isDown && onGround) this.player.setVelocityY(-280);

    // Enemy patrol update
    this.enemies.children.iterate(e => {
      if (!e || !e.patrol || e.patrol.length < 2) return;
      const tgt = e.patrol[e.patrolIndex];
      const dx = tgt.x - e.x;
      const dy = tgt.y - e.y;
      const len = Math.max(1, Math.hypot(dx, dy));
      e.setVelocity((dx / len) * e.speed, (dy / len) * e.speed);
      if (Math.hypot(e.x - tgt.x, e.y - tgt.y) < 3) {
        e.patrolIndex = (e.patrolIndex + 1) % e.patrol.length;
      }
      e.flipX = e.body.velocity.x < 0;
    });
  }
}
