# Sam Morgan Portfolio — CLAUDE.md

## Overview
Single-page portfolio app for Sam Morgan (he/they), Brand + Motion Designer. One self-contained `index.html` file using vanilla HTML/CSS/JS — no frameworks. Deployed to GitHub Pages at https://smmorgan2.github.io/portfolio. Videos are hosted on GitHub in a `videos/` folder relative to `index.html`.

## Architecture
All code lives in a single `index.html`. The site is a client-side SPA with custom routing:
- **Landing page** → parallax scroll to Portfolio
- **Portfolio** → card deck with virtual scroll
- **Project pages** → Amazon Ads, Google Ads, Spotify, LISTEN, R&Company
- **About page**

## Design Tokens
- **Fonts**: DM Sans (primary), Aktiv Grotesk (role text, `-0.05em` letter spacing)
- **Colors**: `--green: #00FF1E`, `--bg: #F8FAFF`, `--black: #000000`
- **Border radius**: 5px everywhere
- **Grid gaps**: 20px
- **Section margins**: 48px
- **Nav padding**: `var(--g)` = `clamp(20px, 3.8vw, 52px)`

## Key Sections & Status

### Landing Page — LOCKED
Character-by-character "Sam Morgan" slide-in with green color transition, role text, S-M logo, Portfolio text. Do NOT modify without explicit instruction.
- **Role title**: "Brand + Motion Designer" (updated from "Motion Art Director" — better reflects work shown)

### Card Deck (Portfolio Scroll)
- Virtual scroll with 16:9 video cards using `object-fit: cover`
- Current params: `PEEK=28, PAD_BASE=40, STEP=28` (25% increase from original 22)
- `NAV_INSET` computed from `--g` at startup — front card edges align with "S-M" and "Menu" nav text
- No height cap — cards may bleed off viewport bottom (intentional)
- Front card exits via `translateY` slide-down
- `_hasScrolled` flag gates the last card fade-in after first scroll cycle
- **Scroll feel:** `wheelVel *= 0.92` decay, `0.01` threshold, gentle settle at `0.035` eased to nearest card boundary; settle gated on `!_touchActive`
- No scroll snap — smooth momentum only

### Project Pages
- Character-split title animations
- Line-by-line scroll-reveal for body copy (20 words per line chunk)
- Statement text: 6 words per line chunk, `max-width: 55%`, right-aligned
- Body copy: 18px, white, 400 weight, full content width (no max-width)
- Featured Work section with hover-to-play video thumbnails
- `featVideo` property allows separate featured work thumbnails from hero videos
- Per-page featured work filtering excludes the current project
- Featured work order: Google Ads → LISTEN → Spotify (for Amazon Ads page)
- Featured Work to footer spacing: 100px bottom padding on `.pj-feat`
- **Title/tag alignment:** `.pj-head` uses `align-items:flex-end`; `.pj-h1` has `padding-bottom:0.04em` to compensate for `line-height:0.92` causing text to bleed 0.04em below the line box — this aligns the visual bottom of the title with the category tags

### Page Transitions — LOCKED
Green scanner overlay sweeps between pages. Pages stay still during transitions (no translateY shifts on outgoing/incoming pages). Do NOT add parallax movement to pages during transitions.

### About Page — Built

### Mobile — Built
- `isMobile = window.matchMedia('(hover:none)').matches` gates all mobile behavior
- **Landing page skipped:** `#pg-land` hidden on load; opens directly to card deck
- **Card size:** `Math.round(window.innerHeight * 0.70)` height (portrait-responsive)
- **Edge inset:** `NAV_INSET * 0.5` (50% of desktop inset)
- **Backward swiping:** enabled — no `sRaw < 0` clamp
- **Touch multiplier:** `5.0` for responsive single-swipe navigation
- **Video lazy loading:** all project-page videos use `preload="none"`; IntersectionObserver with `rootMargin:'200px 0px 0px 0px'` triggers `load()` + `play()` as sections scroll into view — prevents ~70MB cold load
- **Mobile video swap:** `mSrc()` helper rewrites `videos/X.mp4` → `videos/mobile/X.mp4` when `isMobile`; used in `mkMedia()`, the featured-work builder, and a startup pass over static `<video>` tags. `videos/mobile/` holds lightweight re-encodes (1280px long edge, CRF 23, faststart, audio stripped). **When adding any new video, also generate its `videos/mobile/` twin** or mobile will 404 (slash-button). Regenerate: `ffmpeg -i in.mp4 -vf "scale=1280:1280:force_original_aspect_ratio=decrease:force_divisible_by=2" -c:v libx264 -profile:v high -pix_fmt yuv420p -crf 23 -preset medium -movflags +faststart -an videos/mobile/in.mp4`
- **Mobile menu:** full-screen `#mob-menu` overlay (position:fixed, inset:0, z-index:550, black bg); Menu↔Close text toggle on `.n-menu-btn`; staggered link fade-in with `transition-delay`; `.n-dropdown` suppressed with `display:none!important` in `@media(hover:none)` to prevent iOS double-tap bug (first tap activates CSS `:hover`, second fires click)
- **Menu links:** Contact (mailto), About (navGo), CV (PDF download); all call `closeMobMenu()` on click

## Project Data (PROJECTS array)
1. **Amazon Ads** — fully built with videos in all slots (hero, 2-col, banner, 3-col, wide banner)
2. **Google Ads** — fully built. Custom layout (see below). All videos live.
3. **Spotify** — fully built. Custom layout: wide → body → 6-sq grid → wide cover → stickers
4. **LISTEN** — fully built with all media slots filled, `featured: true`
5. **R&Company** — fully built. Custom layout: hero → statement → 3-col → body → wide cover

## Google Ads Page — Custom Layout
Built 2026-04-26. Uses a custom `else if(p.id==='google-ads')` block in `buildProjectPages()`.

**Layout order:**
1. Head (title + tags)
2. Hero — `G-THI25B-ThinkSocials-LOreal-16x9.mp4`
3. Statement — "Demystifying Google Ads, one social video at a time."
4. 3-col square grid (`pj-6sq`) — Sephora, Asset Studio, MoneyGroup 1:1 videos
5. Body copy
6. Wide 1:1 square container (aspect-ratio override: `style="aspect-ratio:1/1"`) — ClickUp video, no black bars
7. Featured Work + Footer

**Videos used:**
- Hero: `videos/G-THI25B-ThinkSocials-LOreal-16x9.mp4`
- featVideo: `videos/G-THI25B_ThinkSocials_LOreal_1x1_V06.mp4`
- col3[0]: `videos/G-THI25B_ThinkSocials_Sephora_1x1_V06.mp4`
- col3[1]: `videos/G-THI25B_ThinkSocials_Asset%20Studio_1x1_V10.mp4`
- col3[2]: `videos/G-THI25B_ThinkSocials_MoneyGroup_1x1_V07.3.mp4`
- wideVid: `videos/G-THI25B_ThinkSocials_ClickUp_1x1_V11.mp4`

**Copy:**
- Statement: "Demystifying Google Ads, one social video at a time."
- Body: Sole motion designer. Social videos helping Google Ads customers activate platform tools. Worked within Google's existing motion system, introduced new animated icons. Featured brands: L'Oréal, Sephora, ClickUp, Money Group.

## Key Utilities
- `mkMedia()` — auto-detects `.mp4/.webm/.mov` to render video vs. image
- `featVideo` property — allows featured work thumbnails to use different videos than the hero
- `object-fit: contain` for videos on project pages, `cover` for images
- `object-fit: cover` for card deck videos
- Square 1:1 video containers: use `pj-6sq` for grids, or `pj-wide` with `style="aspect-ratio:1/1"` for standalone

## Critical Rules — READ THESE
1. **Don't break locked sections** — Landing page and page transitions are finalized
2. **Aspect ratio over viewport fit** — Sam prefers full uncropped 16:9 video over fitting within viewport bounds
3. **`background-clip: text` is unreliable** — use per-character color transitions instead
4. **`mix-blend-mode: difference` breaks text** — avoid
5. **`overflow: hidden` on `.card` clips animated text** — avoid
6. **Spaces in video filenames** are encoded as `%20` in paths
7. **Surgical edits only** — don't touch unrelated parts of the file
8. **No rebuilds** — prefer targeted fixes over broad rewrites
9. **Role title is "Brand + Motion Designer"** — not "Motion Art Director"
10. **`line-height:0.92` causes 0.04em text overflow** below the line box — compensate with `padding-bottom:0.04em` when using flex alignment on `.pj-h1`
11. **iOS hover-before-click:** first tap activates `:hover` state, second fires click — suppress hover-only UI with `display:none!important` in `@media(hover:none)` rather than trying to manage state
12. **Mobile settle fights touch input** — always gate settle logic on `!_touchActive`
13. **Don't preload videos on mobile** — use `preload="none"` + IntersectionObserver; eager preload causes ~70MB cold load

## Positioning Notes
- The portfolio currently reads stronger as a Brand + Motion Designer book than an Art Director book
- Copy should emphasize decisions made and direction given, not just execution tasks
- To elevate toward Art Director positioning: rewrite body copy to foreground creative decisions, concepts owned, and team/stakeholder direction
- All 5 project pages are fully built with content and media

## Workflow
- Sam gives direct, specific corrections when output doesn't match reference
- He provides Figma screenshots and reference sites for visual matching
- Prefer reverting to known-good state over patching broken intermediate states
- Test changes by opening `index.html` in browser or local server
- Push to GitHub Pages: `git add . && git commit -m "description" && git push`
- Site updates take ~60 seconds after push, then ⌘+Shift+R to hard refresh

## Contact
smmorgan2@gmail.com
