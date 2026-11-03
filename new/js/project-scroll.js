/* Homepage project scroll (Figma: ProjectSelection_v1a; motion refs: Project scroll_demo_v2.1 / v2.2)
   One framed viewport (the ID badge outline) with a glass panel along the bottom.
   The first project is already resting in the frame when you arrive. Scrolling slides it up and
   out over the top outline while the next one rises in behind it, a fixed gap apart (they move
   together, so they never overlap).

   Rotation is in the visitor's hands, never automatic: moving the pointer left/right over the
   frame turns the active object (no button needed), a sideways one-finger swipe does it on touch,
   and the arrow keys do it when the rotate control has focus. It holds exactly where it's left.

   Layers, bottom to top:
     .ps-clip   object copy + glass panel, clipped to the badge shape: hidden below the frame.
                The panel holds its own blurred copy of the object (see .ps-glass in site.css).
     .ps-frame  the yellow outline.
     .ps-break  a second object copy, unclipped but cut off below y = 62 (just under the top
                outline). Above that line it draws over the outline, so the object breaks through
                the top instead of being chopped by it. All copies share one position: no seam.
     .ps-info   project name + three pills, which pop on with the intro's word animation.
     .ps-link   the whole frame links to the active project's case study (a click; moving never navigates).
     .ps-rot    keyboard rotate control over the same area (role="slider"), plus the "Move to rotate" hint.

   Scroll drives vertical position only. A project always arrives at its landing pose (frame 000).
   Reduced motion: no travel, the active project simply swaps (rotation by hand still works). */
(() => {
  const section = document.getElementById('projects');
  if (!section || !window.PROJECTS || !window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);

  const projects = window.PROJECTS.filter((p) => p.live && p.seq);
  if (!projects.length) { section.hidden = true; return; }

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const objsLayer = document.getElementById('psObjs');
  const breakLayer = document.getElementById('psBreak');
  const glassLayer = document.getElementById('psGlassObjs');
  const nameEl = document.getElementById('psName');
  const tagEls = [...document.querySelectorAll('#psTags li')];
  const link = document.getElementById('psLink');
  const linkLabel = link.querySelector('.sr-only');
  const rot = document.getElementById('psRot');
  // Rotation input state (declared early: setActive clears it).
  let lastX = null;           // pointer baseline; null = not tracking
  let touch = null;           // { id, x, y, mode: 'pending' | 'swipe' | 'scroll' }
  let swipedAt = 0;

  /* ---------- Geometry (artboard px, from Figma) ---------- */
  const FRAME = { x: 96.5, y: 55.74, w: 1727, h: 940.53 };
  const PANEL = { x: -33.5, y: 718.26 };   // glass panel, relative to the frame
  const COMPACT_BELOW = 0.45;              // stage scale under which the name and pills move below the frame

  let s = 1;
  function fit() {
    s = Math.min(innerWidth / 1920, innerHeight / 1080);
    section.style.setProperty('--ps', s);
    section.classList.toggle('compact', s < COMPACT_BELOW);
  }
  fit();
  addEventListener('resize', fit);
  // Room above the artboard on this screen (artboard px), so an exiting object clears the top fully.
  const spaceAbove = () => (innerHeight / s - 1080) / 2;

  /* ---------- Objects: three canvases each (clipped, breakout, glass), one shared position ---------- */
  const objs = projects.map((p) => {
    const q = p.seq;
    const mk = (parent, left, top) => {
      const c = document.createElement('canvas');
      c.width = q.w; c.height = q.h;
      Object.assign(c.style, { left: left + 'px', top: top + 'px', width: q.w + 'px', height: q.h + 'px' });
      parent.appendChild(c);
      return c;
    };
    const cs = [mk(objsLayer, q.x - FRAME.x, q.y - FRAME.y), mk(breakLayer, q.x, q.y),
      mk(glassLayer, q.x - FRAME.x - PANEL.x, q.y - FRAME.y - PANEL.y)];
    const o = { p, q, canvases: cs, ctx: cs.map((c) => c.getContext('2d')), imgs: [], cur: '', want: 0, got: 0, ready: false,
      y: 0, angle: 0, spin: 0, back: null, loaded: false };
    const ok = (im) => im && im.complete && im.naturalWidth > 0;
    // Draws exactly one rendered frame (no blending: the see-through parts would flicker).
    o.draw = () => {
      const i = o.want;
      if (!ok(o.imgs[i]) || String(i) === o.cur) return;   // not loaded yet: keep what's on screen
      o.cur = String(i);
      o.ctx.forEach((ctx) => { ctx.clearRect(0, 0, q.w, q.h); ctx.drawImage(o.imgs[i], 0, 0, q.w, q.h); });
    };
    // angle in degrees -> nearest frame of the turn
    o.setAngle = (a) => {
      o.angle = a;
      const n = q.loop || q.frames;   // frames in one seamless turn (Google Ads repeats frame 000 at the end)
      o.want = ((Math.round(a / (360 / n)) % n) + n) % n;
      o.draw();
    };
    o.place = () => { const t = `translate3d(0, ${o.y}px, 0)`; cs.forEach((c) => { c.style.transform = t; }); };
    o.show = (v) => cs.forEach((c) => { c.style.visibility = v ? 'visible' : 'hidden'; });
    return o;
  });

  // Rest poses first, then each full turn (only once the section is getting close).
  function load() {
    objs.forEach((o) => {
      if (o.loaded) return;
      o.loaded = true;
      o.got = 0; o.ready = false;
      const get = (i) => {
        const im = new Image();
        im.decoding = 'async';
        im.onload = () => { o.ready = ++o.got >= o.q.frames; if (i === 0 || i === o.want) { o.cur = ''; o.draw(); } };
        im.src = `${o.q.path}/${String(i).padStart(3, '0')}.webp`;
        o.imgs[i] = im;
      };
      get(0);
      setTimeout(() => { for (let i = 1; i < o.q.frames; i++) get(i); }, 300);
    });
  }
  ScrollTrigger.create({ trigger: section, start: 'top bottom+=100%', once: true, onEnter: load });

  /* ---------- Scroll timeline: rest, hand-off, rest, ... ----------
     Each hand-off moves the outgoing and incoming objects together with the same ease, starting
     the incoming one exactly GAP below the outgoing one's bottom edge, so they never touch. */
  const HOLD = 0.6;        // timeline time at rest on each project (room to stop and look)
  const MOVE = 1.2;        // timeline time for one hand-off
  const GAP = 160;         // artboard px between the two objects during a hand-off
  const EASE = 'power2.inOut';
  const startOf = (i) => (i + 1) * HOLD + i * MOVE;   // when hand-off i (project i -> i+1) begins
  const total = objs.length * HOLD + (objs.length - 1) * MOVE;
  const tl = gsap.timeline({ paused: true });
  objs.forEach((o, i) => { o.y = 0; o.place(); });
  if (!reduced) {
    for (let i = 0; i < objs.length - 1; i++) {
      const a = objs[i], b = objs[i + 1];
      const dist = (a.q.y + a.q.h) - b.q.y + GAP;                        // b's top sits GAP under a's bottom
      const out = () => Math.min(-dist, -(a.q.y + a.q.h) - spaceAbove() - 40); // a clears the screen top
      const placeA = () => a.place(), placeB = () => b.place();
      b.y = dist; b.place();
      tl.fromTo(b, { y: dist }, { y: 0, duration: MOVE, ease: EASE, onUpdate: placeB, immediateRender: false }, startOf(i));
      tl.fromTo(a, { y: 0 }, { y: out, duration: MOVE, ease: EASE, onUpdate: placeA, immediateRender: false }, startOf(i));
    }
  }
  tl.to({}, { duration: 0.001 }, total);   // the timeline spans the full journey

  /* ---------- Active project: name + pills ---------- */
  // Intro word motion (js/intro.js wordIn): pop in with no fade, rise 56px (expo.out 0.45s),
  // flash the accent colour then settle to the text colour (theme-aware, via --flash). Pills pop and rise the same way, a beat after the name.
  function wordIn(t, el, at, flash) {
    t.set(el, { autoAlpha: 0 }, 0);
    t.set(el, { autoAlpha: 1 }, at);
    t.fromTo(el, { y: 56 }, { y: 0, duration: 0.45, ease: 'expo.out' }, at);
    if (flash) t.fromTo(el, { '--flash': 1 }, { '--flash': 0, duration: 0.35, ease: 'power1.out' }, at + 0.15);
  }
  let active = -1, shown = false, popTl = null;
  function fill(i) {
    const p = objs[i].p;
    nameEl.textContent = p.title;
    [p.client, ...p.tags].forEach((t, k) => { if (tagEls[k]) tagEls[k].textContent = t; });
    link.href = p.href;
    linkLabel.textContent = `${p.title}: ${p.client}, ${p.tags.join(', ')}. View the case study`;
  }
  function pop() {
    if (popTl) popTl.kill();
    if (reduced) { gsap.set([nameEl, ...tagEls], { autoAlpha: 1, y: 0 }); gsap.set(nameEl, { '--flash': 0 }); return; }
    popTl = gsap.timeline();
    wordIn(popTl, nameEl, 0, true);
    tagEls.forEach((el, k) => wordIn(popTl, el, 0.12 + k * 0.05, false));
  }
  function setActive(i) {
    if (i === active) return;
    active = i;
    endTracking();
    objs[i].setAngle(0);              // every arrival (and revisit) starts from the landing pose
    fill(i);
    rot.setAttribute('aria-label', `Rotate the ${objs[i].p.title} object`);
    syncRot();
    if (reduced) objs.forEach((o, k) => o.show(k === i));
    if (shown) pop();
  }
  // Labels appear (with the pop) as the section arrives, already on the first project.
  gsap.set([nameEl, ...tagEls], { autoAlpha: 0 });
  setActive(0);
  ScrollTrigger.create({
    trigger: section, start: 'top 55%',
    onEnter: () => { shown = true; link.hidden = false; pop(); },
    onLeaveBack: () => { shown = false; link.hidden = true; if (popTl) popTl.kill(); gsap.set([nameEl, ...tagEls], { autoAlpha: 0 }); },
  });

  // Which project the scroll is on: switches halfway through each hand-off. A small margin on
  // either side means tiny scroll wobbles near the line never replay the pop.
  const HYS = 0.05;
  const indexAt = (t) => { for (let i = 0; i < objs.length - 1; i++) if (t < startOf(i) + MOVE / 2) return i; return objs.length - 1; };
  function syncActive() {
    const t = tl.time(), i = indexAt(t);
    if (i === active) return;
    if (indexAt(t - HYS) !== i || indexAt(t + HYS) !== i) return;   // too close to the line yet
    setActive(i);
  }

  /* ---------- Pin + scrub, like the intro ---------- */
  const st = ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    end: () => '+=' + Math.round(innerHeight * total * 0.85),
    pin: true,
    scrub: reduced ? true : 0.6,
    animation: tl,
    invalidateOnRefresh: true,
  });
  tl.eventCallback('onUpdate', syncActive);
  window.projectsST = st;

  /* ---------- Rotation by hand ----------
     Pointer: sideways movement over the frame turns the active object, measured from where the
     pointer was a moment ago (not its screen position), so it continues from the current pose.
     Stopping or leaving holds the pose exactly; coming back starts a fresh baseline (no jump). */
  const DEG_PER_PX = 0.5;     // pointer/swipe sensitivity: degrees of turn per screen px moved
  const KEY_STEP = 10;        // degrees per arrow-key press (Shift: x3)
  const SWIPE_START = 10;     // px a touch must travel sideways before it counts as a swipe
  const area = link;          // the frame's hit area (it is also the case study link)
  function endTracking() { lastX = null; touch = null; }
  function current() { return objs[active]; }
  function turnBy(deg) {
    const o = current();
    if (!o || !deg) return;
    o.setAngle(o.angle + deg);
    syncRot();
  }
  function syncRot() {
    const o = current();
    if (!o) return;
    const a = Math.round((((o.angle % 360) + 360) % 360));
    rot.setAttribute('aria-valuenow', String(a));
    rot.setAttribute('aria-valuetext', `${a} degrees`);
  }

  // Mouse / pen: hover, no button.
  area.addEventListener('pointerenter', (e) => { if (e.pointerType !== 'touch') { lastX = e.clientX; section.classList.add('is-rotating'); } });
  const panel = section.querySelector('.ps-glass');
  area.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch') return;
    // Edge light on the glass panel follows the pointer (see .ps-glass::before).
    const r = panel.getBoundingClientRect();
    section.style.setProperty('--mx', (((e.clientX - r.left) / r.width) * 100).toFixed(1) + '%');
    if (lastX === null) { lastX = e.clientX; return; }
    const dx = e.clientX - lastX;
    lastX = e.clientX;
    turnBy(dx * DEG_PER_PX);
  });
  area.addEventListener('pointerleave', (e) => { if (e.pointerType !== 'touch') { lastX = null; section.classList.remove('is-rotating'); } });

  // Touch: a sideways one-finger swipe turns; anything mostly vertical is left to the page scroll.
  // (CSS gives the area touch-action: pan-y, so the browser keeps vertical scrolling native.)
  area.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'touch' || !e.isPrimary) return;
    touch = { id: e.pointerId, x: e.clientX, y: e.clientY, mode: 'pending' };
  });
  area.addEventListener('pointermove', (e) => {
    if (!touch || e.pointerId !== touch.id) return;
    const dx = e.clientX - touch.x, dy = e.clientY - touch.y;
    if (touch.mode === 'pending') {
      if (Math.abs(dx) >= SWIPE_START && Math.abs(dx) > Math.abs(dy) * 1.2) touch.mode = 'swipe';
      else if (Math.abs(dy) >= SWIPE_START) { touch.mode = 'scroll'; return; }
      else return;
    }
    if (touch.mode !== 'swipe') return;
    turnBy(dx * DEG_PER_PX);
    touch.x = e.clientX; touch.y = e.clientY;
    swipedAt = performance.now();
  });
  const endTouch = (e) => { if (touch && e.pointerId === touch.id) touch = null; };
  area.addEventListener('pointerup', endTouch);
  area.addEventListener('pointercancel', endTouch);
  // A tap still opens the case study; the click a browser fires at the end of a swipe does not.
  area.addEventListener('click', (e) => { if (performance.now() - swipedAt < 450) e.preventDefault(); }, true);

  // Keyboard: only while the rotate control has focus.
  rot.addEventListener('keydown', (e) => {
    const step = e.shiftKey ? KEY_STEP * 3 : KEY_STEP;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { e.preventDefault(); turnBy(step); }
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { e.preventDefault(); turnBy(-step); }
    else if (e.key === 'Home') { e.preventDefault(); const o = current(); if (o) { o.setAngle(0); syncRot(); } }
    else if (e.key === 'Enter') { e.preventDefault(); link.click(); }
  });

  // Losing the page or the window drops any tracking, so stale input can't turn anything.
  addEventListener('blur', endTracking);
  document.addEventListener('visibilitychange', () => { if (document.hidden) endTracking(); });

  // An object that has left the screen is set back to its landing pose, out of sight.
  gsap.ticker.add(() => {
    objs.forEach((o, k) => { if (k !== active && o.angle !== 0 && Math.abs(o.y) > 700) o.setAngle(0); });
  });
})();
