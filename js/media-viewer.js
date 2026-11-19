/* Case-study media viewer
   Every image and video in a case study can be opened larger: a "View larger" button sits over it
   (or in its corner when the video shows its own controls). The viewer is a modal <dialog>, so focus
   stays inside it and Escape closes it. The media is shown as large as the screen allows at its own
   aspect ratio: contained, never cropped or stretched (letterboxed if needed).
   Videos use the full-size original, start playing when the browser allows, and loop; they keep their
   controls, so a blocked autoplay just leaves a play button. Background scrolling is paused and the
   page returns to exactly where it was; focus goes back to the media you opened. */
(() => {
  const figures = [...document.querySelectorAll('.cs-media')];
  if (!figures.length) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- The dialog ---------- */
  const dlg = document.createElement('dialog');
  dlg.className = 'mv';
  dlg.setAttribute('aria-label', 'Media viewer');
  dlg.innerHTML = '<div class="mv-stage"></div>'
    + '<button class="mv-close" type="button" aria-label="Close viewer">'
    + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>'
    + '</button>';
  document.body.appendChild(dlg);
  const stage = dlg.querySelector('.mv-stage');
  const closeBtn = dlg.querySelector('.mv-close');

  let trigger = null, media = null, ratio = 16 / 9, savedY = 0;

  // Largest size that fits the free area at the media's own ratio.
  function size() {
    if (!media) return;
    const pad = Math.max(16, Math.min(innerWidth, innerHeight) * 0.04);
    const cs = getComputedStyle(dlg);
    const availW = innerWidth - pad * 2 - (parseFloat(cs.paddingLeft) || 0) - (parseFloat(cs.paddingRight) || 0);
    const availH = innerHeight - pad * 2 - (parseFloat(cs.paddingTop) || 0) - (parseFloat(cs.paddingBottom) || 0);
    let w = availW, h = w / ratio;
    if (h > availH) { h = availH; w = h * ratio; }
    media.style.width = Math.floor(w) + 'px';
    media.style.height = Math.floor(h) + 'px';
  }

  function open(fig, btn) {
    const src = fig.querySelector('img, video');
    if (!src) return;
    trigger = btn;
    const w = +src.getAttribute('width') || src.naturalWidth || src.videoWidth || 16;
    const h = +src.getAttribute('height') || src.naturalHeight || src.videoHeight || 9;
    ratio = w / h;
    if (src.tagName === 'IMG') {
      media = document.createElement('img');
      media.src = src.currentSrc || src.src;
      media.alt = src.alt || '';
    } else {
      media = document.createElement('video');
      media.src = src.dataset.src || src.currentSrc || src.src;   // the full-size original
      media.poster = src.poster || '';
      media.muted = true;          // the case-study videos carry no sound
      media.loop = true;
      media.playsInline = true;
      media.controls = true;
      media.setAttribute('aria-label', src.getAttribute('aria-label') || 'Video');
    }
    media.className = 'mv-media';
    stage.replaceChildren(media);
    size();

    // Hold the page still and remember exactly where it was.
    savedY = scrollY;
    if (window.lenis) window.lenis.stop();
    document.documentElement.classList.add('mv-open');
    dlg.showModal();
    closeBtn.focus();
    if (!reduced) dlg.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 180, easing: 'ease-out' });

    if (media.tagName === 'VIDEO') {
      const v = media;
      v.play().then(() => { dlg.dataset.playing = 'yes'; }).catch(() => { dlg.dataset.playing = 'blocked'; /* its play control stays */ });
    }
  }

  function close() { if (dlg.open) dlg.close(); }
  dlg.addEventListener('close', () => {
    if (media && media.tagName === 'VIDEO') { media.pause(); media.removeAttribute('src'); media.load(); }
    stage.replaceChildren();
    media = null;
    delete dlg.dataset.playing;
    document.documentElement.classList.remove('mv-open');
    scrollTo(0, savedY);
    if (window.lenis) { window.lenis.scrollTo(savedY, { immediate: true }); window.lenis.start(); }
    if (trigger) trigger.focus({ preventScroll: true });
  });
  closeBtn.addEventListener('click', close);
  // A click on the backdrop closes; clicks on the media or its controls don't.
  dlg.addEventListener('click', (e) => { if (e.target === dlg || e.target === stage) close(); });
  addEventListener('resize', size);

  /* ---------- A trigger on each piece of media ---------- */
  figures.forEach((fig) => {
    const m = fig.querySelector('img, video');
    if (!m) return;
    const label = m.getAttribute('alt') || m.getAttribute('aria-label') || 'media';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'cs-zoom';
    btn.setAttribute('aria-label', `View larger: ${label}`);
    btn.setAttribute('aria-haspopup', 'dialog');
    // A video that shows its own controls (reduced motion) gets a corner button instead of a cover.
    if (m.tagName === 'VIDEO' && m.controls) btn.classList.add('is-corner');
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7"/></svg>';
    btn.addEventListener('click', () => open(fig, btn));
    fig.appendChild(btn);
  });
})();
