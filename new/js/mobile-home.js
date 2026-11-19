/* Phones and tablets: home page as one screen with a sideways carousel (Sam, Nov 19).
   Figma: Mobile - Home+ProjectSelection_v2 (688:300 greeting, 633:684 / 688:229 / 688:258 projects).
   - Slide 1 is the greeting ("Hi! I'm Sam.", the portrait, the sentence), which plays on arrival.
   - Then one slide per project: the still over a glass panel with the title and pills. The glass comes
     in with the first project and stays; only the stills move after that, and the caption swaps.
   - Previous / next buttons on the screen edges (Compass Layout > Carousel), plus swiping and arrow keys.
   - Tapping a project slide opens its case study. Contact lives in the S-M menu.
   The previous phone home (projects, then the greeting further down) is in tools/copy-archive/.
   Desktop never runs this (its own intro and project scroll live in intro.js / project-scroll.js). */
(() => {
  if (!matchMedia('(hover: none)').matches) return;
  const root = document.getElementById('mHome');
  if (!root || !window.PROJECTS) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const projects = window.PROJECTS.filter((p) => (p.live || p.home) && p.m);
  const mu = () => parseFloat(getComputedStyle(root).getPropertyValue('--mu')) || Math.min(innerWidth, 560) / 402;
  const SLIDES = projects.length + 1;      // greeting + projects

  /* ---------- Build the project layer ---------- */
  const section = document.getElementById('mProjects');
  const trackEl = document.getElementById('mTrack');
  const introEl = document.getElementById('mIntro');
  const prevBtn = document.getElementById('mPrev');
  const nextBtn = document.getElementById('mNext');
  // Stills are placed in Figma px on the 402 x 821 artboard, which sits on the bottom edge of the screen
  const place = (m) => `left:calc(50% + ${m.x - 201} * var(--mu));top:calc(100svh + ${m.y - 821} * var(--mu));width:calc(${m.w} * var(--mu));height:calc(${m.h} * var(--mu))`;
  trackEl.innerHTML = `
    <a class="m-card" id="mCard">
      <div class="m-objs" aria-hidden="true"><div class="m-objs-in">${projects.map((p) =>
        `<img class="m-still" src="${p.m.src}" alt="" decoding="async" data-rot="${p.m.rot || 0}" style="${place(p.m)}">`).join('')}</div></div>
      <div class="m-glass"><div class="m-glass-objs" aria-hidden="true">${projects.map((p) =>
        `<img class="m-still" src="${p.m.src}" alt="" decoding="async" data-rot="${p.m.rot || 0}" style="${place(p.m)}">`).join('')}</div></div>
      <div class="m-fade" aria-hidden="true"><i></i><i></i><i></i></div>
      <div class="m-cap" aria-hidden="true">
        <p class="m-name"></p>
        <ul class="m-tags"><li></li><li></li><li></li></ul>
      </div>
    </a>`;
  const card = document.getElementById('mCard');
  const stills = [...trackEl.querySelectorAll('.m-objs .m-still')];
  const glassStills = [...trackEl.querySelectorAll('.m-glass-objs .m-still')];
  const glassEls = [...trackEl.querySelectorAll('.m-glass, .m-fade, .m-cap')];
  const glassObjs = trackEl.querySelector('.m-glass-objs');
  if (window.Glass) Glass.surface(trackEl.querySelector('.m-glass'), { shine: false });
  const nameEl = trackEl.querySelector('.m-name');
  const tagEls = [...trackEl.querySelectorAll('.m-tags li')];

  // Slide 0 is the greeting; slide k (1..n) is project k-1
  function fill(slide) {
    const p = projects[Math.max(0, slide - 1)];
    nameEl.textContent = p.title;
    [p.client, ...p.tags].forEach((t, k) => { if (tagEls[k]) tagEls[k].textContent = t; });
    if (slide > 0 && p.href) {
      card.href = p.href;
      card.setAttribute('aria-label', `${p.title}: ${p.client}, ${p.tags.join(', ')}. View the case study. Project ${slide} of ${projects.length}.`);
      card.tabIndex = 0;
    } else {
      card.removeAttribute('href'); card.removeAttribute('aria-label'); card.tabIndex = -1;
    }
    prevBtn.disabled = slide === 0;
    nextBtn.disabled = slide === SLIDES - 1;
    prevBtn.setAttribute('aria-label', slide === 1 ? 'Previous: hello' : slide > 1 ? `Previous project: ${projects[slide - 2].title}` : 'Previous');
    nextBtn.setAttribute('aria-label', slide < SLIDES - 1 ? `Next project: ${projects[slide].title}` : 'Next');
  }
  // Same word pop as desktop (js/project-scroll.js): rise, flash the accent colour, settle.
  function popCaption() {
    if (reduced || !window.gsap) return;
    gsap.fromTo(nameEl, { y: 40 * mu(), autoAlpha: 0, '--flash': 1 }, { y: 0, autoAlpha: 1, duration: 0.45, ease: 'expo.out' });
    gsap.to(nameEl, { '--flash': 0, duration: 0.35, ease: 'power1.out', delay: 0.15 });
    tagEls.forEach((el, k) => gsap.fromTo(el, { y: 30 * mu(), autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.45, ease: 'expo.out', delay: 0.12 + k * 0.05 }));
  }

  /* ---------- Carousel ---------- */
  let index = 0, x = 0;            // x = scroll offset in px (0 = greeting, -S = first project, ...)
  let drag = null, swipedAt = 0, settle = null;
  // Slides sit this far apart: a screen width plus room for the widest overhang (Google Ads reaches
  // ~130 Figma px past the left edge), so the next still never peeks in at rest.
  const S = () => innerWidth + 160 * mu();
  const SWIPE_START = 10;          // px sideways before a touch counts as a swipe
  const FLICK = 0.35;              // px/ms: a quick flick changes slide even if it's short
  const DISTANCE = 0.22;           // ...otherwise it must be dragged this share of the width

  function render() {
    const sp = S();
    introEl.style.transform = `translate3d(${x}px,0,0)`;
    // The glass, fade and caption come in with the first project, then stay put
    const gx = Math.max(0, sp + x);
    glassEls.forEach((el) => { el.style.transform = gx ? `translate3d(${gx}px,0,0)` : ''; });
    stills.forEach((el, i) => {
      const off = (i + 1) * sp + x;
      const rot = +el.dataset.rot ? ` rotate(${el.dataset.rot}deg)` : '';
      el.style.transform = `translate3d(${off}px,0,0)${rot}`;
      const vis = Math.abs(off) < innerWidth * 1.6 ? 'visible' : 'hidden';
      el.style.visibility = vis;
      const g = glassStills[i];   // the glass's copy, counter to the glass's own move so it stays lined up
      if (g) { g.style.transform = `translate3d(${off - gx}px,0,0)${rot}`; g.style.visibility = vis; }
    });
  }
  function goTo(i, velocity = 0) {
    const next = Math.max(0, Math.min(SLIDES - 1, i));
    const changed = next !== index;
    index = next;
    const target = -index * S();
    if (changed) { fill(index); if (index > 0) popCaption(); }
    if (settle) settle.kill();
    if (reduced || !window.gsap) { x = target; render(); return; }
    // A faster swipe finishes faster: the slide leaves with the finger's speed.
    const dist = Math.abs(target - x), speed = Math.max(Math.abs(velocity), 0.8);
    const duration = Math.max(0.35, Math.min(0.7, dist / speed / 1000 * 1.6));
    settle = gsap.to({ v: x }, { v: target, duration, ease: 'power3.out', onUpdate() { x = this.targets()[0].v; render(); } });
  }

  section.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' || !e.isPrimary || e.target.closest('.m-arrow')) return;
    drag = { id: e.pointerId, x0: e.clientX, y0: e.clientY, start: x, mode: 'pending', samples: [[e.timeStamp, e.clientX]] };
  });
  section.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x0, dy = e.clientY - drag.y0;
    if (drag.mode === 'pending') {
      if (Math.abs(dx) >= SWIPE_START && Math.abs(dx) > Math.abs(dy) * 1.2) { drag.mode = 'swipe'; if (settle) settle.kill(); }
      else if (Math.abs(dy) >= SWIPE_START) { drag = null; return; }
      else return;
    }
    let nx = drag.start + dx;
    const min = -(SLIDES - 1) * S();
    if (nx > 0) nx *= 0.35;                          // rubber band before the greeting...
    else if (nx < min) nx = min + (nx - min) * 0.35; // ...and after the last project
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
    const moved = x - (-index * S());
    let next = index;
    if (v < -FLICK || moved < -innerWidth * DISTANCE) next = index + 1;
    else if (v > FLICK || moved > innerWidth * DISTANCE) next = index - 1;
    goTo(next, v);
  };
  section.addEventListener('pointerup', end);
  section.addEventListener('pointercancel', end);
  // The tap at the end of a swipe doesn't open the case study.
  card.addEventListener('click', (e) => { if (performance.now() - swipedAt < 400 || !card.href) e.preventDefault(); }, true);
  prevBtn.addEventListener('click', () => goTo(index - 1));
  nextBtn.addEventListener('click', () => goTo(index + 1));
  // Keyboard (a tablet with a keyboard): arrow keys anywhere on the page
  addEventListener('keydown', (e) => {
    if (e.target.closest && e.target.closest('input, textarea, .m-menu')) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); goTo(index + 1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(index - 1); }
  });
  addEventListener('resize', () => { if (settle) settle.kill(); x = -index * S(); render(); });
  // The S-M menu's Home and Projects links: the greeting, and the first project
  const fromHash = () => {
    if (location.hash === '#mProjects') goTo(1);
    else if (location.hash === '#top' || location.hash === '') goTo(0);
  };
  addEventListener('hashchange', fromHash);

  // Coming back from a case study through "Projects": show that project.
  let from = null;
  try { from = sessionStorage.getItem('sm-from-project'); sessionStorage.removeItem('sm-from-project'); } catch (e) { /* storage blocked */ }
  const back = projects.findIndex((p) => p.id === from);
  if (location.hash === '#mProjects') index = back >= 0 ? back + 1 : 1;
  x = -index * S();
  fill(index);
  render();

  /* ---------- Greeting: plays on arrival ---------- */
  const words = [...introEl.querySelectorAll('.mw')];
  const photo = introEl.querySelector('.m-photo');
  if (reduced || !window.gsap) return;
  gsap.set([...words, photo], { autoAlpha: 0 });
  const tl = gsap.timeline({ paused: true });
  const wordIn = (el, at, flash = true) => {
    tl.set(el, { autoAlpha: 1 }, at);
    tl.fromTo(el, { y: 56 * mu() * 0.6 }, { y: 0, duration: 0.45, ease: 'expo.out' }, at);
    if (flash) tl.fromTo(el, { '--flash': 1 }, { '--flash': 0, duration: 0.35, ease: 'power1.out' }, at + 0.15);
  };
  // Timing follows the desktop intro: Hi! / photo / I'm / Sam. / (he/they), then the sentence.
  const greet = words.filter((w) => w.closest('.m-greet'));
  const pron = introEl.querySelector('.m-pron');
  const state = words.filter((w) => w.closest('.m-state'));
  wordIn(greet[0], 0.15);
  tl.set(photo, { autoAlpha: 1 }, 0.45);
  tl.fromTo(photo, { y: 40 * mu() }, { y: 0, duration: 0.6, ease: 'expo.out' }, 0.45);
  wordIn(greet[1], 0.85);
  wordIn(greet[2], 1.15, false);
  wordIn(pron, 1.2);
  state.forEach((w, k) => wordIn(w, 1.6 + k * 0.22));
  // Plays once the page (and any page transition) is ready; already done if you arrived on a project
  if (index > 0) tl.progress(1);
  else (window.txWait || Promise.resolve()).then(() => setTimeout(() => tl.play(), 150));
})();
