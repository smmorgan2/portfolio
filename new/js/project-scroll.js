/* Homepage project scroll (Figma: ProjectSelection_v1a; motion refs: Project scroll_demo_v2.1 / v2.2)
   One framed viewport (the ID badge outline) with a glass panel along the bottom.
   The first project is already resting in the frame, turning slowly, when you arrive.
   Scrolling slides it up and out over the top outline while the next one rises in behind it,
   a fixed gap apart (they move together, so they never overlap). The new one settles at rest,
   then starts turning once you stop scrolling.

   Layers, bottom to top:
     .ps-clip   object copy + glass panel, clipped to the badge shape: hidden below the frame.
                The panel holds its own blurred copy of the object (see .ps-glass in site.css).
     .ps-frame  the yellow outline.
     .ps-break  a second object copy, unclipped but cut off below y = 62 (just under the top
                outline). Above that line it draws over the outline, so the object breaks through
                the top instead of being chopped by it. All copies share one position: no seam.
     .ps-info   project name + three pills, which pop on with the intro's word animation.
     .ps-link   the whole frame links to the active project's case study.

   Scroll drives vertical position only; objects hold their rest pose (frame 000) while moving.
   Reduced motion: no travel or turning, the active project simply swaps. */
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
      const n = q.frames;
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
  // flash yellow then settle to white. Pills pop and rise the same way, a beat after the name.
  const YELLOW = '#EDFF21', WHITE = '#FFFFFF';
  function wordIn(t, el, at, flash) {
    t.set(el, { autoAlpha: 0 }, 0);
    t.set(el, { autoAlpha: 1 }, at);
    t.fromTo(el, { y: 56 }, { y: 0, duration: 0.45, ease: 'expo.out' }, at);
    if (flash) t.fromTo(el, { color: YELLOW }, { color: WHITE, duration: 0.35, ease: 'power1.out' }, at + 0.15);
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
    if (reduced) { gsap.set([nameEl, ...tagEls], { autoAlpha: 1, y: 0 }); gsap.set(nameEl, { color: WHITE }); return; }
    popTl = gsap.timeline();
    wordIn(popTl, nameEl, 0, true);
    tagEls.forEach((el, k) => wordIn(popTl, el, 0.12 + k * 0.05, false));
  }
  function setActive(i) {
    if (i === active) return;
    active = i;
    fill(i);
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
  let lastScroll = performance.now();
  const st = ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    end: () => '+=' + Math.round(innerHeight * total * 0.85),
    pin: true,
    scrub: reduced ? true : 0.6,
    animation: tl,
    invalidateOnRefresh: true,
  });
  addEventListener('scroll', () => { lastScroll = performance.now(); }, { passive: true });
  tl.eventCallback('onUpdate', syncActive);
  window.projectsST = st;

  /* ---------- Turning: a slow full turn whenever the active object is at rest ---------- */
  if (reduced) return;
  const IDLE_AFTER = 450;   // ms without scrolling before turning starts
  const TURN = 6;           // seconds per full turn: the speed of Sam's render (180 frames at 30fps)
  const RAMP = 0.6;         // a short ease up to speed so it doesn't kick
  let idleSince = 0, prev = performance.now();
  const inView = () => { const r = section.getBoundingClientRect(); return r.top < innerHeight * 0.3 && r.bottom > innerHeight * 0.7; };
  // Back to the rest pose the short way round, quicker for small angles.
  function settle(o) {
    if (o.back || o.angle === 0) return;
    const a = ((o.angle % 360) + 540) % 360 - 180;   // same pose, as -180..180
    o.setAngle(a);
    o.back = gsap.to(o, { angle: 0, duration: 0.45 + (Math.abs(a) / 360) * 1.1, ease: 'sine.out',
      onUpdate: () => o.setAngle(o.angle), onComplete: () => { o.back = null; o.setAngle(0); } });
  }
  gsap.ticker.add(() => {
    const now = performance.now(), dt = Math.min(0.1, (now - prev) / 1000);
    prev = now;
    const o = objs[active];
    const resting = o && o.ready && Math.abs(o.y) < 2 && inView() && now - lastScroll > IDLE_AFTER;
    objs.forEach((x) => { if (x !== o || !resting) { x.spin = 0; settle(x); } });
    if (!resting) { idleSince = 0; return; }
    if (o.back) { o.back.kill(); o.back = null; }
    if (!idleSince) idleSince = now;
    const k = Math.min(1, (now - idleSince) / 1000 / RAMP);
    o.spin = (360 / TURN) * (1 - Math.cos(Math.PI * k)) / 2;   // speed eases in from zero, no kick
    o.setAngle(o.angle + o.spin * dt);
  });
})();
