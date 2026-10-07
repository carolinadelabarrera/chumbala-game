import { test, expect, type Page } from '@playwright/test';

test.use({ viewport: { width: 393, height: 852 }, hasTouch: true, isMobile: true });

async function expectShell(page: Page) {
  await expect(page.locator('#rotate-message')).toBeVisible();
  expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe('rgb(23, 21, 45)');
  expect(await page.locator('#rotate-message').evaluate(el => getComputedStyle(el).zIndex)).toBe('100');
}

test('cold portrait boot, landscape entry, suspension, and recovery', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto('/?debug=1');
  await expectShell(page);
  await expect(page.locator('html')).toHaveAttribute('data-startup', 'ready');
  await expect(page.locator('#loading-message')).not.toBeVisible();
  await expect(page.locator('#dev-diagnostics')).toContainText('ready');
  await page.screenshot({ path: testInfo.outputPath('cold-portrait.png') });
  await page.setViewportSize({ width: 852, height: 393 });
  await expect(page.locator('#rotate-message')).not.toBeVisible();
  await expect.poll(async () => {
    const bounds = await page.locator('canvas').boundingBox();
    return bounds ? Math.round(bounds.width / bounds.height * 100) : 0;
  }).toBe(178);
  const canvas = (await page.locator('canvas').boundingBox())!;
  expect(canvas.width).toBeGreaterThan(600);
  await page.touchscreen.tap(canvas.x + canvas.width / 2, canvas.y + canvas.height * 450 / 720);
  const right = page.locator('[data-action="right"]');
  await expect(right).toBeVisible();
  await page.setViewportSize({ width: 393, height: 852 });
  await expectShell(page);
  await expect(right).not.toBeVisible();
  await expect(page.locator('#dev-diagnostics')).toContainText('portrait-suspended');
  await page.setViewportSize({ width: 852, height: 393 });
  await expect(right).toBeVisible();
  await expect(page.locator('#dev-diagnostics')).toContainText('landscape-playing');
  const before = await page.evaluate(() => (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene').player.x);
  const button = (await right.boundingBox())!;
  // A held pointer exercises the shared input path without Chromium-specific CDP.
  await page.mouse.move(button.x + button.width / 2, button.y + button.height / 2);
  await page.mouse.down();
  await expect.poll(() => page.evaluate(() => (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene').player.x)).toBeGreaterThan(before + 20);
  await page.mouse.up();
  await page.screenshot({ path: testInfo.outputPath('landscape-recovered.png') });
  expect(errors).toEqual([]);
});

test('portrait shell remains visible when JavaScript is disabled', async ({ browser }) => {
  const context = await browser.newContext({
    javaScriptEnabled: false, hasTouch: true, isMobile: true,
    viewport: { width: 393, height: 852 },
  });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.locator('#rotate-message')).toBeVisible();
  await expect(page.locator('#loading-message')).toBeVisible();
  await expect(page.locator('noscript')).toBeVisible();
  await context.close();
});

test('failed game-module request produces a visible local diagnosis', async ({ page }) => {
  await page.route('**/src/bootstrap.ts*', route => route.abort());
  await page.goto('/?debug=1');
  await expectShell(page);
  await expect(page.locator('#loading-message')).toContainText('could not load');
  await expect(page.locator('#dev-diagnostics')).toContainText('modules-failed');
  await expect(page.locator('canvas')).toHaveCount(0);
});

test('failed JavaScript entry still shows the HTML shell and early diagnosis', async ({ page }) => {
  await page.route('**/src/main.ts*', route => route.abort());
  await page.goto('/?debug=1');
  await expectShell(page);
  await expect(page.locator('#loading-message')).toBeVisible();
  await expect(page.locator('#dev-diagnostics')).toContainText('resource-load-failed');
  await expect(page.locator('#dev-diagnostics')).toContainText('/src/main.ts');
});

test('Phaser constructor failure leaves the shell and reports boot failure', async ({ page }) => {
  await page.route('**/src/bootstrap.ts*', route => route.fulfill({
    contentType: 'application/javascript',
    body: 'export function startGame() { throw new Error("Simulated Phaser boot failure"); }',
  }));
  await page.goto('/?debug=1');
  await expectShell(page);
  await expect(page.locator('#loading-message')).toContainText('could not load');
  await expect(page.locator('#dev-diagnostics')).toContainText('phaser-failed');
  await expect(page.locator('#dev-diagnostics')).toContainText('Simulated Phaser boot failure');
});
