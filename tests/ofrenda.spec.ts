import { test, expect, type Page } from '@playwright/test';
import { LEVEL01 } from '../src/level/level01Layout';

async function enter(page: Page) {
  await page.goto('/');
  await page.waitForFunction(() => (window as any).__CHUMBALA_GAME__?.scene.isActive('MenuScene'));
  const canvas = (await page.locator('canvas').boundingBox())!;
  await page.touchscreen.tap(canvas.x + canvas.width / 2, canvas.y + canvas.height * 450 / 720);
  await expect(page.locator('.hud')).toHaveCount(1);
}
async function place(page: Page, x: number, y = 528) {
  await page.evaluate(({ x, y }) => {
    const s = (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene');
    s.player.body.reset(x, y);
    s.player.setVelocity(0, 0);
    s.player.clearJumpTiming();
    s.cameras.main.centerOn(x, y);
  }, { x, y });
}
async function cureTutorialZombie(page: Page) {
  await page.evaluate(() => {
    const s = (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene');
    s.player.body.reset(s.zombie.x - 30, 528);
    s.player.setVelocity(0, 0);
  });
  await expect.poll(async () => (await state(page)).health).toBe(2);
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
  await expect.poll(async () => (await state(page)).cured).toBe(true);
}
async function state(page: Page) {
  return page.evaluate(() => {
    const game = (window as any).__CHUMBALA_GAME__;
    const s = game.scene.getScene('Level01Scene');
    return { phase: s.finale.flow.phase, x: s.player.x, y: s.player.y,
      health: s.health.getHearts(), candy: s.candySystem.getProgress(),
      checkpoint: s.checkpoints.getActive().id, visibleCheckpoint: s.checkpoints.checkpoint?.id,
      activated: s.finale.ofrenda.activated, xolo: s.xolo.behavior.state,
      sitting: s.xolo.behavior.sitting, xoloX: s.xolo.x, frame: s.xolo.frame.name,
      endingElapsed: s.finale.flow.endingElapsed, xoloElapsed: s.xolo.behavior.elapsed,
      respawning: s.damage.rules.respawning, paused: s.physics.world?.isPaused ?? false,
      cured: s.zombie.behavior.isCured(), end: game.scene.isActive('EndScene'),
      counts: s.phase6Counts };
  });
}
async function fresh(page: Page) {
  const giveLearned = await page.evaluate(() => JSON.parse(localStorage.getItem('chumbala.save.v1') ?? 'null')?.tutorial.giveLearned ?? false);
  await expect(page.locator('.hud')).toHaveCount(1);
  await expect(page.locator('.controls')).toHaveCount(1);
  await expect(page.locator('.game-choice')).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => {
    const s = (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene');
    return { health: s.health.getHearts(), candy: s.candySystem.getProgress(), zombie: s.zombie.behavior.state,
      give: s.give.rules.enabled, busy: s.give.rules.busy, secret: s.xoloGuide.secretRevealed,
      checkpoint: s.checkpoints.checkpoint ?? null, phase: s.finale.flow.phase,
      candies: s.children.list.filter((o: any) => o.collectibleId && o.active).length,
      xolos: s.children.list.filter((o: any) => o.texture?.key === 'xolo').length,
      zombies: s.children.list.filter((o: any) => o.texture?.key === 'zombie').length,
      paused: s.physics.world.isPaused, hint: s.xolo.behavior.hint ?? null,
      following: ['FOLLOW', 'WAIT'].includes(s.xolo.behavior.state),
      restListeners: s.events.listenerCount('rest:started'), completedListeners: s.events.listenerCount('level:completed') };
  })).toEqual({ health: 3, candy: 0, zombie: 'WANDER', give: giveLearned, busy: false, secret: false,
    checkpoint: null, phase: 'EXPLORING', candies: 3, xolos: 1, zombies: 1,
    paused: false, hint: null, following: true, restListeners: 2, completedListeners: 2 });
  await expect.poll(async () => Math.abs((await state(page)).xoloX - (await state(page)).x)).toBeLessThan(120);
}
async function rotate(page: Page, viewport: { width: number; height: number }, rest = false) {
  await page.setViewportSize({ width: 393, height: 852 });
  await expect(page.locator('#rotate-message')).toBeVisible();
  await page.waitForFunction(() => (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene').physics.world.isPaused);
  const before = await state(page);
  if (rest) {
    await expect(page.getByRole('dialog', { name: 'Rest' })).not.toBeVisible();
    await page.evaluate(() => (document.querySelector('[data-choice="continue"]') as HTMLButtonElement).click());
  }
  await page.waitForTimeout(180);
  const after = await state(page);
  expect([after.x, after.phase, after.endingElapsed, after.xoloElapsed, after.checkpoint])
    .toEqual([before.x, before.phase, before.endingElapsed, before.xoloElapsed, before.checkpoint]);
  await page.setViewportSize(viewport);
  await expect(page.locator('#rotate-message')).not.toBeVisible();
  // The HTML cue can update before Phaser handles the new orientation and clears
  // held actions. Send the next key only after the scene has finished that reset.
  await page.waitForFunction(() => !(window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene').portrait);
}

for (const viewport of [{ width: 1280, height: 720 }, { width: 852, height: 393 }, { width: 740, height: 360 }]) {
  test(`cure to optional-secret bypass, Ofrenda rest, ending and replay at ${viewport.width}`, async ({ browser }, testInfo) => {
    const mobile = viewport.width < 1000;
    const context = await browser.newContext({ viewport, hasTouch: true, isMobile: mobile });
    const page = await context.newPage();
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await enter(page);
    for (const [index, candy] of LEVEL01.candies.entries()) {
      await place(page, candy.x);
      await expect.poll(async () => (await state(page)).candy).toBe(index + 1);
    }
    await page.evaluate(() => {
      const s = (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene');
      s.player.body.reset(s.zombie.x - 35, 528);
    });
    await expect.poll(async () => (await state(page)).health).toBe(2);
    await place(page, 3450);
    await expect(page.locator('[data-action="give"]')).toBeVisible();
    await page.waitForFunction(() => {
      const s = (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene');
      return !s.damage.rules.isKnockedBack(s.gameplayTime);
    });
    await page.evaluate(() => {
      const s = (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene');
      s.player.body.reset(s.zombie.x - 95, 528);
      s.player.setVelocity(0, 0);
    });
    await page.keyboard.press('x');
    await expect.poll(async () => (await state(page)).cured).toBe(true);
    await page.evaluate(() => {
      const s = (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene');
      const candy = s.children.list.find((o: any) => o.collectibleId === 'first-cure-reward');
      s.player.body.reset(candy.x, candy.y);
    });
    await expect.poll(async () => (await state(page)).candy).toBe(4);
    await page.evaluate(() => {
      const s = (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene');
      s.health.damage(1);
      s.phase6Counts = { activation: 0, rest: 0, continuedXolo: '' };
      const activation = () => s.phase6Counts.activation++;
      const rest = () => s.phase6Counts.rest++;
      const continued = () => { s.phase6Counts.continuedXolo = s.xolo.behavior.state; };
      s.events.on('checkpoint:activated', activation);
      s.events.on('rest:started', rest);
      s.events.on('rest:continued', continued);
      s.events.once('shutdown', () => {
        s.events.off('checkpoint:activated', activation);
        s.events.off('rest:started', rest);
        s.events.off('rest:continued', continued);
      });
    });
    // Ignore the optional secret and approach the rest area using ordinary movement.
    await place(page, 5900);
    if (mobile) await rotate(page, viewport);
    await page.keyboard.down('ArrowRight');
    const dialog = page.getByRole('dialog', { name: 'Rest', exact: true });
    await expect(dialog).toBeVisible();
    await page.keyboard.up('ArrowRight');
    await expect.poll(async () => (await state(page)).sitting).toBe(true);
    const rested = await state(page);
    expect(rested).toMatchObject({ phase: 'RESTING', health: 3, candy: 4, checkpoint: 'ofrenda',
      activated: true, xolo: 'SIT_CHECKPOINT', frame: 9, paused: true });
    expect(rested.counts).toMatchObject({ activation: 1, rest: 1 });
    await expect(page.locator('.controls')).not.toBeVisible();
    await page.keyboard.press('Space');
    await page.keyboard.press('x');
    await page.waitForTimeout(200);
    expect((await state(page)).x).toBe(rested.x);
    expect((await state(page)).phase).toBe('RESTING');
    if (mobile) await rotate(page, viewport, true);
    await expect(dialog).toHaveCount(1);
    await expect(dialog).toBeVisible();
    expect((await state(page)).paused).toBe(true);
    const button = (await page.getByRole('button', { name: 'Keep going', exact: true }).boundingBox())!;
    expect(button.height).toBeGreaterThanOrEqual(64);
    expect(button.width).toBeGreaterThan(100);
    const panel = (await dialog.boundingBox())!;
    expect(panel.x).toBeGreaterThanOrEqual(16);
    expect(panel.x + panel.width).toBeLessThanOrEqual(viewport.width - 16);
    const presentation = await page.evaluate(() => {
      const s = (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene');
      const camera = s.cameras.main;
      const canvas = document.querySelector('canvas')!.getBoundingClientRect();
      const ratio = canvas.height / camera.height * camera.zoom;
      const button = document.querySelector('[data-choice="continue"]')!;
      const gesture = new Event('gesturestart', { bubbles: true, cancelable: true });
      button.dispatchEvent(gesture);
      return { xoloBottom: canvas.y + (s.xolo.y + 32 - camera.worldView.y) * ratio,
        altarVisible: camera.worldView.contains(6060, 560) && camera.worldView.contains(6340, 360),
        gesturePrevented: gesture.defaultPrevented };
    });
    expect(presentation.xoloBottom).toBeLessThan(panel.y);
    expect(presentation.altarVisible).toBe(true);
    expect(presentation.gesturePrevented).toBe(true);
    await page.screenshot({ path: testInfo.outputPath('ofrenda-rest.png') });
    if (mobile) await page.getByRole('button', { name: 'Keep going', exact: true }).tap();
    else {
      await page.getByRole('button', { name: 'Keep going', exact: true }).focus();
      await page.keyboard.press('Space');
    }
    await expect(dialog).toHaveCount(0);
    await expect(page.locator('.controls')).toBeVisible();
    expect((await state(page)).counts.continuedXolo).toBe('FOLLOW');
    // Re-entering an activated altar must not open another rest choice or heal again.
    await place(page, 6100);
    await page.waitForTimeout(150);
    expect((await state(page)).counts).toMatchObject({ activation: 1, rest: 1 });
    await expect(dialog).toHaveCount(0);
    await page.keyboard.down('ArrowRight');
    await expect.poll(async () => (await state(page)).phase, { intervals: [10, 25] }).toBe('ENDING');
    await page.keyboard.up('ArrowRight');
    if (mobile) await rotate(page, viewport);
    await page.screenshot({ path: testInfo.outputPath('ending-beat.png') });
    await expect.poll(async () => (await state(page)).end).toBe(true);
    await expect(page.locator('.hud')).toHaveCount(0);
    await expect(page.locator('.controls')).toHaveCount(0);
    await expect(page.locator('.game-choice')).toHaveCount(1);
    await expect(page.getByRole('button', { name: 'Play again', exact: true })).toBeVisible();
    if (mobile) {
      await page.setViewportSize({ width: 393, height: 852 });
      await expect(page.locator('#rotate-message')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Play again', exact: true })).not.toBeVisible();
      await page.evaluate(() => (document.querySelector('[data-choice="again"]') as HTMLButtonElement).click());
      expect((await state(page)).end).toBe(true);
      await page.setViewportSize(viewport);
      await expect(page.getByRole('button', { name: 'Play again', exact: true })).toBeVisible();
      await expect(page.locator('.game-choice')).toHaveCount(1);
    }
    const replayButton = (await page.getByRole('button', { name: 'Play again', exact: true }).boundingBox())!;
    expect(replayButton.height).toBeGreaterThanOrEqual(64);
    expect(replayButton.x).toBeGreaterThanOrEqual(16);
    expect(replayButton.x + replayButton.width).toBeLessThan(viewport.width - 16);
    await page.screenshot({ path: testInfo.outputPath('end-scene.png') });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth && document.documentElement.scrollHeight <= innerHeight)).toBe(true);
    expect(await page.evaluate(() => visualViewport!.scale)).toBe(1);
    await page.getByRole('button', { name: 'Play again', exact: true }).tap();
    await fresh(page);
    expect(errors).toEqual([]);
    await context.close();
  });
}

test('injected Ofrenda checkpoint exercises shared zero-health recovery without bypassing the cure gate', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 852, height: 393 }, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await enter(page);
  await place(page, 2080);
  await expect.poll(async () => (await state(page)).candy).toBe(1);
  // The mandatory cure removes the only hazard before real Ofrenda activation.
  // Inject checkpoint ownership to retain live DamageController integration coverage.
  await page.evaluate(point => {
    (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene').checkpoints.activate(point);
  }, LEVEL01.ofrenda.checkpoint);
  await page.evaluate(() => {
    const s = (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene');
    s.health.damage(2);
    s.player.body.reset(s.zombie.x - 35, 528);
  });
  await expect.poll(async () => (await state(page)).respawning, { intervals: [10] }).toBe(true);
  await expect.poll(async () => (await state(page)).respawning).toBe(false);
  await expect.poll(async () => (await state(page)).x).toBe(LEVEL01.ofrenda.checkpoint.x);
  const recovered = await state(page);
  expect(recovered.health).toBe(3);
  expect(recovered.candy).toBe(1);
  expect(recovered.checkpoint).toBe('ofrenda');
  expect(Math.abs(recovered.xoloX - recovered.x)).toBeLessThan(120);
  expect(recovered.xolo).not.toBe('SIT_CHECKPOINT');
  await expect(page.getByRole('dialog', { name: 'Rest', exact: true })).toHaveCount(0);
  await expect(page.locator('.controls')).toBeVisible();
  expect(errors).toEqual([]);
  await context.close();
});

test('STOP HERE, repeated PLAY AGAIN, and MENU clean up DOM and event ownership', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 852, height: 393 }, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await enter(page);
  for (let cycle = 0; cycle < 3; cycle++) {
    await fresh(page);
    await page.keyboard.down('ArrowRight');
    await expect.poll(async () => (await state(page)).x).toBeGreaterThan(190);
    await page.keyboard.up('ArrowRight');
    await page.keyboard.press('Space');
    await expect.poll(() => page.evaluate(() => (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene').player.body.velocity.y),
      { intervals: [10] }).toBeLessThan(-100);
    await page.waitForFunction(() => (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene').player.grounded);
    await cureTutorialZombie(page);
    await place(page, 6100);
    await expect(page.getByRole('dialog', { name: 'Rest', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Stop here', exact: true }).tap();
    await expect.poll(async () => (await state(page)).end).toBe(true);
    await expect(page.locator('.hud')).toHaveCount(0);
    await expect(page.locator('.controls')).toHaveCount(0);
    await expect(page.locator('.game-choice')).toHaveCount(1);
    if (cycle < 2) await page.getByRole('button', { name: 'Play again', exact: true }).tap();
    else await page.getByRole('button', { name: 'Menu', exact: true }).tap();
  }
  await page.waitForFunction(() => (window as any).__CHUMBALA_GAME__.scene.isActive('MenuScene'));
  await expect(page.locator('[data-mode="end"]')).toHaveCount(0);
  await page.getByRole('button', { name: 'New game', exact: true }).tap();
  await fresh(page);
  expect(errors).toEqual([]);
  await context.close();
});

for (const viewport of [{ width: 1280, height: 720 }, { width: 740, height: 360 }]) {
  test(`clean jump evasion in both directions and genuine contact at ${viewport.width}`, async ({ browser }) => {
    const context = await browser.newContext({ viewport, hasTouch: true, isMobile: viewport.width < 1000 });
    const page = await context.newPage();
    await enter(page);
    for (const direction of [1, -1]) {
      await page.evaluate(direction => {
        const s = (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene');
        s.zombie.resetEncounter();
        // Take off near the hazard; an early jump that lands on it is contact.
        s.player.body.reset(s.zombie.x - direction * 90, 528);
        s.player.setVelocity(0, 0); s.player.clearJumpTiming();
        s.cameras.main.centerOn(s.player.x, s.player.y);
        s.cleanCrossing = false;
        s.jumpHits = [];
        const hit = () => s.jumpHits.push({ x: s.player.x, y: s.player.y, vy: s.player.body.velocity.y,
          zombieX: s.zombie.x, playerBottom: s.player.body.bottom, zombieTop: s.zombie.body.top });
        s.events.on('player:hurt', hit);
        const inspect = () => {
          const p = s.player.body, z = s.zombie.body;
          if (p.right > z.left && p.left < z.right && p.bottom < z.top) s.cleanCrossing = true;
        };
        s.events.on('postupdate', inspect);
        s.events.once('shutdown', () => { s.events.off('postupdate', inspect); s.events.off('player:hurt', hit); });
      }, direction);
      await page.waitForFunction(() => (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene').player.grounded);
      const key = direction === 1 ? 'ArrowRight' : 'ArrowLeft';
      await page.keyboard.down(key);
      await page.keyboard.press('Space');
      await page.waitForFunction(direction => {
        const s = (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene');
        return (s.player.x - s.zombie.x) * direction > 85 && s.player.grounded;
      }, direction);
      await page.keyboard.up(key);
      expect((await state(page)).health, JSON.stringify(await page.evaluate(() => (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene').jumpHits))).toBe(3);
      expect(await page.evaluate(() => (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene').cleanCrossing)).toBe(true);
    }
    await page.evaluate(() => {
      const s = (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene');
      s.player.body.reset(s.zombie.x - 30, 528);
    });
    await expect.poll(async () => (await state(page)).health).toBe(2);
    await context.close();
  });
}

test('Level01 cure gate blocks bypass, opens on cure, and Xolo guides before Ofrenda activation', async ({ browser }, testInfo) => {
  const viewport = { width: 740, height: 360 };
  const context = await browser.newContext({ viewport, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await enter(page);
  // Defense in depth: even a staged position beyond the physical gate cannot rest.
  await place(page, 6100);
  await page.waitForTimeout(200);
  expect((await state(page)).phase).toBe('EXPLORING');
  expect((await state(page)).activated).toBe(false);
  await expect(page.locator('.game-choice')).toHaveCount(0);
  await place(page, LEVEL01.cureGate.x - 90);
  await page.waitForFunction(() => (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene').player.grounded);
  await page.keyboard.down('ArrowRight');
  await page.keyboard.press('Space');
  await page.waitForFunction(() => (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene').player.body.velocity.y < -100);
  await page.waitForFunction(() => (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene').player.grounded);
  await page.keyboard.up('ArrowRight');
  expect((await state(page)).x).toBeLessThan(LEVEL01.cureGate.x - LEVEL01.cureGate.width / 2);
  await page.screenshot({ path: testInfo.outputPath('tutorial-cure-gate.png') });
  await cureTutorialZombie(page);
  expect(await page.evaluate(() => (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene').progression.canReachRest)).toBe(true);
  await place(page, LEVEL01.cureGate.x - 90);
  await page.keyboard.down('ArrowRight');
  await expect.poll(async () => (await state(page)).x).toBeGreaterThan(LEVEL01.cureGate.x + 90);
  await page.keyboard.up('ArrowRight');
  await place(page, 5700);
  await expect.poll(() => page.evaluate(() => (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene').xolo.behavior.hint)).toBe('ofrenda');
  await expect.poll(async () => (await state(page)).xoloX - (await state(page)).x).toBeGreaterThan(100);
  await rotate(page, viewport);
  await page.screenshot({ path: testInfo.outputPath('xolo-leads-to-ofrenda.png') });
  await place(page, 5900);
  await expect.poll(async () => (await state(page)).sitting).toBe(true);
  expect((await state(page)).activated).toBe(false);
  await expect(page.locator('.game-choice')).toHaveCount(0);
  await page.keyboard.down('ArrowRight');
  await expect(page.getByRole('dialog', { name: 'Rest', exact: true })).toBeVisible();
  await page.keyboard.up('ArrowRight');
  expect((await state(page)).xolo).toBe('SIT_CHECKPOINT');
  expect(errors).toEqual([]);
  await context.close();
});

test('live zombie chases and its physics leash contains both encounter edges', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 852, height: 393 }, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  await enter(page);
  for (const direction of [-1, 1]) {
    await page.evaluate(direction => {
      const s = (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene');
      s.zombie.resetEncounter();
      s.player.body.reset(s.zombie.x + direction * 220, 528);
      s.player.setVelocity(0, 0);
    }, direction);
    await expect.poll(() => page.evaluate(() => (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene').zombie.behavior.state)).toBe('CHASE');
    await expect.poll(() => page.evaluate(({ direction, spawnX }) => {
      const s = (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene');
      return (s.zombie.x - spawnX) * direction;
    }, { direction, spawnX: LEVEL01.zombie.x })).toBeGreaterThan(10);
    const edge = direction < 0 ? LEVEL01.zombie.encounterLeft : LEVEL01.zombie.encounterRight;
    await page.evaluate(({ direction, edge }) => {
      const s = (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene');
      s.zombie.body.reset(edge, 520);
      s.zombie.setVelocityX(direction * 1000);
      s.player.body.reset(direction < 0 ? 2350 : 6100, 528);
    }, { direction, edge });
    await page.waitForTimeout(250);
    const x = await page.evaluate(() => (window as any).__CHUMBALA_GAME__.scene.getScene('Level01Scene').zombie.x);
    expect(x).toBeGreaterThanOrEqual(LEVEL01.zombie.encounterLeft);
    expect(x).toBeLessThanOrEqual(LEVEL01.zombie.encounterRight);
    expect((await state(page)).activated).toBe(false);
  }
  await context.close();
});
