import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { SaveSystem, SAVE_KEY, type SaveStorage } from '../src/systems/SaveSystem.ts';
import { Level01SaveCoordinator } from '../src/systems/Level01SaveCoordinator.ts';
import { Level01Progression } from '../src/systems/Level01Progression.ts';
import { CheckpointSystem } from '../src/systems/CheckpointSystem.ts';
import { SafePointSystem } from '../src/systems/SafePointSystem.ts';
import { HealthSystem } from '../src/systems/HealthSystem.ts';
import { RestSystem } from '../src/systems/RestSystem.ts';
import { LEVEL01 } from '../src/level/level01Layout.ts';

class MemoryStorage implements SaveStorage {
  raw: string | null = null;
  writes = 0;
  getItem(key: string): string | null { assert.equal(key, SAVE_KEY); return this.raw; }
  setItem(key: string, value: string): void { assert.equal(key, SAVE_KEY); this.raw = value; this.writes++; }
}
function fixture() {
  const storage = new MemoryStorage();
  const saves = new SaveSystem(() => storage);
  return { storage, saves };
}

test('missing save is empty and a semantic checkpoint round-trips without extra fields', () => {
  const { storage, saves } = fixture();
  assert.equal(saves.load(), null);
  assert.equal(saves.saveOfrenda(false), true);
  assert.deepEqual(saves.load(), { schemaVersion: 1, tutorial: { giveLearned: true },
    progress: { currentLevel: 'level-01', checkpointId: 'ofrenda', levelCompleted: false } });
  assert.equal(new SaveSystem(() => storage).load()?.progress.checkpointId, 'ofrenda');
  assert.equal(saves.saveOfrenda(false), true);
  assert.equal(storage.writes, 1, 'equivalent writes do not touch storage again');
});

test('malformed JSON, unsupported versions, wrong types/IDs and inconsistent progress fail safely', () => {
  const { storage, saves } = fixture();
  const valid = { schemaVersion: 1, tutorial: { giveLearned: true },
    progress: { currentLevel: 'level-01', checkpointId: 'ofrenda', levelCompleted: false } };
  for (const raw of ['{', 'null', '[]', '{}', JSON.stringify({ ...valid, schemaVersion: 2 }),
    JSON.stringify({ ...valid, tutorial: { giveLearned: 'true' } }),
    JSON.stringify({ ...valid, progress: { ...valid.progress, currentLevel: 'unknown' } }),
    JSON.stringify({ ...valid, progress: { ...valid.progress, checkpointId: 'unknown' } }),
    JSON.stringify({ ...valid, tutorial: { giveLearned: false } }),
    JSON.stringify({ ...valid, progress: { ...valid.progress, checkpointId: null, levelCompleted: true } }),
  ]) { storage.raw = raw; assert.equal(saves.load(), null, raw); }
});

test('learning GIVE persists before a checkpoint and never discards an existing saved checkpoint', () => {
  const { storage, saves } = fixture();
  saves.learnGive();
  assert.deepEqual(saves.load()?.tutorial, { giveLearned: true });
  assert.equal(saves.load()?.progress.checkpointId, null);
  saves.saveOfrenda(true);
  const previous = storage.raw;
  saves.learnGive();
  assert.equal(storage.raw, previous);
  assert.equal(saves.load()?.progress.levelCompleted, true);
  saves.saveOfrenda(false);
  assert.equal(saves.load()?.progress.levelCompleted, false, 'a new valid checkpoint may replace the previous run');
});

test('storage getter/read/write failures are contained and later retry can succeed', () => {
  const inaccessible = new SaveSystem(() => { throw new Error('storage denied'); });
  assert.equal(inaccessible.load(), null);
  assert.equal(inaccessible.saveOfrenda(false), false);
  const unreadable = new SaveSystem(() => ({ getItem: () => { throw new Error('read denied'); }, setItem: () => {} }));
  assert.equal(unreadable.load(), null);
  assert.equal(unreadable.learnGive(), false);
  const { storage, saves } = fixture();
  let denied = true;
  const unreliable = new SaveSystem(() => ({ getItem: key => storage.getItem(key),
    setItem: (key, value) => { if (denied) throw new Error('quota'); storage.setItem(key, value); } }));
  assert.equal(unreliable.saveOfrenda(false), false);
  assert.equal(saves.load(), null);
  denied = false;
  assert.equal(unreliable.saveOfrenda(false), true);
});

test('deserialization returns independent whitelisted data and completion persists', () => {
  const { storage, saves } = fixture();
  saves.saveOfrenda(true);
  storage.raw = JSON.stringify({ ...saves.load(), ignored: 'not retained' });
  const loaded = saves.load()!;
  assert.equal('ignored' in loaded, false);
  assert.equal(loaded.progress.levelCompleted, true);
  assert.notEqual(loaded, saves.load());
  assert.notEqual(loaded.progress, saves.load()!.progress);
});

test('coordinator writes before STOP HERE/ending exit, retries failed writes, and cleans subscriptions', () => {
  const { saves, storage } = fixture();
  const events = new EventEmitter();
  const health = new HealthSystem();
  const checkpoints = new CheckpointSystem(new SafePointSystem(LEVEL01.safePoints), health, events);
  const progress = new Level01Progression(events);
  const rest = new RestSystem(checkpoints, LEVEL01.ofrenda.checkpoint, events);
  const saving = new Level01SaveCoordinator(saves, events, checkpoints, progress);
  events.emit('give:started');
  assert.equal(saves.load()?.tutorial.giveLearned, true);
  events.emit('zombie:cured');
  rest.activate();
  assert.equal(saves.load()?.progress.checkpointId, 'ofrenda');
  // Simulate eviction between activation and the explicit stopping choice.
  storage.raw = null;
  events.on('rest:stopped', () => assert.equal(saves.load()?.progress.checkpointId, 'ofrenda'));
  rest.stop();
  events.on('level:completed', () => assert.equal(saves.load()?.progress.levelCompleted, true));
  events.emit('level:completed');
  saving.destroy(); progress.destroy();
  assert.equal(events.listenerCount('checkpoint:activated'), 0);
  assert.equal(events.listenerCount('give:started'), 0);
});

test('canonical checkpoint restoration does not replay activation or rest events', () => {
  const events = new EventEmitter();
  const health = new HealthSystem();
  const checkpoints = new CheckpointSystem(new SafePointSystem(LEVEL01.safePoints), health, events);
  const rest = new RestSystem(checkpoints, LEVEL01.ofrenda.checkpoint, events);
  let activations = 0;
  events.on('checkpoint:activated', () => activations++);
  events.on('rest:started', () => activations++);
  health.damage(2);
  checkpoints.restore(LEVEL01.ofrenda.checkpoint);
  rest.restoreContinued();
  assert.equal(health.getHearts(), 3);
  assert.equal(rest.phase, 'CONTINUED');
  assert.equal(rest.blocksGameplay, false);
  assert.equal(rest.activate(), false);
  assert.equal(activations, 0);
});
