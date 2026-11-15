'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), vm = require('node:vm');
const Core = require('../achievements-core.js'), Factory = require('../achievement-tracker.js');
function harness(source = fs.readFileSync(require.resolve('../achievements-ui.js'), 'utf8'), blocked = false, engine = Core) {
  const data = new Map(), frames = new Map(), windowEvents = new Map();
  const metrics = {created: 0, rebuilt: 0, reads: 0, writes: 0, geometry: 0}; let id = 0;
  const storage = {getItem(key) { metrics.reads++; if (blocked) throw Error('blocked'); return data.get(key) ?? null; }, setItem(key, text) { metrics.writes++; if (blocked) throw Error('quota'); data.set(key, text); }, removeItem:key => data.delete(key)};
  function node(tag) {
    const handlers = new Map(), classes = new Set();
    return {tag, children: [], open: false, isConnected: true, style: {}, textContent: '', hidden: false,
      classList: {toggle(name, on) { if (on) classes.add(name); else classes.delete(name); }, contains: name => classes.has(name)},
      append(...items) { for (const item of items) { if (item.tag === 'fragment') this.children.push(...item.children); else this.children.push(item); } },
      replaceChildren(...items) { metrics.rebuilt++; this.children = []; this.append(...items); },
      setAttribute() {},
      addEventListener(name, fn) { if (!handlers.has(name)) handlers.set(name, new Set()); handlers.get(name).add(fn); },
      removeEventListener(name, fn) { handlers.get(name)?.delete(fn); },
      fire(name, event = {}) { for (const fn of [...(handlers.get(name) || [])]) fn(event); },
      listeners(name) { return handlers.get(name)?.size || 0; },
      getBoundingClientRect() { metrics.geometry++; throw Error('layout read forbidden'); }
    };
  }
  const makeHost = () => {
    const host = node('details'), count = node('span'), content = node('div'), status = node('p');
    host.querySelector = key => ({'[data-achievement-count]': count, '[data-achievement-list]': content, '[data-achievement-status]': status})[key] || null;
    return {host, count, content, status, root: {querySelector: () => host}};
  };
  const document = {currentScript: {dataset: {achievementsApp: 'AppleIQ'}}, createElement(tag) { metrics.created++; return node(tag); }, createDocumentFragment() { metrics.created++; return node('fragment'); }};
  const window = {GameAchievementsCore: engine, GameAchievementTracker: Factory, localStorage: storage,
    addEventListener(name, fn) { if (!windowEvents.has(name)) windowEvents.set(name, new Set()); windowEvents.get(name).add(fn); },
    removeEventListener(name, fn) { windowEvents.get(name)?.delete(fn); }};
  if (blocked) Object.defineProperty(window, 'localStorage', {get() { throw Error('SecurityError'); }});
  vm.runInNewContext(source, {window, document, localStorage: storage, requestAnimationFrame: fn => (frames.set(++id, fn), id), cancelAnimationFrame: key => frames.delete(key)});
  const flush = () => { const pending = [...frames.values()]; frames.clear(); pending.forEach(fn => fn(1000)); };
  const fire = (name, event) => { for (const fn of [...(windowEvents.get(name) || [])]) fn(event); };
  return {api: window.GameAchievements, makeHost, flush, fire, frames, metrics, data, windowEvents};
}
test('closed achievement panels build zero rows; opening mounts one reusable list', () => {
  const h = harness(), view = h.makeHost(); h.api.mount(view.root); h.api.mount(view.root);
  assert.equal(view.host.listeners('toggle'), 1); assert.equal(h.frames.size, 1); h.flush();
  assert.equal(h.metrics.created, 0); assert.equal(h.metrics.rebuilt, 0); assert.equal(view.count.textContent, '0 / 13');
  view.host.open = true; view.host.fire('toggle'); h.flush();
  assert.equal(view.content.children.length, 13); assert.equal(h.metrics.rebuilt, 1); assert.equal(h.metrics.created, 40);
  view.host.open = false; view.host.fire('toggle'); h.flush(); view.host.open = true; view.host.fire('toggle'); h.flush();
  assert.equal(h.metrics.rebuilt, 1); assert.equal(h.metrics.created, 40); assert.equal(h.metrics.geometry, 0);
});
test('rapid awards batch into one RAF and only patch existing rows', () => {
  const h = harness(), view = h.makeHost(); view.host.open = true; h.api.mount(view.root); h.flush();
  h.api.observe({test: {completed: true}}); h.api.observe({story: {speedLevel: 1}}); h.api.observe({story: {speedLevel: 1, geniusArena: {next: 1}}});
  assert.equal(h.frames.size, 1); assert.equal(view.count.textContent, '0 / 13'); h.flush();
  assert.equal(view.count.textContent, '3 / 13'); assert.equal(view.content.children.filter(row => row.children[0].textContent.startsWith('✓')).length, 3);
  assert.equal(h.metrics.created, 40); assert.equal(h.metrics.rebuilt, 1);
  const before = {...h.metrics};
  for (let i = 0; i < 1000; i++) h.api.observe({story: {speedLevel: 1, geniusArena: {next: 1}}});
  assert.equal(h.frames.size, 0); assert.deepEqual(h.metrics, before);
});
test('detached dialogs and page lifecycle remove listeners and pending RAFs', () => {
  const h = harness(), old = h.makeHost(); h.api.mount(old.root); h.flush(); old.host.isConnected = false;
  const next = h.makeHost(); h.api.mount(next.root); h.flush(); assert.equal(old.host.listeners('toggle'), 0);
  next.host.open = true; next.host.fire('toggle'); assert.equal(h.frames.size, 1);
  h.fire('pagehide', {persisted: true}); assert.equal(h.frames.size, 0);
  h.fire('pageshow', {}); assert.equal(h.frames.size, 1); h.flush();
  h.fire('pagehide', {persisted: false}); assert.equal(next.host.listeners('toggle'), 0); assert.equal(h.frames.size, 0);
  assert.ok([...h.windowEvents.values()].every(listeners => listeners.size === 0));
  h.api.observe({ending: 'happy'}); assert.equal(h.frames.size, 0);
});
test('blocked browser storage still shows awards and an honest retry message', () => {
  const h = harness(undefined, true), view = h.makeHost(); view.host.open = true; h.api.mount(view.root); h.flush();
  h.api.observe({ending: 'happy'}); h.flush(); assert.equal(view.count.textContent, '1 / 13');
  assert.equal(view.status.hidden, false); assert.match(view.status.textContent, /Не вдалося зберегти/);
});
test('other-tab achievements update the count without rebuilding the list', () => {
  const h = harness(), view = h.makeHost(); view.host.open = true; h.api.mount(view.root); h.flush();
  h.data.set(Core.key('AppleIQ'), JSON.stringify({version: 1, unlocked: ['secret-67']}));
  h.fire('storage', {key: Core.key('AppleIQ')}); h.flush();
  assert.equal(view.count.textContent, '1 / 13'); assert.equal(h.metrics.rebuilt, 1);
});
module.exports = {harness};
