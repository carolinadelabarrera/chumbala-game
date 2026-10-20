import { LEVEL01 } from '../level/level01Layout.ts';
import type { CheckpointSystem, Checkpoint } from './CheckpointSystem.ts';
import type { Level01Progression } from './Level01Progression.ts';
import type { SaveSystem } from './SaveSystem.ts';

interface SaveEvents {
  on(event: string, listener: (...args: any[]) => void): unknown;
  off(event: string, listener: (...args: any[]) => void): unknown;
}

// Subscribe before scene-transition listeners, so STOP HERE writes before leaving.
export class Level01SaveCoordinator {
  private completed: boolean;
  private readonly saves: SaveSystem;
  private readonly events: SaveEvents;
  private readonly checkpoints: CheckpointSystem;
  private readonly progression: Level01Progression;
  private readonly learned = () => { this.saves.learnGive(); };
  private readonly activated = (point: Checkpoint) => {
    if (point.id === LEVEL01.ofrenda.checkpoint.id) this.persist();
  };
  private readonly stopped = () => { this.persist(); };
  private readonly finished = () => { this.completed = true; this.persist(); };

  constructor(saves: SaveSystem, events: SaveEvents, checkpoints: CheckpointSystem,
    progression: Level01Progression, completed = false) {
    this.saves = saves;
    this.events = events;
    this.checkpoints = checkpoints;
    this.progression = progression;
    this.completed = completed;
    events.on('give:started', this.learned);
    events.on('checkpoint:activated', this.activated);
    events.on('rest:stopped', this.stopped);
    events.on('level:completed', this.finished);
  }

  destroy(): void {
    this.events.off('give:started', this.learned);
    this.events.off('checkpoint:activated', this.activated);
    this.events.off('rest:stopped', this.stopped);
    this.events.off('level:completed', this.finished);
  }

  private persist(): void {
    if (this.progression.canReachRest && this.checkpoints.checkpoint?.id === LEVEL01.ofrenda.checkpoint.id) {
      this.saves.saveOfrenda(this.completed);
    }
  }
}
