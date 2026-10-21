import type Phaser from 'phaser';
import type { HealthSystem } from '../systems/HealthSystem';
import type { CandySystem } from '../systems/CandySystem';

export class HUD {
  private readonly root = document.createElement('div');
  private readonly hearts = document.createElement('div');
  private readonly candy = document.createElement('div');
  private readonly heartIcons: HTMLElement[] = [];
  private readonly events: Phaser.Events.EventEmitter;
  private readonly health: HealthSystem;
  private readonly candySystem: CandySystem;

  private readonly healthChanged = () => {
    const count = this.health.getHearts();
    this.heartIcons.forEach((icon, index) => icon.classList.toggle('missing', index >= count));
    this.hearts.setAttribute('aria-label', `${count} of ${this.health.maxHearts} hearts`);
    this.pulse(this.hearts);
  };
  private readonly candyCollected = () => {
    this.candy.textContent = `🍬 × ${this.candySystem.getProgress()}/${this.candySystem.piecesPerHeart}`;
    this.pulse(this.candy);
  };

  constructor(events: Phaser.Events.EventEmitter, health: HealthSystem, candy: CandySystem) {
    this.events = events;
    this.health = health;
    this.candySystem = candy;
    this.root.className = 'hud';
    this.hearts.className = 'heart-display';
    this.hearts.setAttribute('role', 'img');
    this.candy.className = 'candy-display';
    for (let index = 0; index < health.maxHearts; index++) {
      const icon = document.createElement('span');
      icon.textContent = '♥';
      icon.setAttribute('aria-hidden', 'true');
      this.heartIcons.push(icon);
      this.hearts.append(icon);
    }
    this.root.append(this.hearts, this.candy);
    document.getElementById('game')!.append(this.root);
    this.healthChanged();
    this.candyCollected();
    events.on('health:changed', this.healthChanged);
    events.on('candy:collected', this.candyCollected);
  }

  private pulse(element: HTMLElement): void {
    element.getAnimations().forEach(animation => animation.cancel());
    element.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.12)' }, { transform: 'scale(1)' }], { duration: 300 });
  }

  destroy(): void {
    this.events.off('health:changed', this.healthChanged);
    this.events.off('candy:collected', this.candyCollected);
    this.root.remove();
  }
}
