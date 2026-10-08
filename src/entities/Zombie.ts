import Phaser from 'phaser';
import { TUNING } from '../config/tuning';
import { ZombieBehavior, type ZombieArea } from '../systems/ZombieBehavior';

export class Zombie extends Phaser.Physics.Arcade.Sprite {
  readonly behavior: ZombieBehavior;
  private readonly spawnX: number;
  private readonly spawnY: number;

  constructor(scene: Phaser.Scene, x: number, y: number, area: ZombieArea) {
    if (!scene.textures.exists('zombie')) {
      const art = scene.make.graphics({ x: 0, y: 0 });
      art.fillStyle(0x79cea0).fillRoundedRect(6, 1, 44, 39, 12);
      art.fillStyle(0xffffff).fillCircle(18, 17, 8).fillCircle(38, 19, 6);
      art.fillStyle(0x30284e).fillCircle(16, 18, 3).fillCircle(36, 20, 3);
      art.lineStyle(3, 0x30284e).lineBetween(22, 32, 35, 30);
      art.fillStyle(0x79cea0).fillRoundedRect(0, 39, 12, 22, 5).fillRoundedRect(44, 42, 12, 19, 5);
      art.fillStyle(0x57afc5).fillRoundedRect(10, 39, 36, 24, 5);
      art.fillStyle(0xf1b374).fillRect(12, 63, 12, 12).fillRect(32, 63, 12, 12);
      art.fillStyle(0x30284e).fillRoundedRect(6, 73, 20, 7, 3).fillRoundedRect(30, 73, 20, 7, 3);
      art.generateTexture('zombie', TUNING.zombie.width, TUNING.zombie.height);
      art.destroy();
    }
    super(scene, x, y, 'zombie');
    this.spawnX = x;
    this.spawnY = y;
    this.behavior = new ZombieBehavior(area);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setSize(TUNING.zombie.width, TUNING.zombie.height).setCollideWorldBounds(true);
  }

  updateBehavior(now: number, playerX: number): void {
    this.setVelocityX(this.behavior.update(now, this.x, playerX));
    this.setFlipX(this.behavior.facing > 0);
    this.setAngle(this.behavior.state === 'POST_HIT_PAUSE' ? -9 : Math.sin(now / 200) * 3);
  }

  pauseAfterHit(now: number): void {
    this.behavior.pauseAfterHit(now);
    this.setVelocityX(0);
    this.setAngle(-9);
  }

  resetEncounter(): void {
    (this.body as Phaser.Physics.Arcade.Body).reset(this.spawnX, this.spawnY);
    this.setVelocity(0, 0).setAngle(0);
    this.behavior.reset();
  }
}
