/* Case study (and Contact) page wiring
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
  // Remember which project this is, so "Projects" lands back on it in the project selection.
  if (me) { try { sessionStorage.setItem('sm-from-project', id); } catch (e) { /* storage blocked */ } }

  /* ---------- Videos ----------
     Each <video data-src> loads only as it nears the screen, then plays muted on a loop,
     and pauses when it scrolls away. Phones get the lighter copy in videos/<project>/mobile/.
     Reduced motion: nothing autoplays; the poster shows with play controls instead. */
  (() => {
    const vids = [...document.querySelectorAll('video[data-src]')];
    if (!vids.length) return;
    const small = matchMedia('(hover: none), (max-width: 820px)').matches;
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const srcFor = (v) => small ? v.dataset.src.replace(/\/([^/]+\.mp4)$/, '/mobile/$1') : v.dataset.src;
    const load = (v) => { if (!v.src) { v.src = srcFor(v); v.load(); } };
    if (still) { vids.forEach((v) => { v.controls = true; v.loop = false; }); }
    if (!('IntersectionObserver' in window)) { vids.forEach((v) => { load(v); if (!still) v.play().catch(() => {}); }); return; }
    // Start loading a little before the video reaches the screen.
    const loader = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (e.isIntersecting) { load(e.target); loader.unobserve(e.target); }
    }), { rootMargin: '400px 0px' });
    // Play while any part is on screen, pause when it leaves.
    const player = new IntersectionObserver((entries) => entries.forEach((e) => {
      const v = e.target;
      if (still) return;
      if (e.isIntersecting) { load(v); v.play().catch(() => {}); } else v.pause();
    }), { threshold: 0.01 });
    // data-play="hover" (mouse/trackpad only): hold on the first frame (the Figma still),
    // play in a loop while hovered, jump back to the first frame on hover-off.
    // Phones have no hover, so these play on screen like the rest.
    const hoverable = matchMedia('(hover: hover) and (pointer: fine)').matches;
    vids.forEach((v) => {
      loader.observe(v);
      if (v.dataset.play === 'hover' && hoverable && !still) {
        const box = v.closest('.cs-media') || v;
        box.addEventListener('pointerenter', () => { load(v); v.play().catch(() => {}); });
        box.addEventListener('pointerleave', () => { v.pause(); if (v.readyState) v.currentTime = 0; });
      } else {
        player.observe(v);
      }
    });
  })();

  const foot = document.getElementById('csFoot');
  if (!foot) return;
  // Case studies: Previous / Next point at the neighbouring live projects.
  // Other pages (Contact) carry their own fixed buttons, e.g. Home.
  const prevA = foot.querySelector('[data-dir="prev"]');
  const nextA = foot.querySelector('[data-dir="next"]');
  if (prevA && nextA) {
    const live = all.filter((p) => p.live || p.id === id);
    const i = live.findIndex((p) => p.id === id);
    if (live.length < 2 || i < 0) { foot.hidden = true; return; }
    const prev = live[(i - 1 + live.length) % live.length];
    const next = live[(i + 1) % live.length];
    prevA.href = prev.href;
    prevA.setAttribute('aria-label', 'Previous project: ' + prev.title);
    nextA.href = next.href;
    nextA.setAttribute('aria-label', 'Next project: ' + next.title);
  }

  /* ---------- Reveal: the header, mirrored ----------
     Hidden below the screen until you reach the end of the page. Then the header slides away up top
     while the footer slides up from the bottom, and the two buttons pop in and rise, staggered.
     Scrolling back up reverses both. Same timing as the header (js/header.js). */
  if (!window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const OPEN = { duration: 0.7, ease: 'expo.out' };
  const CLOSE = 0.45;
  const space = document.getElementById('csFootSpace');
  const pills = [...foot.querySelectorAll('a')];
  const header = window.siteHeader;

  const tl = gsap.timeline({ paused: true });
  gsap.set(foot, { yPercent: 101 });
  foot.style.visibility = 'visible';
  tl.to(foot, { yPercent: 0, ...OPEN }, 0);
  pills.forEach((el, k) => {
    gsap.set(el, { autoAlpha: 0 });
    tl.set(el, { autoAlpha: 1 }, 0.12 + k * 0.05);
    tl.fromTo(el, { y: 40 }, { y: 0, duration: 0.5, ease: 'expo.out' }, 0.12 + k * 0.05);
  });
  foot.inert = true; // not clickable or tabbable while hidden

  const show = () => {
    foot.inert = false;
    if (header) header.conceal();
    if (reduced) tl.progress(1); else tl.timeScale(1).play();
  };
  const hide = () => {
    foot.inert = true;
    if (document.activeElement && foot.contains(document.activeElement)) document.activeElement.blur();
    if (header) header.reveal();
    if (reduced) tl.progress(0); else tl.timeScale(tl.duration() / CLOSE).reverse();
  };

  // Shows once half of the footer's space at the end of the page has scrolled into view.
  // A page that fits on one screen (Contact on most laptops) has no end to scroll to: the footer
  // slides up as the page opens and stays, and the header keeps its usual behaviour above it.
  // "Fits" = less than a footer's height left to scroll, so there's no real end of page to reach.
  const fits = () => document.documentElement.scrollHeight - innerHeight < space.offsetHeight;
  if (fits()) {
    foot.inert = false;
    if (reduced) tl.progress(1);
    else (window.txWait || Promise.resolve()).then(() => gsap.delayedCall(0.15, () => tl.play()));
  } else {
    ScrollTrigger.create({ trigger: space, start: 'center bottom', onEnter: show, onLeaveBack: hide });
  }
})();

/* Reading progress (Compass step progress): a thin accent line across the top that fills as you
   read, so you can see how much of the case study is left. Case studies only, not Contact. */
(() => {
  if (!document.querySelector('main.cs')) return;
  const bar = document.createElement('div');
  bar.className = 'cs-progress'; bar.setAttribute('aria-hidden', 'true');
  document.body.appendChild(bar);
  let queued = false;
  const update = () => {
    queued = false;
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.setProperty('--p', max > 0 ? Math.min(1, Math.max(0, scrollY / max)).toFixed(4) : 0);
  };
  const ask = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };
  addEventListener('scroll', ask, { passive: true });
  addEventListener('resize', ask);
  update();
})();
