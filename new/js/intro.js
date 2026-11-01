/* Homepage intro
   - First line ("Hi! I'm Sam.") plays on load.
   - The rest of the sentence and the 3D objects are scrubbed by scroll (and reverse on scroll up).
   - Objects drift slightly with the mouse on desktop.
   Timing comes from Sam's AE demo (Intro_demo_v1), in demo seconds minus 1.8s. */
(() => {
  const stage = document.getElementById('stage');
  const cue = document.getElementById('cue');
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
    skate:   { x: 379.5,  y: 704.0, w: 638.8, h: 280.4, px: [1278, 561] },
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
    const s = { canvas, cur: 0 };

    const ready = (im) => im.complete && im.naturalWidth > 0;
    s.draw = () => {
      let i = s.cur;
      while (i > 0 && !ready(s.imgs[i])) i--; // fall back to nearest loaded frame
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (ready(s.imgs[i])) ctx.drawImage(s.imgs[i], 0, 0, canvas.width, canvas.height);
    };
    s.set = (f) => {
      const i = Math.max(0, Math.min(FRAMES - 1, Math.round(f)));
      if (i !== s.cur) { s.cur = i; s.draw(); }
    };
    s.imgs = Array.from({ length: FRAMES }, (_, i) => {
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
  const YELLOW = '#EDFF21';
  const WHITE = '#FFFFFF';
  const word = (t) => [...document.querySelectorAll('.words text')].find((el) => el.textContent === t);
  const photo = document.getElementById('photo');

  // Pop in: hidden until its moment, then fully visible at once (no fade), like the demo.
  function popIn(tl, el, at) {
    gsap.set(el, { autoAlpha: 0 });
    tl.set(el, { autoAlpha: 1 }, at);
  }

  // Word: pops in, rises ~56px with a strong ease out, flashes yellow, then settles to white
  // (highlight words stay yellow).
  function wordIn(tl, el, at) {
    popIn(tl, el, at);
    tl.fromTo(el, { y: 56 }, { y: 0, duration: 0.45, ease: 'expo.out' }, at);
    if (!el.classList.contains('hl')) {
      tl.fromTo(el, { fill: YELLOW }, { fill: WHITE, duration: 0.35, ease: 'power1.out' }, at + 0.15);
    }
  }

  // Object: appears on frame 0, rises 32px (the main-comp Y pop), sequence plays 0 to 30.
  function objIn(tl, key, at) {
    const s = seqs[key];
    const proxy = { f: 0 };
    popIn(tl, s.canvas, at);
    tl.fromTo(s.canvas, { y: 32 }, { y: 0, duration: 0.5, ease: 'expo.out' }, at);
    tl.fromTo(proxy, { f: 0 }, {
      f: FRAMES - 1, duration: 1.0, ease: 'none',
      onUpdate: () => s.set(proxy.f),
    }, at);
  }

  /* ---------- Part 1: autoplay ---------- */
  const tlAuto = gsap.timeline({ paused: true });
  wordIn(tlAuto, word('Hi!'), 0.15);
  popIn(tlAuto, photo, 0.45);
  tlAuto.fromTo(photo, { y: 56 }, { y: 0, duration: 0.6, ease: 'expo.out' }, 0.45);
  wordIn(tlAuto, word('I’m'), 0.85);
  wordIn(tlAuto, word('Sam.'), 1.15);
  wordIn(tlAuto, word('(he/they)'), 1.2);

  /* ---------- Part 2: scroll-scrubbed ---------- */
  const tlScroll = gsap.timeline({ paused: true });
  wordIn(tlScroll, word('I collage'), 0.02); // not exactly 0, or it pops before any scroll
  objIn(tlScroll, 'collage', 0.4);
  wordIn(tlScroll, word('culture'), 0.7);
  wordIn(tlScroll, word('through'), 1.0);
  wordIn(tlScroll, word('design'), 1.4);
  objIn(tlScroll, 'book', 1.65);
  wordIn(tlScroll, word('and'), 2.0);
  wordIn(tlScroll, word('art'), 2.45);
  objIn(tlScroll, 'skate', 2.65);
  wordIn(tlScroll, word('direction.'), 2.95);
  tlScroll.to({}, { duration: 0.6 }, 3.65); // short hold on the full sentence before release

  /* ---------- Reduced motion: show the finished composition, no pin ---------- */
  if (reduced) {
    tlAuto.progress(1);
    tlScroll.progress(1);
    return;
  }

  /* ---------- Scroll control ---------- */
  let cueShown = false;
  const showCue = (on) => {
    if (on === cueShown) return;
    cueShown = on;
    gsap.to(cue, { opacity: on ? 1 : 0, duration: on ? 0.6 : 0.25, overwrite: true });
  };

  // Exposed so the header can appear exactly when this scroll animation ends (js/header.js).
  window.introST = ScrollTrigger.create({
    trigger: '#intro',
    start: 'top top',
    // Scroll distance for the whole build, in screen heights. Lower = more sentence per scroll.
    end: () => '+=' + Math.round(innerHeight * 1.5), // 1.5 screens (Sam, Oct 30: 1.8 too stiff, 1.0 too sensitive)
    pin: true,
    scrub: 0.6, // seconds the animation takes to catch up to the scroll (Lenis adds its own glide on top)
    animation: tlScroll,
    onUpdate: (self) => {
      if (self.progress > 0 && tlAuto.progress() < 1) tlAuto.progress(1); // skip ahead if they scroll early
      showCue(self.progress < 0.02 && tlAuto.progress() === 1);
    },
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

  /* ---------- Start once fonts are in (max 1.5s wait) ---------- */
  const fontsReady = Promise.race([
    document.fonts ? document.fonts.ready : Promise.resolve(),
    new Promise((r) => setTimeout(r, 1500)),
  ]);
  // Arriving through the page transition: start once the tiles have lifted.
  Promise.all([fontsReady, window.txWait]).then(() => {
    if (scrollY > 10) { tlAuto.progress(1); return; } // reloaded mid-page
    tlAuto.play().then(() => {
      if (ScrollTrigger.getAll()[0].progress < 0.02) showCue(true);
    });
  });
})();
