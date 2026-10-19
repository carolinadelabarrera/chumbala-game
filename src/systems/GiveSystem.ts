import { TUNING } from '../config/tuning.ts';
import type { ZombieBehavior } from './ZombieBehavior.ts';

interface GiveEvents {
  emit(event: 'give:enabled' | 'give:started' | 'give:completed' | 'zombie:cured' | 'give:noTarget'): unknown;
}

export class GiveSystem {
  enabled = false;
  private target?: ZombieBehavior;
  private startedAt = 0;
  private readyAt = 0;
  private readonly events?: GiveEvents;

  constructor(events?: GiveEvents) { this.events = events; }
  get busy(): boolean { return this.target !== undefined; }
  getElapsed(now: number): number { return Math.max(0, now - this.startedAt); }

  enable(): void {
    if (this.enabled) return;
    this.enabled = true;
    this.events?.emit('give:enabled');
  }

  tryGive(now: number, playerX: number, playerY: number, zombieX: number, zombieY: number,
    zombie: ZombieBehavior, canAct: boolean): boolean {
    if (!this.enabled || this.busy || now < this.readyAt || !canAct) return false;
    if (!zombie.canReceivePan() || Math.hypot(playerX - zombieX, playerY - zombieY) > TUNING.zombie.giveRange) {
      this.events?.emit('give:noTarget');
      return false;
    }
    if (!zombie.receivePan(playerX, zombieX)) return false;
    this.target = zombie;
    this.startedAt = now;
    this.events?.emit('give:started');
    return true;
  }

  update(now: number): void {
    const target = this.target;
    if (!target) return;
    const elapsed = this.getElapsed(now);
    const receivedAt = TUNING.give.offerDurationMs + TUNING.give.transferDurationMs;
    if (elapsed >= receivedAt) target.eatPan();
    if (elapsed >= receivedAt + TUNING.zombie.eatDurationMs) target.beginCure();
    if (elapsed >= receivedAt + TUNING.zombie.eatDurationMs + TUNING.zombie.cureDurationMs) {
      target.finishCure();
      target.celebrate();
      this.target = undefined;
      this.readyAt = now + TUNING.give.cooldownMs;
      this.events?.emit('zombie:cured');
      this.events?.emit('give:completed');
    }
  }
}
