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
  const pills = [prevA, nextA];
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
  ScrollTrigger.create({ trigger: space, start: 'center bottom', onEnter: show, onLeaveBack: hide });
})();
