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
// Phone stills (m): placed from Figma Mobile - Home+ProjectSelection_v2 (633:684, 634:813, 634:727), Nov 16,
// in px of that 402-wide frame. m.rot tilts a still.
// Order (Sam, Nov 18): Google Ads, Spotify, LISTEN, Composer. AT&T goes in once its turntable is rendered.
window.PROJECTS = [
  { id: 'google-ads', title: 'Google Ads', href: 'google-ads.html', live: true,
    client: 'Entropico', tags: ['Design', 'Motion'],
    // Placed to match Figma Website Design > ProjectSelection_v2 (633:537), Nov 16: frame 1, 6% larger, tilted -1deg
    seq: { path: 'img/projects/google-ads', frames: 180, loop: 179, x: 386.7, y: -106.8, w: 1106.6, h: 1146.9, rest: 1, rot: -1 },
    m: { src: 'img/mobile/google-ads.webp', x: -107, y: 121.5, w: 620, h: 654.9 } },
  // Spotify (BYTE): Sam's Blender turntable SpotifyMug_turntable_v02, cropped to the full turn. Placed to
  // match Figma ProjectSelection_v2 (633:583): mug body tilted 13.3deg, 1.39x, handle on the right
  // (frame 31). Case study: spotify.html (Nov 17).
  { id: 'spotify',    title: 'Spotify',    href: 'spotify.html',    live: true,
    client: 'BYTE', tags: ['Design', 'Motion'],
    seq: { path: 'img/projects/spotify', frames: 180, x: 541.2, y: -511.1, w: 925.8, h: 1511.5, rest: 31, rot: 13.3 },
    // Phone still: frame 31 with the same tilt baked in (no Figma phone frame for Spotify yet)
    m: { src: 'img/mobile/spotify.webp', x: 30, y: 10, w: 360, h: 781 } },
  // LISTEN (Figma: Playground > ProjectSelection_v1a 116:89). Sam's plate sequence placed to match the
  // Figma frame: plate scaled 101% at (-13, -104), cropped to the object's full turn.
  { id: 'listen',     title: 'Listen Mag', href: 'listen.html',     live: true,
    client: 'Listen Mag', tags: ['Social', 'Motion'],
    seq: { path: 'img/projects/listen', frames: 180, x: 399.1, y: -2, w: 1065, h: 1196, ease: [0.333, 0, 0.667, 1] },
    m: { src: 'img/mobile/listen.webp', x: -54, y: 158.1, w: 510, h: 577.9, rot: -4 } },
  { id: 'composer',   title: 'Composer',   href: 'composer.html',   live: true,
    client: 'Whipsaw', tags: ['Art Direction', 'Motion'],
    // Placed to match Figma ProjectSelection_v2 (633:506), Nov 16: lands on frame 114 (turned to show the
    // cylinder on the left, as in the Figma), 4% larger, tilted 1deg
    seq: { path: 'img/projects/composer', frames: 180, x: 489, y: 7.7, w: 962, h: 1217.8, rest: 114, rot: 1 },
    m: { src: 'img/mobile/composer.webp', x: 1, y: 126.8, w: 400, h: 628.5 } },
];
