/* Homepage project scroll (Figma: ProjectSelection_v1a; motion refs: Project scroll_demo_v2.1 / v2.2)
   One framed viewport (the ID badge outline) with a glass panel along the bottom. As you scroll,
   each project's 3D object rises from below the frame, travels up through it, breaks over the
   top outline and leaves the screen; the next one rises behind it.

   Layers, bottom to top:
     .ps-clip   object copy + glass panel, clipped to the badge shape: hidden below the frame.
                The panel holds its own blurred copy of the object (a third canvas).
     .ps-frame  the yellow outline.
     .ps-break  a second object copy, unclipped but cut off below y = BREAK_Y (just under the top
                outline). Above that line it draws over the outline, so the object breaks through
                the top instead of being chopped by it. Both copies share one position, so there's no seam.
     .ps-info   project name + three pills, which pop on with the intro's word animation.
     .ps-link   the whole frame links to the active project's case study.

   Scroll drives vertical position only; objects hold their rest pose (frame 00) while you scroll.
   When scrolling pauses, the active object sways slowly around that pose; scrolling again
   eases it straight back. Reduced motion: no travel or sway, the active project simply swaps. */
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
  const info = document.getElementById('psInfo');
  const nameEl = document.getElementById('psName');
  const tagEls = [...document.querySelectorAll('#psTags li')];
  const link = document.getElementById('psLink');
  const linkLabel = link.querySelector('.sr-only');

  /* ---------- Geometry (artboard px, from Figma) ---------- */
  const FRAME = { x: 96.5, y: 55.74, w: 1727, h: 940.53 };
  const FRAME_BOTTOM = FRAME.y + FRAME.h;
  const PANEL = { x: -33.5, y: 718.26 };   // glass panel, relative to the frame
  const BREAK_Y = 62;            // the breakout copy draws above this line (top outline + stroke)
  const COMPACT_BELOW = 0.45;    // stage scale under which the name and pills switch to phone sizes

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

  /* ---------- Objects: two canvases each (clipped + breakout), one shared position ---------- */
  const objs = projects.map((p) => {
    const q = p.seq;
    const mk = (parent, left, top) => {
      const c = document.createElement('canvas');
      c.width = q.w; c.height = q.h;
      Object.assign(c.style, { left: left + 'px', top: top + 'px', width: q.w + 'px', height: q.h + 'px' });
      parent.appendChild(c);
      return c;
    };
    const a = mk(objsLayer, q.x - FRAME.x, q.y - FRAME.y);
    const b = mk(breakLayer, q.x, q.y);
    // Third copy inside the glass panel, blurred there (see .ps-glass in site.css for why).
    const g = mk(glassLayer, q.x - FRAME.x - PANEL.x, q.y - FRAME.y - PANEL.y);
    const o = { p, canvases: [a, b, g], ctx: [a, b, g].map((c) => c.getContext('2d')), imgs: [], cur: -1, want: 0, y: 0, angle: 0, loaded: false };
    o.draw = () => {
      let i = o.want;
      const ok = (im) => im && im.complete && im.naturalWidth > 0;
      if (!ok(o.imgs[i])) i = ok(o.imgs[0]) ? 0 : -1;   // missing frame: fall back to the rest pose
      if (i === o.cur || i < 0) return;
      o.cur = i;
      o.ctx.forEach((ctx) => { ctx.clearRect(0, 0, q.w, q.h); ctx.drawImage(o.imgs[i], 0, 0, q.w, q.h); });
    };
    o.setFrame = (f) => { o.want = ((Math.round(f) % q.frames) + q.frames) % q.frames; o.draw(); };
    o.place = () => { const t = `translate3d(0, ${o.y}px, 0)`; o.canvases.forEach((c) => { c.style.transform = t; }); };
    return o;
  });

  // Load the rest pose first, the rest of each turn after (only once the section is near).
  function load() {
    objs.forEach((o) => {
      if (o.loaded) return;
      o.loaded = true;
      const q = o.p.seq;
      const get = (i) => {
        const im = new Image();
        im.decoding = 'async';
        im.onload = () => { if (i === 0 || i === o.want) { o.cur = -1; o.draw(); } };
        im.src = `${q.path}/${String(i).padStart(2, '0')}.webp`;
        o.imgs[i] = im;
      };
      get(0);
      setTimeout(() => { for (let i = 1; i < q.frames; i++) get(i); }, 300);
    });
  }
  ScrollTrigger.create({ trigger: section, start: 'top bottom+=100%', once: true, onEnter: load });

  /* ---------- Scroll timeline: rise, hold at rest, rise out ---------- */
  const ENTER = 1, HOLD = 0.4, EXIT = 1, STEP = ENTER + HOLD;   // next object rises as this one leaves
  const restMid = (i) => i * STEP + ENTER + HOLD / 2;
  const tl = gsap.timeline({ paused: true });
  objs.forEach((o, i) => {
    const q = o.p.seq;
    const apply = () => o.place();
    const below = () => FRAME_BOTTOM - q.y + 20;              // top of the object just under the frame
    const above = () => -(q.y + q.h) - spaceAbove() - 40;     // bottom of the object past the screen top
    if (reduced) {
      o.y = 0; apply();
      return;
    }
    o.y = below(); apply();
    tl.fromTo(o, { y: below }, { y: 0, duration: ENTER, ease: 'power2.out', onUpdate: apply }, i * STEP);
    tl.to(o, { y: above, duration: EXIT, ease: 'power2.in', onUpdate: apply, immediateRender: false }, i * STEP + STEP);
  });
  const total = (objs.length - 1) * STEP + STEP + EXIT;
  tl.to({}, { duration: 0.001 }, total);   // make sure the timeline spans the whole journey

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
  let active = -2, popTl = null;
  function setActive(i) {
    if (i === active) return;
    active = i;
    if (popTl) popTl.kill();
    if (i < 0) {
      gsap.set([nameEl, ...tagEls], { autoAlpha: 0 });
      link.hidden = true;
      return;
    }
    const p = objs[i].p;
    nameEl.textContent = p.title;
    [p.client, ...p.tags].forEach((t, k) => { if (tagEls[k]) tagEls[k].textContent = t; });
    link.hidden = false;
    link.href = p.href;
    linkLabel.textContent = `${p.title}: ${p.client}, ${p.tags.join(', ')}. View the case study`;
    if (reduced) { gsap.set([nameEl, ...tagEls], { autoAlpha: 1, y: 0, color: '' }); gsap.set(nameEl, { color: WHITE }); return; }
    popTl = gsap.timeline();
    wordIn(popTl, nameEl, 0, true);
    tagEls.forEach((el, k) => wordIn(popTl, el, 0.12 + k * 0.05, false));
  }
  // Which project the scroll is on. Switches only once the time is clearly past a boundary,
  // so tiny scroll wobbles near the line never replay the pop-in.
  const HYS = 0.05;
  const FIRST_IN = 0.35;                    // the first object is far enough up to name it
  const LAST_OUT = (objs.length - 1) * STEP + STEP + 0.55;
  function indexAt(t) {
    if (t < FIRST_IN) return -1;
    if (t > LAST_OUT) return -1;
    for (let i = 0; i < objs.length - 1; i++) if (t < (restMid(i) + restMid(i + 1)) / 2) return i;
    return objs.length - 1;
  }
  function syncActive() {
    const t = tl.time();
    const i = indexAt(t);
    if (i === active) return;
    // Hysteresis: confirm the same answer a little further on either side of t.
    if (indexAt(t - HYS) !== i && indexAt(t + HYS) !== i) return;
    setActive(i);
  }
  function reducedVisibility() {
    objs.forEach((o, k) => o.canvases.forEach((c) => { c.style.visibility = k === active ? 'visible' : 'hidden'; }));
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
    onUpdate: () => { lastScroll = performance.now(); },
  });
  // The name and pills follow the animation itself (which trails the scroll slightly when smoothed).
  tl.eventCallback('onUpdate', () => { syncActive(); if (reduced) reducedVisibility(); });
  window.projectsST = st;
  setActive(indexAt(tl.time()));
  if (reduced) reducedVisibility();

  /* ---------- Idle sway when scrolling pauses ---------- */
  const IDLE_AFTER = 700;   // ms without scroll before the object starts to sway
  const SWAY = 20;          // degrees either side of the rest pose
  const PERIOD = 8;         // seconds per full sway
  const RAMP = 1.5;         // seconds for the sway to grow to full size
  const DEG_PER_FRAME = 360 / 72;
  let idleSince = 0, returning = null;
  if (!reduced) {
    gsap.ticker.add(() => {
      const now = performance.now();
      const o = objs[active];
      const idle = o && now - lastScroll > IDLE_AFTER && st.isActive && Math.abs(o.y) < 260;
      objs.forEach((x) => {
        if (x !== o && x.angle !== 0) { x.angle = 0; x.setFrame(0); }
      });
      if (!o) return;
      if (idle) {
        if (!idleSince) { idleSince = now; if (returning) { returning.kill(); returning = null; } }
        const tt = (now - idleSince) / 1000;
        o.angle = SWAY * Math.min(1, tt / RAMP) * Math.sin((tt / PERIOD) * Math.PI * 2);
        o.setFrame(o.angle / DEG_PER_FRAME);
      } else if (idleSince) {
        // Scrolling again: ease back to the rest pose and hold it.
        idleSince = 0;
        returning = gsap.to(o, { angle: 0, duration: 0.45, ease: 'power2.out',
          onUpdate: () => o.setFrame(o.angle / DEG_PER_FRAME), onComplete: () => { returning = null; } });
      }
    });
  }
})();
