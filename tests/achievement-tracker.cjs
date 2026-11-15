'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const Core = require('../achievements-core.js');
const State = require('../achievement-state.js');
const Data = require('../appleiq-achievements.js');
const Factory = require('../achievement-tracker.js');
const Cloud = require('../cloud-core.js');
function storage() {
  const data = new Map(), calls = {reads: 0, writes: 0}; let blocked = false;
  return {data, calls, block: value => blocked = value,
    getItem(key) { calls.reads++; if (blocked) throw Error('blocked'); return data.get(key) ?? null; },
    setItem(key, value) { calls.writes++; if (blocked) throw Error('quota'); data.set(key, String(value)); },
    removeItem: key => data.delete(key)};
}
test('malformed/sparse inputs never grant awards or address inherited app keys', () => {
  for (const app of ['constructor', '__proto__', 'unknown']) {
    assert.equal(Core.key(app), null); assert.equal(Core.valid(app, {version: 1, unlocked: []}), false);
    assert.deepEqual(Core.merge(app, null, {}), {version: 1, unlocked: []});
  }
  assert.equal(Core.valid('AppleIQ', {version: 1, unlocked: new Array(1)}), false);
  assert.equal(State.responses(new Array(20)), false);
  assert.deepEqual(Data.secrets({completed: true, responses: new Array(20)}), {first: false, cosmic: false});
  for (const story of ['bad-end', [], {}, {phase: 'no-phase'}, {speedLevel: Infinity}, {qualityLevel: '1'}, {phase: 'happy-end', eventTime: Infinity}]) {
    assert.deepEqual(Core.merge('AppleIQ', null, {story}).unlocked, []);
  }
  assert.deepEqual(Core.normalize('AppleIQ', {version: 2, unlocked: ['first-test']}).unlocked, []);
});
test('projected evidence is immutable, idempotent and stable between award thresholds', () => {
  const raw = {story: {phase: 'cycle', eventTime: 8, speedLevel: 1}, test: {completed: true}};
  const a = State.project('AppleIQ', raw);
  assert.deepEqual(State.project('AppleIQ', a), a);
  raw.story.speedLevel = 0; assert.equal(a.story.speedLevel, 1);
  assert.equal(State.fingerprint('AppleIQ', a), State.fingerprint('AppleIQ', State.project('AppleIQ', {...raw, story: {phase: 'cycle', speedLevel: 1, eventTime: 24.99}})));
  assert.notEqual(State.fingerprint('AppleIQ', a), State.fingerprint('AppleIQ', State.project('AppleIQ', {...raw, story: {phase: 'cycle', speedLevel: 1, eventTime: 25}})));
});
test('10,000 unchanged observations perform no storage reads/writes and retain one cached profile', () => {
  const store = storage(), tracker = Factory.create('AppleIQ', store);
  tracker.observe({test: {completed: true}, story: {phase: 'mind', speedLevel: 1}});
  const before = {...store.calls}, profile = tracker.snapshot().profile;
  for (let i = 0; i < 10000; i++) assert.equal(tracker.observe({story: {phase: 'mind', speedLevel: 1}}), profile);
  assert.deepEqual(store.calls, before); assert.deepEqual(profile.unlocked, ['first-test', 'first-upgrade']);
  assert.ok(Object.isFrozen(profile.unlocked)); tracker.dispose();
});
test('a quota failure preserves awards in memory and retries even without another new award', () => {
  const store = storage(), tracker = Factory.create('AppleIQ', store);
  store.block(true); tracker.observe({story: {speedLevel: 1}});
  assert.equal(tracker.snapshot().status, 'memory'); assert.equal(tracker.snapshot().profile.unlocked.length, 2);
  tracker.observe({story: null}); assert.equal(tracker.snapshot().profile.unlocked.length, 2);
  store.block(false); tracker.observe({story: null});
  assert.equal(tracker.snapshot().status, 'saved'); assert.equal(Core.read('AppleIQ', store).unlocked.length, 2);
  assert.equal(Factory.create('AppleIQ', store).snapshot().profile.unlocked.length, 2);
});
test('corrupt primary records and interrupted primary writes recover from the backup', () => {
  const store = storage();
  store.data.set(Core.key('AppleIQ'), '{broken');
  store.data.set(Core.backupKey('AppleIQ'), JSON.stringify({version: 1, unlocked: ['secret-67']}));
  const tracker = Factory.create('AppleIQ', store);
  assert.deepEqual(tracker.snapshot().profile.unlocked, ['secret-67']);
  assert.equal(store.data.get(Core.key('AppleIQ')), store.data.get(Core.backupKey('AppleIQ')));
  const set = store.setItem; store.setItem = (key, text) => { if (key === Core.key('AppleIQ')) throw Error('primary blocked'); set(key, text); };
  tracker.observe({story: {phase: 'bad-end'}});
  assert.equal(tracker.snapshot().status, 'backup-only');
  assert.ok(Core.read('AppleIQ', store).unlocked.includes('both-iq-secrets'));
});
test('tabs merge awards without duplicates and listener failures cannot interrupt persistence', () => {
  const store = storage(), a = Factory.create('AppleIQ', store), b = Factory.create('AppleIQ', store);
  a.subscribe(() => { throw Error('broken UI'); }); a.observe({story: {phase: 'bad-end'}});
  b.observe({story: {phase: 'cosmic-end'}}); a.sync(); b.sync();
  assert.deepEqual(a.snapshot().profile, b.snapshot().profile);
  assert.ok(a.snapshot().profile.unlocked.includes('both-iq-secrets'));
  assert.equal(new Set(a.snapshot().profile.unlocked).size, a.snapshot().profile.unlocked.length);
});
test('cloud rollback restores the primary AND backup ledgers after a backup-write failure', () => {
  const store = storage(), profile = {version: 1, unlocked: ['first-test']};
  Core.restore('AppleIQ', store, {entries: {}, achievements: profile});
  store.data.set('apple-iq-ended-01', '1');
  const before = new Map(store.data), snapshot = Cloud.collect(store), set = store.setItem; let fail = true;
  store.setItem = (key, value) => { if (key === Core.backupKey('AppleIQ') && fail) { fail = false; throw Error('quota'); } set(key, value); };
  assert.throws(() => Cloud.replace(store, {...snapshot, achievements: {version: 1, unlocked: ['secret-67']}}));
  assert.deepEqual(store.data, before);
});
test('unavailable storage, unknown apps and disposal are safe', () => {
  const tracker = Factory.create('AppleIQ', null); tracker.observe({ending: 'happy'});
  assert.equal(tracker.snapshot().status, 'memory'); assert.ok(tracker.snapshot().profile.unlocked.includes('ending-happy'));
  tracker.dispose(); const profile = tracker.snapshot().profile; tracker.observe({ending: 'bad'}); assert.equal(tracker.snapshot().profile, profile);
  assert.throws(() => Factory.create('__proto__', storage()), TypeError);
});
