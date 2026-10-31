/* Intro hover cards (Figma: Intro Statement_v5_alt_a)
   "Sam." / "design" / "direction." each reveal one glass card.
   - Pointer: opens on entering the word; stays open while the pointer is on the word or its card;
     closes shortly after it leaves both. Only one card at a time.
   - Keyboard: each word has a transparent button over it. Focus opens, Escape closes.
   - Touch: tapping the word toggles its card; tapping anywhere else closes it.
   - A word's trigger only works once that word has appeared in the intro. */
(() => {
  const CLOSE_DELAY = 120; // ms; bridges tiny gaps between word and card so it never flickers
  const IN = { duration: 0.22, ease: 'power2.out' };
  const OUT = { duration: 0.16, ease: 'power2.in' };
  const RISE = 12;         // artboard px the card rises as it appears
  const COMPACT_BELOW = 0.45; // stage scale under which cards become a bottom sheet

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const touch = matchMedia('(hover: none)').matches;
  const intro = document.getElementById('intro');
  const cardsLayer = document.getElementById('icards');
  const words = [...document.querySelectorAll('.words text')];
  const pairs = [...document.querySelectorAll('.itrig')].map((btn) => ({
    btn,
    word: words.find((w) => w.textContent === btn.dataset.word),
    card: document.getElementById(btn.getAttribute('aria-controls')),
  }));

  let current = null;   // the open pair
  let closeTimer = null;

  /* ---------- Size each trigger to its word ---------- */
  function placeTriggers() {
    pairs.forEach(({ btn, word }) => {
      const b = word.getBBox();
      const pad = 10;
      Object.assign(btn.style, {
        left: b.x - pad + 'px', top: b.y - pad + 'px',
        width: b.width + pad * 2 + 'px', height: b.height + pad * 2 + 'px',
      });
    });
  }
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(placeTriggers);
  placeTriggers();

  /* ---------- Glass refraction on each card (Chrome / Edge), same preset as the header ----------
     Cards sit on the scaled artboard, so artboard px values apply as they are. */
  pairs.forEach(({ card }) => {
    const w = parseFloat(card.style.width), h = parseFloat(card.style.height);
    const g = window.Glass && Glass.refract(card, {
      radius: Math.min(w * 0.097, h * 0.167), edge: Glass.PRESET.edge, strength: Glass.PRESET.strength,
    });
    if (g) g.rebuild(w, h);
  });

  /* ---------- Small screens: bottom sheet ---------- */
  function layout() {
    const s = parseFloat(getComputedStyle(intro).getPropertyValue('--s')) || 1;
    cardsLayer.classList.toggle('compact', s < COMPACT_BELOW);
  }
  layout();
  addEventListener('resize', layout);

  /* ---------- Open / close ---------- */
  function show(pair) {
    clearTimeout(closeTimer);
    if (current === pair) return;
    if (current) hide(current, true);
    current = pair;
    pair.btn.setAttribute('aria-expanded', 'true');
    pair.card.classList.add('is-open');
    gsap.killTweensOf(pair.card);
    if (reduced) { gsap.set(pair.card, { autoAlpha: 1, y: 0 }); return; }
    const compact = cardsLayer.classList.contains('compact');
    gsap.fromTo(pair.card, { autoAlpha: 0, y: compact ? 8 : RISE }, { autoAlpha: 1, y: 0, ...IN });
  }
  function hide(pair, instant) {
    if (!pair) return;
    pair.btn.setAttribute('aria-expanded', 'false');
    pair.card.classList.remove('is-open'); // stops catching the pointer right away
    gsap.killTweensOf(pair.card);
    if (instant || reduced) gsap.set(pair.card, { autoAlpha: 0 });
    else gsap.to(pair.card, { autoAlpha: 0, y: RISE / 2, ...OUT });
    if (current === pair) current = null;
  }
  const hideSoon = () => {
    clearTimeout(closeTimer);
    closeTimer = setTimeout(() => hide(current), CLOSE_DELAY);
  };

  /* ---------- Only live once the word is on screen ---------- */
  const isShown = (el) => getComputedStyle(el).visibility !== 'hidden' && +getComputedStyle(el).opacity > 0.5;
  function sync() {
    pairs.forEach((p) => {
      const live = isShown(p.word);
      if (live !== p.btn.classList.contains('is-live')) {
        p.btn.classList.toggle('is-live', live);
        if (!live && current === p) hide(p, true);
      }
    });
  }
  gsap.ticker.add(sync);

  /* ---------- Wiring ---------- */
  pairs.forEach((pair) => {
    const { btn, card } = pair;
    if (!touch) {
      btn.addEventListener('pointerenter', () => show(pair));
      btn.addEventListener('pointerleave', hideSoon);
      card.addEventListener('pointerenter', () => { if (current === pair) clearTimeout(closeTimer); });
      card.addEventListener('pointerleave', hideSoon);
    }
    // Touch tap toggles. (On desktop, click just keeps it open.)
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (touch && current === pair) hide(pair);
      else show(pair);
    });
    // Keyboard focus opens it. (A tap or click also focuses the button; the click handler covers those.)
    btn.addEventListener('focus', () => { if (btn.matches(':focus-visible')) show(pair); });
    btn.addEventListener('blur', () => { if (current === pair) hide(pair); });
  });

  // Tap outside closes (touch). The card itself doesn't close it.
  document.addEventListener('click', (e) => {
    if (!current) return;
    if (current.card.contains(e.target) || current.btn.contains(e.target)) return;
    hide(current);
  });
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && current) {
      hide(current); // focus stays on the word's button; Tab away and back to reopen
    }
  });
})();
