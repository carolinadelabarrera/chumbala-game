import { test, expect, type Page } from '@playwright/test';
import { SAVE_KEY } from '../src/systems/SaveSystem';

const save = { schemaVersion: 1, tutorial: { giveLearned: true },
  progress: { currentLevel: 'level-01', checkpointId: 'ofrenda', levelCompleted: false } };
async function open(page: Page, fresh = false) {
  await page.addInitScript(({ key, save }) => localStorage.setItem(key, JSON.stringify(save)), { key: SAVE_KEY, save });
  await page.goto('/');
  await page.waitForFunction(() => (window as any).__CHUMBALA_GAME__?.scene.isActive('MenuScene'));
  await page.getByRole('button', { name: fresh ? 'New game' : 'Continue', exact: true }).click();
  await expect(page.locator('.controls')).toBeVisible();
  await page.waitForFunction(() => (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene').player.grounded);
}
async function place(page: Page, x: number) {
  await page.evaluate(x => {
    const s = (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene');
    s.player.body.reset(x, 528); s.player.setVelocity(0, 0); s.player.clearJumpTiming();
    s.cameras.main.centerOn(x, 528);
  }, x);
}
async function portraitRoundTrip(page: Page, viewport: { width: number; height: number }) {
  await page.setViewportSize({ width: viewport.height, height: viewport.width });
  await expect(page.locator('#rotate-message')).toBeVisible();
  await page.waitForFunction(() => {
    const game = (window as any).__CHUMBALA_GAME__;
    return !game.scene.isActive('Level01Scene') || game.scene.getScene('Level01Scene').portrait;
  });
  await page.setViewportSize(viewport);
  await expect(page.locator('#rotate-message')).not.toBeVisible();
  await page.waitForFunction(() => {
    const game = (window as any).__CHUMBALA_GAME__;
    return !game.scene.isActive('Level01Scene') || !game.scene.getScene('Level01Scene').portrait;
  });
}
async function insets(page: Page, left: number, right: number, bottom = 21) {
  // Emulate asymmetric layout inputs, not the physical Safari notch itself.
  await page.evaluate(({ left, right, bottom }) => {
    for (const [name, value] of Object.entries({ left, right, bottom })) {
      document.documentElement.style.setProperty(`--safe-${name}`, `${value}px`);
    }
  }, { left, right, bottom });
  await expect.poll(() => page.locator('#game').evaluate(el => el.getBoundingClientRect().x)).toBe(left);
}
async function layout(page: Page) {
  return page.evaluate(() => {
    const rect = (el: Element) => {
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height, right: r.right, bottom: r.bottom };
    };
    const game = rect(document.querySelector('#game')!);
    const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>('.control:not([hidden])')).map(el => ({ action: el.dataset.action, ...rect(el) }));
    const scene = (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene');
    const canvas = rect(document.querySelector('canvas')!);
    const camera = scene.cameras.main;
    const scale = canvas.height / camera.height * camera.zoom;
    return { game, buttons, hud: rect(document.querySelector('.hud')!),
      playerHeight: scene.player.displayHeight * scale,
      playerBottom: canvas.y + (scene.player.y + scene.player.height / 2 - camera.worldView.y) * scale,
      hudPassThrough: getComputedStyle(document.querySelector('.hud')!).pointerEvents,
      logical: [scene.scale.gameSize.width, scene.scale.gameSize.height],
      scroll: [scrollX, scrollY], overflow: document.documentElement.scrollWidth > innerWidth || document.documentElement.scrollHeight > innerHeight };
  });
}

for (const viewport of [{ width: 568, height: 320 }, { width: 740, height: 360 }, { width: 852, height: 393 },
  { width: 1024, height: 768 }, { width: 1280, height: 720 }]) {
  test(`safe responsive controls and world clearance at ${viewport.width}`, async ({ browser }, testInfo) => {
    const context = await browser.newContext({ viewport, hasTouch: true, isMobile: viewport.width < 1000 });
    const page = await context.newPage();
    await open(page);
    for (const [left, right, bottom] of [[0, 0, 0], [59, 0, 21], [0, 59, 21]]) {
      await insets(page, left, right, bottom);
      await expect.poll(async () => {
        const l = await layout(page);
        return l.buttons.every(b => b.x >= l.game.x + 12 && b.right <= l.game.right - 12 && b.bottom <= l.game.bottom - 8);
      }).toBe(true);
      // Wait for ResizeObserver/Phaser camera geometry to settle too.
      await expect.poll(async () => (await layout(page)).playerBottom).toBeLessThanOrEqual((await layout(page)).buttons[0].y - 4);
      const l = await layout(page);
      expect(l.logical).toEqual([1280, 720]);
      expect(l.buttons).toHaveLength(4);
      for (const b of l.buttons) {
        expect(b.width).toBeGreaterThanOrEqual(64);
        expect(b.height).toBeGreaterThanOrEqual(64);
      }
      for (let i = 0; i < l.buttons.length - 1; i++) expect(l.buttons[i + 1].x - l.buttons[i].right).toBeGreaterThanOrEqual(10);
      expect(l.hud.x).toBeGreaterThanOrEqual(l.game.x + 12);
      expect(l.hud.right).toBeLessThanOrEqual(l.game.right - 12);
      expect(l.hudPassThrough).toBe('none');
      expect(l.playerHeight).toBeGreaterThanOrEqual(28);
      expect(l.scroll).toEqual([0, 0]); expect(l.overflow).toBe(false);
      expect(await page.locator('[data-action="jump"] svg').count()).toBe(1);
      expect(await page.locator('[data-action="give"] .pan-icon').count()).toBe(1);
    }
    await page.screenshot({ path: testInfo.outputPath('safe-layout.png') });
    await context.close();
  });
}

test('pointer ownership, cancellation, disabled controls and stale capture release are independent', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 852, height: 393 }, hasTouch: true, isMobile: true });
  const page = await context.newPage(); await open(page);
  const result = await page.evaluate(() => {
    const s = (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene');
    s.scene.pause(); s.actions.reset();
    const button = (action: string) => document.querySelector<HTMLButtonElement>(`[data-action="${action}"]`)!;
    const send = (action: string, type: string, id: number) => button(action).dispatchEvent(new PointerEvent(type, { pointerId: id, pointerType: 'touch', bubbles: true, cancelable: true }));
    send('right', 'pointerdown', 101); send('jump', 'pointerdown', 102);
    const both = s.actions.snapshot();
    send('jump', 'pointerup', 102);
    const stillMoving = s.actions.snapshot();
    send('give', 'pointerdown', 103); send('right', 'pointerup', 101);
    const giveOnly = s.actions.snapshot();
    const giveHeld = button('give').classList.contains('held');
    send('give', 'pointercancel', 103);
    send('left', 'pointerdown', 104); send('left', 'pointerdown', 105);
    send('left', 'pointerup', 104);
    const sharedAction = s.actions.snapshot();
    send('right', 'lostpointercapture', 105);
    const staleRelease = s.actions.snapshot();
    send('left', 'pointercancel', 105);
    s.controls.setGiveAvailable(false);
    send('give', 'pointerdown', 106);
    const disabled = s.actions.snapshot();
    send('right', 'pointerdown', 107); send('jump', 'pointerdown', 108);
    window.dispatchEvent(new Event('orientationchange'));
    const rotated = s.actions.snapshot();
    window.dispatchEvent(new Event('blur'));
    return { both, stillMoving, giveOnly, giveHeld, sharedAction, staleRelease, disabled, rotated,
      heldAfterBlur: document.querySelectorAll('.control.held').length };
  });
  expect(result).toEqual({ both: { move: 1, jumpPressed: true, givePressed: false },
    stillMoving: { move: 1, jumpPressed: false, givePressed: false },
    giveOnly: { move: 0, jumpPressed: false, givePressed: true }, giveHeld: true,
    sharedAction: { move: -1, jumpPressed: false, givePressed: false },
    staleRelease: { move: -1, jumpPressed: false, givePressed: false },
    disabled: { move: 0, jumpPressed: false, givePressed: false },
    rotated: { move: 0, jumpPressed: false, givePressed: false }, heldAfterBlur: 0 });
  await context.close();
});

test('landscape height changes preserve targets, logical canvas, held input, and portrait clears stale presses', async ({ browser }) => {
  const viewport = { width: 852, height: 393 };
  const context = await browser.newContext({ viewport, hasTouch: true, isMobile: true });
  const page = await context.newPage(); await open(page); await place(page, 500);
  const right = page.locator('[data-action="right"]');
  const original = (await right.boundingBox())!;
  await page.mouse.move(original.x + original.width / 2, original.y + original.height / 2); await page.mouse.down();
  for (const height of [360, 320, 393]) {
    await page.setViewportSize({ width: 852, height });
    await expect(right).toHaveClass(/held/);
    const l = await layout(page);
    expect(l.logical).toEqual([1280, 720]);
    expect(l.buttons.find(b => b.action === 'right')!.height).toBe(original.height);
    expect(l.overflow).toBe(false);
  }
  await page.mouse.up();
  await page.keyboard.press('Space');
  await page.waitForFunction(() => (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene').player.body.velocity.y < -100);
  await page.setViewportSize({ width: 393, height: 852 });
  await page.waitForFunction(() => (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene').portrait);
  const frozen = await page.evaluate(() => {
    const s = (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene');
    document.querySelector('[data-action="jump"]')!.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 201, bubbles: true }));
    return [s.gameplayTime, s.player.x, s.player.y];
  });
  await page.waitForTimeout(150);
  expect(await page.evaluate(() => {
    const s = (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene'); return [s.gameplayTime, s.player.x, s.player.y];
  })).toEqual(frozen);
  await page.setViewportSize(viewport);
  await page.waitForFunction(() => !(window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene').portrait);
  expect(await page.evaluate(() => (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene').actions.snapshot())).toEqual({ move: 0, jumpPressed: false, givePressed: false });
  await expect(page.locator('.control.held')).toHaveCount(0);
  await page.evaluate(() => (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene').scene.restart({ resume: false }));
  await page.waitForFunction(() => (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene').zombie.behavior.state === 'WANDER');
  await page.evaluate(() => {
    const s = (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene');
    s.player.body.reset(s.zombie.x + 220, 528);
  });
  await page.waitForFunction(() => (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene').zombie.behavior.state === 'CHASE');
  await page.setViewportSize({ width: 393, height: 852 });
  await page.waitForFunction(() => (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene').portrait);
  const chase = await page.evaluate(() => {
    const s = (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene'); return [s.zombie.x, s.zombie.behavior.state, s.gameplayTime];
  });
  await page.waitForTimeout(150);
  expect(await page.evaluate(() => {
    const s = (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene'); return [s.zombie.x, s.zombie.behavior.state, s.gameplayTime];
  })).toEqual(chase);
  await page.setViewportSize(viewport);
  await expect(page.locator('.controls')).toBeVisible();
  await context.close();
});

test('rest and EndScene choices respect safe sides, cancelled orientation presses and single transitions', async ({ browser }) => {
  const viewport = { width: 740, height: 360 };
  const context = await browser.newContext({ viewport, hasTouch: true, isMobile: true });
  const page = await context.newPage(); await open(page, true);
  await insets(page, 59, 0);
  // Real offer/cure, followed by the accepted guide and rest flow.
  await place(page, 2805); await page.keyboard.press('x');
  await page.waitForFunction(() => (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene').zombie.behavior.isCured());
  await place(page, 5700);
  await page.waitForFunction(() => (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene').xolo.behavior.hint === 'ofrenda');
  await portraitRoundTrip(page, viewport);
  await place(page, 6100);
  const dialog = page.getByRole('dialog', { name: 'Rest', exact: true });
  await expect(dialog).toBeVisible();
  await expect(page.locator('.controls')).not.toBeVisible();
  const choicesFit = async () => {
    const game = (await page.locator('#game').boundingBox())!;
    const panel = (await page.locator('.game-choice').boundingBox())!;
    expect(panel.x).toBeGreaterThanOrEqual(game.x + 12);
    expect(panel.x + panel.width).toBeLessThanOrEqual(game.x + game.width - 12);
    for (const b of await page.locator('.game-choice button').all()) expect((await b.boundingBox())!.height).toBeGreaterThanOrEqual(64);
  };
  await choicesFit(); await insets(page, 0, 59); await choicesFit();
  await page.setViewportSize({ width: 568, height: 320 });
  await choicesFit();
  await expect.poll(async () => {
    const world = await layout(page);
    const panel = (await dialog.boundingBox())!;
    return panel.y - world.playerBottom;
  }).toBeGreaterThanOrEqual(4);
  await page.setViewportSize(viewport);
  await page.locator('[data-choice="continue"]').dispatchEvent('pointerdown', { pointerId: 300, pointerType: 'touch' });
  await page.evaluate(() => window.dispatchEvent(new Event('orientationchange')));
  await page.locator('[data-choice="continue"]').dispatchEvent('click', { detail: 1 });
  await expect(dialog).toBeVisible();
  await page.locator('[data-choice="continue"]').dispatchEvent('pointerdown', { pointerId: 301, pointerType: 'touch' });
  await portraitRoundTrip(page, viewport);
  await page.locator('[data-choice="continue"]').dispatchEvent('click', { detail: 1 });
  await expect(dialog).toBeVisible();
  await page.getByRole('button', { name: 'Keep going', exact: true }).tap();
  await expect(dialog).toHaveCount(0);
  await place(page, 6650);
  await page.waitForFunction(() => (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene').finale.flow.phase === 'ENDING');
  await portraitRoundTrip(page, viewport);
  await page.waitForFunction(() => (window as any).__CHUMBALA_GAME__.scene.isActive('EndScene'));
  await choicesFit();
  await page.locator('[data-choice="again"]').dispatchEvent('pointerdown', { pointerId: 302, pointerType: 'touch' });
  await portraitRoundTrip(page, viewport);
  await page.locator('[data-choice="again"]').dispatchEvent('click', { detail: 1 });
  expect(await page.evaluate(() => (window as any).__CHUMBALA_GAME__.scene.isActive('EndScene'))).toBe(true);
  await page.evaluate(() => {
    const game = (window as any).__CHUMBALA_GAME__;
    (window as any).replayCreates = 0;
    game.scene.getScene('Level01Scene').events.on('create', () => (window as any).replayCreates++);
    const button = document.querySelector<HTMLButtonElement>('[data-choice="again"]')!;
    button.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 303, bubbles: true }));
    button.click(); button.click();
  });
  await expect(page.locator('.hud')).toHaveCount(1); await expect(page.locator('.controls')).toHaveCount(1);
  expect(await page.evaluate(() => (window as any).replayCreates)).toBe(1);
  await context.close();
});

test('real touch supports both movement directions with JUMP/GIVE and independent release order', async ({ browser }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'Native multiple-touch injection uses CDP; pointer ownership is tested in both engines');
  const context = await browser.newContext({ viewport: { width: 852, height: 393 }, hasTouch: true, isMobile: true });
  const page = await context.newPage(); await open(page, true);
  const session = await context.newCDPSession(page);
  for (const direction of ['left', 'right']) for (const action of ['jump', 'give']) {
    if (direction !== 'left' || action !== 'jump') {
      await page.reload();
      await page.waitForFunction(() => (window as any).__CHUMBALA_GAME__?.scene.isActive('MenuScene'));
      await page.getByRole('button', { name: 'New game', exact: true }).tap();
      await expect(page.locator('.controls')).toBeVisible();
    }
    await place(page, action === 'jump' ? 500 : direction === 'right' ? 2805 : 2995);
    if (action === 'give') await page.evaluate(direction => {
      const s = (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene');
      s.player.body.reset(s.zombie.x + (direction === 'right' ? -95 : 95), 528);
    }, direction);
    await page.waitForFunction(() => (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene').player.grounded);
    const point = async (selector: string, id: number) => {
      const r = (await page.locator(selector).boundingBox())!; return { x: r.x + r.width / 2, y: r.y + r.height / 2, id };
    };
    const a = await point(`[data-action="${direction}"]`, 1), b = await point(`[data-action="${action}"]`, 2);
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [a] });
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [a, b] });
    if (action === 'jump') {
      await page.waitForFunction(() => (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene').player.body.velocity.y < -100);
      // In this CDP path a nonempty touchEnd names the finger being ended.
      await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [b] });
      await expect(page.locator(`[data-action="${direction}"]`)).toHaveClass(/held/);
      expect(await page.evaluate(() => (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene').player.body.velocity.x)).toBe(direction === 'right' ? 240 : -240);
    } else {
      await page.waitForFunction(() => (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene').give.rules.busy);
      await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [a] });
      await expect(page.locator('[data-action="give"]')).toHaveClass(/held/);
      await page.waitForFunction(() => (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene').player.body.velocity.x === 0);
    }
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await expect(page.locator('.control.held')).toHaveCount(0);
    if (action === 'give') await page.waitForFunction(() => (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene').zombie.behavior.isCured());
  }
  await context.close();
});
