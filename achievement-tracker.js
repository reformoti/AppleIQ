'use strict';
((root, factory) => {
  const api = factory(
    typeof module === 'object' && module.exports ? require('./achievements-core.js') : root.GameAchievementsCore,
    typeof module === 'object' && module.exports ? require('./achievement-state.js') : root.GameAchievementState
  );
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.GameAchievementTracker = api;
})(typeof window === 'undefined' ? globalThis : window, (Core, State) => {
  const freeze = profile => Object.freeze({version: 1, unlocked: Object.freeze([...profile.unlocked])});

  /**
   * Owns one cached ledger. No DOM, timers or retained mutable game objects.
   * Storage may be unavailable; pending awards survive in memory until retry.
   * @param {string} app Known game identifier.
   * @param {Storage|null} storage A localStorage-compatible adapter.
   */
  function create(app, storage) {
    if (!Core.key(app)) throw new TypeError('Невідома гра.');
    const loaded = Core.readResult(app, storage), listeners = new Set();
    let profile = freeze(loaded.profile), latest = State.project(app, {}), fingerprint = null;
    let status = loaded.state, dirty = loaded.repair, revision = 0, disposed = false;
    const snapshot = () => Object.freeze({profile, status, revision});
    const emit = () => { for (const listener of listeners) try { listener(snapshot()); } catch { /* UI failures cannot block a save. */ } };
    const setStatus = next => { if (next !== status) { status = next; emit(); } };

    /** Write synchronously only when dirty, including before an ending navigates. */
    function flush() {
      if (!dirty) return status !== 'memory' && status !== 'error';
      const result = Core.persist(app, storage, profile);
      dirty = !result.primary || !result.backup;
      setStatus(result.primary && result.backup ? 'saved' : result.primary ? 'backup-error' : result.backup ? 'backup-only' : 'memory');
      return result.primary || result.backup;
    }

    /** Validate/project a partial state and skip rule evaluation when evidence is unchanged. */
    function observe(input) {
      if (disposed) return profile;
      try {
        const projected = State.project(app, input, latest), nextFingerprint = State.fingerprint(app, projected);
        latest = projected;
        if (nextFingerprint !== fingerprint) {
          fingerprint = nextFingerprint;
          const next = Core.merge(app, profile, projected);
          if (next.unlocked.length !== profile.unlocked.length) {
            profile = freeze(next); revision++; dirty = true;
            flush(); emit();
            return profile;
          }
        }
        if (dirty) flush();
      } catch { setStatus('error'); }
      return profile;
    }

    /** Merge another tab's durable awards with unsaved local awards, without losing either. */
    function sync() {
      if (disposed) return profile;
      const next = Core.readResult(app, storage);
      const combined = Core.merge(app, {version: 1, unlocked: [...new Set([...profile.unlocked, ...next.profile.unlocked])]}, {});
      if (combined.unlocked.length !== profile.unlocked.length) { profile = freeze(combined); revision++; emit(); }
      dirty = dirty || next.repair || profile.unlocked.length > next.profile.unlocked.length;
      if (dirty) flush();
      else setStatus(next.state);
      return profile;
    }

    if (dirty) flush();
    return Object.freeze({observe, flush, sync, snapshot,
      subscribe(listener) { if (typeof listener !== 'function' || disposed) return () => {}; listeners.add(listener); return () => listeners.delete(listener); },
      dispose() { if (disposed) return; flush(); disposed = true; listeners.clear(); }
    });
  }
  return Object.freeze({create});
});
