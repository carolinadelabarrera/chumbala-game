import { TUNING } from '../config/tuning.ts';

export type ZombieState = 'WANDER' | 'NOTICE_PLAYER' | 'CHASE' | 'POST_HIT_PAUSE'
  | 'RECEIVING_PAN' | 'EATING' | 'CURING' | 'CURED' | 'CELEBRATE';
export interface ZombieArea {
  readonly patrolLeft: number;
  readonly patrolRight: number;
  readonly encounterLeft: number;
  readonly encounterRight: number;
}

export class ZombieBehavior {
  state: ZombieState = 'WANDER';
  facing: -1 | 1 = -1;
  private patrolDirection: -1 | 1 = -1;
  private resumeAt = 0;
  private readonly area: ZombieArea;

  constructor(area: ZombieArea) { this.area = area; }

  update(now: number, x: number, playerX: number): number {
    if (!this.canReceivePan()) return 0;
    if (this.state === 'POST_HIT_PAUSE') {
      if (now < this.resumeAt) return 0;
      this.state = 'WANDER';
    }
    const detected = Math.abs(playerX - x) <= TUNING.zombie.detectionRange
      && playerX >= this.area.encounterLeft && playerX <= this.area.encounterRight;
    if (detected) {
      this.facing = playerX < x ? -1 : 1;
      if (this.state === 'WANDER') {
        this.state = 'NOTICE_PLAYER';
        this.resumeAt = now + TUNING.zombie.noticeDurationMs;
      }
      if (this.state === 'NOTICE_PLAYER') {
        if (now < this.resumeAt) return 0;
        this.state = 'CHASE';
      }
      if ((x <= this.area.encounterLeft && this.facing < 0)
        || (x >= this.area.encounterRight && this.facing > 0)) return 0;
      return this.facing * TUNING.zombie.chaseSpeed;
    }
    this.state = 'WANDER';
    if (x <= this.area.patrolLeft) this.patrolDirection = 1;
    else if (x >= this.area.patrolRight) this.patrolDirection = -1;
    this.facing = this.patrolDirection;
    return this.patrolDirection * TUNING.zombie.wanderSpeed;
  }

  pauseAfterHit(now: number): void {
    if (!this.canDamage()) return;
    this.state = 'POST_HIT_PAUSE';
    this.resumeAt = now + TUNING.zombie.postHitPauseMs;
  }

  reset(): void {
    if (!this.canReceivePan()) return;
    this.state = 'WANDER';
    this.facing = this.patrolDirection = -1;
    this.resumeAt = 0;
  }

  canReceivePan(): boolean {
    return ['WANDER', 'NOTICE_PLAYER', 'CHASE', 'POST_HIT_PAUSE'].includes(this.state);
  }

  canDamage(): boolean { return this.canReceivePan(); }
  isCured(): boolean { return this.state === 'CURED' || this.state === 'CELEBRATE'; }

  receivePan(playerX: number, zombieX: number): boolean {
    if (!this.canReceivePan()) return false;
    this.facing = playerX < zombieX ? -1 : 1;
    this.state = 'RECEIVING_PAN';
    return true;
  }

  eatPan(): void { if (this.state === 'RECEIVING_PAN') this.state = 'EATING'; }
  beginCure(): void { if (this.state === 'EATING') this.state = 'CURING'; }
  finishCure(): void { if (this.state === 'CURING') this.state = 'CURED'; }
  celebrate(): void { if (this.state === 'CURED') this.state = 'CELEBRATE'; }
}
