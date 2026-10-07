export const TUNING = {
  player: {
    moveSpeed: 240,
    jumpVelocity: -520,
    gravity: 1200,
    coyoteTimeMs: 150,
    jumpBufferMs: 150,
    width: 48,
    height: 64,
  },
  tutorial: {
    moveDelayMs: 2500,
    movedDistance: 12,
    approachDistance: 230,
  },
  camera: { deadzoneWidth: 160, deadzoneHeight: 120, lerp: 0.12 },
} as const;
