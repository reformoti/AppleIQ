'use strict';
((root, factory) => {
  const api = factory(
    typeof module === 'object' && module.exports ? require('./appleiq-achievements.js') : root.AppleIQAchievementData,
    typeof module === 'object' && module.exports ? require('./achievement-state.js') : root.GameAchievementState
  );
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.GameAchievementsCore = api;
})(typeof window === 'undefined' ? globalThis : window, (A, State) => {
  const freeze = rows => Object.freeze(rows.map(row => Object.freeze({...row})));
  const catalog = Object.freeze({
    Brukivka: freeze([
      {id: 'first-income', title: 'Перший заробіток', description: 'Зароби загалом 40 UAH.'},
      {id: 'new-route', title: 'Новий маршрут', description: 'Відкрий будь-який платний маршрут.'},
      {id: 'own-pc', title: 'Власний ПК', description: 'Купи комп’ютер.'}
    ]),
    AppleIQ: freeze([
      {id: 'first-test', title: 'Перший результат', description: 'Заверши IQ-тест.'},
      {id: 'first-upgrade', title: 'Перше перетворення', description: 'Купи першу прокачку швидкості або якості яблука.'},
      {id: 'first-genius', title: 'Виклик генію', description: 'Повністю переможи першого генія.'},
      ...A.definitions
    ])
  });
  const indexes = new Map(Object.entries(catalog).map(([app, rows]) => [app, new Set(rows.map(row => row.id))]));
  const rows = app => indexes.has(app) ? catalog[app] : [];
  const empty = () => ({version: 1, unlocked: []});
  const key = app => indexes.has(app) ? `xar_achievements_${app}_v1` : null;
  const backupKey = app => indexes.has(app) ? `${key(app)}-backup` : null;

  /** Strict persisted-profile validation. Unknown apps/IDs, duplicates and holes fail. */
  function valid(app, value) {
    try {
      const allowed = indexes.get(app);
      if (!allowed || !State.object(value) || value.version !== 1 || !Array.isArray(value.unlocked) || value.unlocked.length > allowed.size) return false;
      const seen = new Set();
      for (let i = 0; i < value.unlocked.length; i++) {
        const id = value.unlocked[i];
        if (!Object.prototype.hasOwnProperty.call(value.unlocked, i) || typeof id !== 'string' || !allowed.has(id) || seen.has(id)) return false;
        seen.add(id);
      }
      return true;
    } catch { return false; }
  }

  /** Canonical catalog order; produces a fresh profile without mutating input. */
  function normalize(app, value) {
    try {
      if (!indexes.has(app) || !State.object(value) || value.version !== 1 || !Array.isArray(value.unlocked) || value.unlocked.length > indexes.get(app).size * 2) return empty();
      const ids = new Set(value.unlocked);
      return {version: 1, unlocked: rows(app).filter(item => ids.has(item.id)).map(item => item.id)};
    } catch { return empty(); }
  }

  function inferProjected(app, state) {
    if (app === 'Brukivka') return [Math.max(state.totalEarned, state.balance) >= 40, state.deliveryOwned.some(id => id >= 1), state.pcOwned];
    if (app !== 'AppleIQ') return [];
    const {story, test} = state;
    return [!!story || test?.completed === true || test?.index === 20 && !!test.responses && test.responses.every(v => v !== null),
      story?.speedLevel > 0 || story?.qualityLevel > 0,
      story?.geniusArena?.next >= 1 || story?.geniusArena?.status === 'complete', ...A.conditions(state)];
  }
  const infer = (app, state) => inferProjected(app, State.project(app, state));

  /** Single ordered union for old awards, new conditions and collection awards. */
  function merge(app, value, state) {
    const prior = normalize(app, value), conditions = infer(app, state), ids = new Set(prior.unlocked);
    rows(app).forEach((item, i) => { if (conditions[i]) ids.add(item.id); });
    if (app === 'AppleIQ') for (const id of A.aggregates(ids)) ids.add(id);
    return {version: 1, unlocked: rows(app).filter(item => ids.has(item.id)).map(item => item.id)};
  }

  /** Recover and union valid primary/backup records; never parse unbounded strings. */
  function readResult(app, storage) {
    if (!indexes.has(app) || !storage || typeof storage.getItem !== 'function') return {profile: empty(), state: 'error', repair: false};
    const found = [], raw = []; let failed = false;
    for (const name of [key(app), backupKey(app)]) {
      let text;
      try { text = storage.getItem(name); }
      catch { found.push(null); raw.push(undefined); failed = true; continue; }
      raw.push(text);
      try {
        const value = typeof text === 'string' && text.length <= 65536 ? JSON.parse(text) : null;
        found.push(valid(app, value) ? value : null);
      } catch { found.push(null); failed = true; }
    }
    const profile = normalize(app, {version: 1, unlocked: [...(found[0]?.unlocked || []), ...(found[1]?.unlocked || [])]});
    const repair = profile.unlocked.length > 0 && found.some(value => !value || value.unlocked.length !== profile.unlocked.length);
    return {profile, repair, state: found[1] && (!found[0] || found[1].unlocked.some(id => !found[0].unlocked.includes(id))) ? 'recovered' :
      found[0] ? 'saved' : failed || raw.some(text => text != null) ? 'error' : 'empty'};
  }
  const read = (app, storage) => readResult(app, storage).profile;

  /** Synchronous writes protect ending awards before navigation clears the run. */
  function persist(app, storage, profile) {
    if (!valid(app, profile)) return {primary: false, backup: false};
    const text = JSON.stringify(profile), result = {primary: false, backup: false};
    for (const [field, name] of [['primary', key(app)], ['backup', backupKey(app)]]) {
      try { storage.setItem(name, text); result[field] = true; } catch { /* Keep the in-memory award for retry. */ }
    }
    return result;
  }

  function stateFrom(app, entries = {}) {
    const parse = name => { try { const text = entries?.[name]; return typeof text === 'string' && text.length <= 2097152 ? JSON.parse(text) : null; } catch { return null; } };
    return app === 'Brukivka' ? parse('brukivka_kos_v4') || {} : {story: parse('apple-iq-story-01'), test: parse('apple-iq-protocol-02')};
  }
  const capture = (app, storage, entries) => merge(app, read(app, storage), stateFrom(app, entries));

  /** Replace a cloud ledger atomically, restoring both records on a write error. */
  function restore(app, storage, snapshot) {
    if (!indexes.has(app) || !State.object(snapshot) || snapshot.achievements !== undefined && !valid(app, snapshot.achievements)) throw Error('Невірний формат досягнень.');
    const names = [key(app), backupKey(app)], before = names.map(name => storage.getItem(name));
    const text = JSON.stringify(merge(app, snapshot.achievements, stateFrom(app, snapshot.entries)));
    try { for (const name of names) storage.setItem(name, text); }
    catch {
      let failed = false;
      names.forEach((name, i) => { try { if (before[i] === null) storage.removeItem(name); else storage.setItem(name, before[i]); } catch { failed = true; } });
      throw Error(failed ? 'Не вдалося відновити досягнення. Скористайся резервною копією.' : 'Досягнення не завантажено. Попередній стан відновлено.');
    }
  }
  return Object.freeze({catalog, key, backupKey, valid, normalize, infer, merge, read, readResult, persist, stateFrom, capture, restore});
});
