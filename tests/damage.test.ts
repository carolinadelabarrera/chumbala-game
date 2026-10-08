import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { HealthSystem } from '../src/systems/HealthSystem.ts';
import { DamageSystem } from '../src/systems/DamageSystem.ts';
import { TUNING } from '../src/config/tuning.ts';

test('eligible contact removes exactly one heart and emits hurt', () => {
  const events = new EventEmitter();
  const hits: number[] = [];
  events.on('player:hurt', hearts => hits.push(hearts));
  const health = new HealthSystem(events);
  const damage = new DamageSystem(health, events);
  assert.equal(damage.contact(false, 100, 0, 50), false);
  assert.equal(damage.contact(true, 100, 0, 50), true);
  assert.equal(health.getHearts(), 2);
  assert.deepEqual(hits, [2]);
});

test('continuous overlap never drains multiple hearts, even after protection expires', () => {
  const health = new HealthSystem();
  const damage = new DamageSystem(health);
  damage.contact(true, 100, 0, 50);
  for (const time of [101, 1100, 1300, 5000]) {
    assert.equal(damage.contact(true, time, 0, 50), false);
  }
  assert.equal(health.getHearts(), 2);
  damage.contact(false, 5001, 0, 50);
  assert.equal(damage.contact(true, 5002, 0, 50), true);
  assert.equal(health.getHearts(), 1);
});

test('recontact inside invulnerability is ignored; fresh contact at expiry can hit', () => {
  const health = new HealthSystem();
  const damage = new DamageSystem(health);
  damage.contact(true, 100, 0, 50);
  damage.contact(false, 200, 0, 50);
  assert.equal(damage.contact(true, 100 + TUNING.player.hurtInvulnerabilityMs - 1, 0, 50), false);
  assert.equal(damage.isInvulnerable(100 + TUNING.player.hurtInvulnerabilityMs - 1), true);
  damage.contact(false, 100 + TUNING.player.hurtInvulnerabilityMs, 0, 50);
  assert.equal(damage.isInvulnerable(100 + TUNING.player.hurtInvulnerabilityMs), false);
  assert.equal(damage.contact(true, 100 + TUNING.player.hurtInvulnerabilityMs, 0, 50), true);
});

test('knockback points away from either side and ends before invulnerability', () => {
  for (const [x, direction] of [[0, -1], [100, 1], [50, -1]]) {
    const damage = new DamageSystem(new HealthSystem());
    damage.contact(true, 100, x, 50);
    assert.equal(damage.getKnockbackX(), direction * TUNING.player.knockbackX);
    assert.equal(damage.isKnockedBack(100), true);
    assert.equal(damage.isKnockedBack(100 + TUNING.player.knockbackDurationMs), false);
    assert.equal(damage.isInvulnerable(100 + TUNING.player.knockbackDurationMs), true);
  }
});

test('zero health emits once, rejects further hits, restores hearts and grants respawn protection', () => {
  const events = new EventEmitter();
  let zeroCount = 0;
  let respawnCount = 0;
  events.on('player:zeroHealth', () => zeroCount++);
  events.on('player:respawned', () => respawnCount++);
  const health = new HealthSystem();
  const damage = new DamageSystem(health, events);
  for (const time of [100, 1500, 2900]) {
    damage.contact(false, time, 0, 50);
    assert.equal(damage.contact(true, time, 0, 50), true);
  }
  assert.equal(health.getHearts(), 0);
  assert.equal(damage.respawning, true);
  damage.contact(false, 10000, 0, 50);
  assert.equal(damage.contact(true, 10000, 0, 50), false);
  assert.equal(zeroCount, 1);
  damage.completeRespawn(11000);
  assert.equal(health.getHearts(), health.maxHearts);
  assert.equal(damage.respawning, false);
  assert.equal(damage.isInvulnerable(11000), true);
  assert.equal(respawnCount, 1);
});
