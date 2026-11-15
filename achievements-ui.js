'use strict';
(() => {
  const Core = window.GameAchievementsCore, Factory = window.GameAchievementTracker;
  const app = document.currentScript?.dataset.achievementsApp;
  if (!Core?.key(app) || !Factory) return;
  let storage = null;
  try { storage = window.localStorage; } catch { /* Private/blocked storage keeps the tracker usable in memory. */ }
  const tracker = Factory.create(app, storage), mounted = new Map();
  let scheduled = false, frame = 0, disposed = false;
  const request = typeof requestAnimationFrame === 'function' ? requestAnimationFrame : callback => { callback(); return 0; };
  const cancel = typeof cancelAnimationFrame === 'function' ? cancelAnimationFrame : () => {};
  const messages = Object.freeze({
    recovered: 'Досягнення відновлено з резервної копії.',
    'backup-error': 'Досягнення збережено. Резервну копію поки не оновлено.',
    'backup-only': 'Досягнення збережено в резервній копії.',
    memory: 'Не вдалося зберегти досягнення. Вони залишаються відкритими в цій вкладці; збереження буде повторено.',
    error: 'Не вдалося прочитати або оновити досягнення.'
  });

  /** Release detached dialogs without observing the entire document. */
  function prune() {
    for (const [host, view] of mounted) if (!host.isConnected) {
      host.removeEventListener('toggle', view.toggle); mounted.delete(host);
    }
  }

  /** Create the list once, in a fragment, only when the user opens it. */
  function build(view) {
    const fragment = document.createDocumentFragment();
    for (const item of Core.catalog[app]) {
      const row = document.createElement('p'), title = document.createElement('strong'), description = document.createElement('small');
      row.className = 'achievement-entry'; row.setAttribute('role', 'listitem');
      title.textContent = '○ ' + item.title; description.textContent = item.description;
      row.append(title, description); fragment.append(row);
      view.rows.set(item.id, {row, title, label: item.title, earned: false});
    }
    view.content.replaceChildren(fragment);
    view.built = true;
  }

  /** Write-only DOM pass: no geometry reads and no rebuilding unchanged rows. */
  function paint() {
    if (disposed) return;
    prune();
    const {profile, status, revision} = tracker.snapshot(), unlocked = new Set(profile.unlocked);
    for (const [host, view] of mounted) {
      try {
        const count = profile.unlocked.length + ' / ' + Core.catalog[app].length;
        if (view.count.textContent !== count) view.count.textContent = count;
        const message = messages[status] || '';
        if (view.status.textContent !== message) view.status.textContent = message;
        view.status.hidden = !message;
        if (!host.open) continue;
        if (!view.built) build(view);
        if (view.revision === revision) continue;
        for (const [id, item] of view.rows) {
          const earned = unlocked.has(id);
          if (earned === item.earned) continue;
          item.earned = earned;
          item.row.classList.toggle('is-earned', earned);
          item.title.textContent = (earned ? '✓ ' : '○ ') + item.label;
        }
        view.revision = revision;
      } catch {
        try { view.status.textContent = 'Не вдалося оновити список досягнень.'; view.status.hidden = false; } catch { /* A detached view must not block other dialogs. */ }
      }
    }
  }

  function schedule() {
    if (disposed || scheduled || !mounted.size) return;
    scheduled = true;
    frame = request(() => { scheduled = false; frame = 0; paint(); });
  }
  const unsubscribe = tracker.subscribe(schedule);

  function observe(state) {
    if (window.AppleSaveStore?.isRestoring?.()) return tracker.snapshot().profile;
    return tracker.observe(state);
  }

  /** Idempotent mount; one toggle listener per live settings panel. */
  function mount(root) {
    if (disposed) return;
    prune();
    const host = root?.querySelector('[data-achievements]');
    if (!host) return;
    if (!mounted.has(host)) {
      const count = host.querySelector('[data-achievement-count]'), content = host.querySelector('[data-achievement-list]'), status = host.querySelector('[data-achievement-status]');
      if (!count || !content || !status) return;
      const view = {count, content, status, built: false, revision: -1, rows: new Map(), toggle: schedule};
      host.addEventListener('toggle', view.toggle); mounted.set(host, view);
    }
    tracker.sync(); schedule();
  }

  function onStorage(event) {
    if (event.key === null || event.key === Core.key(app) || event.key === Core.backupKey(app)) tracker.sync();
  }
  function onPageHide(event) {
    tracker.flush();
    if (scheduled) cancel(frame);
    scheduled = false; frame = 0;
    if (!event.persisted) dispose();
  }
  function onPageShow() { tracker.sync(); schedule(); }
  function dispose() {
    if (disposed) return;
    disposed = true; if (scheduled) cancel(frame);
    for (const [host, view] of mounted) host.removeEventListener('toggle', view.toggle);
    mounted.clear(); unsubscribe(); tracker.dispose();
    window.removeEventListener('storage', onStorage); window.removeEventListener('pagehide', onPageHide); window.removeEventListener('pageshow', onPageShow);
  }

  try {
    const entries = {};
    for (const name of app === 'Brukivka' ? ['brukivka_kos_v4'] : ['apple-iq-story-01', 'apple-iq-protocol-02']) entries[name] = storage?.getItem(name);
    observe(Core.stateFrom(app, entries));
  } catch { /* Loading a damaged save cannot disable the rest of the game. */ }
  window.addEventListener('storage', onStorage); window.addEventListener('pagehide', onPageHide); window.addEventListener('pageshow', onPageShow);
  window.GameAchievements = Object.freeze({observe, mount, dispose,
    get markup() {
      const count = tracker.snapshot().profile.unlocked.length + ' / ' + Core.catalog[app].length;
      return '<details data-achievements class="achievement-panel"><summary>Досягнення · <span data-achievement-count>' + count + '</span></summary><div data-achievement-list role="list"></div><p data-achievement-status class="achievement-status" role="status" aria-live="polite" hidden></p><p class="achievement-help">Досягнення зберігаються після нової гри. Для перенесення на інший пристрій збережи прогрес у XaR Cloud.</p></details>';
    }
  });
})();
