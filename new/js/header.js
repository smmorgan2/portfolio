/* Glass header — three states (Figma: header_colapsed_a / header_expanded_a)
   HIDDEN     Home page only, while the intro's scroll animation is in progress. Not visible,
              not hoverable, not focusable (inert).
   COLLAPSED  The 207px bar: logo, page title, clock. On the home page it slides in once you
              scroll past the end of the intro animation; on other pages it's there from the start.
   EXPANDED   Hovering the bar (or focusing into it, or tapping Menu on touch) grows it into the
              full navigation. Leaving the header, moving focus out, or Escape collapses it.
   Reveal (hidden <-> collapsed) is driven by scroll; expand (collapsed <-> expanded) by hover,
   focus or the Menu button. They are separate timelines so they can't fight each other.
   PEEK       Once the visitor has scrolled through the whole intro (remembered for the visit),
              moving the pointer to the top of the screen while back in the intro brings the bar
              down; hovering it expands as usual, and leaving the header sends it back up. */
(() => {
  const COLLAPSED_H = 207;    // artboard px (Figma header_colapsed_a)
  const EXPANDED_H = 1023;    // artboard px (Figma header_expanded_a)
  const CLOSE_DELAY = 150;    // ms after the pointer leaves before it collapses (prevents flicker)
  const HOT_ZONE = 80;        // px from the top of the screen that brings the bar down (peek)
  const OPEN = { duration: 0.7, ease: 'expo.out' };
  const CLOSE = { duration: 0.45 };

  const hdr = document.getElementById('hdr');
  const menuBtn = document.getElementById('hdrMenu');
  const links = [...hdr.querySelectorAll('.hdr-nav a')];
  const top = [...hdr.querySelectorAll('.hdr-badge, .hdr-title, .hdr-clock, .hdr-menu')];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const touch = matchMedia('(hover: none)').matches;
  const isHome = document.body.dataset.page === 'home';

  /* ---------- Scale the 1920x1023 artboard like the intro stage ---------- */
  let hs = 1;
  function fit() {
    hs = Math.min(innerWidth / 1920, innerHeight / 1080);
    document.documentElement.style.setProperty('--hs', hs);
  }
  fit();
  addEventListener('resize', fit);

  /* ---------- Refraction (Chrome / Edge; js/glass.js) ----------
     Maps for the collapsed and expanded sizes are built once (and again after a resize),
     then swapped, so nothing heavy runs during the animation. */
  const glass = hdr.querySelector('.hdr-glass');
  const refr = window.Glass ? Glass.refract(glass, { flatTop: true, edge: () => 60 * hs, strength: 75 }) : null;
  let maps = null;
  function buildMaps() {
    if (!refr || !Glass.supported) return;
    const W = innerWidth;
    maps = { c: refr.build(W, COLLAPSED_H * hs), e: refr.build(W, EXPANDED_H * hs) };
    refr.use(state === 'expanded' ? maps.e : maps.c, W, (state === 'expanded' ? EXPANDED_H : COLLAPSED_H) * hs);
  }
  let rT;
  addEventListener('resize', () => { clearTimeout(rT); rT = setTimeout(buildMaps, 150); });

  /* ---------- Logo hover animation ----------
     Hovering the S-M badge loops the 93-frame sequence (flat badge, chrome, back to flat)
     for as long as the pointer stays on it. On leave it finishes the current loop and rests
     on frame 0, so it never stops mid-chrome. Frames load the first time the header opens. */
  const LOGO_FRAMES = 93;
  const LOGO_FPS = 30 * 1.15; // 15% faster than the 30fps render
  const badge = hdr.querySelector('.hdr-badge');
  const logo = document.getElementById('hdrLogo');
  const lctx = logo.getContext('2d');
  let logoImgs = null;
  let logoPlaying = false;
  let logoHover = false;

  function drawLogo(i) {
    const im = logoImgs && logoImgs[i];
    if (!im || !im.complete || !im.naturalWidth) return false;
    lctx.clearRect(0, 0, logo.width, logo.height);
    lctx.drawImage(im, 0, 0, logo.width, logo.height);
    return true;
  }
  function loadLogo() {
    if (logoImgs) return;
    logoImgs = Array.from({ length: LOGO_FRAMES }, (_, i) => {
      const im = new Image();
      im.decoding = 'async';
      if (i === 0) im.onload = () => { if (!logoPlaying) drawLogo(0); badge.classList.add('logo-ready'); };
      im.src = `img/logo/${String(i).padStart(2, '0')}.webp`;
      return im;
    });
  }
  function playLogo() {
    logoHover = true;
    if (logoPlaying || reduced || !logoImgs || !badge.classList.contains('logo-ready')) return;
    logoPlaying = true;
    let start = performance.now();
    let last = -1;
    const step = (now) => {
      let i = Math.floor(((now - start) / 1000) * LOGO_FPS);
      if (i >= LOGO_FRAMES - 1) {
        if (logoHover) {            // still hovered: start the next loop
          start = now; i = 0;
        } else {                    // left: rest on the first frame
          drawLogo(0); logoPlaying = false; return;
        }
      }
      // If a frame isn't loaded yet, hold the previous one rather than flashing empty.
      if (i !== last && drawLogo(i)) last = i;
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  const stopLogo = () => { logoHover = false; };
  badge.addEventListener('mouseenter', playLogo);
  badge.addEventListener('mouseleave', stopLogo);
  badge.addEventListener('focus', playLogo);
  badge.addEventListener('blur', stopLogo);
  // Load quietly once the page has settled, or right away if the header opens first.
  addEventListener('load', () => setTimeout(loadLogo, 3000));

  /* ---------- Live clock (Pacific) ---------- */
  const tz = 'America/Los_Angeles';
  const fmtDay = new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'long' });
  const fmtMonth = new Intl.DateTimeFormat('en-US', { timeZone: tz, month: 'long' });
  const fmtDate = new Intl.DateTimeFormat('en-US', { timeZone: tz, day: 'numeric' });
  const fmtTime = new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', minute: '2-digit' });
  const ordinal = (n) => {
    const v = n % 100;
    if (v >= 11 && v <= 13) return n + 'th';
    return n + ({ 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] || 'th');
  };
  const elDay = document.getElementById('clkDay');
  const elDate = document.getElementById('clkDate');
  const elTime = document.getElementById('clkTime');
  function tick() {
    const now = new Date();
    elDay.textContent = fmtDay.format(now);
    elDate.textContent = fmtMonth.format(now) + ' ' + ordinal(+fmtDate.format(now));
    elTime.textContent = fmtTime.format(now) + ' PT';
  }
  tick();
  setInterval(tick, 1000);

  /* ---------- States ---------- */
  let state = 'hidden';
  let armed = true;          // false = the pointer was already over the bar when it appeared
  let closeTimer = null;
  let expandTrigger = null;  // where focus goes back to on Escape
  const pointer = { x: -1, y: -1, known: false };
  addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch') return;
    pointer.x = e.clientX; pointer.y = e.clientY; pointer.known = true;
    // Once the pointer has been somewhere outside the bar, the next entry counts as fresh.
    if (!armed && !inBar()) armed = true;
    // Peek: after the intro has been seen once, the top edge of the screen brings the bar down.
    if (unlocked && state === 'hidden' && pointer.y <= HOT_ZONE) peek();
    // Once the peeked bar has arrived, keep hovering it to expand.
    else if (peeking && peekReady && state === 'collapsed' && inBar()) expand();
  }, { passive: true });

  // Has this visitor scrolled through the whole intro yet? (Remembered for the browser session.)
  let unlocked = false;
  try { unlocked = sessionStorage.getItem('sm-intro-seen') === '1'; } catch (e) { /* storage blocked */ }
  function unlock() {
    unlocked = true;
    try { sessionStorage.setItem('sm-intro-seen', '1'); } catch (e) { /* storage blocked */ }
  }
  let peeking = false;   // bar is down because of a peek (not because we're past the intro)
  let peekReady = false; // peek slide-in finished

  // Reveal: the bar slides down; badge, title and clock pop in (same motion as before).
  const tlReveal = gsap.timeline({ paused: true });
  gsap.set(hdr, { yPercent: -101 });
  hdr.style.visibility = 'visible';
  tlReveal.to(hdr, { yPercent: 0, ...OPEN }, 0);
  top.forEach((el, i) => {
    gsap.set(el, { autoAlpha: 0 });
    tlReveal.set(el, { autoAlpha: 1 }, 0.12 + i * 0.05);
    tlReveal.fromTo(el, { y: 40 }, { y: 0, duration: 0.5, ease: 'expo.out' }, 0.12 + i * 0.05);
  });

  // Expand: the glass grows to full height; nav links pop in and rise, staggered.
  // Links become focusable at the start (visible at 0 opacity) so Tab can reach them right away.
  const tlExpand = gsap.timeline({ paused: true });
  const hh = { v: COLLAPSED_H };
  tlExpand.fromTo(hh, { v: COLLAPSED_H }, {
    v: EXPANDED_H, ...OPEN,
    onUpdate: () => {
      hdr.style.setProperty('--hh', hh.v);
      if (refr) refr.setSize(innerWidth, hh.v * hs);
    },
  }, 0);
  gsap.set(links, { autoAlpha: 0 });
  tlExpand.set(links, { visibility: 'visible' }, 0);
  links.forEach((el, i) => {
    tlExpand.set(el, { opacity: 1 }, 0.12 + i * 0.05);
    tlExpand.fromTo(el, { y: 40 }, { y: 0, duration: 0.5, ease: 'expo.out' }, 0.12 + i * 0.05);
  });
  tlExpand.eventCallback('onStart', () => { if (refr && maps) refr.use(maps.e, innerWidth, hh.v * hs); });
  tlExpand.eventCallback('onReverseComplete', () => { if (refr && maps) refr.use(maps.c, innerWidth, COLLAPSED_H * hs); });

  const inBar = () => pointer.y >= 0 && pointer.y <= COLLAPSED_H * hs;
  tlReveal.eventCallback('onComplete', () => { if (peeking) peekReady = true; });

  function reveal() {
    if (state !== 'hidden') return;
    state = 'collapsed';
    hdr.inert = false;
    hdr.dataset.state = state;
    // Pointer already over the bar (or not known yet, e.g. no mouse movement since load)?
    // Then don't expand until it's been outside the bar and comes back.
    armed = pointer.known && !inBar();
    if (!maps) buildMaps();
    if (reduced) { tlReveal.progress(1); return; }
    tlReveal.timeScale(1).play();
  }
  function conceal() {
    peeking = false; peekReady = false;
    if (state === 'hidden') return;
    clearTimeout(closeTimer);
    if (state === 'expanded') { tlExpand.progress(0).pause(); setMenu(false); }
    state = 'hidden';
    hdr.dataset.state = state;
    if (hdr.contains(document.activeElement)) document.activeElement.blur();
    hdr.inert = true;
    if (reduced) { tlReveal.progress(0); return; }
    tlReveal.timeScale(tlReveal.duration() / CLOSE.duration).reverse();
  }
  function expand(trigger) {
    clearTimeout(closeTimer);
    if (state !== 'collapsed') return;
    state = 'expanded';
    hdr.dataset.state = state;
    expandTrigger = trigger || null;
    setMenu(true);
    loadLogo();
    if (reduced) { tlExpand.progress(1); return; }
    tlExpand.timeScale(1).play();
  }
  function collapse() {
    clearTimeout(closeTimer);
    if (state !== 'expanded') return;
    state = 'collapsed';
    hdr.dataset.state = state;
    setMenu(false);
    if (reduced) { tlExpand.progress(0); return; }
    // Reverse runs the expand backwards; speed it up so collapsing takes CLOSE.duration.
    tlExpand.timeScale(tlExpand.duration() / CLOSE.duration).reverse();
  }
  const collapseSoon = () => { clearTimeout(closeTimer); closeTimer = setTimeout(collapse, CLOSE_DELAY); };

  function peek() {
    peeking = true; peekReady = false;
    reveal();
    if (reduced) peekReady = true;
  }
  // Leaving a peeked header: collapse if open, then slide back up.
  function endPeek() {
    if (!peeking) return;
    if (state === 'expanded') {
      collapse();
      closeTimer = setTimeout(() => { if (peeking && state === 'collapsed') conceal(); }, CLOSE.duration * 1000);
    } else {
      conceal();
    }
  }
  function setMenu(open) {
    menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    menuBtn.textContent = open ? 'Close' : 'Menu';
  }

  /* ---------- Pointer (mouse / pen) ---------- */
  hdr.addEventListener('pointerenter', (e) => {
    if (e.pointerType === 'touch') return;
    clearTimeout(closeTimer);
    if (state === 'collapsed' && armed) expand();
  });
  hdr.addEventListener('pointerleave', (e) => {
    if (e.pointerType === 'touch') return;
    armed = true;
    // Keyboard focus inside keeps it open; focus left behind by a mouse click doesn't.
    if (hdr.querySelector(':focus-visible')) return;
    if (peeking) { clearTimeout(closeTimer); closeTimer = setTimeout(endPeek, CLOSE_DELAY); }
    else if (state === 'expanded') collapseSoon();
  });

  /* ---------- Keyboard ---------- */
  let restoringFocus = false; // true while Escape hands focus back, so that doesn't re-open it
  hdr.addEventListener('focusin', (e) => {
    clearTimeout(closeTimer);
    if (restoringFocus) return;
    // Keyboard focus only; a mouse click on the logo shouldn't count as a "fresh hover entry".
    if (state === 'collapsed' && e.target !== menuBtn && e.target.matches(':focus-visible')) expand(e.target);
  });
  hdr.addEventListener('focusout', (e) => {
    if (!hdr.contains(e.relatedTarget) && state === 'expanded') collapse();
  });
  addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || state !== 'expanded') return;
    const back = touch ? menuBtn : (expandTrigger && expandTrigger.isConnected ? expandTrigger : hdr.querySelector('.hdr-badge'));
    collapse();
    // Return focus to the trigger without re-opening.
    restoringFocus = true;
    back.focus({ preventScroll: true });
    restoringFocus = false;
  });

  /* ---------- Touch: Menu / Close ---------- */
  menuBtn.addEventListener('click', () => {
    if (state === 'expanded') collapse();
    else expand(menuBtn);
  });
  document.addEventListener('click', (e) => {
    if (touch && state === 'expanded' && !hdr.contains(e.target)) collapse();
  });

  // Choosing a link (or the logo) collapses the menu.
  links.forEach((a) => a.addEventListener('click', () => collapse()));
  hdr.querySelector('.hdr-badge').addEventListener('click', () => collapse());

  /* ---------- When the header is available ---------- */
  hdr.inert = true;
  hdr.dataset.state = state;
  if (isHome && window.introST) {
    // Appears once you scroll past the end of the intro animation (the end of its pinned
    // scroll range), and hides again when you scroll back into it. After that first time,
    // the top edge of the screen can bring it back while you're in the intro (peek).
    ScrollTrigger.create({
      start: () => window.introST.end + 1,
      end: 'max',
      onEnter: () => { unlock(); peeking = false; reveal(); },
      onLeaveBack: conceal,
    });
  } else {
    // Other pages (and the home page with reduced motion, which has no intro animation).
    reveal();
  }
})();
