import { test, expect, type Page } from '@playwright/test';
import { LEVEL01 } from '../src/level/level01Layout';

test('Xolo walks through distinct leg poses, faces travel, and stands still at rest', async ({ browser }, testInfo) => {
  const context = await browser.newContext({ viewport: { width: 852, height: 393 }, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  await enter(page);
  expect(await page.evaluate(() => {
    const s = (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene');
    const source = s.textures.get('xolo').getSourceImage() as HTMLCanvasElement;
    const context = source.getContext('2d')!;
    const signatures = new Set();
    for (let frame = 1; frame <= 8; frame++) {
      const feet = context.getImageData(frame * 76, 52, 76, 12).data;
      signatures.add(Array.from(feet).join(','));
    }
    return signatures.size;
  })).toBeGreaterThanOrEqual(4);
  await page.evaluate(() => {
    const s = (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene');
    s.walkFrames = new Set();
    s.sawLeftStride = false;
    s.events.on('postupdate', () => {
      if (s.xolo.behavior.state === 'FOLLOW') s.walkFrames.add(s.xolo.frame.name);
      if (s.xolo.flipX && s.xolo.frame.name !== 0) s.sawLeftStride = true;
    });
  });
  await page.keyboard.down('ArrowRight');
  await expect.poll(() => page.evaluate(() => {
    const s = (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene');
    return s.walkFrames.size;
  })).toBeGreaterThanOrEqual(4);
  expect(await page.evaluate(() => (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene').xolo.flipX)).toBe(false);
  await page.screenshot({ path: testInfo.outputPath('xolo-walk.png') });
  await page.keyboard.up('ArrowRight');
  await expect.poll(async () => (await state(page)).state).toBe('WAIT');
  expect(await page.evaluate(() => (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene').xolo.frame.name)).toBe(0);
  await page.keyboard.down('ArrowLeft');
  await expect.poll(() => page.evaluate(() => {
    // Record the stride per frame: host-side polling can miss a short turn
    // before the player reaches the left world boundary and Xolo stops.
    return (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene').sawLeftStride;
  })).toBe(true);
  await page.keyboard.up('ArrowLeft');
  await expect.poll(async () => (await state(page)).state).toBe('WAIT');
  // Presentation can be inspected without changing any navigation rules.
  await page.evaluate(() => {
    const s = (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene');
    s.xolo.behavior.requestHint('give', { playerX: s.player.x, playerFacing: 1, worldWidth: 5800 }, 0);
  });
  await expect.poll(async () => (await state(page)).state).toBe('HINT');
  await page.waitForFunction(() => {
    const s = (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene');
    return s.xolo.behavior.elapsed > 2600 && s.xolo.frame.name === 0;
  });
  await rotate(page, { width: 852, height: 393 });
  expect(await page.evaluate(() => (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene').xolo.frame.name)).toBe(0);
  await context.close();
});

async function state(page: Page) {
  return page.evaluate(() => {
    const s = (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene');
    const b = s.xolo.behavior;
    return { state: b.state, hint: b.hint, elapsed: b.elapsed, facing: b.facing,
      x: s.xolo.x, y: s.xolo.y, playerX: s.player.x, time: s.gameplayTime,
      hearts: s.health.getHearts(), progress: s.candySystem.getProgress(),
      enabled: s.give.rules.enabled, cured: s.zombie.behavior.isCured(),
      secret: s.xoloGuide.secretRevealed, resolved: s.xoloGuide.secretResolved,
      respawning: s.damage.rules.respawning, records: s.xoloRecords,
      candies: s.children.list.filter((o: any) => o.collectibleId?.startsWith('xolo-secret') && o.active).length };
  });
}
async function place(page: Page, x: number, y = 528) {
  await page.evaluate(({ x, y }) => {
    const s = (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene');
    s.player.body.reset(x, y);
    s.player.setVelocity(0, 0);
    s.player.clearJumpTiming();
  }, { x, y });
}
async function enter(page: Page) {
  await page.goto('/');
  await page.waitForFunction(() => (window as any).__CHUMBALA_GAME__?.scene.isActive('MenuScene'));
  const canvas = (await page.locator('canvas').boundingBox())!;
  await page.touchscreen.tap(canvas.x + canvas.width / 2, canvas.y + canvas.height * 450 / 720);
  await expect(page.locator('.heart-display')).toBeVisible();
  await page.evaluate(() => {
    const s = (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene');
    s.xoloRecords = [];
    s.events.on('postupdate', () => {
      const state = s.xolo.behavior.state;
      if (s.xoloRecords.at(-1) !== state) s.xoloRecords.push(state);
    });
  });
}
async function rotate(page: Page, viewport: { width: number; height: number }) {
  await page.setViewportSize({ width: 393, height: 852 });
  await expect(page.locator('#rotate-message')).toBeVisible();
  await page.waitForFunction(() => (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene').physics.world.isPaused);
  const before = await state(page);
  await page.waitForTimeout(180);
  const after = await state(page);
  expect([after.x, after.y, after.time, after.elapsed, after.state]).toEqual(
    [before.x, before.y, before.time, before.elapsed, before.state]);
  await page.setViewportSize(viewport);
  await expect(page.locator('[data-action="right"]')).toBeVisible();
}

for (const viewport of [{ width: 1280, height: 720 }, { width: 852, height: 393 }, { width: 740, height: 360 }]) {
  test(`Xolo follows, teaches GIVE, celebrates, and reveals optional candy at ${viewport.width}`, async ({ browser }, testInfo) => {
    const mobile = viewport.width < 1000;
    const context = await browser.newContext({ viewport, hasTouch: true, isMobile: mobile });
    const page = await context.newPage();
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await enter(page);
    expect(await page.evaluate(() => {
      const s = (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene');
      return { texture: s.xolo.texture.key, body: !!s.xolo.body };
    })).toEqual({ texture: 'xolo', body: false });
    await page.keyboard.down('ArrowRight');
    await expect.poll(async () => (await state(page)).state).toBe('FOLLOW');
    await expect.poll(async () => (await state(page)).x).toBeGreaterThan(100);
    if (mobile) await rotate(page, viewport);
    await page.keyboard.up('ArrowRight');
    await place(page, 1500);
    await expect.poll(async () => Math.abs((await state(page)).x - 1410)).toBeLessThan(20);
    // Walk through Xolo: no companion collider can arrest this velocity.
    await page.keyboard.down('ArrowLeft');
    await expect.poll(async () => (await state(page)).playerX).toBeLessThan(1380);
    await page.keyboard.up('ArrowLeft');
    for (const candy of LEVEL01.candies) {
      await place(page, candy.x);
      await expect.poll(async () => (await state(page)).progress).toBe(LEVEL01.candies.indexOf(candy) + 1);
    }
    await page.evaluate(() => {
      const s = (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene');
      s.player.body.reset(s.zombie.x - 35, 528);
    });
    await expect.poll(async () => (await state(page)).state, { intervals: [10] }).toBe('REACT_HURT');
    expect((await state(page)).hearts).toBe(2);
    await place(page, 3450);
    await expect(page.locator('[data-action="give"]')).toBeVisible();
    await expect.poll(async () => (await state(page)).hint).toBe('give');
    await expect(page.locator('[data-action="give"]')).toHaveClass(/hint/);
    if (mobile) await rotate(page, viewport);
    await expect.poll(async () => (await state(page)).facing).toBe(-1);
    const presentation = await page.evaluate(() => {
      const s = (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene');
      const canvas = document.querySelector('canvas')!.getBoundingClientRect();
      const camera = s.cameras.main;
      return { height: s.xolo.displayHeight * camera.zoom * canvas.height / 720,
        bottom: canvas.y + (s.xolo.y + s.xolo.displayHeight / 2 - camera.worldView.y) * camera.zoom * canvas.height / 720,
        inView: camera.worldView.contains(s.xolo.x - s.xolo.displayWidth / 2, s.xolo.y)
          && camera.worldView.contains(s.xolo.x + s.xolo.displayWidth / 2, s.xolo.y) };
    });
    expect(presentation.height).toBeGreaterThan(40);
    expect(presentation.inView).toBe(true);
    expect(presentation.bottom).toBeLessThan((await page.locator('.controls').boundingBox())!.y);
    await page.screenshot({ path: testInfo.outputPath('xolo-give-direction.png') });
    await page.evaluate(() => {
      const s = (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene');
      s.player.body.reset(s.zombie.x - 95, 528);
      s.player.setVelocity(0, 0);
    });
    await page.keyboard.press('x');
    await expect.poll(async () => (await state(page)).hint).toBeUndefined();
    await expect.poll(async () => (await state(page)).state, { intervals: [10, 25] }).toBe('CELEBRATE');
    expect((await state(page)).cured).toBe(true);
    if (mobile) await rotate(page, viewport);
    await page.screenshot({ path: testInfo.outputPath('xolo-celebrate.png') });
    await page.evaluate(() => {
      const s = (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene');
      const reward = s.children.list.find((o: any) => o.collectibleId === 'first-cure-reward');
      s.player.body.reset(reward.x, reward.y);
    });
    await expect.poll(async () => (await state(page)).progress).toBe(4);
    await place(page, 5100);
    await expect.poll(async () => (await state(page)).hint).toBe('secret');
    expect((await state(page)).candies).toBe(2);
    await page.screenshot({ path: testInfo.outputPath('xolo-secret.png') });
    // The main path stays open beneath the shelf; ignoring the invitation is safe.
    await place(page, 5200);
    await page.keyboard.down('ArrowRight');
    await expect.poll(async () => (await state(page)).playerX).toBeGreaterThan(5680);
    await page.keyboard.up('ArrowRight');
    expect((await state(page)).progress).toBe(4);
    expect((await state(page)).resolved).toBe(true);
    await expect.poll(async () => (await state(page)).hint).toBe('ofrenda');
    // Returning is allowed: ordinary jumping and Arcade overlaps collect both.
    await place(page, 5200);
    await page.waitForFunction(() => (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene').player.grounded);
    await page.keyboard.down('ArrowRight');
    await page.keyboard.press('Space');
    await expect.poll(async () => (await state(page)).candies).toBe(0);
    await page.keyboard.up('ArrowRight');
    expect((await state(page)).hearts).toBe(3);
    expect((await state(page)).progress).toBe(1);
    expect((await state(page)).records).toEqual(expect.arrayContaining(['FOLLOW', 'REACT_HURT', 'HINT', 'CELEBRATE']));
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth && document.documentElement.scrollHeight <= innerHeight)).toBe(true);
    await page.evaluate(() => (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene').scene.restart());
    await expect.poll(async () => (await state(page)).secret).toBe(false);
    expect(await page.evaluate(() => (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene').events.listenerCount('tutorial:giveReady'))).toBe(1);
    expect(errors).toEqual([]);
    await context.close();
  });
}

test('Xolo resets near the player during real zero-health respawn', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 852, height: 393 }, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  await enter(page);
  await place(page, 2450);
  await page.waitForFunction(() => (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene').safePoints.getActive().id === 'preZombie');
  await page.evaluate(() => (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene').health.damage(2));
  await page.evaluate(() => {
    const s = (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene');
    s.player.body.reset(s.zombie.x - 35, 528);
  });
  await expect.poll(async () => (await state(page)).respawning, { intervals: [10] }).toBe(true);
  await expect.poll(async () => (await state(page)).respawning).toBe(false);
  const recovered = await state(page);
  expect(Math.abs(recovered.x - recovered.playerX)).toBeLessThan(110);
  expect(recovered.hint).toBeUndefined();
  expect(recovered.state).not.toBe('REACT_HURT');
  expect(recovered.hearts).toBe(3);
  await context.close();
});
