export class JumpTiming {
  private lastGroundedAt = -Infinity;
  private bufferedAt = -Infinity;
  private waitingToLeaveGround = false;

  private readonly coyoteMs: number;
  private readonly bufferMs: number;

  constructor(coyoteMs: number, bufferMs: number) {
    this.coyoteMs = coyoteMs;
    this.bufferMs = bufferMs;
  }

  update(now: number, grounded: boolean, pressed: boolean): boolean {
    // Collision flags may stay grounded for the frame immediately after takeoff.
    // Do not re-arm a second jump until the body has actually left the floor.
    if (!grounded) this.waitingToLeaveGround = false;
    if (grounded && !this.waitingToLeaveGround) this.lastGroundedAt = now;
    if (pressed) this.bufferedAt = now;
    if (now - this.lastGroundedAt <= this.coyoteMs && now - this.bufferedAt <= this.bufferMs) {
      this.lastGroundedAt = -Infinity;
      this.bufferedAt = -Infinity;
      this.waitingToLeaveGround = true;
      return true;
    }
    return false;
  }

  reset(): void {
    this.lastGroundedAt = -Infinity;
    this.bufferedAt = -Infinity;
    this.waitingToLeaveGround = false;
  }
}
