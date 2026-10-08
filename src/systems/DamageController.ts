import Phaser from 'phaser';
import { TUNING } from '../config/tuning';
import type { Player } from '../entities/Player';
import type { Zombie } from '../entities/Zombie';
import type { HealthSystem } from './HealthSystem';
import type { SafePointSystem } from './SafePointSystem';
import { DamageSystem } from './DamageSystem';

// Phaser presentation and physics responses; damage eligibility is pure logic.
export class DamageController {
  readonly rules: DamageSystem;
  private elapsedRespawn = 0;
  private relocated = false;
  private overlay?: Phaser.GameObjects.Rectangle;
  private readonly scene: Phaser.Scene;
  private readonly player: Player;
  private readonly zombie: Zombie;
  private readonly safePoints: SafePointSystem;
  private readonly onRespawn: () => void;

  constructor(scene: Phaser.Scene, player: Player, zombie: Zombie, health: HealthSystem,
    safePoints: SafePointSystem, onRespawn: () => void) {
    this.scene = scene;
    this.player = player;
    this.zombie = zombie;
    this.safePoints = safePoints;
    this.onRespawn = onRespawn;
    this.rules = new DamageSystem(health, scene.events);
  }

  update(now: number, delta: number): void {
    if (this.rules.respawning) {
      this.updateRespawn(now, delta);
      return;
    }
    // Overlap detects contact without making the zombie a solid wall.
    const overlapping = this.scene.physics.overlap(this.player, this.zombie);
    if (this.rules.contact(overlapping, now, this.player.x, this.zombie.x)) {
      this.player.clearJumpTiming();
      this.player.setVelocity(this.rules.getKnockbackX(), TUNING.player.knockbackY);
      this.zombie.pauseAfterHit(now);
      const label = this.scene.add.text(this.zombie.x, this.zombie.y - this.zombie.height,
        'ÑAM!', { fontFamily: 'system-ui', fontSize: '34px', fontStyle: 'bold', color: '#ffdf9b',
          backgroundColor: '#30284e', padding: { x: 10, y: 6 } }).setOrigin(0.5).setDepth(20);
      this.scene.tweens.add({ targets: label, y: label.y - 24, alpha: 0, duration: TUNING.zombie.postHitPauseMs,
        onComplete: () => label.destroy() });
      if (this.rules.respawning) this.beginRespawn();
    }
    // Movement remains unchanged; briefly preserve knockback after its velocity assignment.
    if (this.rules.isKnockedBack(now)) this.player.setVelocityX(this.rules.getKnockbackX());
    const pulse = (Math.sin(now * Math.PI * 2 / TUNING.player.hurtPulsePeriodMs) + 1) / 2;
    this.player.setAlpha(this.rules.isInvulnerable(now) ? 0.7 + pulse * 0.3 : 1);
  }

  private beginRespawn(): void {
    this.elapsedRespawn = 0;
    this.relocated = false;
    this.player.setVelocity(0, 0);
    this.zombie.setVelocity(0, 0);
    (this.player.body as Phaser.Physics.Arcade.Body).enable = false;
    (this.zombie.body as Phaser.Physics.Arcade.Body).enable = false;
    const camera = this.scene.cameras.main;
    this.overlay = this.scene.add.rectangle(camera.width / 2, camera.height / 2,
      camera.width, camera.height, 0xffc45c, 0).setScrollFactor(0).setDepth(100);
  }

  private updateRespawn(now: number, delta: number): void {
    this.elapsedRespawn += delta;
    const progress = Math.min(1, this.elapsedRespawn / TUNING.respawn.transitionMs);
    this.overlay?.setFillStyle(0xffc45c, Math.sin(progress * Math.PI) * 0.65);
    if (progress >= 0.5 && !this.relocated) {
      const point = this.safePoints.getActive();
      (this.player.body as Phaser.Physics.Arcade.Body).reset(point.x, point.y);
      this.player.setVelocity(0, 0).setAlpha(1);
      this.player.clearJumpTiming();
      this.zombie.resetEncounter();
      this.scene.cameras.main.centerOn(point.x, point.y);
      this.onRespawn();
      this.relocated = true;
    }
    if (progress < 1) return;
    (this.player.body as Phaser.Physics.Arcade.Body).enable = true;
    (this.zombie.body as Phaser.Physics.Arcade.Body).enable = true;
    this.rules.completeRespawn(now);
    this.onRespawn();
    this.overlay?.destroy();
    this.overlay = undefined;
  }
}
