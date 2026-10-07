import Phaser from 'phaser';
import { TUNING } from './tuning';
import { BootScene } from '../scenes/BootScene';
import { MenuScene } from '../scenes/MenuScene';
import { Level01Scene } from '../scenes/Level01Scene';

export const GAME_SIZE = { width: 1280, height: 720 } as const;

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.CANVAS,
  parent: 'game',
  backgroundColor: '#17152d',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    ...GAME_SIZE,
  },
  physics: {
    default: 'arcade',
    arcade: { gravity: { x: 0, y: TUNING.player.gravity }, debug: false },
  },
  scene: [BootScene, MenuScene, Level01Scene],
};
