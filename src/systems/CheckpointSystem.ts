import type { HealthSystem } from './HealthSystem.ts';

export interface Checkpoint { readonly id: string; readonly x: number; readonly y: number }
export interface RespawnSource { getActive(): Checkpoint }
interface CheckpointEvents { emit(event: 'checkpoint:activated', checkpoint: Checkpoint): unknown }

// Visible checkpoints take priority; invisible tutorial anchors remain the fallback.
export class CheckpointSystem implements RespawnSource {
  private active?: Checkpoint;
  private readonly safePoints: RespawnSource;
  private readonly health: HealthSystem;
  private readonly events?: CheckpointEvents;

  constructor(safePoints: RespawnSource, health: HealthSystem, events?: CheckpointEvents) {
    this.safePoints = safePoints;
    this.health = health;
    this.events = events;
  }

  get checkpoint(): Checkpoint | undefined { return this.active; }
  getActive(): Checkpoint { return this.active ?? this.safePoints.getActive(); }

  restore(point: Checkpoint): void {
    this.active = { ...point };
    this.health.reset();
  }

  activate(point: Checkpoint): boolean {
    if (this.active?.id === point.id) return false;
    // Establish ownership before emitting health/events, including reentrant listeners.
    this.active = { ...point };
    this.health.reset();
    this.events?.emit('checkpoint:activated', this.active);
    return true;
  }
}
