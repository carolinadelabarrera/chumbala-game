import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { GiveSystem } from '../src/systems/GiveSystem.ts';
import { GiveTutorial } from '../src/systems/GiveTutorial.ts';
import { Level01Progression } from '../src/systems/Level01Progression.ts';
import { ZombieBehavior } from '../src/systems/ZombieBehavior.ts';
import { XoloBehavior } from '../src/systems/XoloBehavior.ts';
import { XoloGuide } from '../src/systems/XoloGuide.ts';
import { LEVEL01 } from '../src/level/level01Layout.ts';
import { TUNING } from '../src/config/tuning.ts';

test('Level01 teaches GIVE after damage AND region entry; capability stays independent', () => {
  const events = new EventEmitter();
  const give = new GiveSystem(events);
  const tutorial = new GiveTutorial(give, events, { alreadyLearned: false, region: LEVEL01.giveTeaching });
  let hints = 0;
  events.on('tutorial:giveReady', () => hints++);
  tutorial.update(3450);
  assert.equal(give.enabled, false);
  events.emit('player:hurt');
  tutorial.update(3200);
  assert.equal(give.enabled, false);
  tutorial.update(3450); tutorial.update(3450);
  assert.equal(give.enabled, true);
  assert.equal(tutorial.prompting, true);
  assert.equal(hints, 1);
  assert.equal(give.tryGive(0, 2800, 528, 2900, 520, new ZombieBehavior(LEVEL01.zombie), true), true);
  assert.equal(tutorial.learned, true);
  assert.equal(tutorial.prompting, false);
  tutorial.destroy();
  assert.equal(events.listenerCount('player:hurt'), 0);
});

test('already learned GIVE is available without damage, region, or tutorial hint', () => {
  const events = new EventEmitter();
  const give = new GiveSystem(events);
  let hints = 0;
  events.on('tutorial:giveReady', () => hints++);
  const tutorial = new GiveTutorial(give, events, { alreadyLearned: true });
  tutorial.update(0);
  assert.equal(give.enabled, true);
  assert.equal(tutorial.prompting, false);
  assert.equal(events.listenerCount('player:hurt'), 0);
  assert.equal(hints, 0);
  assert.equal(give.tryGive(0, 2800, 528, 2900, 520, new ZombieBehavior(LEVEL01.zombie), true), true);
  tutorial.destroy();
});

test('only the Level01 cure event opens progression; replay and subscriptions are clean', () => {
  const events = new EventEmitter();
  const progress = new Level01Progression(events);
  for (const event of ['player:hurt', 'give:enabled', 'give:started']) events.emit(event);
  assert.equal(progress.canReachRest, false);
  events.emit('zombie:cured'); events.emit('zombie:cured');
  assert.equal(progress.canReachRest, true);
  progress.destroy();
  assert.equal(events.listenerCount('zombie:cured'), 0);
  const replay = new Level01Progression(events);
  assert.equal(replay.canReachRest, false);
  replay.destroy();
});

test('CHASE retains a noticed player beyond detection, but ends outside either encounter edge', () => {
  for (const direction of [-1, 1]) {
    const zombie = new ZombieBehavior(LEVEL01.zombie);
    zombie.update(0, 2900, 2900 + direction * 200);
    assert.equal(zombie.update(300, 2900, 2900 + direction * 200), direction * TUNING.zombie.chaseSpeed);
    assert.equal(zombie.update(400, 2900, 2900 + direction * 300), direction * TUNING.zombie.chaseSpeed);
    const edge = direction < 0 ? LEVEL01.zombie.encounterLeft : LEVEL01.zombie.encounterRight;
    assert.equal(zombie.update(500, edge, edge), 0);
    zombie.update(600, edge, edge + direction);
    assert.equal(zombie.state, 'WANDER');
    assert.ok(TUNING.zombie.chaseSpeed < TUNING.player.moveSpeed);
  }
});

test('Xolo leads, waits and looks back, then settles before the player activates the Ofrenda', () => {
  const events = new EventEmitter();
  const behavior = new XoloBehavior();
  const guide = new XoloGuide(events, behavior);
  const frame = { playerX: 5700, playerY: 528, playerFacing: 1 as const, zombieX: 2900, worldWidth: LEVEL01.width };
  behavior.reset(frame, false);
  guide.update(16, frame);
  assert.equal(behavior.hint, undefined, 'no guide before cure');
  events.emit('zombie:cured');
  guide.update(TUNING.xolo.celebrateDurationMs, frame);
  assert.equal(behavior.hint, 'ofrenda');
  for (let i = 0; i < 200; i++) guide.update(16, frame);
  assert.equal(behavior.x, frame.playerX + TUNING.xolo.guideLead);
  guide.update(600, frame);
  assert.equal(behavior.facing, -1);
  guide.update(1500, frame);
  assert.equal(behavior.x, frame.playerX + TUNING.xolo.guideLead, 'never runs away from a waiting child');
  const nearby = { ...frame, playerX: 5920 };
  for (let i = 0; i < 100; i++) guide.update(16, nearby);
  assert.equal(behavior.sitting, true);
  guide.update(16, { ...frame, playerX: 5300 });
  assert.notEqual(behavior.state, 'SIT_CHECKPOINT', 'backtracking before activation releases the waiting pose');
  behavior.restAt(LEVEL01.ofrenda.xoloX);
  events.emit('rest:started');
  events.emit('rest:continued');
  assert.equal(behavior.state, 'FOLLOW');
  guide.reset(nearby); guide.update(10000, nearby);
  assert.equal(behavior.hint, undefined, 'checkpoint respawn does not restart guidance');
  guide.destroy();
});
