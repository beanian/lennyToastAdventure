/* global Phaser */
import Player from '../entities/Player.js';
import Sockroach from '../entities/Sockroach.js';

export default class Level1Scene extends Phaser.Scene {
  constructor() {
    super('Level1');
  }

  preload() {
    this.load.tilemapTiledJSON(
      'level1',
      'src/levels/level1/lennyTest.tmj'
    );
    this.load.image(
      'tiles',
      'src/levels/level1/nature-paltformer-tileset-16x16.png'
    );

    Player.preload(this);
    Sockroach.preload(this);
    this.load.image('toast', 'src/assets/sprites/toast/toast_sprite.png');

    this.load.audio('bgm', 'src/assets/audio/Pixel Jump Groove.mp3');
    this.load.audio('toastCollect', 'src/assets/audio/toast-collect.mp3');
  }

  create() {
    // --- Map + tiles ---
    const map = this.make.tilemap({ key: 'level1' });
    const tiles = map.addTilesetImage(
      'nature-paltformer-tileset-16x16',
      'tiles'
    );

    map.createLayer('Sky', tiles, 0, 0);
    map.createLayer('DecorBack', tiles, 0, 0);
    const ground = map.createLayer('Ground', tiles, 0, 0);
    const platforms =
      map.getLayerIndex('Platforms') !== -1
        ? map.createLayer('Platforms', tiles, 0, 0)
        : null;
    map.createLayer('DecorForground', tiles, 0, 0);

    // Collision by tile property
    ground.setCollisionByProperty({ collision: true });
    if (platforms) platforms.setCollisionByProperty({ collision: true });

    // --- Groups ---
    this.enemies = this.physics.add.group();
    this.collectibles = this.physics.add.group();

    // --- Player spawn from Entities layer ---
    const entities = map.getObjectLayer('Entities');
    let spawnX = 64;
    let spawnY = 64;
    if (entities) {
      const spawn = entities.objects.find(
        o =>
          o.name === 'Spawn_Player' ||
          (o.properties || []).some(
            p => p.name === 'type' && p.value === 'spawn'
          )
      );
      if (spawn) {
        spawnX = spawn.x;
        spawnY = spawn.y - (spawn.height || 0);
      }
    }

    Player.createAnimations(this);
    Sockroach.createAnimations(this);
    this.player = new Player(this, spawnX, spawnY);

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

    // --- Audio ---
    this.toastSound = this.sound.add('toastCollect');
    this.bgm = this.sound.add('bgm', { loop: true, volume: 0.5 });
    this.bgm.play();

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
  }

  spawnEnemy(kind, x, y, props, map) {
    const enemy = new Sockroach(this, x, y, this.player.displayHeight);
    enemy.play('sockroach_walk');
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

    this.enemies.add(enemy);
    return enemy;
  }

  spawnCollectible(kind, x, y, props) {
    const toast = this.collectibles.create(x, y, 'toast').setOrigin(0, 1);
    toast.value = Number(props.value ?? 1);

    this.physics.add.overlap(this.player, toast, () => {
      toast.disableBody(true, true);
      this.toastSound.play();
    });
    return toast;
  }

  update() {
    this.player.update();
    this.enemies.children.iterate(e => {
      if (!e) return;
      if (e.patrol && e.patrol.length >= 2) {
        const tgt = e.patrol[e.patrolIndex];
        const dx = tgt.x - e.x;
        const dy = tgt.y - e.y;
        const len = Math.max(1, Math.hypot(dx, dy));
        e.setVelocity((dx / len) * e.speed, (dy / len) * e.speed);
        if (Math.hypot(e.x - tgt.x, e.y - tgt.y) < 3) {
          e.patrolIndex = (e.patrolIndex + 1) % e.patrol.length;
        }
        e.flipX = e.body.velocity.x < 0;
      } else if (e.update) {
        e.update();
      }
    });
  }
}
