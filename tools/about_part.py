
# ---------- About v2 (Sam, Nov 19; Figma Website Design > About_page_v2, 697:220) ----------
# Copy is Sam's, word for word from the Figma. Sizes are Figma px on the 1920 artboard (css/about.css,
# one artboard px = var(--u)). The glass Home footer comes from page() and pops up at the end.
# The previous About (headline animation, hobby objects) is in tools/copy-archive/*-before-v2.*
CLIENTS = ['Google', 'Amazon', 'Spotify', 'AT&amp;T', 'Hewlett Packard', 'VAST', 'MassMutual', 'Dickies Medical',
           'Hearst Magazines', 'Planned Parenthood', 'American Folk Art Museum', 'Queens Museum']
EDUCATION = ['ArtCenter College of Design, Graduate Program', 'Otis, Certificate in Typography + Motion Graphics',
             'SVA, Night Classes', 'Pace University, BA Arts Management, Minor in Art History']
LINKS = [('Email', 'mailto:smmorgan2@gmail.com', False),
         ('LinkedIn', 'https://www.linkedin.com/in/sam-morgan-297a02108/', True),
         ('Instagram', 'https://www.instagram.com/sammorgan.mov/', True),
         ('Are.na', 'https://www.are.na/sam_morgan-mov', True)]
lis = lambda items: ''.join(f'<li>{t}</li>' for t in items)
ext = lambda new: ' target="_blank" rel="noopener"' if new else ''
about = f'''
  <section class="ab-lede" aria-labelledby="abProfile">
    <h2 class="ab-label" id="abProfile">Profile</h2>
    <p class="ab-big">I’m a motion designer and art director, born in New York and based in Long Beach, California. I work freelance and I’m currently an Associate Creative Director at Monks. Before that I was a motion designer at Entropico.</p>
  </section>
  <section class="ab-mid">
    <div class="ab-lists">
      <div class="ab-list"><h2 class="ab-label">Clients</h2><ul>{lis(CLIENTS)}</ul></div>
      <div class="ab-list"><h2 class="ab-label">Education</h2><ul>{lis(EDUCATION)}</ul></div>
      <div class="ab-list ab-contact">
        <ul class="ab-links">{''.join(f'<li><a href="{h}"{ext(n)}>{t}</a></li>' for t, h, n in LINKS)}</ul>
        <p>Open to new opportunities.</p>
      </div>
    </div>
    <div class="ab-portrait">
      <img src="img/about/portrait-v2.webp" srcset="img/about/portrait-v2-sm.webp 785w, img/about/portrait-v2.webp 1570w"
           sizes="(max-width: 820px) 100vw, 82vw" width="1570" height="1558" alt="Sam Morgan holding an open laptop, inside a yellow rounded frame">
    </div>
  </section>
  <section class="ab-lede" aria-labelledby="abApproach">
    <h2 class="ab-label" id="abApproach">Approach</h2>
    <p class="ab-big">My work is a synthesis of my history and my curiosity. I find inspiration in the objects that shape my creative path, using them as a foundation for my own design language. I translate complex narratives into clear visual signals by combining 3D, motion, and graphic design.</p>
  </section>
  <section class="ab-cta">
    <p class="ab-cta-line">Let’s work together</p>
    <a class="ab-btn" href="contact.html">Contact</a>
  </section>'''
open(root + 'about.html', 'w').write(page('about', 'About', 'Sam Morgan is a motion designer and art director based in Long Beach, California.', about,
     main_class='ab', foot_label='Back home', foot_links='  <a class="is-dark-rim" href="index.html">Home</a>',
     extra_css=f'<link rel="stylesheet" href="css/about.css?v={V}">\n', extra_js=''))
