import type { GiveSystem } from './GiveSystem.ts';

export type GiveTeachingPolicy = { alreadyLearned: true }
  | { alreadyLearned: false; region: { readonly start: number; readonly end: number } };
interface TutorialEvents {
  on(event: string, listener: () => void): unknown;
  off(event: string, listener: () => void): unknown;
  emit(event: 'tutorial:giveReady'): unknown;
}

// Teaching policy enables a capability; the capability never reads damage state.
export class GiveTutorial {
  learned: boolean;
  private firstDamage = false;
  private readonly hurt = () => { this.firstDamage = true; };
  private readonly gave = () => { this.learned = true; };
  private readonly give: GiveSystem;
  private readonly events: TutorialEvents;
  private readonly policy: GiveTeachingPolicy;

  constructor(give: GiveSystem, events: TutorialEvents, policy: GiveTeachingPolicy) {
    this.give = give;
    this.events = events;
    this.policy = policy;
    this.learned = policy.alreadyLearned;
    if (policy.alreadyLearned) give.enable();
    else events.on('player:hurt', this.hurt);
    events.on('give:started', this.gave);
  }

  get prompting(): boolean { return this.give.enabled && !this.learned; }

  update(playerX: number): void {
    if (this.policy.alreadyLearned || this.give.enabled || !this.firstDamage) return;
    if (playerX < this.policy.region.start || playerX > this.policy.region.end) return;
    this.give.enable();
    this.events.emit('tutorial:giveReady');
  }

  destroy(): void {
    this.events.off('player:hurt', this.hurt);
    this.events.off('give:started', this.gave);
  }
}
