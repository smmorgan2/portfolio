/* Shared glass refraction (Chrome / Edge only)
   Builds an SVG displacement map that bends whatever is behind an element near its edges,
   like the Figma glass effect. Other browsers can't apply SVG filters to backdrop-filter,
   so they keep the plain frosted blur from site.css.

   Glass.refract(el, opts) adds the filter and the .refract class to el.
     opts.radius   corner radius in the element's own px (default: from CSS border radius)
     opts.edge     width of the bending band, px (default 40)
     opts.strength how far the image bends at the rim, px (default 60)
     opts.flatTop  true = top edge sits flush with the screen and doesn't bend
   Returns { setSize(w, h) } so animated elements can keep the map matched to their size. */
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
  function buildMap(W, H, r, E, flatTop) {
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
        const inTop = !flatTop && y < r, inBot = y > h - r;
        const inL = x < r, inR = x > w - r;
        if ((inL || inR) && (inTop || inBot)) {
          const cx = inL ? r : w - r, cy = inTop ? r : h - r;
          const vx = x - cx, vy = y - cy, len = Math.hypot(vx, vy) || 1;
          dist = r - len; nx = vx / len; ny = vy / len;
        } else {
          const dl = x, dr = w - 1 - x, db = h - 1 - y, dt = flatTop ? Infinity : y;
          dist = Math.min(dl, dr, db, dt);
          if (dist === db) ny = 1; else if (dist === dt) ny = -1; else if (dist === dl) nx = -1; else nx = 1;
        }
        const f = Math.max(0, Math.min(1, 1 - dist / E));
        const m = f * f;
        const i = (y * w + x) * 4;
        d[i] = 128 + Math.round(-nx * m * 127);
        d[i + 1] = 128 + Math.round(-ny * m * 127);
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
        return buildMap(W, H, r, edge, !!opts.flatTop);
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

  window.Glass = { supported, refract };
})();
