import { InputSystem, type TouchAction } from '../systems/InputSystem';
import { isMobilePortrait, watchViewport } from './viewport';

export class TouchControls {
  private readonly root = document.createElement('nav');
  private readonly buttons = new Map<TouchAction, HTMLButtonElement>();
  private readonly held = new Map<number, HTMLButtonElement>();
  private portrait = false;
  private suspended = false;
  private giveAvailable?: boolean;
  private readonly stopWatching: () => void;
  private readonly pointerEnded = (event: PointerEvent) => this.release(event.pointerId);
  private readonly orientationChanged = () => { this.releaseAll(); this.input.reset(); };
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
    const actions = document.createElement('div');
    actions.className = 'action-controls';
    this.root.append(actions);
    this.createButton('jump', 'JUMP', 'Jump', actions);
    this.createButton('give', 'GIVE', 'Give Pan de Muerto', actions);
    this.setGiveAvailable(false);
    document.getElementById('game')!.append(this.root);
    this.stopWatching = watchViewport(() => { if (isMobilePortrait()) this.releaseAll(); });
    window.addEventListener('blur', this.releaseAll);
    window.addEventListener('orientationchange', this.orientationChanged);
    window.addEventListener('pointerup', this.pointerEnded);
    window.addEventListener('pointercancel', this.pointerEnded);
    document.addEventListener('visibilitychange', this.visibility);
  }

  private createButton(action: TouchAction, icon: string, label: string, parent: HTMLElement): void {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `control ${action}`;
    button.textContent = icon;
    if (action === 'jump') {
      const jump = document.createElement('span');
      jump.className = 'jump-icon';
      jump.setAttribute('aria-hidden', 'true');
      jump.innerHTML = '<svg viewBox="0 0 40 36" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 27V5M10 15L20 5L30 15M7 32H33"/></svg>';
      button.prepend(jump);
    }
    if (action === 'give') {
      const pan = document.createElement('span');
      pan.className = 'pan-icon';
      pan.setAttribute('aria-hidden', 'true');
      button.prepend(pan);
    }
    button.setAttribute('aria-label', label);
    button.dataset.action = action;
    button.addEventListener('pointerdown', event => {
      if (this.portrait || this.suspended || isMobilePortrait() || document.hidden
        || button.hidden || button.disabled || this.held.has(event.pointerId)) return;
      event.preventDefault();
      this.held.set(event.pointerId, button);
      button.classList.add('held');
      this.input.press(action, event.pointerId);
      // A window-level release is also installed for browsers that reject capture.
      try { button.setPointerCapture(event.pointerId); } catch { /* Keep the action releasable. */ }
    });
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
      button.addEventListener(type, event => this.release((event as PointerEvent).pointerId, button));
    }
    this.buttons.set(action, button);
    parent.append(button);
  }

  private release(id: number, owner?: HTMLButtonElement): void {
    const button = this.held.get(id);
    if (!button || (owner && owner !== button)) return;
    this.held.delete(id);
    this.input.release(id);
    if (![...this.held.values()].includes(button)) button.classList.remove('held');
    try { if (button.hasPointerCapture(id)) button.releasePointerCapture(id); }
    catch { /* Safari may already have cancelled an interrupted native pointer. */ }
  }

  hint(action: 'right' | 'jump' | 'give', active: boolean): void {
    this.buttons.get(action)?.classList.toggle('hint', active);
  }

  setGiveAvailable(enabled: boolean): void {
    if (this.giveAvailable === enabled) return;
    this.giveAvailable = enabled;
    const button = this.buttons.get('give')!;
    button.hidden = !enabled;
    button.disabled = !enabled;
  }

  setPortrait(portrait: boolean): void {
    this.portrait = portrait;
    this.applyVisibility();
  }

  setSuspended(suspended: boolean): void {
    this.suspended = suspended;
    this.applyVisibility();
  }

  private applyVisibility(): void {
    const hidden = this.portrait || this.suspended;
    this.root.hidden = hidden;
    this.root.style.display = hidden ? 'none' : '';
    if (hidden) this.releaseAll();
  }

  destroy(): void {
    this.releaseAll();
    this.root.remove();
    this.stopWatching();
    window.removeEventListener('blur', this.releaseAll);
    window.removeEventListener('orientationchange', this.orientationChanged);
    window.removeEventListener('pointerup', this.pointerEnded);
    window.removeEventListener('pointercancel', this.pointerEnded);
    document.removeEventListener('visibilitychange', this.visibility);
  }
}
