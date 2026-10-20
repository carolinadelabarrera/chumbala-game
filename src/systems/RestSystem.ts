import { TUNING } from '../config/tuning.ts';
import type { Checkpoint, CheckpointSystem } from './CheckpointSystem.ts';

export type RestPhase = 'EXPLORING' | 'RESTING' | 'CONTINUED' | 'ENDING' | 'FINISHED';
interface RestEvents {
  emit(event: 'ofrenda:activated' | 'rest:started' | 'rest:continued' | 'rest:stopped'
    | 'ending:started' | 'level:completed'): unknown;
}

export class RestSystem {
  phase: RestPhase = 'EXPLORING';
  endingElapsed = 0;
  private readonly checkpoints: CheckpointSystem;
  private readonly point: Checkpoint;
  private readonly events: RestEvents;

  constructor(checkpoints: CheckpointSystem, point: Checkpoint, events: RestEvents) {
    this.checkpoints = checkpoints;
    this.point = point;
    this.events = events;
  }

  get blocksGameplay(): boolean { return ['RESTING', 'ENDING', 'FINISHED'].includes(this.phase); }

  restoreContinued(): void {
    this.phase = 'CONTINUED';
    this.endingElapsed = 0;
  }

  activate(): boolean {
    if (this.phase !== 'EXPLORING') return false;
    this.phase = 'RESTING';
    this.checkpoints.activate(this.point);
    this.events.emit('ofrenda:activated');
    this.events.emit('rest:started');
    return true;
  }

  continue(): boolean {
    if (this.phase !== 'RESTING') return false;
    this.phase = 'CONTINUED';
    this.events.emit('rest:continued');
    return true;
  }

  stop(): boolean {
    if (this.phase !== 'RESTING') return false;
    this.phase = 'FINISHED';
    this.events.emit('rest:stopped');
    return true;
  }

  beginEnding(): boolean {
    if (this.phase !== 'CONTINUED') return false;
    this.phase = 'ENDING';
    this.events.emit('ending:started');
    return true;
  }

  update(delta: number): void {
    if (this.phase !== 'ENDING') return;
    this.endingElapsed += delta;
    if (this.endingElapsed < TUNING.finale.endingDurationMs) return;
    this.phase = 'FINISHED';
    this.events.emit('level:completed');
  }
}
