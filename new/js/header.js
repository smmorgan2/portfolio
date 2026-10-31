/* Glass header
   - Cursor enters the top HOT_ZONE px of the screen: the glass panel slides down.
   - Cursor leaves the panel: it slides back up (after a short grace period).
   - Keyboard: Tab into a link opens it, Escape closes it.
   - The clock pill shows Sam's local time (Pacific) and ticks live. */
(() => {
  const HOT_ZONE = 80;        // px from the top that opens the header (also in site.css .hdr-hot)
  const CLOSE_DELAY = 0.2;    // seconds after the cursor leaves before it slides away
  const OPEN = { duration: 0.7, ease: 'expo.out' };
  const CLOSE = { duration: 0.45, ease: 'power3.in' };

  const hdr = document.getElementById('hdr');
  const hot = document.getElementById('hdrHot');
  const links = [...hdr.querySelectorAll('.hdr-nav a')];
  const top = [...hdr.querySelectorAll('.hdr-badge, .hdr-title, .hdr-clock')];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Scale the 1920x1023 artboard like the intro stage ---------- */
  function fit() {
    const s = Math.min(innerWidth / 1920, innerHeight / 1080);
    document.documentElement.style.setProperty('--hs', s);
  }
  fit();
  addEventListener('resize', fit);
  hot.style.height = HOT_ZONE + 'px';

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

  /* ---------- Open / close ---------- */
  let isOpen = false;
  let closeTimer = null;
  const tl = gsap.timeline({ paused: true });

  // Panel slides down; content pops in (no fade) and rises, staggered, like the intro words.
  gsap.set(hdr, { yPercent: -101 });
  hdr.style.visibility = 'visible';
  tl.to(hdr, { yPercent: 0, ...OPEN }, 0);
  [...top, ...links].forEach((el, i) => {
    gsap.set(el, { autoAlpha: 0 });
    tl.set(el, { autoAlpha: 1 }, 0.12 + i * 0.05);
    tl.fromTo(el, { y: 40 }, { y: 0, duration: 0.5, ease: 'expo.out' }, 0.12 + i * 0.05);
  });

  function open() {
    clearTimeout(closeTimer);
    if (isOpen) return;
    isOpen = true;
    hdr.classList.add('is-open');
    if (reduced) { tl.progress(1); return; }
    tl.timeScale(1).play();
  }
  function close() {
    clearTimeout(closeTimer);
    if (!isOpen) return;
    isOpen = false;
    hdr.classList.remove('is-open');
    if (reduced) { tl.progress(0); return; }
    // Reverse runs the slide-in backwards; speed it up so closing matches CLOSE duration.
    tl.timeScale(tl.duration() / CLOSE.duration).reverse();
  }
  const closeSoon = () => { clearTimeout(closeTimer); closeTimer = setTimeout(close, CLOSE_DELAY * 1000); };

  hot.addEventListener('mouseenter', open);
  hdr.addEventListener('mouseenter', () => clearTimeout(closeTimer));
  hdr.addEventListener('mouseleave', closeSoon);
  // If the cursor touches the hot zone but never enters the panel, close again.
  hot.addEventListener('mouseleave', (e) => { if (!hdr.contains(e.relatedTarget)) closeSoon(); });

  hdr.addEventListener('focusin', open);
  hdr.addEventListener('focusout', (e) => { if (!hdr.contains(e.relatedTarget)) close(); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });

  // Clicking a link closes the panel.
  links.forEach((a) => a.addEventListener('click', () => close()));
  hdr.querySelector('.hdr-badge').addEventListener('click', () => close());
})();
