import Phaser from 'phaser';

export type TouchAction = 'left' | 'right' | 'jump';
export interface InputSnapshot {
  move: -1 | 0 | 1;
  jumpPressed: boolean;
}

export class InputSystem {
  private readonly keys: Record<string, Phaser.Input.Keyboard.Key>;
  private readonly pointers = new Map<number, TouchAction>();
  private jumpQueued = false;
  private readonly blur = () => this.reset();
  private readonly visibility = () => { if (document.hidden) this.reset(); };

  constructor(scene: Phaser.Scene) {
    this.keys = scene.input.keyboard!.addKeys({
      left: 'LEFT', right: 'RIGHT', a: 'A', d: 'D', jump: 'SPACE',
    }) as Record<string, Phaser.Input.Keyboard.Key>;
    // Queue the edge so a quick down/up between rendered frames is still honored.
    this.keys.jump.emitOnRepeat = false;
    this.keys.jump.on('down', () => { this.jumpQueued = true; });
    window.addEventListener('blur', this.blur);
    document.addEventListener('visibilitychange', this.visibility);
  }

  press(action: TouchAction, pointerId: number): void {
    if (this.pointers.has(pointerId)) return;
    this.pointers.set(pointerId, action);
    if (action === 'jump') this.jumpQueued = true;
  }

  release(pointerId: number): void { this.pointers.delete(pointerId); }

  snapshot(): InputSnapshot {
    const actions = new Set(this.pointers.values());
    const left = this.keys.left.isDown || this.keys.a.isDown || actions.has('left');
    const right = this.keys.right.isDown || this.keys.d.isDown || actions.has('right');
    const jumpPressed = this.jumpQueued;
    this.jumpQueued = false;
    return { move: (Number(right) - Number(left)) as -1 | 0 | 1, jumpPressed };
  }

  reset(): void {
    this.pointers.clear();
    this.jumpQueued = false;
    Object.values(this.keys).forEach(key => key.reset());
  }

  destroy(): void {
    this.reset();
    Object.values(this.keys).forEach(key => key.destroy());
    window.removeEventListener('blur', this.blur);
    document.removeEventListener('visibilitychange', this.visibility);
  }
}
