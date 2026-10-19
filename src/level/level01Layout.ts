export const LEVEL01 = {
  width: 5800,
  height: 720,
  floorY: 560,
  spawn: { x: 160, y: 500 },
  obstacle: { x: 1000, width: 180, height: 64 },
  candies: [
    { id: 'path-1', x: 1680, y: 528 },
    { id: 'path-2', x: 1880, y: 528 },
    { id: 'path-3', x: 2080, y: 528 },
  ],
  zombie: { x: 2900, y: 520, patrolLeft: 2800, patrolRight: 3050, encounterLeft: 2600, encounterRight: 3300 },
  giveTeaching: { start: 3400, end: 4100 },
  secret: {
    noticeStart: 5000, ignoreEnd: 5600,
    shelf: { x: 5250, y: 464, width: 220, height: 18 },
    candies: [
      { id: 'xolo-secret-1', x: 5300, y: 432 },
      { id: 'xolo-secret-2', x: 5420, y: 432 },
    ],
  },
  safePoints: [
    { id: 'start', triggerX: 0, x: 160, y: 528 },
    { id: 'postJump', triggerX: 1220, x: 1300, y: 528 },
    { id: 'preZombie', triggerX: 2300, x: 2350, y: 528 },
  ],
} as const;
