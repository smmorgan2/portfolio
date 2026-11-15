
# ---------- LISTEN (Figma: Playground > LISTEN_v1b, 532:45) ----------
# Copy: cut down Nov 14 2026 after the portfolio review (short intro, two lines down the page, captions).
# The long version is in tools/copy-archive/listen-2026-11-14.md. Videos are from his old LISTEN page in the repo.
# The moodboard and the logo pair are images that live only in Figma: each section appears as soon
# as its export is in img/cases/listen/ (moodboard.webp, logo-old.webp, logo-new.webp).
import os
L = 'img/cases/listen/'
def have(*names): return all(os.path.exists(root + L + n) for n in names)
def row(items, cols, gap):
    return f'<div class="cs-row" style="--n:{cols};--gx:{gap}">' + ''.join(items) + '</div>'
parts = ['  <h1 class="sr-only">Listen Mag</h1>',
  '  ' + video('hero', 'listen', 'LISTEN Digital Issue, July 2025: Tinashe in a grocery aisle with the LISTEN wordmark', 1920, 1080),
  '  <p class="cs-statement">How do you give a music magazine a<br> motion identity that puts the artist first?</p>']
parts.append('  ' + video('moodboard', 'listen', 'Moodboard: references from music, film and editorial design', 1772, 996))
parts.append('  ' + intro('Art Director (2025)', ['Social', 'Motion'],
    'LISTEN is a home for up-and-coming artists. I helped the founder rebrand it in 2021. In 2025 the job was motion.',
    'Features include Lolo Zouaï, Sam Gellaitry, Anna of the North, and Audrey Nuna.',
    'The idea was simple: the artist comes first. The identity works with their visuals.'))
if have('logo-old.webp', 'logo-new.webp'):
    parts.append('  ' + row([media(L + 'logo-old.webp', 'The 2021 LISTEN logo', 871, 600), media(L + 'logo-new.webp', 'The simplified 2025 LISTEN wordmark', 871, 600)], 2, 24))
parts += [
  # Sam's three logo concepts (logo 5 full, idea 3.2, idea 7), cropped square
  '  ' + row([video('sq-1', 'listen', 'Logo concept: the wordmark builds in', 1080, 1080),
              video('sq-2', 'listen', 'Logo concept: a fast forward reveal with chevrons', 1080, 1080),
              video('sq-3', 'listen', 'Logo concept: the wordmark collapses into a bar', 1080, 1080)], 3, 24),
  '  <p class="cs-body">The crossbar of the T opens into a frame. That frame holds everything else in the system.</p>',
  '  ' + video('logo', 'listen', 'The LISTEN logo animation: the crossbar of the T opens into a frame', 1920, 1080),
  '  <p class="cs-body">Must Listen, the weekly series, rolls out as a grid post and as a reel.</p>',
  '  ' + row([video('ml-1', 'listen', 'Must Listen grid post: FKA Twigs', 1080, 1350),
              video('ml-2', 'listen', 'Must Listen grid post: Chappell Roan', 1080, 1350),
              video('ml-3', 'listen', 'Must Listen grid post: Charli XCX', 1080, 1350)], 3, 160),
  '  ' + row([video('reel-1', 'listen', 'BTS reel: Chappell Roan', 1080, 1920),
              video('reel-2', 'listen', 'Must Listen reel', 1080, 1920),
              video('reel-3', 'listen', 'BTS reel: Tinashe', 1080, 1920)], 3, 160),
  '  ' + media(L + 'posters.webp', 'Three LISTEN issue posters on a street wall', 1766, 858),
  '  <p class="cs-caption cs-note">Static posters accompany each new issue rollout.</p>',
  '  ' + video('billboard', 'listen', 'A LISTEN billboard on a city building', 1920, 1080),
  '  <p class="cs-caption cs-note">The same system at billboard scale.</p>']
open(root + 'listen.html', 'w').write(page('listen', 'Listen Mag', 'Listen Mag: a motion identity for a music magazine that puts the artist first. Art direction and motion by Sam Morgan.', '\n'.join(parts), main_class='cs cs--listen'))
