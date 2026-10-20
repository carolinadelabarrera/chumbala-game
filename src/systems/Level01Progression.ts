interface ProgressEvents {
  on(event: 'zombie:cured', listener: () => void): unknown;
  off(event: 'zombie:cured', listener: () => void): unknown;
}

// Only Level01 requires this single teaching objective. Not a global zombie rule.
export class Level01Progression {
  private cured = false;
  private readonly cure = () => { this.cured = true; };
  private readonly events: ProgressEvents;

  constructor(events: ProgressEvents) {
    this.events = events;
    events.on('zombie:cured', this.cure);
  }

  get canReachRest(): boolean { return this.cured; }
  restoreCured(): void { this.cured = true; }

  destroy(): void { this.events.off('zombie:cured', this.cure); }
}
