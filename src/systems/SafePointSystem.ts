export interface SafePoint {
  readonly id: string;
  readonly triggerX: number;
  readonly x: number;
  readonly y: number;
}

// Invisible tutorial anchors only: no visible checkpoints or browser storage.
export class SafePointSystem {
  private readonly points: readonly SafePoint[];
  private index = 0;

  constructor(points: readonly SafePoint[]) {
    if (points.length === 0) throw new Error('At least one safe point is required');
    this.points = points;
  }

  update(x: number, grounded: boolean): void {
    if (!grounded) return;
    while (this.index + 1 < this.points.length && x >= this.points[this.index + 1].triggerX) this.index++;
  }

  getActive(): SafePoint { return this.points[this.index]; }
}
