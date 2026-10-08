import { TUNING } from '../config/tuning.ts';

// Phaser's scene emitter satisfies this port; pure logic needs no Phaser runtime.
export interface GameplayEvents {
  emit(event: 'health:changed' | 'candy:collected', value: number): unknown;
}

export class HealthSystem {
  readonly maxHearts: number;
  private hearts: number;
  private readonly events?: GameplayEvents;

  constructor(events?: GameplayEvents, maxHearts: number = TUNING.player.maxHearts) {
    if (!Number.isSafeInteger(maxHearts) || maxHearts < 1) throw new RangeError('Invalid maximum hearts');
    this.events = events;
    this.maxHearts = maxHearts;
    this.hearts = maxHearts;
  }

  damage(amount: number): void { this.change(-this.validAmount(amount)); }
  heal(amount: number): void { this.change(this.validAmount(amount)); }
  reset(): void { this.change(this.maxHearts - this.hearts); }
  getHearts(): number { return this.hearts; }

  private validAmount(amount: number): number {
    return Number.isFinite(amount) ? Math.max(0, Math.floor(amount)) : 0;
  }

  private change(amount: number): void {
    const next = Math.min(this.maxHearts, Math.max(0, this.hearts + amount));
    if (next === this.hearts) return;
    this.hearts = next;
    this.events?.emit('health:changed', next);
  }
}
