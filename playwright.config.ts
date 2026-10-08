import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  workers: 1,
  use: { baseURL: 'http://127.0.0.1:5173' },
  projects: [
    { name: 'chromium', testMatch: ['smoke.spec.ts', 'mobile-startup.spec.ts', 'candy.spec.ts'], use: { browserName: 'chromium' } },
    { name: 'webkit', testMatch: ['mobile-startup.spec.ts', 'candy.spec.ts'], use: { browserName: 'webkit' } },
  ],
  webServer: {
    command: 'npm run dev -- --port 5173 --strictPort',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: !process.env.CI,
  },
});
