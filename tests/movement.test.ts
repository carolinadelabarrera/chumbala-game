import test from 'node:test';
import assert from 'node:assert/strict';
import { JumpTiming } from '../src/systems/JumpTiming.ts';

test('ground jump consumes the request and cannot become a double jump', () => {
  const timing = new JumpTiming(150, 150);
  assert.equal(timing.update(0, true, true), true);
  assert.equal(timing.update(16, true, true), false);
  assert.equal(timing.update(32, false, true), false);
  assert.equal(timing.update(500, false, false), false);
});

test('coyote jump works inside the window and expires outside it', () => {
  for (const [delay, expected] of [[150, true], [151, false]] as const) {
    const timing = new JumpTiming(150, 150);
    timing.update(1000, true, false);
    assert.equal(timing.update(1000 + delay, false, true), expected);
  }
});

test('a press before landing is buffered, consumed once, and expires', () => {
  for (const [delay, expected] of [[150, true], [151, false]] as const) {
    const timing = new JumpTiming(150, 150);
    assert.equal(timing.update(1000, false, true), false);
    assert.equal(timing.update(1000 + delay, true, false), expected);
    assert.equal(timing.update(1168, false, false), false);
  }
});

test('reset drops queued input and grounded history', () => {
  const timing = new JumpTiming(150, 150);
  timing.update(0, true, false);
  timing.update(16, false, true);
  timing.reset();
  assert.equal(timing.update(32, false, true), false);
});
