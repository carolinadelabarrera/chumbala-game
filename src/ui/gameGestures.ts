// Keep browser gesture cancellation inside the game, including its sibling controls.
// Pointer events still reach Phaser and TouchControls: never stop propagation.
export function installGameGestureGuard(): () => void {
  const inGame = (target: EventTarget | null): boolean => target instanceof Element
    && target.closest('#game, .controls') !== null;
  let gameTouchActive = false;
  const updateTouches = (event: TouchEvent) => {
    gameTouchActive = Array.from(event.touches).some(touch => inGame(touch.target));
  };
  const preventMultiTouch = (event: TouchEvent) => {
    updateTouches(event);
    if (event.touches.length > 1 && gameTouchActive && event.cancelable) event.preventDefault();
  };
  const preventSafariGesture = (event: Event) => {
    if ((inGame(event.target) || gameTouchActive) && event.cancelable) event.preventDefault();
  };
  const options = { capture: true, passive: false };
  document.addEventListener('touchstart', preventMultiTouch, options);
  document.addEventListener('touchmove', preventMultiTouch, options);
  document.addEventListener('touchend', updateTouches, options);
  document.addEventListener('touchcancel', updateTouches, options);
  for (const type of ['gesturestart', 'gesturechange', 'gestureend']) {
    document.addEventListener(type, preventSafariGesture, options);
  }
  return () => {
    document.removeEventListener('touchstart', preventMultiTouch, true);
    document.removeEventListener('touchmove', preventMultiTouch, true);
    document.removeEventListener('touchend', updateTouches, true);
    document.removeEventListener('touchcancel', updateTouches, true);
    for (const type of ['gesturestart', 'gesturechange', 'gestureend']) {
      document.removeEventListener(type, preventSafariGesture, true);
    }
  };
}
