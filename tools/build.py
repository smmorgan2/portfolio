# Builds the case-study pages in new/ (google-ads, composer, listen, contact, about) from index.html's header.
# Run: python3 tools/build.py   (after bumping ?v= in new/index.html)
import re, sys
import os
HERE = os.path.dirname(os.path.abspath(__file__))
root = os.path.join(HERE, '..', 'new') + '/'
idx = open(root + 'index.html').read()
V = re.search(r'\?v=(\w+)', idx).group(1)
hdr = re.search(r'<header class="hdr".*?</header>', idx, re.S).group(0)
hdr = hdr.replace('href="#intro" aria-label', 'href="index.html" aria-label')
hdr = hdr.replace('<a href="#intro">Home</a>', '<a href="index.html">Home</a>')
hdr = hdr.replace('<a href="mailto:smmorgan2@gmail.com">Contact</a>', '<a href="contact.html">Contact</a>')
hdr = hdr.replace('<a href="#projects">', '<a href="index.html#projects">')

def media(src, alt, w, h):
    return f'<figure class="cs-media"><img src="{src}" alt="{alt}" width="{w}" height="{h}" loading="lazy" decoding="async"></figure>'

def video(name, folder, alt, w, h, hover=False):
    # Loads only when scrolled near (js/case.js). Phones get videos/<folder>/mobile/<name>.mp4.
    return (f'<figure class="cs-media"><video data-src="videos/{folder}/{name}.mp4" '
            f'poster="img/cases/{folder}/{name}-poster.webp" width="{w}" height="{h}" style="aspect-ratio:{w}/{h}" '
            f'muted loop playsinline preload="none"' + (' data-play="hover"' if hover else '') + f' aria-label="{alt}"></video></figure>')

def page(pid, title, desc, body, main_class='cs', foot_label='More projects',
         foot_links='  <a data-dir="prev" href="index.html">Previous</a>\n  <a data-dir="next" href="index.html">Next</a>',
         extra_css='', extra_js=''):
    h = hdr.replace('<p class="hdr-title">Home</p>', f'<p class="hdr-title">{title}</p>')
    return f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#000000">
<script>/* Saved theme, applied before paint (js/theme.js). Dark unless the visitor chose light. */
try{{if(localStorage.getItem("sm-theme")==="light"){{document.documentElement.dataset.theme="light";document.querySelector('meta[name="theme-color"]').content="#FFFFFF";}}}}catch(e){{}}</script>
<script>/* Arriving through the page transition: cover the page before it paints (js/transition.js) */
try{{if(sessionStorage.getItem("sm-tx")&&!matchMedia("(prefers-reduced-motion: reduce)").matches){{document.documentElement.classList.add("tx-in");window.txWait=new Promise(function(r){{window.__txDone=r;}});}}}}catch(e){{}}</script>
<title>{title} | Sam Morgan</title>
<!-- Test page at /new/ until launch: keep it out of search results. Remove at launch. -->
<meta name="robots" content="noindex">
<meta name="description" content="{desc}">
<link rel="canonical" href="https://sammorgancreative.net/{pid}.html">
<link rel="icon" href="favicon.ico" sizes="48x48"><link rel="icon" href="favicon-32.png" type="image/png" sizes="32x32"><link rel="apple-touch-icon" href="apple-touch-icon.png">
<meta property="og:type" content="website"><meta property="og:site_name" content="Sam Morgan"><meta property="og:title" content="{title} | Sam Morgan">
<meta property="og:description" content="{desc}">
<meta property="og:url" content="https://sammorgancreative.net/{pid}.html"><meta property="og:image" content="https://sammorgancreative.net/img/og.jpg"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<link rel="stylesheet" href="https://use.typekit.net/wpk2hzh.css">
<!-- Bump ?v= on every update so browsers never mix old and new files. -->
<link rel="stylesheet" href="css/site.css?v={V}">
<link rel="stylesheet" href="css/case.css?v={V}">
<link rel="stylesheet" href="css/mobile.css?v={V}">
{extra_css}<!-- Hide this page right away if the project is switched off (js/projects.js) -->
<script src="js/projects.js?v={V}"></script>
</head>
<body data-page="case" data-project="{pid}">
<!-- Page transition screen (js/transition.js) -->
<div class="tx" id="tx" aria-hidden="true"><div class="tx-grid"><span class="tx-tile"><b>S-M</b></span><span class="tx-tile"><b>S-M</b></span><span class="tx-tile"><b>S-M</b></span><span class="tx-tile"><b>S-M</b></span><span class="tx-tile"><b>S-M</b></span><span class="tx-tile"><b>S-M</b></span><span class="tx-tile"><b>S-M</b></span><span class="tx-tile"><b>S-M</b></span><span class="tx-tile"><b>S-M</b></span><span class="tx-tile"><b>S-M</b></span><span class="tx-tile"><b>S-M</b></span><span class="tx-tile"><b>S-M</b></span></div></div>
<!-- Shared shapes: the ID badge (Wii-channel) outline, used as a clip for the glass cards -->
<svg width="0" height="0" style="position:absolute" aria-hidden="true">
  <clipPath id="wiiClip" clipPathUnits="objectBoundingBox">
    <path transform="scale(0.00020080321 0.00036873156)" d="M4980.00 1356.00 C4980.00 1060.68 4974.01 730.17 4950.74 453.66 C4937.10 291.61 4920.91 194.69 4853.51 123.18 C4774.50 39.34 4660.68 31.52 4494.70 24.16 C3896.01 -2.39 3153.43 0.00 2490.00 0.00 C1826.57 0.00 1083.99 -2.39 485.30 24.16 C319.32 31.52 205.50 39.34 126.49 123.18 C59.09 194.69 42.90 291.61 29.26 453.66 C5.99 730.17 0.00 1060.68 0.00 1356.00 C0.00 1651.32 5.99 1981.83 29.26 2258.34 C42.90 2420.39 59.09 2517.31 126.49 2588.82 C205.50 2672.66 319.32 2680.48 485.30 2687.84 C1083.99 2714.39 1826.57 2712.00 2490.00 2712.00 C3153.43 2712.00 3896.01 2714.39 4494.70 2687.84 C4660.68 2680.48 4774.50 2672.66 4853.51 2588.82 C4920.91 2517.31 4937.10 2420.39 4950.74 2258.34 C4974.01 1981.83 4980.00 1651.32 4980.00 1356.00 Z"/>
  </clipPath>
</svg>

{h}
<!-- Light / dark toggle (js/theme.js) -->
<button class="theme-toggle" id="themeToggle" type="button" role="switch" aria-checked="false" aria-label="Light mode"><span class="tt-knob" aria-hidden="true"><svg class="moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z"/></svg><svg class="sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6"/></svg></span></button>

<main class="{main_class}" id="main">
{body}
</main>
<div class="cs-foot-space" id="csFootSpace" aria-hidden="true"></div>

<footer class="cs-foot" id="csFoot" aria-label="{foot_label}">
  <div class="cs-foot-glass"></div>
{foot_links}
</footer>

<script src="js/vendor/gsap.min.js?v={V}"></script>
<script src="js/vendor/ScrollTrigger.min.js?v={V}"></script>
<script src="js/vendor/lenis.min.js?v={V}"></script>
<script src="js/smooth.js?v={V}"></script>
<script src="js/glass.js?v={V}"></script>
<script src="js/header.js?v={V}"></script>
<script src="js/case.js?v={V}"></script>
<script src="js/media-viewer.js?v={V}"></script>
<script src="js/transition.js?v={V}"></script>
<script src="js/theme.js?v={V}"></script>
<script src="js/mobile-menu.js?v={V}"></script>
{extra_js}</body>
</html>
'''

G = 'img/cases/google-ads/'
ga = f'''  <h1 class="sr-only">Google Ads</h1>
  {video('hero', 'google-ads', 'Google Ads social spot: Turn your social content into video ads on Google', 1920, 1080)}
  <p class="cs-statement">How do you make multi-platform journeys<br> speak volumes in just 15 seconds?</p>
  {video('ad-cards', 'google-ads', 'Ad cards for YouTube and Shorts animating across the frame', 1920, 1080)}
  <p class="cs-role"><span>Graphic + Motion Designer (2026)</span><span>Design, Motion</span></p>
  <p class="cs-body">At Entropico, I worked with the Google Ads team to create a suite of ads. My goal was to build on Google’s design system to make an asset suite that could scale across every platform. Movement couldn’t just be decoration. Every motion had to show different pieces of content coming together into one clear message.</p>
  <h2 class="cs-h2">The asset design suite</h2>
  <p class="cs-body">Every spot is built from the same set of parts: rounded ad cards, real Google Ads UI states, a single cursor, and a Launch button. I pulled these straight from Google’s own products, so viewers recognize the interface the second it appears. Keeping the parts consistent meant we could build versions quickly, and they still felt like one campaign.</p>
  {media(G+'suite.webp', 'The asset suite: ad cards on phones, a TV and a tablet, an upload area and a Launch button', 1766, 1198)}
  <p class="cs-body">Simple shapes and small nods to Google’s UI across platforms let the customer’s own content take center stage. Drag and drop became the hero gesture: everyone knows it, it reads in a second, and it shows how easy it is to turn your social into an ad.</p>
  <div class="cs-pair">
    {video('4x5', 'google-ads', 'The 4x5 version: a cursor drags social posts into an ad', 1080, 1350, hover=True)}
    {video('9x16', 'google-ads', 'The 9x16 version of the same moment', 1080, 1920, hover=True)}
  </div>
  <p class="cs-body">The system had to hold up across every social size without being redesigned each time. I set clear rules for safe areas, type size, and where motion starts, so 16x9, 1x1, 4x5, and 9x16 all feel like the same ad.</p>
  {video('sizes', 'google-ads', 'The spot in every size: 16x9, 4x5, 9x16 and 1x1', 1920, 1080)}'''

C = 'img/cases/composer/'
def beat(n, side, alt, cap):
    m = media(C+f'beat-{n}.webp', alt, 1184, 666)
    cls = 'cs-beat is-right' if side == 'right' else 'cs-beat'
    return f'''<div class="{cls}">
    {m}
    <p class="cs-caption">{cap}</p>
  </div>'''

co = f'''  <h1 class="sr-only">Composer, for Whipsaw</h1>
  {video('film', 'composer', 'Composer featurette: The disposal for the next 100 years', 1920, 1080)}
  <p class="cs-statement">How do you show a brand and a product<br> are one system in under 30 seconds?</p>
  {video('brand-line', 'composer', 'Brand line on Avocado green: Quietly crushing it.', 1920, 1080)}
  <p class="cs-role"><span>Motion Art Director (2026)</span><span>Art Direction, Motion</span></p>
  <p class="cs-body">Whipsaw is widely recognized for their industrial design, but they wanted to show prospective clients that their work goes deeper. They needed to prove they also handle the full brand strategy: the positioning, the archetype, the typography, and the digital identity. I was hired to create a sizzle reel that bridged this gap. The goal was to show that for the Composer disposal, the branding and the product were built as a single, unified system.</p>
  <h2 class="cs-h2">Storyboard vs. final animation</h2>
  <p class="cs-body">I started by turning Whipsaw’s brand deck into a story. Two details in their work already proved the “one system” idea, so I built the film around them: three of the brand’s tone of voice lines ship word for word as site copy, and the color names (Avocado, Kumquat, Oatmeal, Black Sesame, Blueberry) are the product’s own finish names. Putting those side by side on screen makes the link between the object and the identity.</p>
  {video('storyboard', 'composer', 'Storyboard next to the final animation, side by side', 1920, 1080)}
  <p class="cs-body">The film follows three beats: the product’s longevity, its core features, then the brand hook. I used the existing 3D renders as design elements rather than just showing the product in a vacuum. This kept the focus on the brand identity while still showcasing the industrial design.</p>
  {beat(1, 'left', 'Opening frame: The disposal for the next 100 years', 'Opens on a defining statement about the product.')}
  {beat(2, 'right', 'Feature frame: Engineered Safety, with the Composer splash guard', 'Pairs lines from the brand’s tone of voice with the product details that prove them.')}
  {beat(3, 'left', 'Avocado color card over a field of avocados', 'Color cards show each finish name and how it feels on the product.')}
  {beat(4, 'right', 'Brand touch points together: type, logo, color cards and tagline', 'Closes on every brand touchpoint meshed with the product renders: one system.')}
  <p class="cs-body">I designed the assets in Figma and created storyboards to map out the motion before moving into production. I delivered two versions: a 30-second 16x9 film for web and a 9x16 version for social. Both keep the same pacing and visual weight, so the brand feels the same on every platform.</p>
  {video('formats', 'composer', 'The film in 16x9 and 9x16', 1920, 1080)}'''

open(root + 'google-ads.html', 'w').write(page('google-ads', 'Google Ads', 'Google Ads for Entropico: an asset suite that scales across every platform. Design and motion by Sam Morgan.', ga))
open(root + 'composer.html', 'w').write(page('composer', 'Composer', 'Composer for Whipsaw: a brand and a product shown as one system in under 30 seconds. Art direction and motion by Sam Morgan.', co))
exec(open(os.path.join(HERE, 'listen_part.py')).read())
exec(open(os.path.join(HERE, 'about_part.py')).read())
print('built with v=' + V)

ct = '''  <h1 class="sr-only">Contact</h1>
  <ul class="ct-links">
    <li><a href="mailto:smmorgan2@gmail.com">Email</a></li>
    <li><a href="https://www.linkedin.com/in/sam-morgan-297a02108/" target="_blank" rel="noopener">LinkedIn</a></li>
    <li><a href="https://www.instagram.com/sammorgan.mov/" target="_blank" rel="noopener">Instagram</a></li>
  </ul>'''
open(root + 'contact.html', 'w').write(page('contact', 'Contact', 'Get in touch with Sam Morgan: email, LinkedIn, and Instagram.', ct,
     main_class='ct', foot_label='Back home', foot_links='  <a class="is-dark-rim" href="index.html">Home</a>'))
