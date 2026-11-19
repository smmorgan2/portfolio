/* Smooth scrolling (Lenis), driven by GSAP's ticker so ScrollTrigger and Lenis stay in sync.
   Only one scroll system runs on the page: this one. Touch screens keep native scrolling. */
(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const lenis = new Lenis({
    lerp: 0.1,            // glide amount: lower = smoother and longer, higher = tighter
    wheelMultiplier: 1,
  });
  window.lenis = lenis;

  gsap.registerPlugin(ScrollTrigger);
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  // One-swipe glides (intro -> projects, project -> project). Glides to y, then holds the page
  // until the trackpad has gone quiet, so a swipe's leftover momentum can't carry on past the stop.
  let lastWheel = 0;
  addEventListener('wheel', () => { lastWheel = performance.now(); }, { passive: true, capture: true });
  window.glideTo = (y, { duration = 0.8, settle = 250, quiet = 160 } = {}) => new Promise((done) => {
    lenis.scrollTo(y, { duration, lock: true, force: true, easing: (t) => 1 - Math.pow(1 - t, 3),
      onComplete: () => {
        lenis.stop();
        const t0 = performance.now();
        const release = () => {
          const now = performance.now();
          if (now - t0 < settle || now - lastWheel < quiet) { setTimeout(release, 50); return; }
          lenis.start(); done();
        };
        release();
      } });
  });

  // In-page links (#intro, #projects…) glide instead of jumping.
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const target = document.querySelector(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    lenis.scrollTo(target, { duration: 1.4 });
  });
})();
