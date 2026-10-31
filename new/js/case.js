/* Case study page wiring
   - Previous / Next follow the live projects in js/projects.js, wrapping around at the ends.
   - If this project is switched off (live: false), the page sends visitors to the homepage. */
(() => {
  const id = document.body.dataset.project;
  const all = window.PROJECTS || [];
  const me = all.find((p) => p.id === id);

  // Switched off: don't show it. (?preview=1 lets Sam still look at it before it's cleared.)
  if (me && !me.live && !/[?&]preview=1\b/.test(location.search)) {
    location.replace('index.html');
    return;
  }

  const foot = document.getElementById('csFoot');
  if (!foot) return;
  const live = all.filter((p) => p.live || p.id === id);
  const i = live.findIndex((p) => p.id === id);
  if (live.length < 2 || i < 0) { foot.hidden = true; return; }

  const prev = live[(i - 1 + live.length) % live.length];
  const next = live[(i + 1) % live.length];
  const prevA = foot.querySelector('[data-dir="prev"]');
  const nextA = foot.querySelector('[data-dir="next"]');
  prevA.href = prev.href;
  prevA.setAttribute('aria-label', 'Previous project: ' + prev.title);
  nextA.href = next.href;
  nextA.setAttribute('aria-label', 'Next project: ' + next.title);
})();
