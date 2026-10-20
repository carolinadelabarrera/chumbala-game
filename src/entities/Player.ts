import Phaser from 'phaser';
import { TUNING } from '../config/tuning';
import type { InputSnapshot } from '../systems/InputSystem';
import { JumpTiming } from '../systems/JumpTiming';

export class Player extends Phaser.Physics.Arcade.Sprite {
  private readonly jumpTiming = new JumpTiming(TUNING.player.coyoteTimeMs, TUNING.player.jumpBufferMs);

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'player');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setCollideWorldBounds(true);
    this.setSize(TUNING.player.bodyWidth, TUNING.player.bodyHeight);
    this.setOffset((TUNING.player.width - TUNING.player.bodyWidth) / 2,
      TUNING.player.height - TUNING.player.bodyHeight);
  }

  get grounded(): boolean {
    const body = this.body as Phaser.Physics.Arcade.Body;
    return body.blocked.down || body.touching.down;
  }

  updateMovement(now: number, input: InputSnapshot): void {
    this.setVelocityX(input.move * TUNING.player.moveSpeed);
    if (input.move !== 0) this.setFlipX(input.move < 0);
    if (this.jumpTiming.update(now, this.grounded, input.jumpPressed)) {
      this.setVelocityY(TUNING.player.jumpVelocity);
    }
    this.setTint(this.grounded ? 0xffffff : 0xffdf9b);
  }

  clearJumpTiming(): void { this.jumpTiming.reset(); }
}
