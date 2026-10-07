import Phaser from 'phaser';
import { TUNING } from '../config/tuning';

export class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  create(): void {
    const { width, height } = TUNING.player;
    const graphics = this.make.graphics({ x: 0, y: 0 });
    graphics.fillStyle(0xb4a0ef).fillRoundedRect(0, 0, width, height, 10);
    graphics.fillStyle(0x30284e).fillCircle(14, 20, 4).fillCircle(34, 20, 4);
    graphics.lineStyle(3, 0x30284e).lineBetween(16, 36, 32, 36);
    graphics.generateTexture('player', width, height);
    graphics.destroy();
    this.scene.start('MenuScene');
  }
}
