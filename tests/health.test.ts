import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { HealthSystem } from '../src/systems/HealthSystem.ts';
import { TUNING } from '../src/config/tuning.ts';

test('health starts at tuning maximum, damages, clamps, heals and resets', () => {
  const health = new HealthSystem();
  assert.equal(health.getHearts(), TUNING.player.maxHearts);
  health.damage(1);
  assert.equal(health.getHearts(), 2);
  health.damage(100);
  assert.equal(health.getHearts(), 0);
  health.heal(1);
  assert.equal(health.getHearts(), 1);
  health.heal(100);
  assert.equal(health.getHearts(), TUNING.player.maxHearts);
  health.damage(2);
  health.reset();
  assert.equal(health.getHearts(), TUNING.player.maxHearts);
});

test('invalid amounts cannot corrupt health or reverse damage/heal', () => {
  const health = new HealthSystem();
  health.damage(1);
  for (const amount of [-1, NaN, Infinity, -Infinity]) {
    health.damage(amount);
    health.heal(amount);
    assert.equal(health.getHearts(), 2);
  }
  health.damage(1.8);
  assert.equal(health.getHearts(), 1);
});

test('only actual changes emit health state; listeners can unsubscribe', () => {
  const events = new EventEmitter();
  const values: number[] = [];
  const listener = (value: number) => values.push(value);
  events.on('health:changed', listener);
  const health = new HealthSystem(events);
  health.heal(1);
  health.damage(1);
  health.damage(100);
  health.damage(1);
  health.reset();
  assert.deepEqual(values, [2, 0, 3]);
  events.off('health:changed', listener);
  health.damage(1);
  assert.deepEqual(values, [2, 0, 3]);
});
