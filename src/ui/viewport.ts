export function isMobilePortrait(): boolean {
  const touchDevice = navigator.maxTouchPoints > 0 || matchMedia('(pointer: coarse)').matches;
  return touchDevice && matchMedia('(orientation: portrait)').matches;
}

export function updateOrientationMessage(): void {
  document.documentElement.dataset.mobilePortrait = String(isMobilePortrait());
}

export function watchViewport(onChange: () => void): () => void {
  window.addEventListener('resize', onChange);
  window.addEventListener('orientationchange', onChange);
  window.addEventListener('pageshow', onChange);
  window.visualViewport?.addEventListener('resize', onChange);
  const orientation = matchMedia('(orientation: portrait)');
  orientation.addEventListener('change', onChange);
  return () => {
    window.removeEventListener('resize', onChange);
    window.removeEventListener('orientationchange', onChange);
    window.removeEventListener('pageshow', onChange);
    window.visualViewport?.removeEventListener('resize', onChange);
    orientation.removeEventListener('change', onChange);
  };
}
