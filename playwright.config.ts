import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  workers: 1,
  use: { baseURL: 'http://127.0.0.1:5173' },
  projects: [
    { name: 'chromium', testMatch: ['smoke.spec.ts', 'mobile-startup.spec.ts', 'candy.spec.ts', 'zombie.spec.ts', 'give.spec.ts', 'xolo.spec.ts', 'ofrenda.spec.ts', 'save.spec.ts'], use: { browserName: 'chromium' } },
    {
      name: 'webkit',
      testMatch: ['mobile-startup.spec.ts', 'candy.spec.ts', 'zombie.spec.ts', 'give.spec.ts', 'xolo.spec.ts', 'ofrenda.spec.ts', 'save.spec.ts'],
      use: { browserName: 'webkit' },
      // Windows headless WebKit can render slowly while Phaser caps startup delta.
      // Allow wall-clock headroom without changing game time or weakening assertions.
      timeout: 120_000,
      expect: { timeout: 40_000 },
    },
  ],
  webServer: {
    command: 'npm run dev -- --port 5173 --strictPort',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: !process.env.CI,
  },
});
