import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { GiveSystem } from '../src/systems/GiveSystem.ts';
import { ZombieBehavior } from '../src/systems/ZombieBehavior.ts';
import { TUNING } from '../src/config/tuning.ts';
import { LEVEL01 } from '../src/level/level01Layout.ts';

const duration = TUNING.give.offerDurationMs + TUNING.give.transferDurationMs
  + TUNING.zombie.eatDurationMs + TUNING.zombie.cureDurationMs;

test('GIVE rejects disabled, unavailable player, and out-of-range requests', () => {
  const give = new GiveSystem();
  const zombie = new ZombieBehavior(LEVEL01.zombie);
  assert.equal(give.tryGive(0, 0, 0, 100, 0, zombie, true), false);
  give.enable();
  assert.equal(give.tryGive(0, 0, 0, 100, 0, zombie, false), false);
  assert.equal(give.tryGive(0, 0, 0, TUNING.zombie.giveRange + 1, 0, zombie, true), false);
  assert.equal(give.tryGive(0, 0, 0, 100, 100, zombie, true), false);
  assert.equal(zombie.state, 'WANDER');
  assert.equal(give.busy, false);
});

test('forgiving inclusive range works from both sides and immediately disables damage', () => {
  for (const side of [-1, 1]) {
    const give = new GiveSystem();
    const zombie = new ZombieBehavior(LEVEL01.zombie);
    give.enable();
    assert.equal(give.tryGive(0, side * TUNING.zombie.giveRange, 0, 0, 0, zombie, true), true);
    assert.equal(zombie.state, 'RECEIVING_PAN');
    assert.equal(zombie.facing, side);
    assert.equal(zombie.canDamage(), false);
    assert.equal(zombie.update(1, 0, 100), 0);
  }
});

test('receive, eat, cure, celebrate occur in order and emit completion exactly once', () => {
  const events = new EventEmitter();
  const recorded: string[] = [];
  for (const name of ['give:enabled', 'give:started', 'zombie:cured', 'give:completed']) events.on(name, () => recorded.push(name));
  const give = new GiveSystem(events);
  const zombie = new ZombieBehavior(LEVEL01.zombie);
  give.enable(); give.enable();
  give.tryGive(100, 0, 0, 100, 0, zombie, true);
  const received = TUNING.give.offerDurationMs + TUNING.give.transferDurationMs;
  give.update(100 + received - 1);
  assert.equal(zombie.state, 'RECEIVING_PAN');
  give.update(100 + received);
  assert.equal(zombie.state, 'EATING');
  give.update(100 + received + TUNING.zombie.eatDurationMs);
  assert.equal(zombie.state, 'CURING');
  give.update(100 + duration);
  assert.equal(zombie.state, 'CELEBRATE');
  assert.equal(zombie.isCured(), true);
  assert.equal(give.busy, false);
  give.update(10000);
  assert.deepEqual(recorded, ['give:enabled', 'give:started', 'zombie:cured', 'give:completed']);
});

test('repeat inputs cannot restart giving or cure the same zombie twice', () => {
  const give = new GiveSystem();
  const zombie = new ZombieBehavior(LEVEL01.zombie);
  give.enable();
  give.tryGive(0, 0, 0, 100, 0, zombie, true);
  assert.equal(give.tryGive(10, 0, 0, 100, 0, zombie, true), false);
  give.update(duration);
  assert.equal(give.tryGive(duration + TUNING.give.cooldownMs, 0, 0, 100, 0, zombie, true), false);
  zombie.pauseAfterHit(10000);
  zombie.reset();
  assert.equal(zombie.isCured(), true);
  assert.equal(zombie.canDamage(), false);
  assert.equal(zombie.update(10000, 0, 100), 0);
});

test('cooldown is configurable, supply has no counter, and large time steps complete safely', () => {
  const give = new GiveSystem();
  const first = new ZombieBehavior(LEVEL01.zombie);
  const second = new ZombieBehavior(LEVEL01.zombie);
  give.enable();
  give.tryGive(0, 0, 0, 100, 0, first, true);
  give.update(duration + 100);
  assert.equal(first.isCured(), true);
  assert.equal(give.tryGive(duration + 100 + TUNING.give.cooldownMs - 1, 0, 0, 100, 0, second, true), false);
  assert.equal(give.tryGive(duration + 100 + TUNING.give.cooldownMs, 0, 0, 100, 0, second, true), true);
});
