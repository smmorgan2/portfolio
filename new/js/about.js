/* About page (Sam's art direction, about_page_demo.mp4)
   Headline, desktop: the homepage intro's build. "Bringing concepts to life" plays on load; the rest
   is scrubbed by scroll while the headline is pinned, with the same word pop (rise, accent flash, settle).
   - "motion" is Sam's 71-frame render, scrubbed with the scroll: it stretches into the accent
     gradient and settles back. ", [Game Boy] 3D," ride its right edge the whole way (--dx).
   - The Game Boy pops in turning once "motion" has stretched, and lands on its rest pose.
   - The portrait pops in last, like the homepage photo.
   Below: three objects sit still behind the homepage glass; hovering a glass box loops that
   object's turn, and it finishes the turn back to its rest pose when the pointer leaves.
   Phones and tablets (Figma: Mobile - About): a stacked, centred headline, shown static (no animation);
   the objects sit on their rest poses. */
(() => {
  const touch = matchMedia('(hover: none)').matches;
  // Desktop and phones each have their own headline layout (Figma: About_page / Mobile - About)
  const art = document.getElementById(touch ? 'abmArt' : 'abArt');
  if (!art) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isLight = () => document.documentElement.dataset.theme === 'light';
  const pad = (i) => String(i).padStart(3, '0');

  /* ---------- Frame sequences on canvases ---------- */
  function seq(canvas, frames, src) {
    const s = { canvas, cur: 0, sets: {} };
    const ctx = canvas.getContext('2d');
    const ok = (im) => im && im.complete && im.naturalWidth > 0;
    const list = () => {
      const key = src();
      if (!s.sets[key]) s.sets[key] = [];
      return s.sets[key];
    };
    const get = (i) => {
      const L = list();
      if (!L[i]) {
        const im = new Image();
        im.decoding = 'async';
        im.onload = () => {
          if (!canvas.width || canvas.width === 300) { canvas.width = im.naturalWidth; canvas.height = im.naturalHeight; }
          if (i === s.cur || !ok(L[s.cur])) s.draw();
        };
        im.src = `${src()}/${pad(i)}.webp`;
        L[i] = im;
      }
      return L[i];
    };
    s.draw = () => {
      const L = list();
      let i = s.cur;
      if (!ok(L[i])) { get(i); let j = i; while (j > 0 && !ok(L[j])) j--; if (!ok(L[j])) return; i = j; }   // nearest loaded frame
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(L[i], 0, 0, canvas.width, canvas.height);
    };
    s.set = (f) => {
      const i = Math.max(0, Math.min(frames - 1, Math.round(f)));
      if (i !== s.cur) { s.cur = i; s.draw(); }
    };
    s.loadAll = () => { for (let i = 0; i < frames; i++) get(i); };
    get(0);
    return s;
  }

  /* ---------- Headline ---------- */
  // Right edge of the inked "motion" in each of its 71 frames (px in its 581-wide render). The rest of the
  // line was laid out for the widest frame (577), so it shifts by (edge - 577).
  const EDGE = [443,473,489,501,511,519,526,532,538,542,547,550,554,557,560,562,564,566,568,570,571,572,573,574,575,576,576,576,577,577,577,577,577,576,576,576,575,574,573,572,571,570,568,566,564,562,560,557,554,550,547,542,538,532,526,519,511,501,489,473,443,443,443,443,443,443,443,443,443,443,443];
  const MOTION_END = 60;                       // frames 60..70 are the settled word
  const GBA_REST = 60;                         // rest pose (frame 60 = frame 0)
  const motion = seq(art.querySelector('.ab-motion'), 71, () => isLight() ? 'img/about/motion-light' : 'img/about/motion');
  const gba = seq(art.querySelector('[data-seq="gba"]'), 61, () => 'img/about/gba');
  const setMotion = (f) => {
    motion.set(f);
    art.style.setProperty('--dx', EDGE[Math.max(0, Math.min(70, Math.round(f)))] - 577);
  };
  setMotion(0);
  addEventListener('sm-theme', () => motion.draw());   // light mode has its own black / blue render

  const words = [...art.querySelectorAll('svg.words text')];
  const word = (t) => words.find((el) => el.textContent === t);
  const photo = art.querySelector('.ab-photo');
  const motionEl = motion.canvas;
  const gbaEl = gba.canvas;

  function popIn(tl, el, at) { gsap.set(el, { autoAlpha: 0 }); tl.set(el, { autoAlpha: 1 }, at); }
  function wordIn(tl, el, at, flash = true) {
    popIn(tl, el, at);
    tl.fromTo(el, { y: 56 }, { y: 0, duration: 0.45, ease: 'expo.out' }, at);
    if (flash) tl.fromTo(el, { '--flash': 1 }, { '--flash': 0, duration: 0.35, ease: 'power1.out' }, at + 0.15);
  }

  const finish = () => { setMotion(MOTION_END); gba.set(GBA_REST); };
  if (!window.gsap || reduced || touch) {        // phones, and reduced motion: the finished composition, no animation
    finish();
    initItems();
    return;
  }
  gsap.registerPlugin(ScrollTrigger);

  const tlAuto = gsap.timeline({ paused: true });
  wordIn(tlAuto, word('Bringing'), 0.15);
  wordIn(tlAuto, word('concepts'), 0.45);
  if (touch) wordIn(tlAuto, word('to life'), 0.75);   // phones set "to life" on one line
  else { wordIn(tlAuto, word('to'), 0.75); wordIn(tlAuto, word('life'), 1.0); }

  const tl = gsap.timeline({ paused: true });
  wordIn(tl, word('through'), 0.02);
  // "motion" pops in on its first frame, then its render plays with the scroll
  popIn(tl, motionEl, 0.3);
  tl.fromTo(motionEl, { y: 56 }, { y: 0, duration: 0.45, ease: 'expo.out' }, 0.3);
  const mp = { f: 0 };
  tl.fromTo(mp, { f: 0 }, { f: MOTION_END, duration: 1.4, ease: 'none', onUpdate: () => setMotion(mp.f) }, 0.3);
  wordIn(tl, word(','), 0.75, false);
  // Game Boy: pops in on frame 0 and turns to its rest pose
  const gp = { f: 0 };
  popIn(tl, gbaEl, 0.95);
  tl.fromTo(gbaEl, { y: 32 }, { y: 0, duration: 0.5, ease: 'expo.out' }, 0.95);
  tl.fromTo(gp, { f: 0 }, { f: GBA_REST, duration: 1.0, ease: 'none', onUpdate: () => gba.set(gp.f) }, 0.95);
  wordIn(tl, word('3D,'), 1.3);
  wordIn(tl, word('and'), 1.75);
  wordIn(tl, word('graphic'), 2.05);
  wordIn(tl, word('design.'), 2.35);
  popIn(tl, photo, 2.6);
  tl.fromTo(photo, { y: 56 }, { y: 0, duration: 0.6, ease: 'expo.out' }, 2.6);
  tl.to({}, { duration: 0.6 }, 3.2);             // short hold on the full sentence before release
  motion.loadAll(); gba.loadAll();

  const fontsReady = Promise.race([document.fonts ? document.fonts.ready : Promise.resolve(), new Promise((r) => setTimeout(r, 1500))]);
  if (touch) {
    // Phones and tablets: the stacked headline is taller than the screen, so after the first lines play
    // on their own, the rest builds with the scroll as it comes up (no pin).
    ScrollTrigger.create({
      trigger: art, start: 'top top', end: () => '+=' + Math.round(art.offsetHeight * 0.55),
      scrub: 0.6, animation: tl, refreshPriority: 1,
      once: true,   // once built it stays built (no un-building when you scroll back up)
      onUpdate: (self) => { if (self.progress > 0.001 && tlAuto.progress() < 1) tlAuto.progress(1); },
    });
    ScrollTrigger.refresh();
    Promise.all([fontsReady, window.txWait]).then(() => { if (scrollY > 10) tlAuto.progress(1); else tlAuto.play(); });
  } else {
    // Scroll cue, as on the homepage: shows once the first line has played, until the first scroll
    const cue = document.getElementById('abCue');
    let cueShown = false;
    const showCue = (on) => {
      if (!cue || on === cueShown) return;
      cueShown = on;
      gsap.to(cue, { opacity: on ? 1 : 0, duration: on ? 0.6 : 0.25, overwrite: true });
    };
    const st = ScrollTrigger.create({
      trigger: '#abTop', start: 'top top',
      end: () => '+=' + Math.round(innerHeight * 1.5),   // same build length as the homepage intro
      pin: true, scrub: 0.6, animation: tl,
      refreshPriority: 1,   // measured before the footer trigger (js/case.js), so the footer waits for the real end of the page
      onUpdate: (self) => {
        // skip ahead if they scroll early (above a hair: the pin can report ~0.000001 on load)
        if (self.progress > 0.001 && tlAuto.progress() < 1) tlAuto.progress(1);
        showCue(self.progress < 0.02 && tlAuto.progress() === 1);
      },
    });
    ScrollTrigger.refresh();
    Promise.all([fontsReady, window.txWait]).then(() => {
      if (scrollY > 10) { tlAuto.progress(1); return; }
      tlAuto.play().then(() => { if (st.progress < 0.02) showCue(true); });
    });
  }
  initItems();

  /* ---------- Things I like to do: glass over still objects; hover loops the turn ---------- */
  function initItems() {
    const items = ['3ds', 'skate', 'shoe'].map((key) => {
      const canvas = document.querySelector(`.ab-items [data-seq="${key}"]`);
      const box = document.querySelector(`.ab-glass[data-item="${key}"]`);
      return { key, canvas, box, s: seq(canvas, 61, () => `img/about/${key}`), on: false, raf: 0, t0: 0, f0: 0 };
    });
    const FPS = 30, LOOP = 60;                   // 60 frames per turn (frame 60 = frame 0)
    let loaded = false;
    const loadAll = () => { if (!loaded) { loaded = true; items.forEach((it) => it.s.loadAll()); } };

    function tick(it, now) {
      const f = it.f0 + (now - it.t0) / 1000 * FPS;
      if (!it.on && f >= it.stopAt) { it.s.set(0); it.raf = 0; return; }   // finished the turn: rest pose
      it.s.set(f % LOOP);
      it.raf = requestAnimationFrame((t) => tick(it, t));
    }
    function start(it) {
      if (reduced) return;
      loadAll();
      it.on = true;
      if (!it.raf) { it.t0 = performance.now(); it.f0 = it.s.cur; it.raf = requestAnimationFrame((t) => tick(it, t)); }
    }
    function stop(it) {
      if (!it.on) return;
      it.on = false;
      const f = it.f0 + (performance.now() - it.t0) / 1000 * FPS;
      it.stopAt = Math.ceil(f / LOOP) * LOOP;    // keep turning to the next full turn, then rest
    }

    // Same glass refraction as the homepage cards (Chrome / Edge)
    // The boxes aren't on a scaled artboard, so the preset (artboard px) is scaled by the box's size.
    const fitGlass = () => items.forEach((it) => {
      const w = it.box.offsetWidth, h = it.box.offsetHeight;
      if (!w || !window.Glass) return;
      if (!it.g) it.g = Glass.refract(it.box, {
        radius: Math.min(w * 0.097, h * 0.167),
        edge: () => Glass.PRESET.edge * it.box.offsetWidth / 440,
        strength: Glass.PRESET.strength * w / 440,
      });
      it.g.rebuild(w, h);
    });

    if (touch) {
      // Pair each object with its caption, and let it turn while it's on screen
      items.forEach((it) => {
        const wrap = document.createElement('div'); wrap.className = 'ab-item';
        it.canvas.parentNode.insertBefore(wrap, it.canvas);
        wrap.appendChild(it.canvas); wrap.appendChild(it.box);
      });
      // (static on phones: each object stays on its rest pose)
    } else {
      items.forEach((it) => {
        it.box.addEventListener('pointerenter', () => start(it));
        it.box.addEventListener('pointerleave', () => stop(it));
      });
      // Get the turns in once the section is close
      const near = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { loadAll(); near.disconnect(); } }, { rootMargin: '400px 0px' });
      near.observe(document.getElementById('abRest'));
    }
    fitGlass();
    let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(fitGlass, 200); });
  }
})();
