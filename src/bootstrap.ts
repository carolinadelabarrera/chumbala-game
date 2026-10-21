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
        let frame: number | undefined;
        const refresh = () => {
          if (frame !== undefined) return;
          frame = requestAnimationFrame(() => {
            frame = undefined;
            if (!booted.isRunning) return;
            booted.scale.getParentBounds();
            booted.scale.refresh();
          });
        };
        const stopWatching = watchViewport(refresh);
        const observer = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(refresh);
        observer?.observe(document.getElementById('game')!);
        booted.events.once(Phaser.Core.Events.DESTROY, () => {
          stopWatching();
          observer?.disconnect();
          if (frame !== undefined) cancelAnimationFrame(frame);
        });
        refresh();
      },
    },
  });
  if (import.meta.env.DEV) {
    Object.assign(window, { __CHUMBALA_GAME__: game });
  }
}
