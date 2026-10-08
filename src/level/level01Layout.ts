export const LEVEL01 = {
  width: 2300,
  height: 720,
  floorY: 560,
  spawn: { x: 160, y: 500 },
  obstacle: { x: 1000, width: 180, height: 64 },
  candies: [
    { id: 'path-1', x: 1680, y: 528 },
    { id: 'path-2', x: 1880, y: 528 },
    { id: 'path-3', x: 2080, y: 528 },
  ],
} as const;
