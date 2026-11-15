'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const C = require('../cinema-details.js');
const Art = require('../scene-art.js');
const Model = require('../character-model.js');
const G = require('../progression.js');
const B = require('../genius-battle.js');
let depth = 0, operations = 0, gradients = 0;
const words = [], gradient = { addColorStop(at, color) {
  assert.ok(Number.isFinite(at) && at >= 0 && at <= 1);
  assert.ok(!String(color).includes('NaN'));
} };
const context = new Proxy({ globalAlpha: 1,
  save() { depth++; }, restore() { assert.ok(depth > 0); depth--; },
  createLinearGradient() { gradients++; return gradient; },
  createRadialGradient() { gradients++; return gradient; },
  fillText(value) { words.push(value); },
}, { get: (o, k) => k in o ? o[k] : (...args) => {
  operations++;
  for (const n of args) if (typeof n === 'number') assert.ok(Number.isFinite(n), 'finite ' + String(k));
}, set: (o, k, v) => (o[k] = v, true) });
for (const reduced of [false, true]) {
  for (const hour of [0, 5.5, 8, 12, 17.5, 22]) for (const bedroom of [false, true]) {
    Art.room(context, { bedroom, hour, reduced, t: 3.5 });
    assert.equal(depth, 0, 'the full set restores its clip and transforms');
  }
  for (const id of ['school', 'university', 'love', 'work', 'wedding', 'home', 'family']) {
    Art.landscape(context, id, 3, reduced); assert.equal(depth, 0);
  }
  let sleeperCount = 0;
  Art.hospital(context, 4, reduced, (c, x, y) => {
    sleeperCount++; assert.equal(x, 388); assert.equal(y, 609); C.restingFace(c, x, y, 4);
  });
  assert.equal(sleeperCount, 1, 'the new hospital draws one sleeping head');
  Art.warmRoom(context, 3, reduced); Art.ambulanceDetails(context, 3, reduced);
  Art.arena(context, 3, 1, 0, reduced); Art.arena(context, 3, 2, 9, reduced);
  assert.equal(depth, 0);
}
// The actual arena UI uses the new actor branch, even without a matchMedia service.
const win = { AppleCinema: C, AppleCharacterModel: Model, AppleSceneArt: Art, AppleGenius: B };
vm.runInNewContext(fs.readFileSync(require.resolve('../genius-view.js'), 'utf8'), { window: win, Math, Number });
for (const rival of B.RIVALS) for (const scale of [.23, .83, 1.22]) {
  win.AppleGeniusUI.scientist(context, 400, 280, scale, rival, 0, 5); assert.equal(depth, 0);
}
assert.ok(words.includes('ШВИДКА ДОПОМОГА'));
assert.ok(words.includes('ЛИСТОПАД'));
assert.ok(words.includes('Ra'));
// Display changes are pure: no mutation of progression/economy, no frame or timer ownership.
const p = G.normalise({ iq: 125, speedLevel: 2, qualityLevel: 12 });
const snapshot = JSON.stringify(p), income = G.income(p);
for (let i = 0; i < 40; i++) C.character(context, 800, 760, i / 12, { walk: true, facing: i % 2 ? -1 : 1 });
assert.equal(JSON.stringify(p), snapshot); assert.equal(G.income(p), income);
const previous = globalThis.AppleVisualSettings;
try {
  globalThis.AppleVisualSettings = { enabled: () => false };
  gradients = 0;
  C.character(context, 800, 760, 4, { suit: true, mood: 'smile' });
  Art.arena(context, 4, 2, 2, true); Art.warmRoom(context, 4, true);
  assert.equal(gradients, 0, 'unlit actor/arena/warm-room paths allocate no lighting gradients');
} finally { globalThis.AppleVisualSettings = previous; }
assert.equal(depth, 0); assert.ok(operations > 10000);
console.log('Passed: every new day/night set, clipped scenery, hospital head anchor, ten redesigned rivals, reduced motion, light switches and unchanged progression.');
