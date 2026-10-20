import { isMobilePortrait } from './viewport';

interface Choice {
  id: string;
  label: string;
  icon: 'continue' | 'stop' | 'again' | 'menu';
  select(): void;
}

const ICONS = {
  continue: '<path d="M12 7L31 20L12 33Z" fill="currentColor"/>',
  stop: '<path d="M6 18L20 6L34 18V34H6Z"/><path d="M16 34V23H24V34"/>',
  again: '<path d="M31 12A14 14 0 1 0 33 25"/><path d="M31 4V14H21"/>',
  menu: '<path d="M6 18L20 6L34 18V34H6Z"/><path d="M16 34V23H24V34"/>',
};

// Only this panel owns input during rest; no timer chooses a button for the child.
export class ChoicePanel {
  private readonly root = document.createElement('div');

  constructor(label: string, choices: readonly Choice[], modal = false, mode: 'end' | 'menu' = 'end') {
    this.root.className = 'game-choice';
    this.root.dataset.mode = modal ? 'rest' : mode;
    this.root.setAttribute('role', modal ? 'dialog' : 'group');
    this.root.setAttribute('aria-label', label);
    if (modal) this.root.setAttribute('aria-modal', 'true');
    this.root.tabIndex = -1;
    // Preserve native Tab/Enter/Space button behavior instead of Phaser's key capture.
    this.root.addEventListener('keydown', event => event.stopPropagation());
    this.root.addEventListener('keyup', event => event.stopPropagation());
    for (const choice of choices) {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.choice = choice.id;
      button.setAttribute('aria-label', choice.label);
      const icon = document.createElement('span');
      icon.setAttribute('aria-hidden', 'true');
      icon.innerHTML = `<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round" stroke-linecap="round">${ICONS[choice.icon]}</svg>`;
      const text = document.createElement('span');
      text.textContent = choice.label.toUpperCase();
      button.append(icon, text);
      button.addEventListener('click', () => {
        if (isMobilePortrait() || button.disabled) return;
        this.root.querySelectorAll('button').forEach(item => { item.disabled = true; });
        choice.select();
      });
      this.root.append(button);
    }
    // The game container also supplies the accepted scoped gesture protection.
    document.getElementById('game')!.append(this.root);
    this.root.focus({ preventScroll: true });
    if (mode === 'menu') this.root.querySelector('button')?.focus({ preventScroll: true });
  }

  destroy(): void { this.root.remove(); }
}
