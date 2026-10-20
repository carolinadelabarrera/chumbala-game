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
      art.clear();
      art.fillStyle(0xf1b374).fillRoundedRect(6, 1, 44, 39, 12);
      art.fillStyle(0x30284e).fillCircle(18, 17, 3).fillCircle(38, 17, 3);
      art.lineStyle(3, 0x30284e).beginPath().arc(28, 24, 9, 0, Math.PI).strokePath();
      art.fillStyle(0xf1b374).fillRoundedRect(0, 39, 12, 22, 5).fillRoundedRect(44, 42, 12, 19, 5);
      art.fillStyle(0xff86bd).fillRoundedRect(10, 39, 36, 24, 5);
      art.fillStyle(0x57afc5).fillRect(12, 63, 12, 12).fillRect(32, 63, 12, 12);
      art.fillStyle(0x30284e).fillRoundedRect(6, 73, 20, 7, 3).fillRoundedRect(30, 73, 20, 7, 3);
      art.generateTexture('townsperson', TUNING.zombie.width, TUNING.zombie.height);
      art.destroy();
    }
    super(scene, x, y, 'zombie');
    this.spawnX = x;
    this.spawnY = y;
    this.behavior = new ZombieBehavior(area);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setSize(TUNING.zombie.bodyWidth, TUNING.zombie.bodyHeight).setCollideWorldBounds(true);
    this.setOffset((TUNING.zombie.width - TUNING.zombie.bodyWidth) / 2,
      TUNING.zombie.height - TUNING.zombie.bodyHeight);
    // Bound the body in physics too, so a long frame cannot overshoot the leash.
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setBoundsRectangle(new Phaser.Geom.Rectangle(
      area.encounterLeft - body.halfWidth, 0,
      area.encounterRight - area.encounterLeft + body.width, scene.physics.world.bounds.height));
  }

  updateBehavior(now: number, playerX: number): void {
    if (this.behavior.isCured()) this.setCollideWorldBounds(false);
    this.setVelocityX(this.behavior.update(now, this.x, playerX));
    this.setFlipX(this.behavior.facing > 0);
    const state = this.behavior.state;
    this.setAngle(state === 'POST_HIT_PAUSE' ? -9 : this.behavior.canReceivePan() || state === 'CELEBRATE' ? Math.sin(now / 200) * 3 : 0);
    this.setTexture(this.behavior.isCured() ? 'townsperson' : 'zombie');
  }

  restoreCured(): void {
    this.behavior.restoreCured();
    this.setVelocity(0, 0).setAngle(0).setTexture('townsperson').setCollideWorldBounds(false);
  }

  pauseAfterHit(now: number): void {
    this.behavior.pauseAfterHit(now);
    this.setVelocityX(0);
    this.setAngle(-9);
  }

  resetEncounter(): void {
    if (!this.behavior.canReceivePan()) return;
    (this.body as Phaser.Physics.Arcade.Body).reset(this.spawnX, this.spawnY);
    this.setVelocity(0, 0).setAngle(0);
    this.behavior.reset();
  }
}
