// Injected as an inline classic script by Vite DEV only, before module loading.
(function () {
  var state = { stage: 'html-received', orientation: 'unknown', error: '', viewport: '', canvas: '' };
  var panel;
  var debug = new URLSearchParams(location.search).get('debug') === '1';
  window.__CHUMBALA_DIAGNOSTICS__ = state;

  function render() {
    state.viewport = window.innerWidth + 'x' + window.innerHeight;
    var canvas = document.querySelector('canvas');
    var bounds = canvas && canvas.getBoundingClientRect();
    state.canvas = bounds ? Math.round(bounds.width) + 'x' + Math.round(bounds.height) : 'not created';
    if (!debug && !state.error) return;
    // A stalled module can delay DOMContentLoaded; diagnostics must not wait for it.
    if (!panel && document.body) {
      panel = document.createElement('pre');
      panel.id = 'dev-diagnostics';
      panel.style.cssText = 'position:fixed;z-index:200;left:16px;right:16px;bottom:max(110px,env(safe-area-inset-bottom));padding:10px;background:#100d22;color:#fff5d9;border:1px solid #ffcf70;font:12px monospace;white-space:pre-wrap;overflow-wrap:anywhere;pointer-events:none;';
      document.body.append(panel);
    }
    if (!panel) return;
    panel.hidden = false;
    panel.textContent = 'DEV: ' + state.stage + '\n' + state.orientation + ' | viewport ' + state.viewport + ' | canvas ' + state.canvas + (state.error ? '\n' + state.error : '');
  }

  function failed(stage, detail) {
    state.stage = stage;
    state.error = String(detail || 'Unknown error').slice(0, 240);
    document.documentElement.dataset.startup = stage;
    var message = document.getElementById('loading-message');
    if (message) message.textContent = 'CHÚMBALA! could not load. Check the connection and reload.';
    render();
    console.debug('[CHÚMBALA startup]', state.stage, state.error);
  }

  window.addEventListener('chumbala:startup', function (event) {
    state.stage = event.detail.stage;
    state.error = event.detail.detail || '';
    render();
    console.debug('[CHÚMBALA startup]', state.stage);
  });
  window.addEventListener('chumbala:orientation', function (event) {
    state.orientation = event.detail;
    render();
  });
  window.addEventListener('error', function (event) {
    var target = event.target;
    if (target && target !== window && (target.src || target.href)) {
      failed('resource-load-failed', new URL(target.src || target.href).pathname);
    } else {
      failed('runtime-failed', event.message);
    }
  }, true);
  window.addEventListener('unhandledrejection', function (event) {
    failed('runtime-failed', event.reason && event.reason.message || event.reason);
  });
  function orientation() {
    var touch = navigator.maxTouchPoints > 0 || matchMedia('(pointer: coarse)').matches;
    state.orientation = touch && matchMedia('(orientation: portrait)').matches ? 'portrait (waiting for landscape)' : 'landscape/desktop';
    render();
  }
  window.addEventListener('resize', orientation);
  window.addEventListener('orientationchange', orientation);
  document.addEventListener('DOMContentLoaded', orientation);
  setTimeout(orientation, 0);
  setTimeout(function () {
    if (state.stage === 'html-received') failed('module-entry-timeout', 'HTML loaded, but the JavaScript entry did not run. Check script requests.');
    else if (state.stage === 'modules-loading') failed('module-load-timeout', 'JavaScript started, but game modules have not loaded.');
    else if (state.stage === 'phaser-booting') failed('phaser-boot-timeout', 'Game modules loaded, but Phaser has not rendered its first frame.');
  }, 10000);
})();
