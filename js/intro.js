/* Homepage sign-off (was the intro; Sam, Nov 15: work first, personality last)
   - It now comes after the projects. The whole sentence, greeting included, is scrubbed by scroll
     (and reverses on scroll up). It is pinned while it builds, but nothing holds you there.
   - Objects drift slightly with the mouse on desktop.
   Timing comes from Sam's AE demo (Intro_demo_v1), in demo seconds minus 1.8s. */
(() => {
  if (matchMedia('(hover: none)').matches) return;   // phones and tablets: their own intro plays on its own (js/mobile-home.js)
  const stage = document.getElementById('stage');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------- Fit the 1920x1080 artboard to the viewport ---------- */
  function fit() {
    const s = Math.min(innerWidth / 1920, innerHeight / 1080);
    // Set on the intro section so the stage and the hover-card artboards share one scale.
    stage.parentElement.style.setProperty('--s', s);
  }
  fit();
  addEventListener('resize', fit);

  /* ---------- PNG sequences (rendered in AE, cropped to WebP) ----------
     x/y/w/h are artboard px. px = stored image size (2x display). */
  const FRAMES = 31;
  const LAYOUT = {
    collage: { x: 770.9,  y: 330.9, w: 449.1, h: 277.0, px: [898, 554] },
    book:    { x: 1144.6, y: 529.9, w: 317.5, h: 273.0, px: [635, 546] },
    // Sculpture (Intro_demo_v2, Nov 15): replaces the skateboard. Rendered at 1x; frames 11-34 of the
    // export (before 11 it isn't on screen, after 34 it holds still), placed from the demo frame.
    sculpture: { x: 400, y: 681, w: 397, h: 375, px: [397, 375], frames: 24 },
  };
  const seqs = {};

  document.querySelectorAll('canvas.seq').forEach((canvas) => {
    const key = canvas.dataset.seq;
    const L = LAYOUT[key];
    Object.assign(canvas.style, {
      left: L.x + 'px', top: L.y + 'px', width: L.w + 'px', height: L.h + 'px',
    });
    canvas.width = L.px[0];
    canvas.height = L.px[1];
    const ctx = canvas.getContext('2d');
    const N = L.frames || FRAMES;
    const s = { canvas, cur: 0, n: N };

    const ready = (im) => im.complete && im.naturalWidth > 0;
    s.draw = () => {
      let i = s.cur;
      while (i > 0 && !ready(s.imgs[i])) i--; // fall back to nearest loaded frame
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (ready(s.imgs[i])) ctx.drawImage(s.imgs[i], 0, 0, canvas.width, canvas.height);
    };
    s.set = (f) => {
      const i = Math.max(0, Math.min(N - 1, Math.round(f)));
      if (i !== s.cur) { s.cur = i; s.draw(); }
    };
    s.imgs = Array.from({ length: N }, (_, i) => {
      const im = new Image();
      im.decoding = 'async';
      im.onload = () => { if (i <= s.cur) s.draw(); };
      im.src = `img/intro/${key}/${String(i).padStart(2, '0')}.webp`;
      return im;
    });
    seqs[key] = s;
  });

  /* ---------- Animation helpers ---------- */
  gsap.registerPlugin(ScrollTrigger);
  const word = (t) => [...document.querySelectorAll('.words text')].find((el) => el.textContent === t);
  const photo = document.getElementById('photo');

  // Pop in: hidden until its moment, then fully visible at once (no fade), like the demo.
  function popIn(tl, el, at) {
    gsap.set(el, { autoAlpha: 0 });
    tl.set(el, { autoAlpha: 1 }, at);
  }

  // Word: pops in, rises ~56px with a strong ease out, flashes the accent colour, then settles to the
  // text colour (highlight words stay accent).
  function wordIn(tl, el, at) {
    popIn(tl, el, at);
    tl.fromTo(el, { y: 56 }, { y: 0, duration: 0.45, ease: 'expo.out' }, at);
    if (!el.classList.contains('hl')) {
      // --flash 1 -> 0: accent colour fading into the text colour (both follow the theme; see .words in site.css)
      tl.fromTo(el, { '--flash': 1 }, { '--flash': 0, duration: 0.35, ease: 'power1.out' }, at + 0.15);
    }
  }

  // Object: appears on frame 0, rises 32px (the main-comp Y pop), sequence plays 0 to 30.
  function objIn(tl, key, at, dur = 1.0) {
    const s = seqs[key];
    const proxy = { f: 0 };
    popIn(tl, s.canvas, at);
    tl.fromTo(s.canvas, { y: 32 }, { y: 0, duration: 0.5, ease: 'expo.out' }, at);
    tl.fromTo(proxy, { f: 0 }, {
      f: s.n - 1, duration: dur, ease: 'none',
      onUpdate: () => s.set(proxy.f),
    }, at);
  }

  /* ---------- One scroll-scrubbed timeline ----------
     The greeting used to play on load; it is the first beat of the scroll now. The rest keeps its
     old timing, moved O seconds later. */
  const tlScroll = gsap.timeline({ paused: true });
  wordIn(tlScroll, word('Hi!'), 0.02);   // not exactly 0, or it pops before any scroll
  popIn(tlScroll, photo, 0.3);
  tlScroll.fromTo(photo, { y: 56 }, { y: 0, duration: 0.6, ease: 'expo.out' }, 0.3);
  wordIn(tlScroll, word('I’m'), 0.7);
  wordIn(tlScroll, word('Sam.'), 1.0);
  wordIn(tlScroll, word('(he/they)'), 1.05);
  const O = 1.4;
  wordIn(tlScroll, word('I collage'), O + 0.02);
  objIn(tlScroll, 'collage', O + 0.4);
  wordIn(tlScroll, word('culture'), O + 0.7);
  wordIn(tlScroll, word('through'), O + 1.0);
  wordIn(tlScroll, word('design'), O + 1.4);
  objIn(tlScroll, 'book', O + 1.65);
  wordIn(tlScroll, word('and'), O + 2.0);
  wordIn(tlScroll, word('art'), O + 2.45);
  // Intro_demo_v2.mp4, measured frame by frame (30fps): "art" pops on frame 8, the sculpture on
  // frame 11 (0.1s later) and turns until frame 34 (0.8s), "direction." pops on frame 28 (0.67s after "art").
  objIn(tlScroll, 'sculpture', O + 2.55, 0.8);
  wordIn(tlScroll, word('direction.'), O + 3.12);
  // The whole sentence has played once: the hover cards may open from here on (js/cards.js)
  tlScroll.call(() => { window.introDone = true; }, null, O + 3.8);
  tlScroll.to({}, { duration: 0.6 }, O + 3.95); // short hold on the full sentence before release

  /* ---------- Reduced motion: show the finished composition, no pin ---------- */
  if (reduced) {
    tlScroll.progress(1);
    window.introDone = true;
    return;
  }

  /* ---------- Scroll control ---------- */

  // Exposed so the header can appear exactly when this scroll animation ends (js/header.js).
  window.introST = ScrollTrigger.create({
    trigger: '#intro',
    start: 'top top',
    // Scroll distance for the whole build, in screen heights. Lower = more sentence per scroll.
    // 1.5 screens for the sentence (Sam, Oct 30: 1.8 too stiff, 1.0 too sensitive) + 0.5 for the greeting
    end: () => '+=' + Math.round(innerHeight * 2),
    pin: true,
    scrub: 0.6, // seconds the animation takes to catch up to the scroll (Lenis adds its own glide on top)
    animation: tlScroll,
  });

  /* ---------- Mouse parallax (desktop only) ---------- */
  if (finePointer) {
    const layers = [...document.querySelectorAll('.layer[data-depth]')].map((el) => ({
      d: +el.dataset.depth,
      x: gsap.quickTo(el, 'x', { duration: 1.2, ease: 'power3.out' }),
      y: gsap.quickTo(el, 'y', { duration: 1.2, ease: 'power3.out' }),
    }));
    addEventListener('mousemove', (e) => {
      const nx = e.clientX / innerWidth - 0.5;
      const ny = e.clientY / innerHeight - 0.5;
      layers.forEach((l) => { l.x(-nx * l.d * 2); l.y(-ny * l.d * 1.2); });
    }, { passive: true });
  }

})();
