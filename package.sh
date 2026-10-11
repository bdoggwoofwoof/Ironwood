#!/bin/sh
# Rebuild, then refresh the zip and the git repo in site/ with a commit for any change.
set -e
cd "$(dirname "$0")"; ROOT="$(pwd)"
python3 build.py
# Never publish a build that fails its own tests (SKIP_TESTS=1 to bypass in a hurry)
if [ "${SKIP_TESTS:-0}" != "1" ]; then
  for t in test_*.py; do python3 "$t" >"/tmp/ironwood-$t.log" 2>&1 || { tail -6 "/tmp/ironwood-$t.log"; echo "Tests failed in $t; not publishing."; exit 1; }; echo "$t: $(tail -1 "/tmp/ironwood-$t.log")"; done
fi
rm -rf release && mkdir -p release/ironwood-app && cp -r dist/. release/ironwood-app/
cat > release/ironwood-app/README.md <<'R'
# Ironwood — standalone app

Upload this whole folder to any static host with HTTPS (GitHub Pages, Netlify, Cloudflare Pages or Vercel).
Then on the iPhone: open the address in Safari → Share → Add to Home Screen.

- Works offline after the first open.
- Workouts and photos are saved on the phone only. Use Profile → Save backup file now and then.
- Deleting the home-screen icon deletes its data, so save a backup first.
R
rm -f ironwood-app.zip && (cd release && zip -qr ../ironwood-app.zip ironwood-app)
[ -d site/.git ] || { mkdir -p site && git -C site init -q -b main; }
find site -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} +
cp -r release/ironwood-app/. site/ && touch site/.nojekyll
cd site && git add -A
if git diff --cached --quiet; then echo "site: no changes"; else
  git -c user.name="Newt" -c user.email="blake.newton12@gmail.com" commit -q -m "${1:-Update Ironwood}

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_011NEah7nUcm1oHrcWep6qE1"
  git log --oneline -1; fi
# Publish: main is the site; gh-pages mirrors it so GitHub Pages serves it either way
if git -C "$ROOT/site" remote get-url origin >/dev/null 2>&1; then
  git -C "$ROOT/site" push -q origin main && git -C "$ROOT/site" push -q -f origin main:gh-pages && echo "pushed to GitHub"
fi
