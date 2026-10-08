import { TUNING } from '../config/tuning.ts';
import type { GameplayEvents, HealthSystem } from './HealthSystem.ts';

export class CandySystem {
  readonly piecesPerHeart: number;
  private progress = 0;
  private readonly collected = new Set<string>();
  private readonly health: HealthSystem;
  private readonly events?: GameplayEvents;

  constructor(health: HealthSystem, events?: GameplayEvents, piecesPerHeart: number = TUNING.candy.piecesPerHeart) {
    if (!Number.isSafeInteger(piecesPerHeart) || piecesPerHeart < 1) throw new RangeError('Invalid candy threshold');
    this.health = health;
    this.events = events;
    this.piecesPerHeart = piecesPerHeart;
  }

  collect(id: string): boolean {
    if (this.collected.has(id)) return false;
    this.collected.add(id);
    this.progress += 1;
    if (this.progress >= this.piecesPerHeart) {
      if (this.health.getHearts() < this.health.maxHearts) {
        this.progress = 0;
        this.health.heal(1);
      } else {
        // Technical Spec: retain one pickup short of healing, never bank hearts.
        this.progress = this.piecesPerHeart - 1;
      }
    }
    this.events?.emit('candy:collected', this.progress);
    return true;
  }

  getProgress(): number { return this.progress; }
}
