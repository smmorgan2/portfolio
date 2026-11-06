#!/usr/bin/env bash
# Launch the 2027 site: moves redesign-2027's new/ to the root of main (sammorgancreative.net).
#   bash tools/launch.sh            dry run: builds the launch in a scratch copy and serves it on :8767
#   PUSH=1 bash tools/launch.sh     same, then pushes it live
#   KEEP_ABOUT=1              keep the About links (only once the About page exists)
# What it does on main:
#   - removes the old one-page site (index.html and its videos/*.mp4); it stays in git history
#   - keeps CNAME and the CV at videos/Sam_Morgan_CV_2026.pdf (old links to it keep working)
#   - copies new/ to the root, drops the "noindex" tags, adds robots.txt + sitemap.xml
#   - turns /new/*.html into redirects to the same page at the root (preview links keep working)
set -euo pipefail
REPO="$(cd "$(dirname "$0")/.." && pwd)"
W="${TMPDIR:-/tmp}/sm-launch"
cd "$REPO"
git fetch -q origin
git worktree remove --force "$W" 2>/dev/null || true; rm -rf "$W"
git worktree add -q --detach "$W" origin/main
cd "$W"

# 1. Old site out (CV and CNAME stay)
git rm -q index.html
git ls-files videos | grep -v '^videos/Sam_Morgan_CV_2026.pdf$' | xargs -r -d '\n' git rm -q --
# 2. New site in, from the branch (not from main's preview copy)
rm -rf new
git checkout origin/redesign-2027 -- new
cp -R new/. .
rm -rf new
# 3. Search engines may index it now
for f in index.html composer.html google-ads.html listen.html contact.html; do
  sed -i '/<!-- Test page at \/new\/ until launch: keep it out of search results. Remove at launch. -->/d' "$f"
  sed -i 's#<meta name="robots" content="noindex">##' "$f"
done
# 4. About isn't built yet: take its link out of the header and the phone menu
if [ "${KEEP_ABOUT:-0}" != 1 ]; then
  sed -i '/<a href="\(index.html\)\?#about">About<\/a>/d' index.html composer.html google-ads.html listen.html contact.html
  sed -i "/\['About', isHome ? '#about' : 'index.html#about'\],/d" js/mobile-menu.js
fi
# 5. robots + sitemap
printf 'User-agent: *\nAllow: /\nSitemap: https://sammorgancreative.net/sitemap.xml\n' > robots.txt
{ echo '<?xml version="1.0" encoding="UTF-8"?>'; echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
  for u in "" composer.html google-ads.html listen.html contact.html; do echo "  <url><loc>https://sammorgancreative.net/$u</loc></url>"; done
  echo '</urlset>'; } > sitemap.xml
# 6. /new/ preview links forward to the real pages
mkdir -p new
for f in index.html composer.html google-ads.html listen.html contact.html; do
  t="/$f"; [ "$f" = index.html ] && t="/"
  cat > "new/$f" <<EOF
<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Sam Morgan</title>
<meta name="robots" content="noindex"><link rel="canonical" href="https://sammorgancreative.net$t">
<meta http-equiv="refresh" content="0; url=$t"><script>location.replace("$t" + location.hash);</script>
</head><body><a href="$t">sammorgancreative.net$t</a></body></html>
EOF
done

git add -A
echo "--- launch diff (main) ---"; git status --short | awk '{print $1}' | sort | uniq -c
! grep -l 'name="robots" content="noindex"' index.html composer.html google-ads.html listen.html contact.html || { echo "noindex still present"; exit 1; }
test -f CNAME && test -f videos/Sam_Morgan_CV_2026.pdf && test -f 404.html && echo "checks: CNAME, CV, 404 present"

if [ "${PUSH:-0}" = 1 ]; then
  git -c user.name=Claude -c user.email=noreply@anthropic.com commit -q -m "Launch the 2027 site at the root

Old one-page site removed (kept in history); CV path and CNAME kept; /new/ redirects to the root.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_012K1qkxSxFVPdh193GzudyK"
  git push origin HEAD:main
  cd "$REPO"; git worktree remove --force "$W"
  echo "pushed"
else
  (cd "$W" && python3 -m http.server 8767 >/dev/null 2>&1 &)
  echo "dry run ready at http://localhost:8767 (nothing pushed)"
fi
