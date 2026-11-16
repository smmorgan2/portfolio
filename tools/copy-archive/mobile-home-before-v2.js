/* Phones and tablets: home page (Figma: Mobile - Home+ProjectSelection 439:1076 / 453:267).
   - Intro: "Hi! I'm Sam.", the portrait and the sentence play on their own (no scrolling needed),
     with the same word pop as desktop: rise, flash the accent colour, settle.
   - Projects: one fixed card; only the project still moves (no rotation on touch). Swipe left for the
     next project, right for the previous one; the still follows the finger and lets go with the speed
     of the swipe. Dots under the card show where you are (Compass dot pagination). Tapping the card
     opens the case study.
   Desktop never runs this (its own intro and project scroll live in intro.js / project-scroll.js). */
(() => {
  if (!matchMedia('(hover: none)').matches) return;
  const root = document.getElementById('mHome');
  if (!root || !window.PROJECTS) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const projects = window.PROJECTS.filter((p) => p.live && p.m);
  const mu = () => Math.min(innerWidth, 560) / 402;

  /* ---------- Card ----------
     The card itself (outline, glass, caption) stays put. Only the project stills move: they sit side
     by side one screen-width apart and slide together, like the desktop project view where the object
     changes inside a fixed frame. The caption swaps when a new project lands. */
  const section = document.getElementById('mProjects');
  const trackEl = document.getElementById('mTrack');
  trackEl.innerHTML = `
    <a class="m-card" id="mCard" href="${projects[0].href}">
      <span class="m-outline" aria-hidden="true"></span>
      <div class="m-objs" aria-hidden="true"><div class="m-objs-in">${projects.map((p) => {
        const m = p.m;
        // m.cut (optional): a box in card px to trim off the still, like Sam's Figma "Subtract" on Composer
        let clip = '';
        if (m.cut) {
          const [cx, cy, cw, ch] = m.cut, px = (v) => (v / m.w * 100).toFixed(2) + '%', py = (v) => (v / m.h * 100).toFixed(2) + '%';
          const l = px(cx - m.x), r = px(cx - m.x + cw), t = py(cy - m.y), b = py(cy - m.y + ch);
          clip = `;clip-path:polygon(evenodd,0 0,100% 0,100% 100%,0 100%,0 0,${l} ${t},${r} ${t},${r} ${b},${l} ${b},${l} ${t})`;
        }
        return `<img class="m-still" src="${m.src}" alt="" decoding="async" style="left:calc(${m.x} * var(--mu));top:calc(${m.y} * var(--mu));width:calc(${m.w} * var(--mu));height:calc(${m.h} * var(--mu))${clip}">`;
      }).join('')}</div></div>
      <div class="m-glass"></div>
      <div class="m-fade"><i></i><i></i><i></i></div>
      <span class="m-outline is-front" aria-hidden="true"></span>
      <div class="m-cap" aria-hidden="true">
        <p class="m-name"></p>
        <ul class="m-tags"><li></li><li></li><li></li></ul>
      </div>
    </a>
    <div class="m-dots" role="group" aria-label="Projects">${projects.map((p, i) =>
      `<button type="button" class="m-dot" aria-label="${p.title}, project ${i + 1} of ${projects.length}"></button>`).join('')}</div>`;
  const card = document.getElementById('mCard');
  const stills = [...trackEl.querySelectorAll('.m-still')];
  const dots = [...trackEl.querySelectorAll('.m-dot')];
  const nameEl = trackEl.querySelector('.m-name');
  const tagEls = [...trackEl.querySelectorAll('.m-tags li')];
  if (!stills.length) return;

  function fill(i) {
    const p = projects[i];
    nameEl.textContent = p.title;
    [p.client, ...p.tags].forEach((t, k) => { if (tagEls[k]) tagEls[k].textContent = t; });
    card.href = p.href;
    card.setAttribute('aria-label', `${p.title}: ${p.client}, ${p.tags.join(', ')}. View the case study. Swipe sideways for more projects.`);
    dots.forEach((d, k) => d.setAttribute('aria-current', k === i ? 'true' : 'false'));
  }
  // Same word pop as desktop (js/project-scroll.js): rise, flash the accent colour, settle.
  function popCaption() {
    if (reduced || !window.gsap) return;
    gsap.fromTo(nameEl, { y: 40 * mu(), autoAlpha: 0, '--flash': 1 }, { y: 0, autoAlpha: 1, duration: 0.45, ease: 'expo.out' });
    gsap.to(nameEl, { '--flash': 0, duration: 0.35, ease: 'power1.out', delay: 0.15 });
    tagEls.forEach((el, k) => gsap.fromTo(el, { y: 30 * mu(), autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.45, ease: 'expo.out', delay: 0.12 + k * 0.05 }));
  }

  /* ---------- Swipe ---------- */
  let index = 0, x = 0;            // x = offset of the stills in px (0 = first project in the card)
  let drag = null, swipedAt = 0, settle = null;
  const W = () => root.getBoundingClientRect().width;
  // Stills sit this far apart: a screen width plus room for the widest overhang (Google Ads reaches
  // ~130 Figma px past the card's left edge), so the next one never peeks in while you're at rest.
  // Spaced by the screen, not the column: on a wide tablet the column is narrower than the screen.
  const S = () => Math.max(W(), innerWidth) + 160 * mu();
  const SWIPE_START = 10;          // px sideways before a touch counts as a swipe
  const FLICK = 0.35;              // px/ms: a quick flick changes project even if it's short
  const DISTANCE = 0.22;           // ...otherwise it must be dragged this share of the width

  function render() {
    const w = W(), sp = S();
    stills.forEach((el, i) => {
      const off = i * sp + x;
      el.style.transform = `translate3d(${off}px,0,0)`;
      el.style.visibility = Math.abs(off) < Math.max(w, innerWidth) * 1.6 ? 'visible' : 'hidden';
    });
    // Dots follow the finger: the active pill slides between positions as you drag.
    const pos = Math.max(0, Math.min(projects.length - 1, -x / sp));
    trackEl.style.setProperty('--m-pos', pos.toFixed(3));
  }
  function goTo(i, velocity = 0) {
    const next = Math.max(0, Math.min(stills.length - 1, i));
    const changed = next !== index;
    index = next;
    const target = -index * S();
    if (changed) { fill(index); popCaption(); }
    if (settle) settle.kill();
    if (reduced || !window.gsap) { x = target; render(); return; }
    // A faster swipe finishes faster: the object leaves with the finger's speed.
    const dist = Math.abs(target - x), speed = Math.max(Math.abs(velocity), 0.8);
    const duration = Math.max(0.3, Math.min(0.65, dist / speed / 1000 * 1.6));
    settle = gsap.to({ v: x }, { v: target, duration, ease: 'power3.out', onUpdate() { x = this.targets()[0].v; render(); } });
  }

  section.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' || !e.isPrimary || e.target.closest('.m-dots')) return;
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
    const min = -(stills.length - 1) * S();
    if (nx > 0) nx *= 0.35;                          // rubber band before the first project...
    else if (nx < min) nx = min + (nx - min) * 0.35; // ...and after the last
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
    if (v < -FLICK || moved < -W() * DISTANCE) next = index + 1;
    else if (v > FLICK || moved > W() * DISTANCE) next = index - 1;
    goTo(next, v);
  };
  section.addEventListener('pointerup', end);
  section.addEventListener('pointercancel', end);
  // The tap at the end of a swipe doesn't open the case study.
  card.addEventListener('click', (e) => { if (performance.now() - swipedAt < 400) e.preventDefault(); }, true);
  // Keyboard (a tablet with a keyboard): arrows on the focused card change project.
  card.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); goTo(index + 1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(index - 1); }
  });
  dots.forEach((d, i) => d.addEventListener('click', () => goTo(i)));
  addEventListener('resize', () => { x = -index * S(); render(); });
  // Coming back from a case study through "Projects": show that project, not the first one.
  let from = null;
  try { from = sessionStorage.getItem('sm-from-project'); sessionStorage.removeItem('sm-from-project'); } catch (e) { /* storage blocked */ }
  const back = projects.findIndex((p) => p.id === from);
  if (back > 0 && location.hash === '#mProjects') { index = back; x = -index * S(); }
  fill(index);
  render();

  /* ---------- Intro: plays on its own ---------- */
  const words = [...root.querySelectorAll('.mw')];
  const photo = root.querySelector('.m-photo');
  if (reduced || !window.gsap) return;
  gsap.set([...words, photo, section], { autoAlpha: 0 });
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
  tl.set(section, { autoAlpha: 1 }, after);
  tl.fromTo(section, { y: 60 * mu() }, { y: 0, duration: 0.7, ease: 'expo.out' }, after);

  const fontsReady = Promise.race([document.fonts ? document.fonts.ready : Promise.resolve(), new Promise((r) => setTimeout(r, 1500))]);
  Promise.all([fontsReady, window.txWait]).then(() => {
    if (scrollY > 40) tl.progress(1); else tl.play();
  });
  // Scrolling before it finishes shows everything at once.
  addEventListener('scroll', () => { if (scrollY > 40 && tl.progress() < 1) tl.progress(1); }, { passive: true });
})();
