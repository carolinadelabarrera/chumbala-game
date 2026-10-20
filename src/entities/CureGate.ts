import Phaser from 'phaser';
import { LEVEL01 } from '../level/level01Layout';
import type { Player } from './Player';

// A quiet decorative passage, not a hazard. Only the player collides with it.
export class CureGate {
  private readonly trigger: Phaser.GameObjects.Zone;
  private readonly art: Phaser.GameObjects.Container;
  private readonly collider: Phaser.Physics.Arcade.Collider;
  readonly open = () => {
    (this.trigger.body as Phaser.Physics.Arcade.StaticBody).enable = false;
    this.art.setVisible(false);
  };

  constructor(private readonly scene: Phaser.Scene, player: Player) {
    const gate = LEVEL01.cureGate;
    this.trigger = scene.add.zone(gate.x, LEVEL01.height / 2, gate.width, LEVEL01.height);
    scene.physics.add.existing(this.trigger, true);
    this.collider = scene.physics.add.collider(player, this.trigger);
    const shapes = scene.add.graphics();
    shapes.fillStyle(0x8979a6).fillRoundedRect(-30, -300, 60, 300, 8);
    for (let y = -280; y < 0; y += 40) {
      shapes.fillStyle(0xd38694).fillRect(-24, y, 48, 15);
    }
    // Local sign references the friend and the offered Pan, without text.
    shapes.fillStyle(0x30284e).fillRoundedRect(-170, -190, 138, 112, 12);
    shapes.lineStyle(5, 0xffdf9b).lineBetween(-145, -160, -158, -145)
      .lineBetween(-158, -145, -145, -130);
    this.art = scene.add.container(gate.x, LEVEL01.floorY, [shapes,
      scene.add.image(-75, -145, 'zombie').setScale(0.7),
      scene.add.image(-120, -112, 'pan-de-muerto').setScale(0.8),
    ]);
    scene.events.on('zombie:cured', this.open);
  }

  destroy(): void {
    this.scene.events.off('zombie:cured', this.open);
    this.collider.destroy();
    this.trigger.destroy();
    this.art.destroy();
  }
}
