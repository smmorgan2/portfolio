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
