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

  /* ---------- Reveal: hidden until the end of the page, like the header ----------
     The glass slides up from the bottom edge, then the two buttons pop in and rise, staggered.
     Same timing as the header's reveal (js/header.js). Scrolling back up hides it again. */
  if (!window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const OPEN = { duration: 0.7, ease: 'expo.out' };
  const CLOSE = 0.45;
  const glass = foot.querySelector('.cs-foot-glass');
  const pills = [prevA, nextA];

  const tl = gsap.timeline({ paused: true });
  gsap.set(glass, { yPercent: 101 });
  tl.to(glass, { yPercent: 0, ...OPEN }, 0);
  pills.forEach((el, k) => {
    gsap.set(el, { autoAlpha: 0 });
    tl.set(el, { autoAlpha: 1 }, 0.12 + k * 0.05);
    tl.fromTo(el, { y: 40 }, { y: 0, duration: 0.5, ease: 'expo.out' }, 0.12 + k * 0.05);
  });
  foot.inert = true; // not clickable or tabbable while hidden

  const show = () => {
    foot.inert = false;
    if (reduced) tl.progress(1); else tl.timeScale(1).play();
  };
  const hide = () => {
    foot.inert = true;
    if (document.activeElement && foot.contains(document.activeElement)) document.activeElement.blur();
    if (reduced) tl.progress(0); else tl.timeScale(tl.duration() / CLOSE).reverse();
  };

  // Shows once half the footer's space has scrolled into view, i.e. at the very end of the page.
  ScrollTrigger.create({ trigger: foot, start: 'center bottom', onEnter: show, onLeaveBack: hide });
})();
