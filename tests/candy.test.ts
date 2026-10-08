import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { HealthSystem } from '../src/systems/HealthSystem.ts';
import { CandySystem } from '../src/systems/CandySystem.ts';
import { TUNING } from '../src/config/tuning.ts';

test('progress increments, duplicate IDs do nothing, and pickup emits immediately', () => {
  const events = new EventEmitter();
  const values: number[] = [];
  events.on('candy:collected', value => values.push(value));
  const candy = new CandySystem(new HealthSystem(), events);
  assert.equal(candy.getProgress(), 0);
  assert.equal(candy.collect('one'), true);
  assert.equal(candy.collect('one'), false);
  assert.equal(candy.collect('two'), true);
  assert.equal(candy.getProgress(), 2);
  assert.deepEqual(values, [1, 2]);
});

test('default tuning threshold heals exactly one missing heart and resets progress', () => {
  const health = new HealthSystem();
  const candy = new CandySystem(health);
  health.damage(2);
  assert.equal(candy.piecesPerHeart, TUNING.candy.piecesPerHeart);
  for (let i = 0; i < candy.piecesPerHeart - 1; i++) candy.collect(`first-${i}`);
  assert.equal(health.getHearts(), 1);
  candy.collect('threshold');
  assert.equal(health.getHearts(), 2);
  assert.equal(candy.getProgress(), 0);
  assert.equal(candy.collect('threshold'), false);
  assert.equal(health.getHearts(), 2);
});

test('full health caps at threshold minus one, then next pickup heals after damage', () => {
  const health = new HealthSystem();
  const candy = new CandySystem(health);
  for (let i = 0; i < 20; i++) candy.collect(`full-${i}`);
  assert.equal(candy.getProgress(), candy.piecesPerHeart - 1);
  assert.equal(health.getHearts(), health.maxHearts);
  health.damage(1);
  assert.equal(health.getHearts(), health.maxHearts - 1);
  candy.collect('after-damage');
  assert.equal(health.getHearts(), health.maxHearts);
  assert.equal(candy.getProgress(), 0);
  candy.collect('next');
  assert.equal(candy.getProgress(), 1);
});

test('configurable threshold controls healing, including threshold one', () => {
  for (const threshold of [1, 2, 7]) {
    const health = new HealthSystem();
    const candy = new CandySystem(health, undefined, threshold);
    health.damage(1);
    for (let i = 0; i < threshold; i++) candy.collect(`${i}`);
    assert.equal(health.getHearts(), health.maxHearts);
    assert.equal(candy.getProgress(), 0);
    candy.collect('full');
    assert.equal(candy.getProgress(), Math.min(1, threshold - 1));
  }
});

test('reject invalid system configuration', () => {
  for (const value of [0, -1, 1.5, NaN, Infinity]) {
    assert.throws(() => new HealthSystem(undefined, value), RangeError);
    assert.throws(() => new CandySystem(new HealthSystem(), undefined, value), RangeError);
  }
});
