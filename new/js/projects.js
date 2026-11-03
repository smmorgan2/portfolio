/* The project list: order here is the order of Previous / Next and of the homepage project scroll.
   live: false hides a project everywhere on the site: no Previous / Next links point to it,
   and its own page sends visitors back to the homepage.

   Homepage project scroll (js/project-scroll.js):
     client + tags = the three pills, in order: agency, design type 1, design type 2
                     (from Figma ProjectSelection_v1a and Sam's demos).
     seq           = the object's full turn from Sam's AE export (frame 000 = rest pose).
                     loop = frames in one seamless turn, when the last frame repeats the first.
     x, y, w, h    = where those frames sit on the 1920x1080 frame artboard at the rest pose
                     (y is negative when the object already pokes over the top edge).

   Composer: cleared by Whipsaw for the site (Oct 30, 2026). */
window.PROJECTS = [
  { id: 'composer',   title: 'Composer',   href: 'composer.html',   live: true,
    client: 'Whipsaw', tags: ['Art Direction', 'Motion'],
    seq: { path: 'img/projects/composer', frames: 180, x: 478, y: -28, w: 925, h: 1171 } },
  { id: 'google-ads', title: 'Google Ads', href: 'google-ads.html', live: true,
    client: 'Entropico', tags: ['Design', 'Motion'],
    seq: { path: 'img/projects/google-ads', frames: 180, loop: 179, x: 414, y: -66, w: 1044, h: 1082 } },
];
