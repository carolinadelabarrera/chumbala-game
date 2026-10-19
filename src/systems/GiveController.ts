import Phaser from 'phaser';
import { TUNING } from '../config/tuning';
import type { Player } from '../entities/Player';
import type { Zombie } from '../entities/Zombie';
import type { DamageController } from './DamageController';
import { GiveSystem } from './GiveSystem';
import { PanVisual } from '../ui/PanVisual';

export class GiveController {
  readonly rules: GiveSystem;
  private readonly pan: PanVisual;
  private bread?: Phaser.GameObjects.Image;
  private receiveArm?: Phaser.GameObjects.Rectangle;
  private startX = 0;
  private startY = 0;
  private noTargetUntil = 0;
  private readonly scene: Phaser.Scene;
  private readonly player: Player;
  private readonly zombie: Zombie;
  private readonly damage: DamageController;
  private readonly glow: Phaser.GameObjects.Arc;

  constructor(scene: Phaser.Scene, player: Player, zombie: Zombie, damage: DamageController) {
    this.scene = scene;
    this.player = player;
    this.zombie = zombie;
    this.damage = damage;
    this.rules = new GiveSystem(scene.events);
    this.pan = new PanVisual(scene, player);
    this.glow = scene.add.circle(zombie.x, zombie.y, 56, 0xffcf70, 0).setDepth(1);
    this.pan.update(false);
  }

  update(now: number, pressed: boolean): void {
    const started = pressed && this.rules.tryGive(now, this.player.x, this.player.y, this.zombie.x, this.zombie.y,
      this.zombie.behavior, !this.damage.rules.respawning && !this.damage.rules.isKnockedBack(now));
    if (pressed && !started && this.rules.enabled && !this.rules.busy) this.noTargetUntil = now + TUNING.give.noTargetFeedbackMs;
    if (started) {
      this.player.setFlipX(this.zombie.x < this.player.x);
      this.zombie.setVelocityX(0).setAngle(0);
      this.bread = this.scene.add.image(0, 0, 'pan-de-muerto').setDepth(8);
      this.receiveArm = this.scene.add.rectangle(0, 0, 28, 9, 0x79cea0).setDepth(3);
    }
    this.rules.update(now);
    const state = this.zombie.behavior.state;
    const remaining = Math.max(0, this.noTargetUntil - now) / TUNING.give.noTargetFeedbackMs;
    this.pan.update(state === 'RECEIVING_PAN', 1 + Math.sin(remaining * Math.PI) * 0.15);
    this.glow.setPosition(this.zombie.x, this.zombie.y).setFillStyle(0xffcf70,
      state === 'CURING' ? 0.2 + Math.sin(now / 250) * 0.08 : 0);
    if (state === 'RECEIVING_PAN' && this.bread) {
      const elapsed = this.rules.getElapsed(now);
      if (elapsed <= TUNING.give.offerDurationMs) {
        this.startX = this.player.x + (this.player.flipX ? -38 : 38);
        this.startY = this.player.y - 2;
      }
      const progress = Phaser.Math.Clamp((elapsed - TUNING.give.offerDurationMs) / TUNING.give.transferDurationMs, 0, 1);
      const handX = this.zombie.x + this.zombie.behavior.facing * 32;
      const handY = this.zombie.y + 5;
      this.bread.setPosition(Phaser.Math.Linear(this.startX, handX, progress),
        Phaser.Math.Linear(this.startY, handY, progress) - Math.sin(progress * Math.PI) * 10);
      this.receiveArm?.setPosition(this.zombie.x + this.zombie.behavior.facing * 27, handY);
    } else if (state === 'EATING' && this.bread) {
      this.receiveArm?.setPosition(this.zombie.x + this.zombie.behavior.facing * 18, this.zombie.y - 5);
      this.bread.setPosition(this.zombie.x, this.zombie.y - 14).setScale(0.8 + Math.sin(now / 120) * 0.08);
    } else {
      this.bread?.destroy();
      this.receiveArm?.destroy();
      this.bread = undefined;
      this.receiveArm = undefined;
    }
    // Keep the cured look current in the same frame as the completion event.
    if (this.zombie.behavior.isCured()) this.zombie.setTexture('townsperson');
  }
}
