#!/bin/sh
# One-time setup on a new machine, then: python3 features.py && ./package.sh
set -e
cd "$(dirname "$0")"
[ -f package.json ] || npm init -y >/dev/null
npm install -s htm@3.1.1 @fontsource/barlow @fontsource/barlow-condensed
mkdir -p dist/vendor dist/fonts dist/icons
cp node_modules/htm/preact/standalone.umd.js dist/vendor/htm-preact.umd.js
for w in 400 500 600 700; do cp node_modules/@fontsource/barlow/files/barlow-latin-$w-normal.woff2 dist/fonts/; done
for w in 600 700; do cp node_modules/@fontsource/barlow-condensed/files/barlow-condensed-latin-$w-normal.woff2 dist/fonts/; done
pip install -q playwright pillow 2>/dev/null || pip install -q --break-system-packages playwright pillow
python3 -m playwright install chromium >/dev/null 2>&1 || true
python3 render_icon.py
echo "Ready. Build with: python3 features.py && python3 build.py   (tests: python3 test_pwa.py)"
