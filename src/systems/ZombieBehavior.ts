import { TUNING } from '../config/tuning.ts';

export type ZombieState = 'WANDER' | 'NOTICE_PLAYER' | 'CHASE' | 'POST_HIT_PAUSE';
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
    this.state = 'POST_HIT_PAUSE';
    this.resumeAt = now + TUNING.zombie.postHitPauseMs;
  }

  reset(): void {
    this.state = 'WANDER';
    this.facing = this.patrolDirection = -1;
    this.resumeAt = 0;
  }
}
