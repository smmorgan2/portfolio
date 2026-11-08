/* Phones and tablets: the S-M logo is the menu button (Figma: Mobile - Home+ProjectSelection_menunav,
   mobile_header_expanded). Tapping it morphs the logo into a glass panel, Liquid Glass style:
   the glass starts as the logo's own pill and grows on springs, sideways a touch faster than
   downwards, overshooting slightly before it settles; the links drop in one after another.
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
    ['About', 'about.html'],
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

  /* ---------- Open / close: Liquid Glass morph ----------
     The glass is a real element that changes size (not a clip), so it can overshoot like Apple's
     Liquid Glass: it starts as the logo's own pill and grows on two springs. Width is quicker
     (response 0.38s), height a touch slower with a little more give (0.5s), so the glass stretches
     sideways first and then drops, overshoots a few px and settles. Closing is one firm spring with
     no bounce. Links drop in one after another as the glass arrives. */
  let open = false, tl = null, raf = 0;
  const mu = () => Math.min(innerWidth, 560) / 402;
  const glass = menu.querySelector('.m-menu-glass');
  const SPRING_OPEN_X = { response: 0.38, damping: 0.74 };
  const SPRING_OPEN_Y = { response: 0.5, damping: 0.66 };
  const SPRING_CLOSE = { response: 0.26, damping: 1 };
  // A spring from 0 to 1 (damped harmonic oscillator, stepped per frame).
  const spring = ({ response, damping }) => {
    const w = (2 * Math.PI) / response;
    return { x: 0, v: 0, k: w * w, c: 2 * damping * w, step(dt, target) {
      const a = -this.k * (this.x - target) - this.c * this.v;
      this.v += a * dt; this.x += this.v * dt;
      return Math.abs(this.x - target) < 0.003 && Math.abs(this.v) < 0.02;
    } };
  };
  let px = null, py = null, from = null;     // springs and the logo's rectangle (panel coordinates)
  const lerp = (a, b, t) => a + (b - a) * t;
  function paint() {
    const W = menu.clientWidth, H = menu.clientHeight, R = 50 * mu();
    const w = lerp(from.w, W, px.x), h = lerp(from.h, H, py.x);
    const l = lerp(from.l, 0, px.x), t = lerp(from.t, 0, Math.min(1, py.x));
    const g = glass.style;
    g.left = l + 'px'; g.top = t + 'px'; g.width = Math.max(0, w) + 'px'; g.height = Math.max(0, h) + 'px';
    g.borderRadius = lerp(from.h / 2, R, Math.min(1, py.x)) + 'px';
  }
  function run(target, onDone) {
    cancelAnimationFrame(raf);
    let last = performance.now();
    const frame = (now) => {
      const dt = Math.min(0.032, (now - last) / 1000); last = now;
      const a = px.step(dt, target), b = py.step(dt, target);
      paint();
      if (a && b) { px.x = py.x = target; px.v = py.v = 0; paint(); if (onDone) onDone(); return; }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
  }
  function logoRect() {
    const L = btn.getBoundingClientRect(), P = menu.getBoundingClientRect();
    return { l: L.left - P.left, t: L.top - P.top, w: L.width, h: L.height };
  }
  function place() {
    // Keep the logo where Figma has it inside the panel (32 from the panel top), but never let
    // the panel's top edge go above the screen.
    const L = btn.getBoundingClientRect();
    const top = Math.max(8, L.top - 32 * mu());
    menu.style.setProperty('--m-panel-top', top + 'px');
  }

  // Pressing the logo squishes it a little, like a drop of glass.
  btn.addEventListener('pointerdown', () => { if (!reduced && window.gsap) gsap.to(btn, { scale: 0.9, duration: 0.12, ease: 'power2.out' }); });
  const unsquish = () => { if (!reduced && window.gsap) gsap.to(btn, { scale: 1, duration: 0.5, ease: 'elastic.out(1, 0.45)' }); };
  btn.addEventListener('pointerup', unsquish);
  btn.addEventListener('pointercancel', unsquish);
  btn.addEventListener('pointerleave', unsquish);

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
    from = logoRect();
    const keep = px ? { x: px.x, y: py.x } : { x: 0, y: 0 };   // reopening mid-close continues from there
    px = spring(SPRING_OPEN_X); py = spring(SPRING_OPEN_Y);
    px.x = keep.x; py.x = keep.y;
    if (reduced || !window.gsap) {
      px.x = py.x = 1; paint();
      anchors.forEach((a) => { a.style.opacity = 1; a.style.transform = 'none'; a.style.filter = 'none'; });
    } else {
      paint();
      run(1);
      tl = gsap.timeline();
      anchors.forEach((a, k) => {
        tl.fromTo(a, { opacity: 0, y: -26 * mu(), filter: 'blur(6px)' },
          { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.5, ease: 'expo.out' }, 0.14 + k * 0.06);
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
    if (reduced || !window.gsap) { cancelAnimationFrame(raf); done(); }
    else {
      from = logoRect();
      const keep = { x: px.x, y: py.x };
      px = spring(SPRING_CLOSE); py = spring(SPRING_CLOSE);
      px.x = keep.x; py.x = keep.y;
      gsap.to(anchors, { opacity: 0, y: -12 * mu(), filter: 'blur(4px)', duration: 0.14, ease: 'power2.in', stagger: { each: 0.02, from: 'end' } });
      setTimeout(() => run(0, () => { if (!open) done(); }), 60);
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
  addEventListener('resize', () => { if (open) { place(); from = logoRect(); px.x = py.x = 1; paint(); } });
})();
