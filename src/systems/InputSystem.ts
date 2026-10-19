import Phaser from 'phaser';

export type TouchAction = 'left' | 'right' | 'jump' | 'give';
export interface InputSnapshot {
  move: -1 | 0 | 1;
  jumpPressed: boolean;
  givePressed: boolean;
}

export class InputSystem {
  private readonly keys: Record<string, Phaser.Input.Keyboard.Key>;
  private readonly pointers = new Map<number, TouchAction>();
  private jumpQueued = false;
  private giveQueued = false;
  private readonly blur = () => this.reset();
  private readonly visibility = () => { if (document.hidden) this.reset(); };

  constructor(scene: Phaser.Scene) {
    this.keys = scene.input.keyboard!.addKeys({
      left: 'LEFT', right: 'RIGHT', a: 'A', d: 'D', jump: 'SPACE', give: 'X',
    }) as Record<string, Phaser.Input.Keyboard.Key>;
    // Queue the edge so a quick down/up between rendered frames is still honored.
    this.keys.jump.emitOnRepeat = false;
    this.keys.jump.on('down', () => { this.jumpQueued = true; });
    this.keys.give.emitOnRepeat = false;
    this.keys.give.on('down', () => { this.giveQueued = true; });
    window.addEventListener('blur', this.blur);
    document.addEventListener('visibilitychange', this.visibility);
  }

  press(action: TouchAction, pointerId: number): void {
    if (this.pointers.has(pointerId)) return;
    this.pointers.set(pointerId, action);
    if (action === 'jump') this.jumpQueued = true;
    if (action === 'give') this.giveQueued = true;
  }

  release(pointerId: number): void { this.pointers.delete(pointerId); }

  snapshot(): InputSnapshot {
    const actions = new Set(this.pointers.values());
    const left = this.keys.left.isDown || this.keys.a.isDown || actions.has('left');
    const right = this.keys.right.isDown || this.keys.d.isDown || actions.has('right');
    const jumpPressed = this.jumpQueued;
    const givePressed = this.giveQueued;
    this.jumpQueued = false;
    this.giveQueued = false;
    return { move: (Number(right) - Number(left)) as -1 | 0 | 1, jumpPressed, givePressed };
  }

  reset(): void {
    this.pointers.clear();
    this.jumpQueued = false;
    this.giveQueued = false;
    Object.values(this.keys).forEach(key => key.reset());
  }

  destroy(): void {
    this.reset();
    Object.values(this.keys).forEach(key => key.destroy());
    window.removeEventListener('blur', this.blur);
    document.removeEventListener('visibilitychange', this.visibility);
  }
}
