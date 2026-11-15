'use strict';
((root, factory) => {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.GameAchievementState = api;
})(typeof window === 'undefined' ? globalThis : window, () => {
  const stories = new WeakSet(), tests = new WeakSet();
  const phases = new Set(['film', 'mind', 'sleep', 'cycle', 'resolve', 'school', 'quiet-day', 'bad-end', 'ultimate', 'ultimate-win', 'happy-end', 'vegetable', 'genius-hub', 'genius-battle', 'genius-loss', 'genius-end', 'cosmic-end']);
  const endings = new Set(['happy', 'bad', 'genius', 'secret-160', 'secret-67']);
  const milestones = Object.freeze({cycle: 25, 'happy-end': 64, vegetable: 20, 'genius-end': 147});
  const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
  const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
  const integer = (value, max) => Number.isInteger(value) && value >= 0 && value <= max;

  /** Validate every slot explicitly: Array#every skips holes in sparse arrays. */
  function responses(value) {
    if (!Array.isArray(value) || value.length !== 20) return false;
    for (let i = 0; i < 20; i++) {
      if (!own(value, i) || value[i] !== null && !integer(value[i], 6)) return false;
    }
    return true;
  }

  /** Copy only fields that can affect awards, never a live combat/renderer graph. */
  function story(value) {
    if (stories.has(value)) return value;
    if (!object(value)) return null;
    const fields = ['phase', 'speedLevel', 'qualityLevel', 'geniusArena', 'geniusEndingSeen'];
    if (!fields.some(key => own(value, key))) return null;
    if (own(value, 'phase') && value.phase !== null && !phases.has(value.phase)) return null;
    if (own(value, 'speedLevel') && !integer(value.speedLevel, 80)) return null;
    if (own(value, 'qualityLevel') && !integer(value.qualityLevel, 42)) return null;
    if (own(value, 'geniusEndingSeen') && typeof value.geniusEndingSeen !== 'boolean') return null;
    if (own(value, 'eventTime') && (!Number.isFinite(value.eventTime) || value.eventTime < 0 || value.eventTime > 21600)) return null;
    let arena = null;
    if (own(value, 'geniusArena') && value.geniusArena !== null) {
      const a = value.geniusArena;
      if (!object(a) || own(a, 'next') && !integer(a.next, 10) || own(a, 'status') && a.status !== null && !['ready', 'recovery', 'complete'].includes(a.status)) return null;
      arena = Object.freeze({next: a.next > 0 ? 1 : 0, status: a.status === 'complete' ? 'complete' : null});
    }
    const threshold = milestones[value.phase];
    const projected = Object.freeze({
      phase: value.phase || null,
      speedLevel: value.speedLevel > 0 ? 1 : 0,
      qualityLevel: value.qualityLevel > 0 ? 1 : 0,
      geniusArena: arena,
      geniusEndingSeen: value.geniusEndingSeen === true,
      ultimateStatus: value.ultimateStatus === 'failed' ? 'failed' : null,
      // Seconds between thresholds cannot change an achievement.
      eventTime: threshold && value.eventTime >= threshold ? threshold : 0
    });
    stories.add(projected);
    return projected;
  }

  function test(value) {
    if (tests.has(value)) return value;
    if (!object(value)) return null;
    if (own(value, 'index') && value.index !== null && !integer(value.index, 20)) return null;
    if (own(value, 'round') && !integer(value.round, 1000000)) return null;
    for (const key of ['completed', 'pendingRetake']) if (own(value, key) && typeof value[key] !== 'boolean') return null;
    if (own(value, 'responses') && value.responses !== null && !responses(value.responses)) return null;
    const answers = value.responses ? Object.freeze([...value.responses]) : null;
    const projected = Object.freeze({
      completed: value.completed === true && (!answers || answers.every(answer => answer !== null)),
      index: value.index ?? null,
      pendingRetake: value.pendingRetake === true,
      round: value.round || 0,
      responses: answers
    });
    tests.add(projected);
    return projected;
  }

  /** Apply a partial observation. Ending/calendar notifications last one observation. */
  function project(app, input, previous = {}) {
    const state = object(input) ? input : {};
    if (app === 'Brukivka') {
      const amount = n => Number.isFinite(n) ? n : 0;
      return Object.freeze({totalEarned: amount(state.totalEarned), balance: amount(state.balance), pcOwned: state.pcOwned === true,
        deliveryOwned: Object.freeze(Array.isArray(state.deliveryOwned) ? state.deliveryOwned.filter(id => integer(id, 1000000)) : [])});
    }
    return Object.freeze({
      story: own(state, 'story') ? story(state.story) : previous.story || null,
      test: own(state, 'test') ? test(state.test) : previous.test || null,
      ending: endings.has(state.ending) ? state.ending : null,
      calendarSecret: state.calendarSecret === true
    });
  }

  /** Stable small fingerprint; does not serialize game saves or mutable objects. */
  function fingerprint(app, state) {
    if (app === 'Brukivka') return [state.totalEarned, state.balance, state.pcOwned, state.deliveryOwned.join(',')].join('|');
    const s = state.story, t = state.test;
    return [s?.phase, s?.speedLevel, s?.qualityLevel, s?.geniusArena?.next, s?.geniusArena?.status, s?.geniusEndingSeen, s?.ultimateStatus, s?.eventTime,
      t?.completed, t?.index, t?.pendingRetake, t?.round, t?.responses?.join(','), state.ending, state.calendarSecret].join('|');
  }
  return Object.freeze({object, responses, story, test, project, fingerprint});
});
