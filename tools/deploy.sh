#!/usr/bin/env bash
# Deploy after launch (Nov 19): copies redesign-2027's new/ onto the root of main (sammorgancreative.net).
# Keeps CNAME, the old CV path (videos/Sam_Morgan_CV_2026.pdf), robots.txt, sitemap.xml and the /new/
# redirect pages that tools/launch.sh made. Run from the repo after pushing redesign-2027.
set -euo pipefail
REPO="$(cd "$(dirname "$0")/.." && pwd)"
W="${TMPDIR:-/tmp}/sm-deploy"
cd "$REPO"; git fetch -q origin
git worktree remove --force "$W" 2>/dev/null || true; rm -rf "$W"
git worktree add -q --detach "$W" origin/main
cd "$W"
T=$(mktemp -d); git --git-dir="$REPO/.git" archive origin/redesign-2027 new | tar -x -C "$T"
cp -R "$T/new/." .
rm -rf "$T"
git add -A
if git diff --cached --quiet; then echo "nothing to deploy"; else
  git -c user.name=Claude -c user.email=noreply@anthropic.com commit -q -m "${MSG:-Deploy from redesign-2027}

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_012K1qkxSxFVPdh193GzudyK"
  git push -q origin HEAD:main; echo "deployed"; fi
cd "$REPO"; git worktree remove --force "$W"
