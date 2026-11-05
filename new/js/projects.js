/* The project list: order here is the order of Previous / Next and of the homepage project scroll.
   live: false hides a project everywhere on the site: no Previous / Next links point to it,
   and its own page sends visitors back to the homepage.

   Homepage project scroll (js/project-scroll.js):
     client + tags = the three pills, in order: agency, design type 1, design type 2
                     (from Figma ProjectSelection_v1a and Sam's demos).
     seq           = the object's full turn from Sam's AE export (frame 000 = rest pose).
                     loop = frames in one seamless turn, when the last frame repeats the first.
                     ease = the turn was rendered with an ease (After Effects bezier); evened out in code.
     x, y, w, h    = where those frames sit on the 1920x1080 frame artboard at the rest pose
                     (y is negative when the object already pokes over the top edge).

   Phones and tablets (js/mobile-home.js, Figma Mobile - Home+ProjectSelection):
     m = the still on the project card: Sam's export (src), placed like the Figma frame: top-left
         corner (x, y) and size (w, h) in Figma px, measured from the card's top-left corner.
         cut = optional [x, y, w, h] box (card px) trimmed off the still (Figma "Subtract").

   Composer: cleared by Whipsaw for the site (Oct 30, 2026). */
window.PROJECTS = [
  { id: 'composer',   title: 'Composer',   href: 'composer.html',   live: true,
    client: 'Whipsaw', tags: ['Art Direction', 'Motion'],
    seq: { path: 'img/projects/composer', frames: 180, x: 478, y: -28, w: 925, h: 1171 },
    m: { src: 'img/mobile/composer.webp', x: -29, y: -36.4, w: 415, h: 652, cut: [350, 326, 30, 78] } },
  { id: 'google-ads', title: 'Google Ads', href: 'google-ads.html', live: true,
    client: 'Entropico', tags: ['Design', 'Motion'],
    seq: { path: 'img/projects/google-ads', frames: 180, loop: 179, x: 414, y: -66, w: 1044, h: 1082 },
    m: { src: 'img/mobile/google-ads.webp', x: -129.8, y: -19.1, w: 604, h: 638 } },
  // LISTEN (Figma: Playground > ProjectSelection_v1a 116:89). Sam's plate sequence placed to match the
  // Figma frame: plate scaled 101% at (-13, -104), cropped to the object's full turn.
  { id: 'listen',     title: 'Listen Mag', href: 'listen.html',     live: true,
    client: 'Listen Mag', tags: ['Social', 'Motion'],
    seq: { path: 'img/projects/listen', frames: 180, x: 399.1, y: -2, w: 1065, h: 1196, ease: [0.333, 0, 0.667, 1] },
    m: { src: 'img/mobile/listen.webp', x: -62, y: 59.6, w: 430, h: 483 } },
];
