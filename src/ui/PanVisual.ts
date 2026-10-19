import Phaser from 'phaser';
import type { Player } from '../entities/Player';

export function ensurePanTextures(scene: Phaser.Scene): void {
  if (scene.textures.exists('pan-de-muerto')) return;
  const art = scene.make.graphics({ x: 0, y: 0 });
  art.fillStyle(0xeab56b).fillEllipse(18, 14, 34, 25);
  art.lineStyle(4, 0xffefc3).lineBetween(8, 7, 28, 21).lineBetween(8, 21, 28, 7);
  art.fillStyle(0xffefc3).fillCircle(18, 14, 4);
  art.generateTexture('pan-de-muerto', 36, 28);
  art.clear();
  art.lineStyle(4, 0xd39658).strokeEllipse(22, 18, 30, 30);
  art.fillStyle(0x9d663f).fillRoundedRect(2, 22, 40, 20, 6);
  art.lineStyle(2, 0xeab56b).lineBetween(10, 25, 10, 39).lineBetween(22, 25, 22, 39).lineBetween(34, 25, 34, 39);
  art.generateTexture('pan-basket', 44, 44);
  art.destroy();
}

export class PanVisual {
  private readonly basket: Phaser.GameObjects.Image;
  private readonly loaf: Phaser.GameObjects.Image;
  private readonly arm: Phaser.GameObjects.Rectangle;
  private readonly player: Player;

  constructor(scene: Phaser.Scene, player: Player) {
    ensurePanTextures(scene);
    this.player = player;
    this.basket = scene.add.image(0, 0, 'pan-basket').setScale(0.65).setDepth(4);
    this.loaf = scene.add.image(0, 0, 'pan-de-muerto').setScale(0.55).setDepth(5);
    this.arm = scene.add.rectangle(0, 0, 28, 9, 0xb4a0ef).setDepth(3).setVisible(false);
  }

  update(offering: boolean, basketPulse = 1): void {
    const side = this.player.flipX ? -1 : 1;
    this.basket.setPosition(this.player.x + side * 24, this.player.y + 18).setAlpha(this.player.alpha).setScale(0.65 * basketPulse);
    this.loaf.setPosition(this.basket.x, this.basket.y - 4).setAlpha(this.player.alpha);
    this.arm.setPosition(this.player.x + side * 27, this.player.y - 2).setAlpha(this.player.alpha).setVisible(offering);
  }
}
