/* Tab icon flicker (Sam, Nov 19): the tab icon switches back and forth between the two S-M logos,
   the yellow badge (dark mode) and the blue one (light mode). Two small PNGs, swapped on a timer,
   so it costs almost nothing. Chrome slows timers in background tabs to about once a second, which
   still reads as a flicker. Safari ignores icon swaps; reduced motion keeps the normal icon.
   The earlier version played the full logo animation: tools/copy-archive/favicon-anim-before-flicker.js */
(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const SWAP_MS = 700;
  const links = [...document.querySelectorAll('link[rel="icon"]')];
  if (!links.length) return;
  const logos = ['img/favicon-yellow.png', 'img/favicon-blue.png'];
  logos.forEach((src) => { new Image().src = src; });   // load both first so the swap never shows a gap
  let i = 0;
  setInterval(() => {
    i = 1 - i;
    links.forEach((l) => { l.type = 'image/png'; l.href = logos[i]; });
  }, SWAP_MS);
})();
