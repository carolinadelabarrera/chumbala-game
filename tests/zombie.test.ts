import test from 'node:test';
import assert from 'node:assert/strict';
import { ZombieBehavior } from '../src/systems/ZombieBehavior.ts';
import { TUNING } from '../src/config/tuning.ts';
import { LEVEL01 } from '../src/level/level01Layout.ts';

test('patrol reverses at both ends and stays slower than player', () => {
  const zombie = new ZombieBehavior(LEVEL01.zombie);
  assert.equal(zombie.update(0, 2900, 0), -TUNING.zombie.wanderSpeed);
  assert.equal(zombie.update(1, LEVEL01.zombie.patrolLeft, 0), TUNING.zombie.wanderSpeed);
  assert.equal(zombie.update(2, LEVEL01.zombie.patrolRight, 0), -TUNING.zombie.wanderSpeed);
  assert.ok(TUNING.zombie.wanderSpeed < TUNING.player.moveSpeed);
  assert.ok(TUNING.zombie.chaseSpeed < TUNING.player.moveSpeed);
});

test('notice pauses and faces player before chase; lost targets return to wander', () => {
  const zombie = new ZombieBehavior(LEVEL01.zombie);
  assert.equal(zombie.update(100, 2900, 2750), 0);
  assert.equal(zombie.state, 'NOTICE_PLAYER');
  assert.equal(zombie.facing, -1);
  assert.equal(zombie.update(100 + TUNING.zombie.noticeDurationMs - 1, 2900, 2750), 0);
  assert.equal(zombie.update(100 + TUNING.zombie.noticeDurationMs, 2900, 2750), -TUNING.zombie.chaseSpeed);
  assert.equal(zombie.state, 'CHASE');
  assert.equal(zombie.update(500, 2900, 3050), TUNING.zombie.chaseSpeed);
  zombie.update(600, 2900, 0);
  assert.equal(zombie.state, 'WANDER');
});

test('post-hit pause lasts configured duration, then resumes without stacking damage behavior', () => {
  const zombie = new ZombieBehavior(LEVEL01.zombie);
  zombie.pauseAfterHit(100);
  assert.equal(zombie.state, 'POST_HIT_PAUSE');
  assert.equal(zombie.update(100 + TUNING.zombie.postHitPauseMs - 1, 2900, 2900), 0);
  zombie.update(100 + TUNING.zombie.postHitPauseMs, 2900, 0);
  assert.equal(zombie.state, 'WANDER');
});

test('safe approach is outside chase territory and reset restores wandering', () => {
  const zombie = new ZombieBehavior(LEVEL01.zombie);
  zombie.update(0, 2600, 2350);
  assert.equal(zombie.state, 'WANDER');
  assert.equal(zombie.update(100, 2600, 2600), 0);
  zombie.pauseAfterHit(200);
  zombie.reset();
  assert.equal(zombie.state, 'WANDER');
  assert.equal(zombie.update(201, 2900, 0), -TUNING.zombie.wanderSpeed);
});
