/* Page transition (after the Wii "return to menu" screen)
   Leaving: the screen fades to black, then a 4x3 grid of channel tiles with the S-M logo
   cascades in diagonally from the top-left. Then the browser goes to the next page.
   Arriving: the new page opens under that same tile screen (the head script adds html.tx-in
   before anything paints), the tiles cascade out in the same order, and the page fades up.

   Applies to every link to another page on the site, unless the link opts out with data-no-tx.
   Skipped for: in-page # links, email/phone links, other sites, new-tab or modified clicks,
   downloads, and reduced motion.

   Timing comes from the reference video (wii_transition_ref.mp4): tiles 0.07s apart along
   the diagonal, each fading over about 0.35s. */
(() => {
  const root = document.documentElement;
  const tx = document.getElementById('tx');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const KEY = 'sm-tx';
  const done = () => { if (window.__txDone) { window.__txDone(); window.__txDone = null; } };

  if (!tx || !window.gsap) { root.classList.remove('tx-in'); done(); return; }

  const tiles = [...tx.querySelectorAll('.tx-tile')];
  // Diagonal step of each tile (row + column), read from the live grid so portrait (3 columns) works too.
  const step = (el) => {
    const cols = getComputedStyle(tx.querySelector('.tx-grid')).gridTemplateColumns.split(' ').length;
    const i = tiles.indexOf(el);
    return Math.floor(i / cols) + (i % cols);
  };
  const STAGGER = 0.07;

  /* ---------- Arriving ---------- */
  function arrive() {
    if (!root.classList.contains('tx-in')) { done(); return; }
    try { sessionStorage.removeItem(KEY); } catch (e) { /* storage blocked */ }
    tx.classList.add('is-on');
    gsap.set(tx, { autoAlpha: 1 });
    gsap.set(tiles, { autoAlpha: 1 });
    root.classList.remove('tx-in');
    const tl = gsap.timeline({ delay: 0.15, onComplete: () => tx.classList.remove('is-on') });
    tiles.forEach((t) => tl.to(t, { autoAlpha: 0, duration: 0.3, ease: 'power1.in' }, step(t) * 0.05));
    // Black lifts as the last tiles go; the page underneath starts its own motion then.
    tl.add(done, 0.4);
    tl.to(tx, { autoAlpha: 0, duration: 0.35, ease: 'power1.out' }, 0.4);
  }
  arrive();

  /* ---------- Leaving ---------- */
  let leaving = false;
  function leave(href) {
    if (leaving) return;
    leaving = true;
    try { sessionStorage.setItem(KEY, '1'); } catch (e) { /* storage blocked: next page just opens plainly */ }
    tx.classList.add('is-on');
    gsap.set(tiles, { autoAlpha: 0 });
    const tl = gsap.timeline({ onComplete: () => { location.href = href; } });
    tl.fromTo(tx, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2, ease: 'power1.in' }, 0);
    tiles.forEach((t) => tl.to(t, { autoAlpha: 1, duration: 0.35, ease: 'power1.out' }, 0.1 + step(t) * STAGGER));
    tl.to({}, { duration: 0.1 });   // a beat on the full grid before the page changes
  }

  const samePage = (url) => {
    const norm = (p) => p.replace(/index\.html$/, '');
    return url.origin === location.origin && norm(url.pathname) === norm(location.pathname);
  };

  document.addEventListener('click', (e) => {
    if (reduced || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest('a[href]');
    if (!a || a.hasAttribute('data-no-tx') || a.hasAttribute('download')) return;
    if (a.target && a.target !== '_self') return;
    const raw = a.getAttribute('href');
    if (!raw || raw.startsWith('#') || /^(mailto|tel|sms|javascript):/i.test(raw)) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin) return;
    if (samePage(url) && url.hash) return;   // in-page jump
    e.preventDefault();
    leave(url.href);
  });

  // Fetch the next page early when a link is hovered, so the tiles aren't waiting on the network.
  const fetched = new Set();
  document.addEventListener('pointerover', (e) => {
    const a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin || samePage(url) || fetched.has(url.pathname)) return;
    fetched.add(url.pathname);
    const l = document.createElement('link');
    l.rel = 'prefetch'; l.href = url.pathname;
    document.head.appendChild(l);
  });

  // Back / forward can restore this page from memory with the tile screen still up: clear it.
  addEventListener('pageshow', (e) => {
    if (!e.persisted) return;
    leaving = false;
    gsap.killTweensOf([tx, ...tiles]);
    gsap.set(tx, { autoAlpha: 0 });
    tx.classList.remove('is-on');
    root.classList.remove('tx-in');
    try { sessionStorage.removeItem(KEY); } catch (err) { /* storage blocked */ }
  });
})();
