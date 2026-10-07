import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';

export default defineConfig({
  // The target iPhone launched with iOS 17. Vite dev otherwise defaults to esnext.
  oxc: { target: 'safari17' },
  build: { target: ['safari17', 'chrome111', 'firefox114'] },
  plugins: [{
    name: 'local-startup-diagnostics',
    apply: 'serve',
    transformIndexHtml: {
      order: 'pre',
      handler: () => [{
        tag: 'script',
        children: readFileSync(new URL('./src/dev/startupDiagnostics.js', import.meta.url), 'utf8'),
        injectTo: 'head-prepend',
      }],
    },
  }],
});
