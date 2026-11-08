
# ---------- About (Sam's art direction: about_page_demo.mp4, Nov 8) ----------
# Copy is Sam's, word for word from the demo. Every position is in 1920-wide artboard px, measured
# from the demo frame (type matched to Halyard at 150px, the same size as the homepage intro).
# Top artboard: 1920 x 1000 (pinned while the headline builds). Rest: 1920 x 1746 below it.
def glass(key, x, y, lines, tx, ty):
    # Caption glass: the homepage hover-card glass (Wii badge shape), 440 x 237. The caption is SVG
    # text so its baselines land exactly where the demo has them.
    t = ''.join(f'<text x="{tx}" y="{ty + i * 46}">{l}</text>' for i, l in enumerate(lines))
    return (f'<div class="ab-glass" data-item="{key}" style="left:calc({x} * var(--u));top:calc({y} * var(--u))">'
            f'<svg viewBox="0 0 440 237" aria-hidden="true">{t}</svg><p class="sr-only">{" ".join(lines)}</p></div>')

def obj(key, x, y, w, h, cls='ab-o'):
    return f'<canvas class="{cls}" data-seq="{key}" style="left:calc({x} * var(--u));top:calc({y} * var(--u));width:calc({w} * var(--u));height:calc({h} * var(--u))"></canvas>'

about = f'''  <h1 class="sr-only">Bringing concepts to life through motion, 3D, and graphic design.</h1>
  <section class="ab-top" id="abTop">
    <div class="ab-art" id="abArt" aria-hidden="true">
      <div class="ab-photo" id="abPhoto"><img src="img/about/me.webp" alt="" width="525" height="468"></div>
      <canvas class="ab-o ab-motion" id="abMotion" width="581" height="176"></canvas>
      <div class="ab-follow ab-gba-wrap">{obj('gba', 1270, 398, 257.4, 226.5, 'ab-o ab-gba')}</div>
      <svg class="words ab-words" viewBox="0 0 1920 1000">
        <text class="w" x="137.8" y="357">Bringing</text>
        <text class="w" x="685" y="357">concepts</text>
        <text class="w" x="1268.4" y="357">to</text>
        <text class="w" x="1421.6" y="357">life</text>
        <text class="w" x="138.4" y="536">through</text>
        <g class="ab-follow-svg"><text class="w" x="1255.9" y="536">,</text><text class="w" x="1493.2" y="536">3D,</text></g>
        <text class="w" x="138.3" y="717">and</text>
        <text class="w" x="398.9" y="717">graphic</text>
        <text class="w" x="885.7" y="717">design.</text>
      </svg>
    </div>
  </section>
  <section class="ab-rest" id="abRest">
    <p class="ab-body">My work is a synthesis of my history and my curiosity. I find inspiration in the objects that shaped my creative path as a child, using them as a foundation for my own design language. I translate complex narratives into clear visual signals by combining 3D, motion, and graphic design. I don’t just build assets; I create cohesive systems that turn cultural influences into polished, purposeful brand experiences.</p>
    <h2 class="ab-h2">Things I like to do when I’m not designing</h2>
    <div class="ab-items">
      {obj('3ds', 38, 702, 493.65, 423.45)}
      {obj('skate', 602, 620, 1233.2, 636.4)}
      {obj('shoe', 468.25, 955.1, 718.4, 522.6)}
      {glass('3ds', 103, 759, ['Play my modded 3Ds'], 61, 127)}
      {glass('skate', 1005, 824, ['Skateboard with friends', 'at the skatepark'], 38, 105)}
      {glass('shoe', 578, 1160, ['Go on long walks', 'along the beach'], 91, 104)}
    </div>
  </section>'''
open(root + 'about.html', 'w').write(page('about', 'About', 'Sam Morgan brings concepts to life through motion, 3D, and graphic design.', about,
     main_class='ab', foot_label='Back home', foot_links='  <a class="is-dark-rim" href="index.html">Home</a>',
     extra_css=f'<link rel="stylesheet" href="css/about.css?v={V}">\n', extra_js=f'<script src="js/about.js?v={V}"></script>\n'))
