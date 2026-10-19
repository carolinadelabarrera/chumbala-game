import { test, expect, type Page } from '@playwright/test';

test.use({ viewport: { width: 393, height: 852 }, hasTouch: true, isMobile: true });

test('gesture prevention is scoped to the game and controls without restricting viewport zoom metadata', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width: 852, height: 393 });
  await page.goto('/');
  await page.waitForFunction(() => (window as any).__CHUMBALA_GAME__?.scene.isActive('MenuScene'));
  await page.keyboard.press('Enter');
  await expect(page.locator('.controls')).toBeVisible();
  const result = await page.evaluate(() => {
    const canvas = document.querySelector('canvas')!;
    const game = document.querySelector('#game')!;
    const control = document.querySelector('[data-action="right"]')!;
    const outside = document.createElement('aside');
    document.body.append(outside);
    const gesture = (target: EventTarget, type: string) => {
      const event = new Event(type, { bubbles: true, cancelable: true });
      target.dispatchEvent(event);
      return event.defaultPrevented;
    };
    const touch = (target: Element, type: string, targets: Element[]) => {
      const event = new Event(type, { bubbles: true, cancelable: true });
      Object.defineProperty(event, 'touches', { value: targets.map(target => ({ target })) });
      Object.defineProperty(event, 'changedTouches', { value: [] });
      target.dispatchEvent(event);
      return event.defaultPrevented;
    };
    const scoped = ['gesturestart', 'gesturechange', 'gestureend'].every(type =>
      gesture(canvas, type) && gesture(control, type) && !gesture(outside, type));
    // Dispatch on the container to test our guard independently of Phaser's
    // canvas touch capture, which also cancels single-finger native defaults.
    const single = touch(game, 'touchstart', [canvas]);
    const multi = touch(game, 'touchstart', [canvas, control]);
    const moved = touch(game, 'touchmove', [canvas, control]);
    // Safari may deliver a gesture to the document while game-owned touches are active.
    const retargeted = gesture(document, 'gesturechange');
    touch(game, 'touchend', []);
    const released = gesture(outside, 'gesturestart');
    const unrelated = touch(outside, 'touchstart', [outside, outside]);
    touch(outside, 'touchcancel', []);
    outside.remove();
    return { scoped, single, multi, moved, retargeted, released, unrelated,
      bodyAction: getComputedStyle(document.body).touchAction,
      gameAction: getComputedStyle(document.querySelector('#game')!).touchAction,
      canvasAction: getComputedStyle(canvas).touchAction,
      controlAction: getComputedStyle(control).touchAction,
      viewport: document.querySelector('meta[name="viewport"]')!.getAttribute('content') };
  });
  expect(result).toMatchObject({ scoped: true, single: false, multi: true, moved: true,
    retargeted: true, released: false, unrelated: false,
    bodyAction: 'auto', gameAction: 'none', canvasAction: 'none', controlAction: 'none' });
  expect(result.viewport).not.toMatch(/user-scalable\s*=\s*no|maximum-scale/i);
  expect(errors).toEqual([]);
});

test('two-finger canvas pinch and drag preserve visual viewport and landscape framing', async ({ browser }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'Native multi-touch injection uses Chromium CDP; Safari gestures need real-device testing');
  const context = await browser.newContext({ viewport: { width: 852, height: 393 }, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  await page.goto('/');
  await page.waitForFunction(() => (window as any).__CHUMBALA_GAME__?.scene.isActive('MenuScene'));
  const canvas = (await page.locator('canvas').boundingBox())!;
  await page.touchscreen.tap(canvas.x + canvas.width / 2, canvas.y + canvas.height * 450 / 720);
  await expect(page.locator('.controls')).toBeVisible();
  const before = (await page.locator('canvas').boundingBox())!;
  const session = await context.newCDPSession(page);
  const points = (spread: number, shift = 0) => [
    { x: 426 - spread + shift, y: 170, id: 1 }, { x: 426 + spread + shift, y: 170, id: 2 },
  ];
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: points(40) });
  for (const spread of [60, 90, 130, 170, 110, 40]) {
    await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: points(spread) });
  }
  await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: points(40, 80) });
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect.poll(() => page.evaluate(() => window.visualViewport!.scale)).toBe(1);
  expect(await page.evaluate(() => [scrollX, scrollY, visualViewport!.offsetLeft, visualViewport!.offsetTop])).toEqual([0, 0, 0, 0]);
  const after = (await page.locator('canvas').boundingBox())!;
  for (const key of ['x', 'y', 'width', 'height'] as const) expect(after[key]).toBeCloseTo(before[key], 1);
  await page.setViewportSize({ width: 393, height: 852 });
  await expect(page.locator('#rotate-message')).toBeVisible();
  await page.setViewportSize({ width: 852, height: 393 });
  await expect(page.locator('#rotate-message')).not.toBeVisible();
  await expect(page.locator('[data-action="jump"]')).toBeVisible();
  expect(await page.evaluate(() => visualViewport!.scale)).toBe(1);
  await context.close();
});

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
