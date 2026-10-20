import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { XoloBehavior } from '../src/systems/XoloBehavior.ts';
import { XoloGuide } from '../src/systems/XoloGuide.ts';
import { GiveSystem } from '../src/systems/GiveSystem.ts';
import { ZombieBehavior } from '../src/systems/ZombieBehavior.ts';
import { HealthSystem } from '../src/systems/HealthSystem.ts';
import { CandySystem } from '../src/systems/CandySystem.ts';
import { LEVEL01 } from '../src/level/level01Layout.ts';
import { TUNING } from '../src/config/tuning.ts';

const frame = { playerX: 500, playerY: 528, playerFacing: 1 as const, worldWidth: LEVEL01.width, zombieX: 2900 };
function companion() {
  const events = new EventEmitter();
  const behavior = new XoloBehavior();
  behavior.reset(frame, false);
  const guide = new XoloGuide(events, behavior);
  return { events, behavior, guide };
}

test('starts FOLLOW, waits near preferred distance, follows in either direction and never overshoots', () => {
  const { behavior } = companion();
  assert.equal(behavior.state, 'FOLLOW');
  behavior.update(16, frame);
  assert.equal(behavior.state, 'WAIT');
  behavior.update(100, { ...frame, playerX: 700 });
  assert.equal(behavior.state, 'FOLLOW');
  assert.equal(behavior.x, 410 + TUNING.xolo.followSpeed / 10);
  assert.equal(behavior.facing, 1);
  behavior.update(10000, { ...frame, playerX: 200, playerFacing: -1 });
  assert.equal(behavior.x, 290);
  assert.equal(behavior.facing, -1);
});

test('catch-up and off-screen recovery stay near the player within world bounds', () => {
  const { behavior } = companion();
  behavior.update(100, { ...frame, playerX: 900 });
  assert.equal(behavior.x, 410 + TUNING.xolo.catchUpSpeed / 10);
  behavior.update(16, { ...frame, playerX: 4000 });
  assert.equal(behavior.recovered, true);
  assert.equal(behavior.x, 3910);
  behavior.reset({ ...frame, playerX: 24 });
  assert.equal(behavior.x, TUNING.xolo.worldMargin);
  behavior.reset({ ...frame, playerX: LEVEL01.width - 24, playerFacing: -1 });
  assert.equal(behavior.x, LEVEL01.width - TUNING.xolo.worldMargin);
});

test('hint looks at basket, steps toward zombie, looks back, expires and repeats gently', () => {
  const { behavior } = companion();
  assert.equal(behavior.requestHint('give', frame, 100), true);
  assert.equal(behavior.state, 'HINT');
  assert.equal(behavior.showPan, true);
  behavior.update(TUNING.xolo.hintPauseMs - 1, frame);
  assert.equal(behavior.x, 410);
  assert.equal(behavior.facing, 1);
  behavior.update(1, frame);
  assert.equal(behavior.facing, -1);
  assert.equal(behavior.showBark, true);
  behavior.update(TUNING.xolo.hintPauseMs, frame);
  assert.equal(behavior.facing, 1);
  assert.equal(behavior.showBark, false);
  behavior.update(TUNING.xolo.hintDurationMs, frame);
  assert.notEqual(behavior.state, 'HINT');
  assert.equal(behavior.requestHint('give', frame, 100), false);
  behavior.update(TUNING.xolo.hintRepeatMs, frame);
  assert.equal(behavior.requestHint('give', frame, 100), true);
  assert.ok(behavior.hintEmphasis > 1);
  behavior.update(16, { ...frame, playerX: 800 });
  assert.equal(behavior.hint, undefined, 'walking away releases the invitation');
});

test('hurt and cure events cause short non-combat reactions and return to FOLLOW', () => {
  const { behavior, events, guide } = companion();
  for (const [event, state, duration] of [
    ['player:hurt', 'REACT_HURT', TUNING.xolo.hurtDurationMs],
    ['zombie:cured', 'CELEBRATE', TUNING.xolo.celebrateDurationMs],
  ] as const) {
    events.emit(event);
    assert.equal(behavior.state, state);
    guide.update(100, frame);
    assert.ok(behavior.hop > 0);
    guide.update(duration - 100, frame);
    assert.equal(behavior.state, 'FOLLOW');
    assert.equal(behavior.hop, 0);
  }
  assert.equal('health' in behavior, false);
  assert.equal('attack' in behavior, false);
  guide.destroy();
  events.emit('player:hurt');
  assert.equal(behavior.state, 'FOLLOW', 'scene cleanup removes listeners');
});

test('a lagging companion rejoins the basket glance before indicating an on-screen return direction', () => {
  const { behavior } = companion();
  const teaching = { ...frame, playerX: 3450 };
  behavior.x = 2940;
  behavior.requestHint('give', teaching, 2900);
  // Use real-sized steps, including the exact transition out of the glance.
  for (let i = 0; i < 100; i++) behavior.update(16, teaching);
  assert.equal(behavior.state, 'HINT');
  assert.ok(Math.abs(behavior.x - teaching.playerX) <= 260);
  assert.equal(behavior.facing, -1);
});

test('GIVE enablement triggers guide without changing eligibility; starting GIVE ends hint and cure celebrates', () => {
  const { behavior, events, guide } = companion();
  const give = new GiveSystem(events);
  const zombie = new ZombieBehavior(LEVEL01.zombie);
  const teaching = { ...frame, playerX: 3450 };
  guide.update(16, teaching);
  assert.equal(behavior.hint, undefined);
  events.emit('player:hurt');
  guide.update(TUNING.xolo.hurtDurationMs, teaching);
  assert.equal(behavior.hint, undefined, 'hurt alone cannot enable GIVE or its hint');
  give.enable();
  events.emit('tutorial:giveReady');
  guide.update(16, teaching);
  assert.equal(behavior.hint, 'give');
  assert.equal(give.tryGive(0, 3450, 528, 2900, 520, zombie, true), false);
  assert.equal(give.tryGive(0, 2800, 528, 2900, 520, zombie, false), false);
  assert.equal(give.tryGive(0, 2800, 528, 2900, 520, zombie, true), true);
  assert.equal(behavior.hint, undefined);
  give.update(10000);
  assert.equal(zombie.isCured(), true);
  assert.equal(behavior.state, 'CELEBRATE');
});

test('respawn reset drops stale hints and reaction timers, repositions, and defers new prompts', () => {
  const { guide, behavior, events } = companion();
  events.emit('tutorial:giveReady');
  guide.update(16, { ...frame, playerX: 3450 });
  assert.equal(behavior.hint, 'give');
  guide.reset({ ...frame, playerX: 2350 });
  assert.equal(behavior.state, 'FOLLOW');
  assert.equal(behavior.hint, undefined);
  assert.equal(behavior.x, 2260);
  guide.update(16, { ...frame, playerX: 3450 });
  assert.equal(behavior.hint, undefined);
  events.emit('zombie:cured');
  guide.reset(frame);
  assert.equal(behavior.state, 'FOLLOW');
  assert.equal(behavior.hop, 0);
});

test('secret is gated by cure, reveals once, uses normal candy healing, and can be ignored', () => {
  for (const investigate of [true, false]) {
    const { guide, behavior, events } = companion();
    const secretFrame = { ...frame, playerX: 5100 };
    const pickups: string[] = [];
    events.on('xolo:secretRevealed', () => pickups.push(...LEVEL01.secret.candies.map(candy => candy.id)));
    guide.update(16, secretFrame);
    assert.deepEqual(pickups, []);
    events.emit('zombie:cured');
    guide.update(TUNING.xolo.celebrateDurationMs, secretFrame);
    assert.equal(behavior.hint, 'secret');
    assert.equal(pickups.length, 2);
    const health = new HealthSystem();
    const candy = new CandySystem(health);
    health.damage(1);
    for (let i = 0; i < 4; i++) candy.collect(`normal-${i}`);
    if (investigate) {
      assert.equal(candy.collect(pickups[0]), true);
      assert.equal(health.getHearts(), 3);
      assert.equal(candy.getProgress(), 0);
      assert.equal(candy.collect(pickups[1]), true);
      assert.equal(candy.getProgress(), 1);
      assert.equal(candy.collect(pickups[1]), false);
    }
    guide.update(16, { ...secretFrame, playerX: investigate ? 5300 : 5700, playerY: investigate ? 432 : 528 });
    assert.equal(guide.secretResolved, true);
    assert.equal(behavior.hint, investigate ? undefined : 'ofrenda');
    guide.update(TUNING.xolo.hintRepeatMs, secretFrame);
    assert.equal(pickups.length, 2);
    assert.notEqual(behavior.state, 'HINT');
  }
});
