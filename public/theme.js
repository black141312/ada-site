// Theme toggle. The <head> script has already applied any stored choice before
// first paint; this only wires the button and remembers what you pick.
(() => {
  const btn = document.getElementById('theme');
  if (!btn) return;
  const root = document.documentElement;
  const systemLight = () => matchMedia('(prefers-color-scheme: light)').matches;
  btn.addEventListener('click', () => {
    const showingLight = root.dataset.theme ? root.dataset.theme === 'light' : systemLight();
    const next = showingLight ? 'dark' : 'light';
    root.dataset.theme = next;
    try {
      localStorage.setItem('ada-theme', next);
    } catch {
      /* private mode — the choice just won't persist */
    }
  });
})();
