import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { CheckpointSystem } from '../src/systems/CheckpointSystem.ts';
import { RestSystem } from '../src/systems/RestSystem.ts';
import { SafePointSystem } from '../src/systems/SafePointSystem.ts';
import { HealthSystem } from '../src/systems/HealthSystem.ts';
import { CandySystem } from '../src/systems/CandySystem.ts';
import { DamageSystem } from '../src/systems/DamageSystem.ts';
import { XoloBehavior } from '../src/systems/XoloBehavior.ts';
import { XoloGuide } from '../src/systems/XoloGuide.ts';
import { LEVEL01 } from '../src/level/level01Layout.ts';
import { TUNING } from '../src/config/tuning.ts';

function setup() {
  const events = new EventEmitter();
  const health = new HealthSystem(events);
  const candy = new CandySystem(health, events);
  const safe = new SafePointSystem(LEVEL01.safePoints);
  const checkpoints = new CheckpointSystem(safe, health, events);
  const rest = new RestSystem(checkpoints, LEVEL01.ofrenda.checkpoint, events);
  return { events, health, candy, safe, checkpoints, rest };
}

test('invisible SafePoints are the fallback until a visible checkpoint takes ownership', () => {
  const { safe, checkpoints } = setup();
  assert.equal(checkpoints.getActive().id, 'start');
  safe.update(1300, true);
  assert.equal(checkpoints.getActive().id, 'postJump');
  checkpoints.activate(LEVEL01.ofrenda.checkpoint);
  safe.update(7000, true);
  assert.equal(safe.getActive().id, 'preZombie');
  assert.deepEqual(checkpoints.getActive(), LEVEL01.ofrenda.checkpoint);
});

test('Ofrenda activation heals once, preserves candy, and is safe against reentrant listeners', () => {
  const { events, health, candy, checkpoints, rest } = setup();
  health.damage(2);
  candy.collect('one'); candy.collect('two');
  const counts = { checkpoint: 0, ofrenda: 0, rest: 0 };
  events.on('health:changed', () => assert.equal(rest.activate(), false));
  events.on('checkpoint:activated', () => { counts.checkpoint++; });
  events.on('ofrenda:activated', () => { counts.ofrenda++; });
  events.on('rest:started', () => { counts.rest++; });
  assert.equal(rest.activate(), true);
  assert.equal(health.getHearts(), 3);
  assert.equal(candy.getProgress(), 2);
  assert.equal(candy.collect('one'), false);
  for (let i = 0; i < 5; i++) {
    assert.equal(rest.activate(), false);
    assert.equal(checkpoints.activate(LEVEL01.ofrenda.checkpoint), false);
  }
  assert.deepEqual(counts, { checkpoint: 1, ofrenda: 1, rest: 1 });
});

test('rest never auto-advances, continuing requires a choice, and completion emits once', () => {
  const { rest, events } = setup();
  let completed = 0;
  events.on('level:completed', () => completed++);
  assert.equal(rest.continue(), false);
  assert.equal(rest.stop(), false);
  assert.equal(rest.beginEnding(), false);
  rest.activate();
  rest.update(100000);
  assert.equal(rest.phase, 'RESTING');
  assert.equal(rest.blocksGameplay, true);
  assert.equal(rest.beginEnding(), false);
  assert.equal(rest.continue(), true);
  assert.equal(rest.continue(), false);
  assert.equal(rest.phase, 'CONTINUED');
  assert.equal(rest.blocksGameplay, false);
  assert.equal(rest.activate(), false);
  rest.update(100000);
  assert.equal(completed, 0, 'the player still needs to reach the ending area');
  assert.equal(rest.beginEnding(), true);
  assert.equal(rest.beginEnding(), false);
  rest.update(TUNING.finale.endingDurationMs - 1);
  assert.equal(completed, 0);
  rest.update(1);
  rest.update(100000);
  assert.equal(completed, 1);
  assert.equal(rest.phase, 'FINISHED');
});

test('STOP HERE is a one-time graceful exit, not level failure or automatic completion', () => {
  const { rest, checkpoints, events } = setup();
  const recorded: string[] = [];
  events.on('rest:stopped', () => recorded.push('stopped'));
  events.on('level:completed', () => recorded.push('completed'));
  rest.activate();
  assert.equal(rest.stop(), true);
  assert.equal(rest.stop(), false);
  assert.equal(rest.continue(), false);
  rest.update(100000);
  assert.deepEqual(recorded, ['stopped']);
  assert.equal(checkpoints.getActive().id, 'ofrenda');
});

test('soft damage recovery retains checkpoint ownership and candy state', () => {
  const { health, candy, checkpoints, rest } = setup();
  candy.collect('kept');
  rest.activate(); rest.continue();
  const damage = new DamageSystem(health);
  for (const now of [100, 1500, 2900]) {
    damage.contact(false, now, 0, 50);
    damage.contact(true, now, 0, 50);
  }
  assert.equal(damage.respawning, true);
  assert.deepEqual(checkpoints.getActive(), LEVEL01.ofrenda.checkpoint);
  damage.completeRespawn(4000);
  assert.equal(health.getHearts(), 3);
  assert.equal(candy.getProgress(), 1);
  assert.equal(rest.activate(), false);
});

test('Xolo approaches and sits through rest, resumes FOLLOW, and clears old hints on respawn', () => {
  const { rest, events } = setup();
  const behavior = new XoloBehavior();
  const guide = new XoloGuide(events, behavior);
  const frame = { playerX: 6000, playerY: 528, playerFacing: 1 as const, zombieX: 2900, worldWidth: LEVEL01.width };
  behavior.reset(frame, false);
  behavior.requestHint('give', frame, 2900);
  rest.activate();
  assert.equal(behavior.state, 'SIT_CHECKPOINT');
  assert.equal(behavior.hint, undefined);
  assert.equal(behavior.requestHint('secret', frame, 6200), false);
  guide.update(1000, frame);
  assert.equal(behavior.sitting, true);
  const restingX = behavior.x;
  guide.update(10000, { ...frame, playerX: 5950, playerFacing: -1 });
  assert.equal(behavior.state, 'SIT_CHECKPOINT');
  assert.equal(behavior.x, restingX, 'rest does not revert to following the player');
  rest.continue();
  assert.equal(behavior.state, 'FOLLOW');
  guide.reset(frame);
  guide.update(10000, frame);
  assert.equal(behavior.hint, undefined);
  assert.equal(Math.abs(behavior.x - frame.playerX) <= TUNING.xolo.followDistance + TUNING.xolo.stopTolerance, true);
  guide.destroy();
  assert.equal(events.listenerCount('rest:started'), 0);
  assert.equal(events.listenerCount('rest:continued'), 0);
});

test('a new run creates fresh checkpoint and rest state', () => {
  const first = setup();
  first.rest.activate(); first.rest.stop();
  const second = setup();
  assert.equal(second.checkpoints.checkpoint, undefined);
  assert.equal(second.checkpoints.getActive().id, 'start');
  assert.equal(second.rest.phase, 'EXPLORING');
});
