/* Shared glass refraction (Chrome / Edge only)
   Builds an SVG displacement map that bends whatever is behind an element near its edges,
   like the Figma glass effect. Other browsers can't apply SVG filters to backdrop-filter,
   so they keep the plain frosted blur from site.css.

   Glass.refract(el, opts) adds the filter and the .refract class to el.
     opts.radius   corner radius in the element's own px (default: from CSS border radius)
     opts.edge     width of the bending band, px (default 40)
     opts.strength how far the image bends at the rim, px (default 60)
     opts.flatTop  true = top edge sits flush with the screen and doesn't bend
     opts.flatBottom  same for the bottom edge (footers)
     opts.magnify  0..1: the middle of the glass enlarges what's behind it, like a lens (Compass
                   "Liquid Glass", Nov 16). The rim bend sits on top of it.
   Returns { setSize(w, h) } so animated elements can keep the map matched to their size.

   Glass.surface(el) adds the Compass-style surface on top of any glass (all browsers): a thin light
   rim (bright top-left, faint bottom-right), a faint rainbow dispersion ring, and a soft shine that
   follows the pointer. Glass.lensFilter(id, W, H, opts) makes a plain SVG filter (not tied to an
   element's backdrop) for glass that refracts a copy of the artwork instead (the project strip). */
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const brands = (navigator.userAgentData && navigator.userAgentData.brands) || [];
  const supported = brands.some((b) => /Chromium/.test(b.brand)) && !reduced;
  const NS = 'http://www.w3.org/2000/svg';
  let defs = null;
  let count = 0;

  function ensureDefs() {
    if (defs) return defs;
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('width', '0');
    svg.setAttribute('height', '0');
    svg.setAttribute('aria-hidden', 'true');
    svg.style.position = 'absolute';
    defs = document.createElementNS(NS, 'defs');
    svg.appendChild(defs);
    document.body.appendChild(svg);
    return defs;
  }

  // Displacement map for a rounded rectangle: neutral grey in the middle; near the rim,
  // pixels point inward so the edge samples from further inside (the lens bend).
  function buildMap(W, H, r, E, flatTop, flatBottom, magnify, rimK = 1, magnifyY = null) {
    const k = 0.5; // half resolution; the filter stretches it back up
    const w = Math.max(2, Math.round(W * k)), h = Math.max(2, Math.round(H * k));
    r *= k; E = Math.max(3, E * k);
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const ctx = c.getContext('2d');
    const img = ctx.createImageData(w, h);
    const d = img.data;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let dist, nx = 0, ny = 0;
        const inTop = !flatTop && y < r, inBot = !flatBottom && y > h - r;
        const inL = x < r, inR = x > w - r;
        if ((inL || inR) && (inTop || inBot)) {
          const cx = inL ? r : w - r, cy = inTop ? r : h - r;
          const vx = x - cx, vy = y - cy, len = Math.hypot(vx, vy) || 1;
          dist = r - len; nx = vx / len; ny = vy / len;
        } else {
          const dl = x, dr = w - 1 - x, db = flatBottom ? Infinity : h - 1 - y, dt = flatTop ? Infinity : y;
          dist = Math.min(dl, dr, db, dt);
          if (dist === db) ny = 1; else if (dist === dt) ny = -1; else if (dist === dl) nx = -1; else nx = 1;
        }
        const f = Math.max(0, Math.min(1, 1 - dist / E));
        const m = f * f;
        // Lens: every pixel samples a little nearer the middle, so the middle looks enlarged.
        // (Relative to the half size; scaled into the channel so it shares the rim's range.)
        let mx = 0, my = 0;
        if (magnify) {
          const hx = w / 2, hy = h / 2;
          mx = ((x - hx) / hx) * magnify;
          my = ((y - hy) / hy) * (magnifyY ?? magnify * Math.min(1, h / w));
        }
        const i = (y * w + x) * 4;
        d[i] = 128 + Math.max(-127, Math.min(127, Math.round((-nx * m * rimK - mx) * 127)));
        d[i + 1] = 128 + Math.max(-127, Math.min(127, Math.round((-ny * m * rimK - my) * 127)));
        d[i + 2] = 128;
        d[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    return c.toDataURL();
  }

  function refract(el, opts = {}) {
    const noop = { setSize() {}, rebuild() {}, build() { return ''; }, use() {} };
    if (!supported) return noop;
    const id = 'glassRefract' + (++count);
    const filter = document.createElementNS(NS, 'filter');
    filter.setAttribute('id', id);
    filter.setAttribute('color-interpolation-filters', 'sRGB');
    filter.innerHTML =
      '<feImage x="0" y="0" preserveAspectRatio="none" result="map"/>' +
      '<feDisplacementMap in="SourceGraphic" in2="map" xChannelSelector="R" yChannelSelector="G"/>';
    ensureDefs().appendChild(filter);
    const feImage = filter.querySelector('feImage');
    const feDisp = filter.querySelector('feDisplacementMap');
    feDisp.setAttribute('scale', opts.strength ?? 60);
    el.style.setProperty('--refract', `url(#${id})`);
    el.classList.add('refract');

    const api = {
      // Build a map for a given size and return it (so callers can cache maps for several sizes).
      build(W, H) {
        const r = opts.radius ?? (parseFloat(getComputedStyle(el).borderBottomLeftRadius) || 0);
        const edge = typeof opts.edge === 'function' ? opts.edge() : (opts.edge ?? 40);
        return buildMap(W, H, r, edge, !!opts.flatTop, !!opts.flatBottom, opts.magnify || 0);
      },
      // Show a map built earlier, sized to W x H.
      use(href, W, H) {
        feImage.setAttribute('href', href);
        api.setSize(W, H);
      },
      // Rebuild the map at the element's current size (call after resizes, not every frame).
      rebuild(w, h) {
        const W = w ?? el.offsetWidth, H = h ?? el.offsetHeight;
        if (!W || !H) return;
        api.use(api.build(W, H), W, H);
      },
      // Stretch the existing map to a new size (cheap; fine to call every animation frame).
      setSize(w, h) {
        feImage.setAttribute('width', w);
        feImage.setAttribute('height', h);
      },
    };
    return api;
  }

  // Shared look for every glass object. Values are in 1920-wide artboard px:
  // scale them by the page scale when the element itself isn't scaled (like the header).
  const PRESET = { edge: 60, strength: 75, magnify: 0.5 };

  /* ---------- Surface: rim, dispersion and pointer shine (every browser) ---------- */
  function surface(el, opts = {}) {
    if (!el || el.querySelector(':scope > .lg-shine')) return;
    // opts.rim = false: no rim or dispersion ring (the homepage cards have no outline, Sam Oct 30)
    (opts.rim === false ? ['lg-shine'] : ['lg-shine', 'lg-disp', 'lg-rim']).forEach((c) => {
      const s = document.createElement('span'); s.className = c; s.setAttribute('aria-hidden', 'true'); el.appendChild(s);
    });
    if (opts.shine === false || !matchMedia('(hover: hover)').matches) return;
    // The shine follows the pointer anywhere on the page, so the light seems to come from it
    let raf = 0, px = 0, py = 0;
    addEventListener('pointermove', (e) => {
      px = e.clientX; py = e.clientY;
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const r = el.getBoundingClientRect();
        if (!r.width || !r.height) return;
        el.style.setProperty('--shine-x', ((px - r.left) / r.width * 100).toFixed(1) + '%');
        el.style.setProperty('--shine-y', ((py - r.top) / r.height * 100).toFixed(1) + '%');
      });
    }, { passive: true });
  }

  /* ---------- A lens filter for a copy of the artwork (the project strip) ----------
     Unlike refract(), this filters an element itself (filter: url(#id)), not its backdrop. Chrome /
     Edge only, like refract(); other browsers get the CSS magnify fallback (.lg-lens-css). */
  function lensFilter(id, W, H, opts = {}) {
    if (!supported) return false;
    const filter = document.createElementNS(NS, 'filter');
    filter.setAttribute('id', id);
    filter.setAttribute('color-interpolation-filters', 'sRGB');
    filter.setAttribute('filterUnits', 'userSpaceOnUse');
    filter.setAttribute('x', 0); filter.setAttribute('y', 0); filter.setAttribute('width', W); filter.setAttribute('height', H);
    const href = buildMap(W, H, opts.radius || 0, opts.edge ?? 60, !!opts.flatTop, !!opts.flatBottom, opts.magnify || 0, opts.rim ?? 1, opts.magnifyY ?? null);
    filter.innerHTML =
      `<feImage x="0" y="0" width="${W}" height="${H}" preserveAspectRatio="none" href="${href}" result="map"/>` +
      `<feDisplacementMap in="SourceGraphic" in2="map" scale="${opts.strength ?? 75}" xChannelSelector="R" yChannelSelector="G"/>`;
    ensureDefs().appendChild(filter);
    return true;
  }

  if (supported) document.documentElement.classList.add('lg-svg');
  window.Glass = { supported, refract, surface, lensFilter, PRESET };
})();
