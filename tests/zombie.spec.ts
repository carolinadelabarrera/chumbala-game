import { test, expect, type Page } from '@playwright/test';
import { TUNING } from '../src/config/tuning';

async function state(page: Page) {
  return page.evaluate(() => {
    const scene = (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene');
    return {
      hearts: scene.health.getHearts(), x: scene.player.x, y: scene.player.y,
      vx: scene.player.body.velocity.x, grounded: scene.player.grounded,
      zombieX: scene.zombie.x, zombieState: scene.zombie.behavior.state,
      invulnerable: scene.damage.rules.isInvulnerable(scene.gameplayTime),
      respawning: scene.damage.rules.respawning, time: scene.gameplayTime,
      safe: scene.safePoints.getActive().id, records: scene.testHits,
    };
  });
}

async function placeAtContact(page: Page, side = -1) {
  await page.evaluate(side => {
    const scene = (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene');
    scene.player.body.reset(scene.zombie.x + side * 35, 528);
    scene.player.setVelocity(0, 0);
    scene.player.clearJumpTiming();
  }, side);
}

for (const viewport of [{ width: 1280, height: 720 }, { width: 852, height: 393 }, { width: 740, height: 360 }]) {
  test(`zombie encounter, protection, and soft respawn at ${viewport.width}`, async ({ browser }, testInfo) => {
    const mobile = viewport.width < 1000;
    const context = await browser.newContext({ viewport, hasTouch: true, isMobile: mobile });
    const page = await context.newPage();
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.goto('/');
    await page.waitForFunction(() => (window as any).__CHUMBALA_GAME__?.scene.isActive('MenuScene'));
    const canvas = (await page.locator('canvas').boundingBox())!;
    await page.touchscreen.tap(canvas.x + canvas.width / 2, canvas.y + canvas.height * 450 / 720);
    await expect(page.locator('.heart-display')).toHaveAttribute('aria-label', '3 of 3 hearts');
    await page.evaluate(() => {
      const scene = (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene');
      scene.testHits = [];
      scene.events.on('player:hurt', () => {
        scene.events.once('postupdate', () => scene.testHits.push({
          hearts: scene.health.getHearts(), vx: scene.player.body.velocity.x,
          vy: scene.player.body.velocity.y, zombieState: scene.zombie.behavior.state,
          invulnerable: scene.damage.rules.isInvulnerable(scene.gameplayTime),
          label: scene.children.list.some((object: any) => object.text === 'ÑAM!'),
        }));
      });
      // Use a real pickup so preservation also checks the disabled collectible body.
      scene.player.body.reset(2080, 528);
    });
    await expect(page.locator('.candy-display')).toHaveText('🍬 × 1/5');
    await page.evaluate(() => {
      const scene = (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene');
      scene.player.body.reset(2450, 528);
      // This fixture teleports several screens; stage the camera too. Normal
      // scrolling is covered by smoke.spec.ts rather than this encounter test.
      scene.cameras.main.centerOn(scene.player.x, scene.player.y);
    });
    await expect.poll(async () => (await state(page)).safe).toBe('preZombie');
    await expect.poll(() => page.evaluate(() => {
      const scene = (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene');
      const view = scene.cameras.main.worldView;
      return scene.zombie.x - 28 >= view.x && scene.zombie.x + 28 <= view.right;
    })).toBe(true);
    expect((await state(page)).hearts).toBe(3);
    const zombieHeight = await page.evaluate(() => {
      const scene = (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene');
      return scene.zombie.displayHeight * scene.cameras.main.zoom * document.querySelector('canvas')!.getBoundingClientRect().height / 720;
    });
    expect(zombieHeight).toBeGreaterThan(50);
    await page.screenshot({ path: testInfo.outputPath('zombie-visible-before-contact.png') });
    await page.keyboard.down('ArrowRight');
    await expect.poll(async () => (await state(page)).records.length, { intervals: [10, 20] }).toBe(1);
    await page.keyboard.up('ArrowRight');
    const first = (await state(page)).records[0];
    expect(first).toMatchObject({ hearts: 2, vx: -TUNING.player.knockbackX,
      vy: TUNING.player.knockbackY, zombieState: 'POST_HIT_PAUSE', invulnerable: true, label: true });
    await expect(page.locator('.heart-display .missing')).toHaveCount(1);
    await page.screenshot({ path: testInfo.outputPath('first-hurt.png') });
    // Deterministically put a fresh contact inside the protection window.
    await page.evaluate(() => {
      const scene = (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene');
      scene.player.body.reset(2450, 528);
      scene.damage.rules.contact(false, scene.gameplayTime, scene.player.x, scene.zombie.x);
      scene.damage.rules.completeRespawn(scene.gameplayTime);
      scene.health.damage(1);
    });
    await placeAtContact(page);
    await page.waitForTimeout(150);
    expect((await state(page)).hearts).toBe(2);
    expect((await state(page)).records.length).toBe(1);
    await page.evaluate(() => {
      const scene = (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene');
      scene.player.body.reset(2450, 528);
    });
    if (mobile) {
      await page.setViewportSize({ width: 393, height: 852 });
      await expect(page.locator('#rotate-message')).toBeVisible();
      await expect(page.locator('[data-action="right"]')).not.toBeVisible();
      const frozen = await state(page);
      await page.waitForTimeout(150);
      expect((await state(page)).time).toBe(frozen.time);
      await page.setViewportSize(viewport);
      await expect(page.locator('[data-action="right"]')).toBeVisible();
      await expect.poll(() => page.evaluate(() => (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene').cameras.main.zoom)).toBe(1.3);
    }
    await expect.poll(async () => (await state(page)).invulnerable).toBe(false);
    await placeAtContact(page, 1);
    await expect.poll(async () => (await state(page)).records.length).toBe(2);
    expect((await state(page)).records[1]).toMatchObject({ hearts: 1, vx: TUNING.player.knockbackX });
    await page.evaluate(() => {
      const scene = (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene');
      scene.player.body.reset(2450, 528);
    });
    await expect.poll(async () => (await state(page)).invulnerable).toBe(false);
    await placeAtContact(page);
    await expect.poll(async () => (await state(page)).respawning, { intervals: [10] }).toBe(true);
    await expect(page.locator('.heart-display .missing')).toHaveCount(3);
    if (mobile) {
      await page.setViewportSize({ width: 393, height: 852 });
      await expect(page.locator('#rotate-message')).toBeVisible();
      const frozen = await state(page);
      await page.waitForTimeout(150);
      expect((await state(page)).time).toBe(frozen.time);
      expect((await state(page)).respawning).toBe(true);
      await page.setViewportSize(viewport);
    }
    await expect(page.locator('[data-action="right"]')).toBeVisible();
    const rightBox = (await page.locator('[data-action="right"]').boundingBox())!;
    await page.mouse.move(rightBox.x + rightBox.width / 2, rightBox.y + rightBox.height / 2);
    await page.mouse.down();
    let recovered = await state(page);
    await expect.poll(async () => {
      recovered = await state(page);
      return !recovered.respawning && recovered.x > 2350;
    }, { intervals: [10] }).toBe(true);
    await page.mouse.up();
    await expect(page.locator('.heart-display')).toHaveAttribute('aria-label', '3 of 3 hearts');
    await expect(page.locator('.candy-display')).toHaveText('🍬 × 1/5');
    expect(recovered.x).toBeGreaterThanOrEqual(2350);
    expect(recovered.x).toBeLessThan(2600);
    expect(recovered.zombieX).toBeGreaterThan(2750);
    expect(recovered.safe).toBe('preZombie');
    expect(recovered.invulnerable).toBe(true);
    expect(recovered.records.length).toBe(3);
    expect(await page.evaluate(() => {
      const scene = (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene');
      return scene.children.list.filter((object: any) => object.texture?.key === 'zombie').length;
    })).toBe(1);
    await page.screenshot({ path: testInfo.outputPath('soft-respawn.png') });
    await page.keyboard.down('ArrowRight');
    await expect.poll(async () => (await state(page)).x).toBeGreaterThan(2380);
    await page.keyboard.up('ArrowRight');
    await page.evaluate(() => {
      const scene = (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene');
      scene.player.body.reset(2080, 528);
    });
    await page.waitForTimeout(100);
    await expect(page.locator('.candy-display')).toHaveText('🍬 × 1/5');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth && document.documentElement.scrollHeight <= innerHeight)).toBe(true);
    expect(errors).toEqual([]);
    await context.close();
  });
}
