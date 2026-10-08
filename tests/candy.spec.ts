import { test, expect } from '@playwright/test';

for (const viewport of [{ width: 1280, height: 720 }, { width: 852, height: 393 }, { width: 740, height: 360 }]) {
  test(`candy overlap, HUD, healing and scene cleanup at ${viewport.width}`, async ({ browser }, testInfo) => {
    const context = await browser.newContext({ viewport, hasTouch: true, isMobile: viewport.width < 1000 });
    const page = await context.newPage();
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.goto('/');
    await page.waitForFunction(() => (window as any).__CHUMBALA_GAME__?.scene.isActive('MenuScene'));
    const canvas = (await page.locator('canvas').boundingBox())!;
    await page.touchscreen.tap(canvas.x + canvas.width / 2, canvas.y + canvas.height * 450 / 720);
    const hearts = page.locator('.heart-display');
    const candy = page.locator('.candy-display');
    await expect(hearts).toHaveAttribute('aria-label', '3 of 3 hearts');
    await expect(candy).toHaveText('🍬 × 0/5');
    const expectedZoom = viewport.width < 1000 ? 1.3 : 1;
    await expect.poll(() => page.evaluate(() => (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene').cameras.main.zoom)).toBe(expectedZoom);
    const initialBox = (await hearts.boundingBox())!;
    const controls = (await page.locator('.controls').boundingBox())!;
    expect(initialBox.y + initialBox.height).toBeLessThan(controls.y);
    expect(initialBox.x).toBeGreaterThanOrEqual(16);
    const candyBox = (await candy.boundingBox())!;
    // WebKit may round animated bounds by a fraction of a CSS pixel.
    expect(candyBox.x + candyBox.width).toBeLessThanOrEqual(viewport.width - 16 + 0.1);
    await page.evaluate(() => {
      const scene = (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene');
      scene.player.body.reset(1500, 528);
      scene.cameras.main.centerOn(1800, 360);
    });
    await page.screenshot({ path: testInfo.outputPath('candy-path.png') });
    // Walk into each real Arcade overlap; order is intentionally reversed.
    for (const [index, x] of [2080, 1880, 1680].entries()) {
      await page.evaluate(x => {
        const scene = (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene');
        scene.player.body.reset(x - 80, 528);
        scene.player.clearJumpTiming();
      }, x);
      await page.keyboard.down('ArrowRight');
      await expect(candy).toHaveText(`🍬 × ${index + 1}/5`);
      await page.keyboard.up('ArrowRight');
    }
    await expect.poll(() => page.evaluate(() => {
      const scene = (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene');
      return scene.children.list.filter((object: any) => object.texture?.key === 'candy' && object.visible).length;
    })).toBe(0);
    expect((await hearts.boundingBox())!.x).toBe(initialBox.x);
    await page.screenshot({ path: testInfo.outputPath('candy-collected.png') });
    // Existing DEV-only game reference exercises infrastructure without a production damage action.
    await page.evaluate(() => {
      const scene = (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene');
      scene.candySystem.collect('dev-fourth');
      scene.candySystem.collect('dev-full');
      scene.health.damage(1);
    });
    await expect(candy).toHaveText('🍬 × 4/5');
    await expect(hearts.locator('.missing')).toHaveCount(1);
    await page.screenshot({ path: testInfo.outputPath('missing-heart.png') });
    await page.evaluate(() => {
      const scene = (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene');
      scene.candySystem.collect('dev-heal');
    });
    await expect(hearts).toHaveAttribute('aria-label', '3 of 3 hearts');
    // Check actual camera world bounds and player visibility at both level ends.
    for (const x of [24, 2276]) {
      await page.evaluate(x => {
        const scene = (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene');
        scene.player.body.reset(x, 528);
      }, x);
      await expect.poll(() => page.evaluate(() => {
        const scene = (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene');
        const view = scene.cameras.main.worldView;
        return scene.player.x - 24 >= view.x - 1 && scene.player.x + 24 <= view.right + 1
          && view.x >= -1 && view.right <= 2301 && view.y >= -1 && view.bottom <= 721;
      })).toBe(true);
    }
    if (viewport.width < 1000) {
      const presentation = await page.evaluate(() => {
        const scene = (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene');
        const camera = scene.cameras.main;
        const canvas = document.querySelector('canvas')!.getBoundingClientRect();
        const ratio = canvas.height / camera.height;
        return {
          playerHeight: scene.player.displayHeight * camera.zoom * ratio,
          candyWidth: 48 * camera.zoom * ratio,
          obstacleHeight: 64 * camera.zoom * ratio,
          floorScreenY: canvas.y + (560 - camera.worldView.y) * camera.zoom * ratio,
        };
      });
      expect(presentation.playerHeight).toBeGreaterThan(40);
      expect(presentation.candyWidth).toBeGreaterThan(30);
      expect(presentation.obstacleHeight).toBeGreaterThan(40);
      expect(presentation.floorScreenY).toBeLessThan(controls.y);
      await page.keyboard.press('Space');
      await expect.poll(() => page.evaluate(() => (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene').player.body.velocity.y)).toBeLessThan(-100);
      await expect.poll(() => page.evaluate(() => {
        const scene = (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene');
        return scene.player.grounded;
      })).toBe(true);
      await page.setViewportSize({ width: 1280, height: 720 });
      await expect.poll(() => page.evaluate(() => (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene').cameras.main.zoom)).toBe(1);
      await page.setViewportSize(viewport);
      await expect.poll(() => page.evaluate(() => (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene').cameras.main.zoom)).toBe(expectedZoom);
    }
    await expect(hearts.locator('.missing')).toHaveCount(0);
    await expect(candy).toHaveText('🍬 × 0/5');
    if (viewport.width < 1000) {
      await page.setViewportSize({ width: 393, height: 852 });
      await expect(page.locator('#rotate-message')).toBeVisible();
      await expect(hearts).not.toBeVisible();
      await page.setViewportSize(viewport);
      await expect(hearts).toBeVisible();
      await expect(candy).toHaveText('🍬 × 0/5');
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth && document.documentElement.scrollHeight <= innerHeight)).toBe(true);
    await page.evaluate(() => (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene').scene.restart());
    await expect(page.locator('.hud')).toHaveCount(1);
    await expect(candy).toHaveText('🍬 × 0/5');
    await expect(hearts).toHaveAttribute('aria-label', '3 of 3 hearts');
    expect(errors).toEqual([]);
    await context.close();
  });
}
