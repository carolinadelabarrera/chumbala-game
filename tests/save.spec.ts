import { test, expect, type Page } from '@playwright/test';
import { SAVE_KEY } from '../src/systems/SaveSystem';
import { LEVEL01 } from '../src/level/level01Layout';

const checkpointSave = (levelCompleted = false) => ({ schemaVersion: 1, tutorial: { giveLearned: true },
  progress: { currentLevel: 'level-01', checkpointId: 'ofrenda', levelCompleted } });

async function menu(page: Page) {
  await page.waitForFunction(() => (window as any).__CHUMBALA_GAME__?.scene.isActive('MenuScene'));
}
async function start(page: Page) {
  await page.goto('/'); await menu(page); await page.keyboard.press('Enter');
  await expect(page.locator('.hud')).toHaveCount(1);
}
async function place(page: Page, x: number) {
  await page.evaluate(x => {
    const s = (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene');
    s.player.body.reset(x, 528); s.player.setVelocity(0, 0); s.player.clearJumpTiming();
    s.cameras.main.centerOn(x, 528);
  }, x);
}
async function cureAndRest(page: Page) {
  await page.evaluate(() => {
    const s = (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene');
    s.player.body.reset(s.zombie.x - 30, 528);
  });
  await expect(page.locator('.heart-display')).toHaveAttribute('aria-label', '2 of 3 hearts');
  await place(page, 3450);
  await expect(page.locator('[data-action="give"]')).toBeVisible();
  await page.waitForFunction(() => {
    const s = (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene');
    return !s.damage.rules.isKnockedBack(s.gameplayTime);
  });
  await page.evaluate(() => {
    const s = (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene');
    s.player.body.reset(s.zombie.x - 95, 528);
  });
  await page.keyboard.press('x');
  await page.waitForFunction(() => (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene').zombie.behavior.isCured());
  await place(page, 6100);
  await expect(page.getByRole('dialog', { name: 'Rest', exact: true })).toBeVisible();
}
async function saved(page: Page) {
  return page.evaluate(key => JSON.parse(localStorage.getItem(key) ?? 'null'), SAVE_KEY);
}
async function canonical(page: Page) {
  await expect(page.locator('.hud')).toHaveCount(1);
  await expect(page.locator('.controls')).toHaveCount(1);
  await expect(page.locator('.controls')).toBeVisible();
  await expect(page.locator('.game-choice')).toHaveCount(0);
  await expect(page.locator('[data-action="give"]')).toBeVisible();
  await expect.poll(() => page.evaluate(() => {
    const s = (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene');
    return { x: s.player.x, grounded: s.player.grounded, health: s.health.getHearts(), candy: s.candySystem.getProgress(),
      give: s.give.rules.enabled, busy: s.give.rules.busy, cured: s.zombie.behavior.isCured(),
      damage: s.zombie.behavior.canDamage(), texture: s.zombie.texture.key,
      progression: s.progression.canReachRest, checkpoint: s.checkpoints.getActive().id,
      altar: s.finale.ofrenda.activated, phase: s.finale.flow.phase, paused: s.physics.world.isPaused,
      invulnerable: s.damage.rules.isInvulnerable(s.gameplayTime),
      xoloNearby: Math.abs(s.xolo.x - s.player.x) <= 110,
      xoloCalm: ['FOLLOW', 'WAIT'].includes(s.xolo.behavior.state), hint: s.xolo.behavior.hint ?? null,
      candies: s.children.list.filter((o: any) => o.collectibleId && o.active).length,
      xolos: s.children.list.filter((o: any) => o.texture?.key === 'xolo').length,
      checkpointListeners: s.events.listenerCount('checkpoint:activated'),
      completionListeners: s.events.listenerCount('level:completed') };
  })).toEqual({ x: LEVEL01.ofrenda.checkpoint.x, grounded: true, health: 3, candy: 0,
    give: true, busy: false, cured: true, damage: false, texture: 'townsperson', progression: true,
    checkpoint: 'ofrenda', altar: true, phase: 'CONTINUED', paused: false, invulnerable: false,
    xoloNearby: true, xoloCalm: true, hint: null, candies: 0, xolos: 1,
    checkpointListeners: 1, completionListeners: 2 });
}

for (const viewport of [{ width: 1280, height: 720 }, { width: 740, height: 360 }]) {
  test(`real Ofrenda save survives reload, canonical CONTINUE and completion at ${viewport.width}`, async ({ browser }, testInfo) => {
    const mobile = viewport.width < 1000;
    const context = await browser.newContext({ viewport, hasTouch: true, isMobile: mobile });
    const page = await context.newPage();
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await start(page); await cureAndRest(page);
    expect(await saved(page)).toEqual(checkpointSave());
    await page.reload(); await menu(page);
    await expect(page.getByRole('button', { name: 'Continue', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'New game', exact: true })).toBeVisible();
    await expect(page.locator('.hud')).toHaveCount(0);
    await page.screenshot({ path: testInfo.outputPath('saved-game-menu.png') });
    if (mobile) {
      await page.setViewportSize({ width: 393, height: 852 });
      await expect(page.locator('#rotate-message')).toBeVisible();
      await page.evaluate(() => (document.querySelector('[data-choice="continue"]') as HTMLButtonElement).click());
      expect(await page.evaluate(() => (window as any).__CHUMBALA_GAME__.scene.isActive('MenuScene'))).toBe(true);
      await page.setViewportSize(viewport);
    }
    await page.getByRole('button', { name: 'Continue', exact: true }).tap();
    await canonical(page);
    expect(await saved(page)).toEqual(checkpointSave());
    await page.screenshot({ path: testInfo.outputPath('canonical-ofrenda-resume.png') });
    // Move and jump after resume; crossing the altar must not reopen rest.
    await page.keyboard.down('ArrowRight');
    await page.keyboard.press('Space');
    await page.waitForFunction(() => (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene').player.body.velocity.y < -100);
    await page.keyboard.up('ArrowRight');
    await page.waitForFunction(() => (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene').player.grounded);
    await expect(page.locator('.game-choice')).toHaveCount(0);
    expect(await page.evaluate(() => {
      const event = new Event('gesturechange', { bubbles: true, cancelable: true });
      document.querySelector('canvas')!.dispatchEvent(event);
      return event.defaultPrevented && visualViewport!.scale === 1
        && document.documentElement.scrollWidth <= innerWidth && document.documentElement.scrollHeight <= innerHeight;
    })).toBe(true);
    await place(page, 6650);
    await page.waitForFunction(() => (window as any).__CHUMBALA_GAME__.scene.isActive('EndScene'));
    expect(await saved(page)).toEqual(checkpointSave(true));
    await page.getByRole('button', { name: 'Menu', exact: true }).tap();
    await menu(page);
    await page.getByRole('button', { name: 'Continue', exact: true }).tap();
    await canonical(page);
    expect(await saved(page)).toEqual(checkpointSave(true));
    await page.reload(); await menu(page);
    await page.getByRole('button', { name: 'Continue', exact: true }).tap();
    await canonical(page);
    expect(errors).toEqual([]);
    await context.close();
  });
}

test('STOP HERE retries saving before exit; NEW GAME preserves the save and learned GIVE', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 852, height: 393 }, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  await start(page); await cureAndRest(page);
  await page.evaluate(key => localStorage.removeItem(key), SAVE_KEY);
  await page.getByRole('button', { name: 'Stop here', exact: true }).tap();
  await page.waitForFunction(() => (window as any).__CHUMBALA_GAME__.scene.isActive('EndScene'));
  expect(await saved(page)).toEqual(checkpointSave());
  await page.getByRole('button', { name: 'Menu', exact: true }).tap(); await menu(page);
  await page.getByRole('button', { name: 'New game', exact: true }).tap();
  await expect(page.locator('.hud')).toHaveCount(1);
  await expect.poll(() => page.evaluate(() => {
    const s = (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene');
    return { x: s.player.x, health: s.health.getHearts(), candy: s.candySystem.getProgress(),
      give: s.give.rules.enabled, zombie: s.zombie.behavior.state, checkpoint: s.checkpoints.checkpoint ?? null,
      phase: s.finale.flow.phase, candies: s.children.list.filter((o: any) => o.collectibleId && o.active).length };
  })).toEqual({ x: 160, health: 3, candy: 0, give: true, zombie: 'WANDER', checkpoint: null, phase: 'EXPLORING', candies: 3 });
  expect(await saved(page)).toEqual(checkpointSave());
  await page.reload(); await menu(page);
  await page.getByRole('button', { name: 'Continue', exact: true }).tap();
  await canonical(page);
  await context.close();
});

test('invalid saves fall back safely and learned-only saves continue at the level start', async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('/'); await menu(page);
  for (const raw of ['{broken', JSON.stringify({ ...checkpointSave(), schemaVersion: 99 }),
    JSON.stringify({ ...checkpointSave(), progress: { ...checkpointSave().progress, checkpointId: 'unknown' } })]) {
    await page.evaluate(({ key, raw }) => localStorage.setItem(key, raw), { key: SAVE_KEY, raw });
    await page.reload(); await menu(page);
    await expect(page.getByRole('button', { name: 'Continue', exact: true })).toHaveCount(0);
    await page.keyboard.press('Enter');
    await expect(page.locator('.hud')).toHaveCount(1);
    expect(await page.evaluate(() => (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene').give.rules.enabled)).toBe(false);
  }
  await page.evaluate(({ key, data }) => localStorage.setItem(key, JSON.stringify(data)), { key: SAVE_KEY,
    data: { ...checkpointSave(), progress: { ...checkpointSave().progress, checkpointId: null } } });
  await page.reload(); await menu(page);
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.locator('[data-action="give"]')).toBeVisible();
  expect(await page.evaluate(() => (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene').player.x)).toBe(160);
  await context.close();
});

test('unavailable storage and write denial do not interrupt cure, Ofrenda or STOP HERE', async ({ browser }) => {
  for (const mode of ['unavailable', 'write-denied']) {
    const context = await browser.newContext({ viewport: { width: 852, height: 393 }, hasTouch: true, isMobile: true });
    await context.addInitScript(mode => {
      if (mode === 'unavailable') Object.defineProperty(window, 'localStorage', { get: () => { throw new Error('storage unavailable'); } });
      else Storage.prototype.setItem = () => { throw new Error('storage quota denied'); };
    }, mode);
    const page = await context.newPage();
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await start(page); await cureAndRest(page);
    await page.getByRole('button', { name: 'Stop here', exact: true }).tap();
    await page.waitForFunction(() => (window as any).__CHUMBALA_GAME__.scene.isActive('EndScene'));
    expect(errors).toEqual([]);
    await context.close();
  }
});
