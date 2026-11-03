/* Phones and tablets: the S-M logo is the menu button (Figma: Mobile - Home+ProjectSelection_menunav,
   mobile_header_expanded). Tapping it pops a glass panel down out of the logo, Liquid Glass style:
   the glass starts as the logo's own pill and stretches open, sideways a touch faster than
   downwards, with a small wobble as it lands; the links drop in one after another.
   The logo sits at its Figma spot at the top of the page and sticks to the top edge as you scroll.
   Desktop keeps the glass header (js/header.js); nothing here runs there. */
(() => {
  if (!matchMedia('(hover: none)').matches) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const page = document.body.dataset.page;
  const isHome = page === 'home';
  const here = location.pathname.split('/').pop() || 'index.html';

  const WII = 'M4980 1356C4980 1060.68 4974.01 730.17 4950.74 453.66 4937.1 291.61 4920.91 194.69 4853.51 123.18 4774.5 39.34 4660.68 31.52 4494.7 24.16 3896.01-2.39 3153.43 0 2490 0 1826.57 0 1083.99-2.39 485.3 24.16 319.32 31.52 205.5 39.34 126.49 123.18 59.09 194.69 42.9 291.61 29.26 453.66 5.99 730.17 0 1060.68 0 1356 0 1651.32 5.99 1981.83 29.26 2258.34 42.9 2420.39 59.09 2517.31 126.49 2588.82 205.5 2672.66 319.32 2680.48 485.3 2687.84 1083.99 2714.39 1826.57 2712 2490 2712 3153.43 2712 3896.01 2714.39 4494.7 2687.84 4660.68 2680.48 4774.5 2672.66 4853.51 2588.82 4920.91 2517.31 4937.1 2420.39 4950.74 2258.34 4974.01 1981.83 4980 1651.32 4980 1356Z';

  /* ---------- Markup ---------- */
  const btn = document.createElement('button');
  btn.className = 'm-logo';
  btn.type = 'button';
  btn.setAttribute('aria-expanded', 'false');
  btn.setAttribute('aria-controls', 'mMenu');
  btn.setAttribute('aria-label', 'Menu');
  btn.innerHTML = `<svg viewBox="0 0 4980 2712" aria-hidden="true"><path d="${WII}"/></svg><span aria-hidden="true">S-M</span>`;

  const menu = document.createElement('div');
  menu.className = 'm-menu';
  menu.id = 'mMenu';
  const home = isHome ? '#top' : 'index.html';
  const links = [
    ['Home', home],
    ['Projects', isHome ? '#mProjects' : 'index.html#mProjects'],
    ['About', isHome ? '#about' : 'index.html#about'],
    ['Contact', 'contact.html'],
  ];
  menu.innerHTML = '<div class="m-menu-glass"></div><nav aria-label="Main">'
    + links.map(([t, h]) => `<a href="${h}"${(h === here || (isHome && t === 'Home')) ? ' aria-current="page"' : ''}>${t}</a>`).join('')
    + '</nav>';
  menu.inert = true;
  document.body.prepend(menu);
  document.body.prepend(btn);
  const anchors = [...menu.querySelectorAll('a')];

  /* ---------- Logo position: Figma spot (y78), then held 12px under the top edge ---------- */
  let ticking = false;
  const track = () => { document.documentElement.style.setProperty('--m-scroll', Math.max(0, scrollY) + 'px'); ticking = false; };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(track); } }, { passive: true });
  track();

  /* ---------- Open / close ---------- */
  let open = false, tl = null;
  const mu = () => Math.min(innerWidth, 560) / 402;
  const state = { t: 0, r: 0, b: 0, l: 0, rad: 0 };
  const paint = () => {
    const s = menu.style;
    s.setProperty('--m-t', state.t + 'px'); s.setProperty('--m-r', state.r + 'px');
    s.setProperty('--m-b', state.b + 'px'); s.setProperty('--m-l', state.l + 'px');
    s.setProperty('--m-rad', state.rad + 'px');
  };
  // The logo's rectangle, as insets of the panel: where the glass starts and ends.
  function logoInsets() {
    const L = btn.getBoundingClientRect(), P = menu.getBoundingClientRect();
    return { t: L.top - P.top, l: L.left - P.left, r: P.right - L.right, b: P.bottom - L.bottom, rad: L.height / 2 };
  }
  function place() {
    // Keep the logo where Figma has it inside the panel (32 from the panel top), but never let
    // the panel's top edge go above the screen.
    const L = btn.getBoundingClientRect();
    const top = Math.max(8, L.top - 32 * mu());
    menu.style.setProperty('--m-panel-top', top + 'px');
  }

  function show() {
    if (open) return;
    open = true;
    place();
    btn.setAttribute('aria-expanded', 'true');
    btn.setAttribute('aria-label', 'Close menu');
    document.documentElement.classList.add('m-menu-open');
    if (window.lenis) window.lenis.stop();
    menu.inert = false;
    menu.classList.add('is-open');
    if (tl) tl.kill();
    const from = logoInsets();
    if (reduced || !window.gsap) {
      Object.assign(state, { t: 0, r: 0, b: 0, l: 0, rad: 50 * mu() }); paint();
      anchors.forEach((a) => { a.style.opacity = 1; a.style.transform = 'none'; });
    } else {
      Object.assign(state, from); paint();
      tl = gsap.timeline({ onUpdate: paint });
      // Sideways first and quick, then the drop with a little overshoot: glass stretching like a liquid.
      tl.to(state, { l: 0, r: 0, duration: 0.55, ease: 'expo.out' }, 0);
      tl.to(state, { t: 0, duration: 0.3, ease: 'power2.out' }, 0);
      tl.to(state, { b: 0, duration: 0.8, ease: 'elastic.out(1, 0.72)' }, 0.06);
      tl.to(state, { rad: 50 * mu(), duration: 0.5, ease: 'power2.out' }, 0);
      tl.fromTo(menu, { scaleX: 0.94, scaleY: 0.98, transformOrigin: '50% 0%' },
        { scaleX: 1, scaleY: 1, duration: 0.9, ease: 'elastic.out(1, 0.55)' }, 0);
      anchors.forEach((a, k) => {
        tl.fromTo(a, { opacity: 0, y: -26 * mu(), filter: 'blur(6px)' },
          { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.5, ease: 'expo.out' }, 0.16 + k * 0.06);
      });
    }
    anchors[0].focus({ preventScroll: true });
  }

  function hide(returnFocus = true) {
    if (!open) return;
    open = false;
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-label', 'Menu');
    menu.inert = true;
    const done = () => {
      menu.classList.remove('is-open');
      document.documentElement.classList.remove('m-menu-open');
      if (window.lenis) window.lenis.start();
    };
    if (tl) tl.kill();
    if (reduced || !window.gsap) { done(); }
    else {
      const to = logoInsets();
      tl = gsap.timeline({ onUpdate: paint, onComplete: done });
      tl.to(anchors, { opacity: 0, y: -12 * mu(), duration: 0.16, ease: 'power2.in', stagger: { each: 0.02, from: 'end' } }, 0);
      tl.to(state, { b: to.b, duration: 0.34, ease: 'power3.in' }, 0.04);
      tl.to(state, { l: to.l, r: to.r, t: to.t, rad: to.rad, duration: 0.3, ease: 'power3.in' }, 0.1);
    }
    if (returnFocus) btn.focus({ preventScroll: true });
  }

  btn.addEventListener('click', () => (open ? hide() : show()));
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && open) hide(); });
  // Tapping outside the panel closes it.
  document.addEventListener('pointerdown', (e) => {
    if (open && !menu.contains(e.target) && !btn.contains(e.target)) hide(false);
  });
  // Focus leaving the panel (Tab past the last link) closes it.
  menu.addEventListener('focusout', (e) => { if (open && e.relatedTarget && !menu.contains(e.relatedTarget) && e.relatedTarget !== btn) hide(false); });

  // Links on the same page scroll there; others navigate (with the page transition).
  anchors.forEach((a) => a.addEventListener('click', (e) => {
    const h = a.getAttribute('href');
    if (!h.startsWith('#')) { hide(false); return; }
    e.preventDefault();
    hide(false);
    const y = h === '#top' ? 0 : (document.querySelector(h) ? document.querySelector(h).getBoundingClientRect().top + scrollY - 20 : null);
    if (y === null) return;
    setTimeout(() => scrollTo({ top: y, behavior: reduced ? 'auto' : 'smooth' }), 120);
  }));
  addEventListener('resize', () => { if (open) { place(); Object.assign(state, { t: 0, r: 0, b: 0, l: 0, rad: 50 * mu() }); paint(); } });
})();
