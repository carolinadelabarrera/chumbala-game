import { test, expect, type Page } from '@playwright/test';

async function sceneState(page: Page) {
  return page.evaluate(() => {
    const scene = (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene');
    return { state: scene.zombie.behavior.state, enabled: scene.give.rules.enabled,
      busy: scene.give.rules.busy, hearts: scene.health.getHearts(), time: scene.gameplayTime,
      records: scene.giveRecords, vx: scene.player.body.velocity.x, vy: scene.player.body.velocity.y,
      texture: scene.zombie.texture.key, hazardous: scene.zombie.behavior.canDamage() };
  });
}

async function enter(page: Page) {
  await page.goto('/');
  await page.waitForFunction(() => (window as any).__CHUMBALA_GAME__?.scene.isActive('MenuScene'));
  const canvas = (await page.locator('canvas').boundingBox())!;
  await page.touchscreen.tap(canvas.x + canvas.width / 2, canvas.y + canvas.height * 450 / 720);
  await expect(page.locator('.heart-display')).toBeVisible();
  await page.evaluate(() => {
    const scene = (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene');
    scene.giveRecords = { started: 0, cured: 0, states: [], physicsBread: false };
    scene.events.on('give:started', () => scene.giveRecords.started++);
    scene.events.on('zombie:cured', () => scene.giveRecords.cured++);
    scene.events.on('postupdate', () => {
      if (!scene.giveRecords.started) return;
      const state = scene.zombie.behavior.state;
      const states = scene.giveRecords.states;
      if (states.at(-1) !== state) states.push(state);
      if (scene.give.bread?.body) scene.giveRecords.physicsBread = true;
    });
  });
}

async function teach(page: Page) {
  await page.evaluate(() => {
    const scene = (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene');
    scene.player.body.reset(scene.zombie.x - 35, 528);
  });
  await expect(page.locator('.heart-display')).toHaveAttribute('aria-label', '2 of 3 hearts');
  await page.evaluate(() => {
    const scene = (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene');
    scene.player.body.reset(3450, 528);
    scene.player.setVelocity(0, 0);
  });
  await expect(page.locator('[data-action="give"]')).toBeVisible();
  await expect(page.locator('[data-action="give"]')).toHaveClass(/hint/);
  await page.waitForFunction(() => {
    const scene = (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene');
    return !scene.damage.rules.isKnockedBack(scene.gameplayTime);
  });
}

async function approach(page: Page) {
  await page.evaluate(() => {
    const scene = (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene');
    scene.player.body.reset(scene.zombie.x - 95, 528);
    scene.player.setVelocity(0, 0);
    scene.player.clearJumpTiming();
    scene.cameras.main.centerOn(scene.player.x, scene.player.y);
  });
}

for (const viewport of [{ width: 1280, height: 720 }, { width: 852, height: 393 }, { width: 740, height: 360 }]) {
  test(`GIVE gate, scripted cure, and safe townsperson at ${viewport.width}`, async ({ browser }, testInfo) => {
    const mobile = viewport.width < 1000;
    const context = await browser.newContext({ viewport, hasTouch: true, isMobile: mobile });
    const page = await context.newPage();
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await enter(page);
    await expect(page.locator('[data-action="give"]')).not.toBeVisible();
    await page.keyboard.press('x');
    expect((await sceneState(page)).records.started).toBe(0);
    // Reaching the region alone is insufficient: the damage teaching beat comes first.
    await page.evaluate(() => (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene').player.body.reset(3450, 528));
    await page.waitForTimeout(100);
    expect((await sceneState(page)).enabled).toBe(false);
    await teach(page);
    const give = page.locator('[data-action="give"]');
    const jumpBox = (await page.locator('[data-action="jump"]').boundingBox())!;
    const giveBox = (await give.boundingBox())!;
    expect(giveBox.width).toBeGreaterThanOrEqual(94);
    expect(giveBox.height).toBeGreaterThanOrEqual(64);
    expect(giveBox.x).toBeGreaterThan(jumpBox.x + jumpBox.width);
    expect(giveBox.x + giveBox.width).toBeLessThanOrEqual(viewport.width - 16 + 0.1);
    // Out-of-range keyboard GIVE has no free-flying bread or gameplay effect.
    await page.keyboard.press('x');
    expect((await sceneState(page)).records.started).toBe(0);
    await approach(page);
    await page.screenshot({ path: testInfo.outputPath('basket-and-give-cue.png') });
    await page.keyboard.down('ArrowRight');
    if (mobile) await give.tap();
    else await page.keyboard.press('x');
    await expect.poll(async () => (await sceneState(page)).records.started, { intervals: [10] }).toBe(1);
    await expect.poll(async () => (await sceneState(page)).vx, { intervals: [10] }).toBe(240);
    await page.keyboard.up('ArrowRight');
    await expect(give).not.toHaveClass(/hint/);
    await page.screenshot({ path: testInfo.outputPath('offering-pan.png') });
    if (mobile) {
      await page.setViewportSize({ width: 393, height: 852 });
      await expect(page.locator('#rotate-message')).toBeVisible();
      await expect(give).not.toBeVisible();
      const paused = await sceneState(page);
      await page.waitForTimeout(200);
      expect((await sceneState(page)).time).toBe(paused.time);
      expect((await sceneState(page)).state).toBe(paused.state);
      await page.setViewportSize(viewport);
      await expect(give).toBeVisible();
    }
    await page.keyboard.press('x');
    await expect.poll(async () => (await sceneState(page)).state, { intervals: [10, 25] }).toBe('EATING');
    await page.screenshot({ path: testInfo.outputPath('receiving-and-eating.png') });
    await expect.poll(async () => (await sceneState(page)).state, { intervals: [10, 25] }).toBe('CURING');
    await page.screenshot({ path: testInfo.outputPath('warm-cure.png') });
    await expect.poll(async () => (await sceneState(page)).records.cured).toBe(1);
    const cured = await sceneState(page);
    expect(cured.records.states).toEqual(['RECEIVING_PAN', 'EATING', 'CURING', 'CELEBRATE']);
    expect(cured.records.physicsBread).toBe(false);
    expect(cured.texture).toBe('townsperson');
    expect(cured.hazardous).toBe(false);
    expect(cured.hearts).toBe(2);
    await page.evaluate(() => new Promise<void>(resolve => (window as any).__CHUMBALA_GAME__.events.once('postrender', resolve)));
    expect(await page.evaluate(() => {
      const scene = (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene');
      return scene.textures.getPixel(28, 7, 'townsperson').color;
    })).toBe(0xf1b374);
    expect(await page.evaluate(() => {
      const scene = (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene');
      return scene.children.list.filter((object: any) => object.collectibleId === 'first-cure-reward').length;
    })).toBe(1);
    await page.screenshot({ path: testInfo.outputPath('safe-townsperson.png') });
    await page.evaluate(() => {
      const scene = (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene');
      scene.player.body.reset(scene.zombie.x, 528);
    });
    await page.keyboard.press('x');
    await page.waitForTimeout(1400);
    expect((await sceneState(page)).hearts).toBe(2);
    expect((await sceneState(page)).records.started).toBe(1);
    expect((await sceneState(page)).records.cured).toBe(1);
    await page.evaluate(() => {
      const scene = (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene');
      scene.zombie.resetEncounter();
    });
    expect((await sceneState(page)).hazardous).toBe(false);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth && document.documentElement.scrollHeight <= innerHeight)).toBe(true);
    await page.evaluate(() => (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene').scene.restart());
    // Fresh gameplay retains the tutorial skill that was persisted on valid GIVE.
    await expect(give).toBeVisible();
    expect(errors).toEqual([]);
    await context.close();
  });
}

test('two real mobile touch pointers support MOVE plus GIVE', async ({ browser }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'CDP touch injection is Chromium-specific');
  const context = await browser.newContext({ viewport: { width: 852, height: 393 }, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  await enter(page);
  await teach(page);
  const right = (await page.locator('[data-action="right"]').boundingBox())!;
  const give = (await page.locator('[data-action="give"]').boundingBox())!;
  const jump = (await page.locator('[data-action="jump"]').boundingBox())!;
  const session = await context.newCDPSession(page);
  const move = { x: right.x + right.width / 2, y: right.y + right.height / 2, id: 1 };
  const offer = { x: give.x + give.width / 2, y: give.y + give.height / 2, id: 2 };
  const leap = { x: jump.x + jump.width / 2, y: jump.y + jump.height / 2, id: 2 };
  // Revalidate MOVE + JUMP with the new GIVE button visible beside it.
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [move, leap] });
  await expect.poll(async () => (await sceneState(page)).vy, { intervals: [10] }).toBeLessThan(-100);
  expect((await sceneState(page)).vx).toBe(240);
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await page.waitForFunction(() => (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene').player.grounded);
  await approach(page);
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [move, offer] });
  await expect.poll(async () => (await sceneState(page)).records.started, { intervals: [10] }).toBe(1);
  expect((await sceneState(page)).vx).toBe(240);
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [move] });
  expect((await sceneState(page)).vx).toBe(240);
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect.poll(async () => (await sceneState(page)).vx).toBe(0);
  await expect.poll(async () => (await sceneState(page)).records.cured).toBe(1);
  await context.close();
});
