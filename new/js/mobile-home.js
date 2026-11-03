/* Phones and tablets: home page (Figma: Mobile - Home+ProjectSelection 439:1076 / 453:267).
   - Intro: "Hi! I'm Sam.", the portrait and the sentence play on their own (no scrolling needed),
     with the same word pop as desktop: rise, flash the accent colour, settle.
   - Projects: one card at a time with a still of the object (no rotation on touch).
     Swipe left for the next project, right for the previous one; the card follows the finger
     and lets go with the speed of the swipe. Tapping the card opens the case study.
   Desktop never runs this (its own intro and project scroll live in intro.js / project-scroll.js). */
(() => {
  if (!matchMedia('(hover: none)').matches) return;
  const root = document.getElementById('mHome');
  if (!root || !window.PROJECTS) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const projects = window.PROJECTS.filter((p) => p.live && p.m);
  const mu = () => Math.min(innerWidth, 560) / 402;

  /* ---------- Cards ---------- */
  const section = document.getElementById('mProjects');
  const trackEl = document.getElementById('mTrack');
  const slides = projects.map((p, i) => {
    const m = p.m, src = `${p.seq.path}/${String(m.frame).padStart(3, '0')}.webp`;
    const h = m.w * (p.seq.h / p.seq.w);
    const s = document.createElement('div');
    s.className = 'm-slide';
    s.innerHTML = `
      <a class="m-card" href="${p.href}" aria-label="${p.title}: ${p.client}, ${p.tags.join(', ')}. View the case study"${i ? ' tabindex="-1"' : ''}>
        <img class="m-outline" src="img/mobile/card-outline.svg" alt="" aria-hidden="true">
        <div class="m-obj" style="inset:0">
          <img src="${src}" alt="" decoding="async" style="left:calc(${m.cx - m.w / 2} * var(--mu));top:calc(${m.cy - h / 2} * var(--mu));width:calc(${m.w} * var(--mu));height:calc(${h} * var(--mu));transform:rotate(${m.rot}deg)">
        </div>
        <div class="m-glass"></div>
        <img class="m-outline is-front" src="img/mobile/card-outline.svg" alt="" aria-hidden="true">
        <div class="m-cap" aria-hidden="true">
          <p class="m-name">${p.title}</p>
          <ul class="m-tags">${[p.client, ...p.tags].map((t) => `<li>${t}</li>`).join('')}</ul>
        </div>
      </a>`;
    trackEl.appendChild(s);
    return s;
  });
  if (!slides.length) return;

  /* ---------- Swipe ---------- */
  let index = 0, x = 0;            // x = track offset in px (0 = first card centred)
  let drag = null, swipedAt = 0, settle = null;
  const W = () => root.getBoundingClientRect().width;
  const SWIPE_START = 10;          // px sideways before a touch counts as a swipe
  const FLICK = 0.35;              // px/ms: a quick flick changes card even if it's short
  const DISTANCE = 0.22;           // ...otherwise the card must be dragged this share of the width

  function render() {
    const w = W();
    slides.forEach((s, i) => {
      const off = i * w + x;
      s.style.transform = `translate3d(${off}px,0,0)`;
      s.classList.toggle('is-on', i === index);
      s.classList.toggle('is-near', Math.abs(off) < w * 0.999 && i !== index);
    });
  }
  function popCaption(i) {
    if (reduced || !window.gsap) return;
    const cap = slides[i].querySelector('.m-cap');
    const name = cap.querySelector('.m-name'), pills = [...cap.querySelectorAll('li')];
    gsap.fromTo(name, { y: 40 * mu(), autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.45, ease: 'expo.out' });
    pills.forEach((el, k) => gsap.fromTo(el, { y: 30 * mu(), autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.45, ease: 'expo.out', delay: 0.1 + k * 0.05 }));
  }
  function goTo(i, velocity = 0) {
    const changed = i !== index;
    index = Math.max(0, Math.min(slides.length - 1, i));
    slides.forEach((s, k) => s.querySelector('.m-card').tabIndex = k === index ? 0 : -1);
    const target = -index * W();
    if (settle) settle.kill();
    if (reduced || !window.gsap) { x = target; render(); return; }
    // A faster swipe finishes faster: the card leaves with the finger's speed.
    const dist = Math.abs(target - x), speed = Math.max(Math.abs(velocity), 0.8);
    const duration = Math.max(0.28, Math.min(0.6, dist / speed / 1000 * 1.6));
    settle = gsap.to({ v: x }, { v: target, duration, ease: 'power3.out', onUpdate() { x = this.targets()[0].v; render(); } });
    if (changed) popCaption(index);
  }

  section.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' || !e.isPrimary) return;
    drag = { id: e.pointerId, x0: e.clientX, y0: e.clientY, start: x, mode: 'pending', samples: [[e.timeStamp, e.clientX]] };
  });
  section.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x0, dy = e.clientY - drag.y0;
    if (drag.mode === 'pending') {
      if (Math.abs(dx) >= SWIPE_START && Math.abs(dx) > Math.abs(dy) * 1.2) { drag.mode = 'swipe'; if (settle) settle.kill(); }
      else if (Math.abs(dy) >= SWIPE_START) { drag = null; return; }   // vertical: leave it to the page scroll
      else return;
    }
    let nx = drag.start + dx;
    const min = -(slides.length - 1) * W();
    if (nx > 0) nx *= 0.35;                          // rubber band past the first card...
    else if (nx < min) nx = min + (nx - min) * 0.35; // ...and past the last
    x = nx; render();
    drag.samples.push([e.timeStamp, e.clientX]);
    if (drag.samples.length > 6) drag.samples.shift();
    swipedAt = performance.now();
  });
  const end = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const d = drag; drag = null;
    if (d.mode !== 'swipe') return;
    const [t0, x0] = d.samples[0], [t1, x1] = d.samples[d.samples.length - 1];
    const v = (x1 - x0) / Math.max(1, t1 - t0);     // px per ms, + = moving right
    const moved = x - (-index * W());
    let next = index;
    if (v < -FLICK || moved < -W() * DISTANCE) next = index + 1;
    else if (v > FLICK || moved > W() * DISTANCE) next = index - 1;
    goTo(next, v);
  };
  section.addEventListener('pointerup', end);
  section.addEventListener('pointercancel', end);
  // The tap at the end of a swipe doesn't open the case study.
  section.addEventListener('click', (e) => { if (performance.now() - swipedAt < 400) e.preventDefault(); }, true);
  // Keyboard (e.g. a tablet with a keyboard): arrows on a focused card change project.
  section.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); goTo(index + 1); slides[index].querySelector('.m-card').focus(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(index - 1); slides[index].querySelector('.m-card').focus(); }
  });
  addEventListener('resize', () => { x = -index * W(); render(); });
  render();

  /* ---------- Intro: plays on its own ---------- */
  const words = [...root.querySelectorAll('.mw')];
  const photo = root.querySelector('.m-photo');
  const card = section;
  if (reduced || !window.gsap) return;
  gsap.set([...words, photo, card], { autoAlpha: 0 });
  const tl = gsap.timeline({ paused: true });
  const wordIn = (el, at, flash = true) => {
    tl.set(el, { autoAlpha: 1 }, at);
    tl.fromTo(el, { y: 56 * mu() * 0.6 }, { y: 0, duration: 0.45, ease: 'expo.out' }, at);
    if (flash) tl.fromTo(el, { '--flash': 1 }, { '--flash': 0, duration: 0.35, ease: 'power1.out' }, at + 0.15);
  };
  // Timing follows the desktop intro: Hi! / photo / I'm / Sam. / (he/they), then the sentence.
  const greet = words.filter((w) => w.closest('.m-greet'));
  const pron = root.querySelector('.m-pron');
  const state = words.filter((w) => w.closest('.m-state'));
  wordIn(greet[0], 0.15);
  tl.set(photo, { autoAlpha: 1 }, 0.45);
  tl.fromTo(photo, { y: 40 * mu() }, { y: 0, duration: 0.6, ease: 'expo.out' }, 0.45);
  wordIn(greet[1], 0.85);
  wordIn(greet[2], 1.15, false);
  wordIn(pron, 1.2);
  state.forEach((w, k) => wordIn(w, 1.6 + k * 0.22));
  const after = 1.6 + state.length * 0.22;
  tl.set(card, { autoAlpha: 1 }, after);
  tl.fromTo(card, { y: 60 * mu() }, { y: 0, duration: 0.7, ease: 'expo.out' }, after);

  const fontsReady = Promise.race([document.fonts ? document.fonts.ready : Promise.resolve(), new Promise((r) => setTimeout(r, 1500))]);
  Promise.all([fontsReady, window.txWait]).then(() => {
    if (scrollY > 40) tl.progress(1); else tl.play();
  });
  // Scrolling before it finishes shows everything at once.
  addEventListener('scroll', () => { if (scrollY > 40 && tl.progress() < 1) tl.progress(1); }, { passive: true });
})();
