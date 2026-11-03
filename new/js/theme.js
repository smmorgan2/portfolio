/* Light / dark theme toggle
   Dark is the default. The visitor's choice is saved (localStorage "sm-theme") and restored on
   later visits; the head of every page applies it before anything paints, so there's no flash.
   Nothing ever switches automatically (no clock, no system setting). */
(() => {
  const KEY = 'sm-theme';
  const root = document.documentElement;
  const btn = document.getElementById('themeToggle');
  if (!btn) return;
  const isLight = () => root.dataset.theme === 'light';
  function sync() {
    btn.setAttribute('aria-pressed', String(isLight()));
    btn.setAttribute('aria-label', 'Light mode');
    btn.title = isLight() ? 'Switch to dark mode' : 'Switch to light mode';
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = isLight() ? '#FFFFFF' : '#000000';
  }
  btn.addEventListener('click', () => {
    if (isLight()) delete root.dataset.theme; else root.dataset.theme = 'light';
    try { localStorage.setItem(KEY, isLight() ? 'light' : 'dark'); } catch (e) { /* storage blocked: applies for this page only */ }
    sync();
  });
  sync();
})();
