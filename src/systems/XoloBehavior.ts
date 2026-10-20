import { TUNING } from '../config/tuning.ts';

export type XoloState = 'FOLLOW' | 'WAIT' | 'HINT' | 'REACT_HURT' | 'CELEBRATE' | 'SIT_CHECKPOINT';
export type XoloHint = 'give' | 'secret' | 'ofrenda';
export interface XoloFrame {
  playerX: number;
  playerFacing: -1 | 1;
  worldWidth: number;
}

// Pure companion intent and timing. There is deliberately no combat/health API.
export class XoloBehavior {
  state: XoloState = 'FOLLOW';
  x = 0;
  facing: -1 | 1 = 1;
  hint?: XoloHint;
  elapsed = 0;
  recovered = false;
  hintEmphasis = 1;
  private lastHint?: XoloHint;
  private clock = 0;
  private nextHintAt = 0;
  private hintOrigin = 0;
  private hintTarget = 0;
  private lookTarget = 0;
  private restX = 0;

  reset(frame: XoloFrame, deferHints = true): void {
    this.x = this.followTarget(frame);
    this.facing = frame.playerFacing;
    this.hint = undefined;
    this.state = 'FOLLOW';
    this.elapsed = 0;
    this.recovered = true;
    this.lastHint = undefined;
    this.hintEmphasis = 1;
    this.nextHintAt = this.clock + (deferHints ? TUNING.xolo.hintRepeatMs : 0);
  }

  requestHint(kind: XoloHint, frame: XoloFrame, targetX: number): boolean {
    if ((this.clock < this.nextHintAt && (kind !== 'ofrenda' || this.lastHint === kind)) || this.state === 'HINT'
      || this.state === 'REACT_HURT' || this.state === 'CELEBRATE' || this.state === 'SIT_CHECKPOINT') return false;
    this.hint = kind;
    this.hintEmphasis = this.lastHint === kind ? 1.2 : 1;
    this.lastHint = kind;
    this.state = 'HINT';
    this.elapsed = 0;
    this.hintOrigin = frame.playerX;
    const direction = targetX < frame.playerX ? -1 : 1;
    this.hintTarget = this.clamp(frame.playerX + direction * (kind === 'give'
      ? TUNING.xolo.followDistance + TUNING.xolo.hintStep : TUNING.xolo.hintStep), frame.worldWidth);
    this.lookTarget = targetX;
    this.nextHintAt = this.clock + TUNING.xolo.hintRepeatMs;
    return true;
  }

  cancelHint(): void {
    this.hint = undefined;
    if (this.state === 'HINT') { this.state = 'FOLLOW'; this.elapsed = 0; }
  }

  reactHurt(): void { this.react('REACT_HURT'); }
  celebrate(): void { this.react('CELEBRATE'); }

  restAt(x: number): void {
    this.cancelHint();
    this.restX = x;
    this.state = 'SIT_CHECKPOINT';
    this.elapsed = 0;
  }

  resumeFollowing(): void {
    if (this.state !== 'SIT_CHECKPOINT') return;
    this.state = 'FOLLOW';
    this.elapsed = 0;
    this.nextHintAt = this.clock + TUNING.xolo.hintRepeatMs;
  }

  get sitting(): boolean {
    return this.state === 'SIT_CHECKPOINT' && Math.abs(this.x - this.restX) <= TUNING.xolo.stopTolerance;
  }

  update(delta: number, frame: XoloFrame): void {
    this.clock += delta;
    this.elapsed += delta;
    this.recovered = false;
    if (Math.abs(this.x - frame.playerX) > TUNING.xolo.recoveryDistance) {
      this.x = this.followTarget(frame);
      this.cancelHint();
      this.recovered = true;
    }
    if (this.state === 'SIT_CHECKPOINT') {
      if (!this.sitting) this.moveTo(this.clamp(this.restX, frame.worldWidth), TUNING.xolo.followSpeed, delta);
      else this.lookAt(frame.playerX);
      return;
    }
    if (this.state === 'REACT_HURT' || this.state === 'CELEBRATE') {
      this.lookAt(frame.playerX);
      const duration = this.state === 'REACT_HURT' ? TUNING.xolo.hurtDurationMs : TUNING.xolo.celebrateDurationMs;
      if (this.elapsed >= duration) { this.state = 'FOLLOW'; this.elapsed = 0; }
      return;
    }
    if (this.state === 'HINT') {
      if (this.hint === 'ofrenda') {
        if (frame.playerX < this.hintOrigin - TUNING.xolo.hintLeash) {
          this.cancelHint();
          return;
        } else {
          const target = Math.min(this.lookTarget, frame.playerX + TUNING.xolo.guideLead);
          const speed = this.x < frame.playerX ? TUNING.xolo.catchUpSpeed : TUNING.xolo.followSpeed;
          this.moveTo(target, speed, delta);
          // Lead only a short distance. When waiting, alternate destination/player glances.
          if (Math.abs(this.x - target) <= TUNING.xolo.stopTolerance) {
            this.lookAt(Math.floor(this.elapsed / TUNING.xolo.hintPauseMs) % 2 ? frame.playerX : this.lookTarget);
          }
          if (Math.abs(this.x - this.lookTarget) <= TUNING.xolo.stopTolerance) this.restAt(this.lookTarget);
          return;
        }
      }
      if (this.elapsed >= TUNING.xolo.hintDurationMs
        || Math.abs(frame.playerX - this.hintOrigin) > TUNING.xolo.hintLeash) {
        this.cancelHint();
      } else {
        const pause = TUNING.xolo.hintPauseMs;
        if (this.elapsed < pause) {
          // Join the basket glance before pointing back, even if ordinary following lagged.
          this.moveTo(this.followTarget(frame), TUNING.xolo.catchUpSpeed, delta);
          this.lookAt(frame.playerX);
        }
        else {
          this.moveTo(this.hintTarget, TUNING.xolo.followSpeed, delta);
          // Look back after the invitation, then gently reference the target again.
          this.lookAt(this.elapsed < pause * 2 || this.elapsed >= pause * 3 ? this.lookTarget : frame.playerX);
        }
        return;
      }
    }
    const target = this.followTarget(frame);
    const distance = Math.abs(target - this.x);
    if (distance <= TUNING.xolo.stopTolerance) {
      this.state = 'WAIT';
      this.lookAt(frame.playerX);
      return;
    }
    this.state = 'FOLLOW';
    this.moveTo(target, distance > TUNING.xolo.catchUpDistance ? TUNING.xolo.catchUpSpeed : TUNING.xolo.followSpeed, delta);
  }

  get showPan(): boolean { return this.hint === 'give' && this.elapsed < TUNING.xolo.hintPauseMs; }
  get showBark(): boolean {
    return this.state === 'HINT' && this.elapsed >= TUNING.xolo.hintPauseMs
      && this.elapsed < TUNING.xolo.hintPauseMs + TUNING.xolo.barkVisualMs;
  }
  get hop(): number {
    if (this.state !== 'REACT_HURT' && this.state !== 'CELEBRATE') return 0;
    return Math.abs(Math.sin(this.elapsed * Math.PI / TUNING.xolo.hopPeriodMs)) * TUNING.xolo.hopHeight;
  }

  private react(state: 'REACT_HURT' | 'CELEBRATE'): void {
    this.cancelHint();
    this.state = state;
    this.elapsed = 0;
    this.nextHintAt = this.clock + (state === 'REACT_HURT' ? TUNING.xolo.hurtDurationMs : TUNING.xolo.celebrateDurationMs);
  }
  private followTarget(frame: XoloFrame): number {
    return this.clamp(frame.playerX - frame.playerFacing * TUNING.xolo.followDistance, frame.worldWidth);
  }
  private clamp(x: number, width: number): number {
    return Math.max(TUNING.xolo.worldMargin, Math.min(width - TUNING.xolo.worldMargin, x));
  }
  private lookAt(x: number): void { if (x !== this.x) this.facing = x < this.x ? -1 : 1; }
  private moveTo(target: number, speed: number, delta: number): void {
    this.lookAt(target);
    this.x += Math.sign(target - this.x) * Math.min(Math.abs(target - this.x), speed * delta / 1000);
  }
}
