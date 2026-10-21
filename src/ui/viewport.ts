const coarsePointer = matchMedia('(pointer: coarse)');
const portraitOrientation = matchMedia('(orientation: portrait)');

export function isTouchDevice(): boolean { return navigator.maxTouchPoints > 0 || coarsePointer.matches; }
export function isMobilePortrait(): boolean { return isTouchDevice() && portraitOrientation.matches; }

export function updateOrientationMessage(): void {
  document.documentElement.dataset.mobilePortrait = String(isMobilePortrait());
}

export function watchViewport(onChange: () => void): () => void {
  window.addEventListener('resize', onChange);
  window.addEventListener('orientationchange', onChange);
  window.addEventListener('pageshow', onChange);
  window.visualViewport?.addEventListener('resize', onChange);
  portraitOrientation.addEventListener('change', onChange);
  return () => {
    window.removeEventListener('resize', onChange);
    window.removeEventListener('orientationchange', onChange);
    window.removeEventListener('pageshow', onChange);
    window.visualViewport?.removeEventListener('resize', onChange);
    portraitOrientation.removeEventListener('change', onChange);
  };
}
