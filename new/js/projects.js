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

   Order (Nov 12, Sam): Google Ads leads, on advice from a motion art director who reviewed the book.

   Composer: cleared by Whipsaw for the site (Oct 30, 2026). */
// Order (Sam, Nov 15; Figma Website Design > ProjectSelection_v2): Google Ads, LISTEN, Composer.
// Spotify and AT&T go after Composer once their turntables are rendered.
window.PROJECTS = [
  { id: 'google-ads', title: 'Google Ads', href: 'google-ads.html', live: true,
    client: 'Entropico', tags: ['Design', 'Motion'],
    // Placed to match Figma Website Design > ProjectSelection_v2 (633:537), Nov 16: frame 1, 6% larger, tilted -1deg
    seq: { path: 'img/projects/google-ads', frames: 180, loop: 179, x: 386.7, y: -106.8, w: 1106.6, h: 1146.9, rest: 1, rot: -1 },
    m: { src: 'img/mobile/google-ads.webp', x: -129.8, y: -19.1, w: 604, h: 638 } },
  // LISTEN (Figma: Playground > ProjectSelection_v1a 116:89). Sam's plate sequence placed to match the
  // Figma frame: plate scaled 101% at (-13, -104), cropped to the object's full turn.
  { id: 'listen',     title: 'Listen Mag', href: 'listen.html',     live: true,
    client: 'Listen Mag', tags: ['Social', 'Motion'],
    seq: { path: 'img/projects/listen', frames: 180, x: 399.1, y: -2, w: 1065, h: 1196, ease: [0.333, 0, 0.667, 1] },
    m: { src: 'img/mobile/listen.webp', x: -71, y: 52.6, w: 447, h: 506.5 } },
  { id: 'composer',   title: 'Composer',   href: 'composer.html',   live: true,
    client: 'Whipsaw', tags: ['Art Direction', 'Motion'],
    // Placed to match Figma ProjectSelection_v2 (633:506), Nov 16: lands on frame 114 (turned to show the
    // cylinder on the left, as in the Figma), 4% larger, tilted 1deg
    seq: { path: 'img/projects/composer', frames: 180, x: 489, y: 7.7, w: 962, h: 1217.8, rest: 114, rot: 1 },
    m: { src: 'img/mobile/composer.webp', x: -29, y: -36.4, w: 415, h: 652, cut: [350, 300, 80, 170] } },
  // Spotify (BYTE): Sam's Blender turntable SpotifyMug_turntable_v02, cropped to the full turn. Placed to
  // match Figma ProjectSelection_v2 (633:583): mug body tilted 13.3deg, 1.39x, handle on the right
  // (frame 31). No case study yet, so it shows on the homepage only (home: true, live: false).
  { id: 'spotify',    title: 'Spotify',    href: null,              live: false, home: true,
    client: 'BYTE', tags: ['Design', 'Motion'],
    seq: { path: 'img/projects/spotify', frames: 180, x: 541.2, y: -511.1, w: 925.8, h: 1511.5, rest: 31, rot: 13.3 } },
];
