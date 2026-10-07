import { InputSystem, type TouchAction } from '../systems/InputSystem';

export class TouchControls {
  private readonly root = document.createElement('nav');
  private readonly buttons = new Map<TouchAction, HTMLButtonElement>();
  private readonly held = new Map<number, HTMLButtonElement>();
  private readonly releaseAll = () => {
    for (const id of [...this.held.keys()]) this.release(id);
  };
  private readonly visibility = () => { if (document.hidden) this.releaseAll(); };

  constructor(private readonly input: InputSystem) {
    this.root.className = 'controls';
    this.root.setAttribute('aria-label', 'Movement controls');
    const movement = document.createElement('div');
    movement.className = 'move-controls';
    this.root.append(movement);
    this.createButton('left', '◀', 'Move left', movement);
    this.createButton('right', '▶', 'Move right', movement);
    this.createButton('jump', '↑ JUMP', 'Jump', this.root);
    document.body.append(this.root);
    window.addEventListener('blur', this.releaseAll);
    document.addEventListener('visibilitychange', this.visibility);
  }

  private createButton(action: TouchAction, icon: string, label: string, parent: HTMLElement): void {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `control ${action}`;
    button.textContent = icon;
    button.setAttribute('aria-label', label);
    button.dataset.action = action;
    button.addEventListener('pointerdown', event => {
      event.preventDefault();
      button.setPointerCapture(event.pointerId);
      this.held.set(event.pointerId, button);
      button.classList.add('held');
      this.input.press(action, event.pointerId);
    });
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
      button.addEventListener(type, event => this.release((event as PointerEvent).pointerId));
    }
    this.buttons.set(action, button);
    parent.append(button);
  }

  private release(id: number): void {
    const button = this.held.get(id);
    this.held.delete(id);
    this.input.release(id);
    if (button && ![...this.held.values()].includes(button)) button.classList.remove('held');
  }

  hint(action: 'right' | 'jump', active: boolean): void {
    this.buttons.get(action)?.classList.toggle('hint', active);
  }

  setPortrait(portrait: boolean): void {
    this.root.hidden = portrait;
    this.root.style.display = portrait ? 'none' : '';
    if (portrait) this.releaseAll();
  }

  destroy(): void {
    this.releaseAll();
    this.root.remove();
    window.removeEventListener('blur', this.releaseAll);
    document.removeEventListener('visibilitychange', this.visibility);
  }
}
