import Phaser from 'phaser';
import { LEVEL01 } from '../level/level01Layout';

export class Ofrenda {
  readonly trigger: Phaser.GameObjects.Zone;
  activated = false;
  private readonly glow: Phaser.GameObjects.Ellipse;
  private readonly marker: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene) {
    const point = LEVEL01.ofrenda;
    scene.add.rectangle(6400, 280, 1200, 560, 0x443448).setDepth(-2);
    this.glow = scene.add.ellipse(point.x, point.y - 90, 440, 250, 0xffcf70, 0.1).setDepth(-1);
    if (!scene.textures.exists('ofrenda')) {
      const art = scene.make.graphics({ x: 0, y: 0 });
      art.fillStyle(0x9d663f).fillRoundedRect(5, 150, 270, 50, 8)
        .fillRoundedRect(30, 110, 220, 45, 6).fillRoundedRect(65, 70, 150, 45, 6);
      art.fillStyle(0xd38694).fillRect(30, 110, 220, 12).fillRect(65, 70, 150, 12);
      for (const x of [55, 95, 185, 225]) {
        const y = x === 55 || x === 225 ? 110 : 70;
        art.fillStyle(0xffefc3).fillRoundedRect(x - 6, y - 30, 12, 30, 3);
        art.fillStyle(0xffcf70).fillEllipse(x, y - 38, 9, 16);
      }
      for (const x of [25, 65, 105, 175, 215, 255]) {
        art.fillStyle(0xe89035).fillCircle(x, 154, 12);
        art.fillStyle(0xffcf70).fillCircle(x, 154, 5);
      }
      art.lineStyle(2, 0xffefc3).lineBetween(0, 10, 280, 10);
      for (let index = 0; index < 7; index++) {
        art.fillStyle(index % 2 ? 0xffcf70 : 0xd38694).fillRect(index * 40 + 5, 10, 30, 26);
      }
      art.generateTexture('ofrenda', 280, 200);
      art.destroy();
    }
    scene.add.image(point.x, point.y - 100, 'ofrenda').setDepth(-0.5);
    this.marker = scene.add.graphics().setVisible(false);
    this.marker.lineStyle(5, 0xffefc3).strokeCircle(point.x, point.y - 230, 23)
      .lineBetween(point.x - 12, point.y - 230, point.x - 3, point.y - 221)
      .lineBetween(point.x - 3, point.y - 221, point.x + 13, point.y - 239);
    this.trigger = scene.add.zone(point.triggerX, point.y - 40, point.triggerWidth, 80);
    scene.physics.add.existing(this.trigger, true);
  }

  activate(): void {
    if (this.activated) return;
    this.activated = true;
    this.glow.setFillStyle(0xffcf70, 0.22);
    this.marker.setVisible(true);
  }
}
