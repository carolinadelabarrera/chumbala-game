import test from 'node:test';
import assert from 'node:assert/strict';
import { SafePointSystem } from '../src/systems/SafePointSystem.ts';
import { LEVEL01 } from '../src/level/level01Layout.ts';

test('starts at spawn; anchors activate only after grounded progress and never regress', () => {
  const safe = new SafePointSystem(LEVEL01.safePoints);
  assert.equal(safe.getActive().id, 'start');
  safe.update(1300, false);
  assert.equal(safe.getActive().id, 'start');
  safe.update(1300, true);
  assert.equal(safe.getActive().id, 'postJump');
  safe.update(2350, false);
  assert.equal(safe.getActive().id, 'postJump');
  safe.update(2350, true);
  assert.equal(safe.getActive().id, 'preZombie');
  safe.update(160, true);
  assert.equal(safe.getActive().id, 'preZombie');
});

test('grounded progress can advance multiple anchors; empty lists are rejected', () => {
  const safe = new SafePointSystem(LEVEL01.safePoints);
  safe.update(3000, true);
  assert.equal(safe.getActive().id, 'preZombie');
  assert.throws(() => new SafePointSystem([]));
});
