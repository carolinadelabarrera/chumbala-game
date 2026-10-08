import Phaser from 'phaser';
import type { CandySystem } from '../systems/CandySystem';

export class Candy extends Phaser.Physics.Arcade.Sprite {
  readonly collectibleId: string;

  constructor(scene: Phaser.Scene, id: string, x: number, y: number) {
    if (!scene.textures.exists('candy')) {
      const art = scene.make.graphics({ x: 0, y: 0 });
      art.fillStyle(0xffcf70).fillTriangle(2, 4, 16, 16, 2, 28)
        .fillTriangle(46, 4, 32, 16, 46, 28);
      art.fillStyle(0xff86bd).fillRoundedRect(12, 2, 24, 28, 9);
      art.lineStyle(3, 0xfff5d9).lineBetween(20, 7, 28, 25);
      art.generateTexture('candy', 48, 32);
      art.destroy();
    }
    super(scene, x, y, 'candy');
    this.collectibleId = id;
    scene.add.existing(this);
    scene.physics.add.existing(this, true);
  }

  collect(system: CandySystem): void {
    if (!this.active || !system.collect(this.collectibleId)) return;
    this.disableBody(true, true);
    const sparkle = this.scene.add.circle(this.x, this.y, 12, 0xffcf70, 0.5);
    this.scene.tweens.add({
      targets: sparkle, y: this.y - 40, scale: 2, alpha: 0, duration: 350,
      onComplete: () => sparkle.destroy(),
    });
  }
}
