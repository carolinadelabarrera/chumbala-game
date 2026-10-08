import { TUNING } from '../config/tuning.ts';
import type { HealthSystem } from './HealthSystem.ts';

interface DamageEvents {
  emit(event: 'player:hurt' | 'player:zeroHealth' | 'player:respawned', hearts: number): unknown;
}

export class DamageSystem {
  respawning = false;
  private touching = false;
  private protectedUntil = 0;
  private knockbackUntil = 0;
  private direction: -1 | 1 = -1;
  private readonly health: HealthSystem;
  private readonly events?: DamageEvents;

  constructor(health: HealthSystem, events?: DamageEvents) {
    this.health = health;
    this.events = events;
  }

  contact(overlapping: boolean, now: number, playerX: number, zombieX: number): boolean {
    const wasTouching = this.touching;
    this.touching = overlapping;
    if (!overlapping || wasTouching || this.isInvulnerable(now) || this.health.getHearts() === 0) return false;
    this.direction = playerX <= zombieX ? -1 : 1;
    this.protectedUntil = now + TUNING.player.hurtInvulnerabilityMs;
    this.knockbackUntil = now + TUNING.player.knockbackDurationMs;
    this.health.damage(1);
    this.respawning = this.health.getHearts() === 0;
    this.events?.emit('player:hurt', this.health.getHearts());
    if (this.respawning) this.events?.emit('player:zeroHealth', 0);
    return true;
  }

  isInvulnerable(now: number): boolean { return this.respawning || now < this.protectedUntil; }
  isKnockedBack(now: number): boolean { return !this.respawning && now < this.knockbackUntil; }
  getKnockbackX(): number { return this.direction * TUNING.player.knockbackX; }

  completeRespawn(now: number): void {
    this.respawning = false;
    this.touching = false;
    this.knockbackUntil = 0;
    this.protectedUntil = now + TUNING.player.hurtInvulnerabilityMs;
    this.health.reset();
    this.events?.emit('player:respawned', this.health.getHearts());
  }
}
