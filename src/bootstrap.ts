import Phaser from 'phaser';
import { gameConfig } from './config/gameConfig';
import { watchViewport } from './ui/viewport';

export function startGame(onRendered: () => void): void {
  const game = new Phaser.Game({
    ...gameConfig,
    callbacks: {
      postBoot: booted => {
        booted.events.once(Phaser.Core.Events.POST_RENDER, onRendered);
        // Safari may deliver rotation before its safe-area layout has settled.
        const refresh = () => requestAnimationFrame(() => {
          if (!booted.isRunning) return;
          booted.scale.getParentBounds();
          booted.scale.refresh();
        });
        const stopWatching = watchViewport(refresh);
        booted.events.once(Phaser.Core.Events.DESTROY, stopWatching);
        refresh();
      },
    },
  });
  if (import.meta.env.DEV) {
    Object.assign(window, { __CHUMBALA_GAME__: game });
  }
}
