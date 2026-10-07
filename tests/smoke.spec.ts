import { test, expect, type Page } from '@playwright/test';

// Inspect the actual Phaser bodies through the development-only game reference.
async function state(page: Page) {
  return page.evaluate(() => {
    const scene = (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene');
    const player = scene.player;
    return {
      x: player.x, y: player.y, vx: player.body.velocity.x, vy: player.body.velocity.y,
      grounded: player.grounded, cameraX: scene.cameras.main.scrollX,
      paused: scene.physics.world.isPaused,
    };
  });
}

async function enter(page: Page) {
  await page.goto('/');
  await expect(page.locator('canvas')).toBeVisible();
  await page.waitForFunction(() => (window as any).__CHUMBALA_GAME__?.scene.isActive('MenuScene'));
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: 'Jump', exact: true })).toBeVisible();
  await expect.poll(async () => (await state(page)).grounded).toBe(true);
}

async function place(page: Page, x: number, y: number, vy = 0) {
  await page.evaluate(({ x, y, vy }) => {
    const player = (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene').player;
    player.body.reset(x, y);
    player.setVelocity(0, vy);
    player.clearJumpTiming();
  }, { x, y, vy });
}

test('desktop menu, tutorial, keyboard, obstacle, camera, and scaling', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  await page.setViewportSize({ width: 1280, height: 720 });
  await enter(page);
  const right = page.locator('[data-action="right"]');
  await expect(right).toHaveClass(/hint/, { timeout: 4000 });
  await page.keyboard.down('ArrowRight');
  await expect.poll(async () => (await state(page)).x).toBeGreaterThan(190);
  await page.keyboard.up('ArrowRight');
  await expect.poll(async () => (await state(page)).vx).toBe(0);
  await expect(right).not.toHaveClass(/hint/);
  await page.keyboard.down('a');
  await expect.poll(async () => (await state(page)).x).toBeLessThan(180);
  await page.keyboard.up('a');
  await page.keyboard.press('Space');
  await expect.poll(async () => (await state(page)).vy, { intervals: [10] }).toBeLessThan(-100);
  await expect.poll(async () => (await state(page)).grounded).toBe(true);
  await place(page, 920, 528);
  await expect(page.locator('[data-action="jump"]')).toHaveClass(/hint/);
  await page.keyboard.down('d');
  await page.keyboard.press('Space');
  await expect.poll(async () => (await state(page)).y, { intervals: [20] }).toBeLessThan(464);
  await expect.poll(async () => (await state(page)).x).toBeGreaterThan(1220);
  await page.keyboard.up('d');
  await expect.poll(async () => (await state(page)).grounded).toBe(true);
  await expect(page.locator('[data-action="jump"]')).not.toHaveClass(/hint/);
  expect((await state(page)).cameraX).toBeGreaterThan(0);
  await page.setViewportSize({ width: 1024, height: 768 });
  await expect.poll(async () => {
    const box = await page.locator('canvas').boundingBox();
    return box ? Math.round(box.width / box.height * 100) : 0;
  }).toBe(178);
  await page.screenshot({ path: 'test-results/desktop.png' });
  expect(errors).toEqual([]);
});

test('coyote time and buffered input work on live Arcade bodies', async ({ page }) => {
  await enter(page);
  // Step off the tutorial platform without jumping, then jump after leaving its edge.
  await place(page, 1198, 464);
  await expect.poll(async () => (await state(page)).grounded).toBe(true);
  await page.keyboard.down('ArrowRight');
  await expect.poll(async () => (await state(page)).grounded, { intervals: [5] }).toBe(false);
  await page.keyboard.press('Space');
  await expect.poll(async () => (await state(page)).vy, { intervals: [5] }).toBeLessThan(-100);
  await page.keyboard.up('ArrowRight');
  await expect.poll(async () => (await state(page)).grounded).toBe(true);
  // Release a player just above the floor and tap before landing.
  await place(page, 500, 500, 240);
  await expect.poll(async () => (await state(page)).grounded, { intervals: [5] }).toBe(false);
  await page.keyboard.press('Space');
  await expect.poll(async () => (await state(page)).vy, { intervals: [5] }).toBeLessThan(-100);
});

test('mobile landscape supports two real touch pointers and portrait suspension', async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 852, height: 393 }, hasTouch: true, isMobile: true,
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  await page.goto('/');
  await page.waitForFunction(() => (window as any).__CHUMBALA_GAME__?.scene.isActive('MenuScene'));
  const canvas = (await page.locator('canvas').boundingBox())!;
  await page.touchscreen.tap(canvas.x + canvas.width / 2, canvas.y + canvas.height * 450 / 720);
  const right = page.locator('[data-action="right"]');
  const jump = page.locator('[data-action="jump"]');
  await expect(right).toBeVisible();
  await expect.poll(async () => (await state(page)).grounded).toBe(true);
  const rightBox = (await right.boundingBox())!;
  const jumpBox = (await jump.boundingBox())!;
  expect(rightBox.width).toBeGreaterThanOrEqual(64);
  expect(rightBox.x).toBeGreaterThanOrEqual(16);
  expect(jumpBox.x + jumpBox.width).toBeLessThanOrEqual(852 - 16);
  const session = await context.newCDPSession(page);
  const finger = (box: typeof rightBox, id: number) => ({
    x: box.x + box.width / 2, y: box.y + box.height / 2, id,
  });
  const movement = finger(rightBox, 1);
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [movement] });
  await expect.poll(async () => (await state(page)).x).toBeGreaterThan(180);
  await session.send('Input.dispatchTouchEvent', {
    type: 'touchStart', touchPoints: [movement, finger(jumpBox, 2)],
  });
  await expect.poll(async () => (await state(page)).vy, { intervals: [10] }).toBeLessThan(-100);
  expect((await state(page)).vx).toBe(240);
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [movement] });
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect.poll(async () => (await state(page)).vx).toBe(0);
  await page.screenshot({ path: 'test-results/mobile-landscape.png' });
  await page.setViewportSize({ width: 393, height: 852 });
  await expect(page.locator('#rotate-message')).toBeVisible();
  await expect(right).not.toBeVisible();
  await expect.poll(async () => (await state(page)).paused).toBe(true);
  const paused = await state(page);
  await page.waitForTimeout(200);
  expect((await state(page)).x).toBe(paused.x);
  await page.screenshot({ path: 'test-results/mobile-portrait.png' });
  await page.setViewportSize({ width: 740, height: 360 });
  await expect(page.locator('#rotate-message')).not.toBeVisible();
  await expect(right).toBeVisible();
  await expect.poll(async () => (await state(page)).paused).toBe(false);
  expect(errors).toEqual([]);
  await context.close();
});
