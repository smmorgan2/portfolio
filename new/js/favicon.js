/* Animated tab icon (Sam, Nov 18)
   Chrome won't play an animated favicon, so this swaps the tab icon for one still frame after another.
   The frames are the S-M logo animation (img/logo, as in the header), squared up and shrunk into one
   strip: img/favicon-anim.webp, 93 frames of 48 x 48.
   It plays once after the page settles and once each time you come back to the tab, then puts the
   normal icon back. It doesn't loop: Chrome slows background tabs to about a frame a second, so a loop
   would only stutter there and cost battery. Safari ignores icon swaps, and reduced motion skips it. */
(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const FRAMES = 93, SIZE = 48;
  const FPS = 30 * 1.15;   // same speed as the header logo
  const links = [...document.querySelectorAll('link[rel="icon"]')];
  if (!links.length) return;
  const originals = links.map((l) => l.href);
  const cv = document.createElement('canvas');
  cv.width = cv.height = SIZE;
  const ctx = cv.getContext('2d');
  const strip = new Image();
  let ready = false, playing = false, lastPlay = -Infinity;
  strip.onload = () => { ready = true; play(); };

  function set(href) { links.forEach((l) => { l.href = href; }); }
  function play() {
    if (!ready || playing || document.hidden) return;
    if (performance.now() - lastPlay < 4000) return;   // don't replay on a quick tab flick
    playing = true;
    const start = performance.now();
    let last = -1;
    const step = (now) => {
      const i = Math.floor(((now - start) / 1000) * FPS);
      if (i >= FRAMES || document.hidden) {
        originals.forEach((h, k) => { links[k].href = h; });   // back to the normal icon
        playing = false; lastPlay = performance.now();
        return;
      }
      if (i !== last) {
        last = i;
        ctx.clearRect(0, 0, SIZE, SIZE);
        ctx.drawImage(strip, i * SIZE, 0, SIZE, SIZE, 0, 0, SIZE, SIZE);
        set(cv.toDataURL('image/png'));
      }
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  // Load the strip once the page has settled, then play; replay when the tab comes back into view.
  addEventListener('load', () => setTimeout(() => { strip.src = 'img/favicon-anim.webp'; }, 1200));
  document.addEventListener('visibilitychange', () => { if (!document.hidden) play(); });
})();
