import { updateOrientationMessage, watchViewport } from './ui/viewport';
import { installGameGestureGuard } from './ui/gameGestures';

updateOrientationMessage();
watchViewport(updateOrientationMessage);
installGameGestureGuard();

export function startupStage(stage: string, detail = ''): void {
  document.documentElement.dataset.startup = stage;
  if (import.meta.env.DEV) {
    window.dispatchEvent(new CustomEvent('chumbala:startup', { detail: { stage, detail } }));
  }
}

function fail(stage: string, error: unknown): void {
  startupStage(stage, error instanceof Error ? error.message : String(error));
  const message = document.getElementById('loading-message');
  if (message) message.textContent = 'CHÚMBALA! could not load. Check the connection and reload.';
}

window.addEventListener('error', event => fail('runtime-failed', event.error ?? event.message));
window.addEventListener('unhandledrejection', event => fail('runtime-failed', event.reason));

async function start(): Promise<void> {
  startupStage('modules-loading');
  let bootstrap: typeof import('./bootstrap');
  try {
    bootstrap = await import('./bootstrap');
  } catch (error) {
    fail('modules-failed', error);
    return;
  }
  startupStage('phaser-booting');
  try {
    bootstrap.startGame(() => startupStage('ready'));
  } catch (error) {
    fail('phaser-failed', error);
  }
}

void start();
