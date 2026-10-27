"""Turn the Ironwood (formerly Liftbook) artifact page (source.html) into a standalone, installable web app in dist/.

Run: python3 build.py   (re-run whenever source.html is replaced with a newer version of the app)
"""
import hashlib, json, os, re

SRC = 'app.html'  # made from the artifact's source.html by features.py
OUT = 'dist'
html = open(SRC, encoding='utf8').read()


def swap(old, new, count=1):
    global html
    n = html.count(old)
    if n != count:
        raise SystemExit(f'Expected {count} copy of {old[:70]!r}, found {n}. The app source changed; update build.py.')
    html = html.replace(old, new)


# 0. App name: Ironwood. Only what people see changes. Storage keys and the backup's internal
#    "app" label stay "liftbook" so backups from the Liftbook version restore here (and back).
html = html.replace('Liftbook', 'Ironwood')  # already done by features.py; kept as a safety net


# 1. Home-screen app tags in <head>
swap('<meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover">',
     '<meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover">'
     '<meta name="apple-mobile-web-app-capable" content="yes">'
     '<meta name="mobile-web-app-capable" content="yes">'
     '<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">'
     '<meta name="apple-mobile-web-app-title" content="Ironwood">'
     '<meta name="theme-color" content="#111315">'
     '<link rel="manifest" href="manifest.webmanifest">'
     '<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">'
     '<link rel="icon" type="image/png" sizes="192x192" href="icons/icon-192.png">')

# 2. Fonts from this site instead of Google, so the app looks right offline
FACES = [('Barlow', w, f'barlow-latin-{w}-normal.woff2') for w in (400, 500, 600, 700)] + \
        [('Barlow Condensed', w, f'barlow-condensed-latin-{w}-normal.woff2') for w in (600, 700)]
font_css = '<style>\n' + '\n'.join(
    f"@font-face{{font-family:'{fam}';font-style:normal;font-weight:{w};font-display:swap;src:url('fonts/{f}') format('woff2')}}"
    for fam, w, f in FACES) + '\n' \
    "/* Standalone: solid strip behind the iPhone status bar so content doesn't scroll under the clock */\n" \
    "body::before{content:'';position:fixed;top:0;left:0;right:0;height:env(safe-area-inset-top,0px);background:var(--bg);z-index:100;pointer-events:none}\n" \
    '</style>'
swap('<link rel="preconnect" href="https://fonts.googleapis.com">\n', '')
swap('<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n', '')
m = re.search(r'<link rel="stylesheet" href="https://fonts\.googleapis\.com/css2[^>]*>', html)
if not m:
    raise SystemExit('Google Fonts link not found; update build.py.')
html = html.replace(m.group(0), font_css)

# 3. Preact/htm bundled with the app instead of loaded from a CDN, plus a stand-in for the
#    Claude page features: saving files works through the iPhone share sheet; account sync,
#    Claude translation and the rest report "not available", which the app already handles.
SHIM = r'''<script>
/* Standalone build: there is no Claude page around the app here. Saving files (backups, photos,
   phrase lists) goes through the iPhone share sheet; everything else is reported as unavailable,
   so workouts stay on this phone and translation falls back to the spreadsheet upload. */
(function () {
  if (window.claude) return;
  const declined = () => { const e = new Error('declined'); e.code = 'declined'; return e; };
  async function save({ filename, data }) {
    const type = typeof data === 'string' ? (/\.csv$/i.test(filename) ? 'text/csv' : 'application/json') : (data.type || 'application/octet-stream');
    const file = new File([data], filename, { type });
    if (navigator.canShare && navigator.share) {
      let ok = false; try { ok = navigator.canShare({ files: [file] }); } catch (e) {}
      if (ok) {
        try { await navigator.share({ files: [file] }); return; }
        catch (e) { if (e && e.name === 'AbortError') throw declined(); }
      }
    }
    const url = URL.createObjectURL(file); const a = document.createElement('a');
    a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }
  window.claude = { standalone: true, use: async name => name === 'downloads' ? { save } : null };
})();
</script>
<script src="vendor/htm-preact.umd.js"></script>'''
swap('<script src="https://cdn.jsdelivr.net/npm/htm@3.1.1/preact/standalone.umd.js"></script>', SHIM)

# 4. After the app boots: offline support, ask iOS to keep the data, plain wording for local saving
BOOT = r'''<script>
/* Standalone build */
try { SYNC_TEXT.local = 'Saved on this phone. Save a backup file now and then.'; } catch (e) {}
if ('serviceWorker' in navigator) addEventListener('load', () => {
  /* Check for a new build on every launch and whenever the app comes back to the front. When one takes over, reload
     once so it shows right away (but never in the middle of a workout; then it applies on the next launch). */
  const had = !!navigator.serviceWorker.controller; let reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (!had || reloaded) return; if (typeof S !== 'undefined' && S.active) return; if (typeof FR !== 'undefined' && FR.T && !FR.T.done && !FR.T.ended) return; reloaded = true; location.reload(); });
  navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then(reg => {
    reg.update().catch(() => {});
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') reg.update().catch(() => {}); });
  }).catch(() => {});
});
try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {}); } catch (e) {}
</script>
</body></html>'''
swap('</body></html>', BOOT)


# 4b. About section in Profile: privacy policy and support pages (copied into the site below)
# Tip link at the very bottom of Profile. Leave TIP_URL empty to hide the card. It is also hidden inside the App Store
# app: App Review has rejected external "Buy me a coffee" links under guideline 3.1.1 (tips to the developer must use
# In-App Purchase there), so the card only shows in the web / home-screen version.
TIP_URL = ''
swap('<script src="vendor/htm-preact.umd.js"></script>', '<script>var TIP_URL = ' + json.dumps(TIP_URL) + ';</script>\n<script src="vendor/htm-preact.umd.js"></script>')
swap('<div class="section-h"><h2>Nutrition</h2><span class="chip">Coming later</span></div>\n    <div class="card note">Meal logging will live here once lifting tracking is settled.</div>',
     '<div class="section-h"><h2>About</h2></div>\n    <div class="card stack"><a class="btn" href="privacy.html">Privacy policy</a><a class="btn" href="support.html">Help and support</a><p class="note">Ironwood keeps everything on this phone. No accounts, ads or tracking.</p><p class="small faint" id="app-version">Version __APPVER__</p></div>'
     '\n    ${TIP_URL && !(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()) ? html`<div class="card stack tip-card-support" id="tip-card"><div style="font-weight:700">Enjoying Ironwood?</div><p class="note">It’s free, with no ads or accounts. If it helps your training, you can buy me a coffee, once or monthly.</p><a class="btn primary wide" id="tip-link" href=${TIP_URL} target="_blank" rel="noopener">☕ Buy me a coffee</a></div>` : null}')

os.makedirs(OUT, exist_ok=True)
import shutil
for f in os.listdir('pages'):
    shutil.copy(os.path.join('pages', f), os.path.join(OUT, f))
# Barcode reader (ZXing in WebAssembly, from the barcode-detector package): loaded only when you scan, then cached
os.makedirs(os.path.join(OUT, 'vendor'), exist_ok=True)
for f in ('barcode-ponyfill.js', 'zxing_reader.wasm'):
    shutil.copy(os.path.join('vendor', f), os.path.join(OUT, 'vendor', f))
open(os.path.join(OUT, 'index.html'), 'w', encoding='utf8').write(html)

manifest = {
    'name': 'Ironwood', 'short_name': 'Ironwood', 'description': 'Workout log, PRs and progress.',
    'id': './', 'start_url': './', 'scope': './', 'display': 'standalone', 'orientation': 'portrait',
    'background_color': '#111315', 'theme_color': '#111315',
    'icons': [
        {'src': 'icons/icon-192.png', 'sizes': '192x192', 'type': 'image/png'},
        {'src': 'icons/icon-512.png', 'sizes': '512x512', 'type': 'image/png'},
        {'src': 'icons/icon-maskable-512.png', 'sizes': '512x512', 'type': 'image/png', 'purpose': 'maskable'},
    ],
}
json.dump(manifest, open(os.path.join(OUT, 'manifest.webmanifest'), 'w'), indent=2)

# 4c. Version shown in Profile → About: a short fingerprint of the app page, so a phone can tell which build it has
html = html.replace('__APPVER__', hashlib.sha256(html.encode()).hexdigest()[:7])
open(os.path.join(OUT, 'index.html'), 'w', encoding='utf8').write(html)

# 5. Service worker: every file the app needs, versioned by content so a new build replaces the old cache
files = ['./', 'index.html', 'manifest.webmanifest', 'vendor/htm-preact.umd.js', 'privacy.html', 'support.html', 'pages.css'] + \
        [f'fonts/{f}' for _, _, f in FACES] + \
        [f'icons/{f}' for f in sorted(os.listdir(os.path.join(OUT, 'icons')))]
h = hashlib.sha256()
for f in files[1:]:
    h.update(open(os.path.join(OUT, f), 'rb').read())
version = h.hexdigest()[:10]
sw = f'''/* Ironwood offline support. Build {version}. */
const CACHE = 'ironwood-{version}';
const FILES = {json.dumps(files)};

self.addEventListener('install', e => {{
  /* cache: 'reload' skips the browser's own cache, so a new build never stores a stale copy of a file */
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(FILES.map(f => fetch(new Request(f, {{ cache: 'reload' }})).then(r => {{ if (!r.ok) throw new Error(f); return c.put(f, r); }})))).then(() => self.skipWaiting()));
}});
self.addEventListener('activate', e => {{
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('ironwood-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
}});
/* The app page: ask the network first (a few seconds at most) so a new build shows on the next open, and fall back to
   the saved copy with no signal. Everything else (fonts, icons, scripts) comes from this build's cache. */
self.addEventListener('fetch', e => {{
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  const nav = req.mode === 'navigate';
  e.respondWith(caches.open(CACHE).then(async c => {{
    if (nav) {{
      /* Only the app page itself refreshes the saved app page. Other pages (privacy, support) are cached under their
         own address at install, so opening them can't replace the app's offline copy. */
      const path = new URL(req.url).pathname; const shell = path.endsWith('/') || path.endsWith('/index.html');
      const net = fetch(req, {{ cache: 'no-cache' }}).then(res => {{ if (shell && res && res.ok && res.type === 'basic') {{ c.put('index.html', res.clone()); c.put('./', res.clone()); }} return res; }}).catch(() => null);
      const quick = await Promise.race([net, new Promise(r => setTimeout(() => r(null), 3500))]);
      if (quick && quick.ok) return quick;  /* an error page from the server is never shown over the saved copy */
      return (await c.match(req, {{ ignoreSearch: true }})) || (shell ? await c.match('index.html') : null) || (await net) || new Response('Offline', {{ status: 503 }});
    }}
    const hit = await c.match(req);
    if (hit) return hit;
    const res = await fetch(req).catch(() => null);
    if (res && res.ok && res.type === 'basic') c.put(req, res.clone());
    return res || new Response('Offline', {{ status: 503 }});
  }}));
}});
'''
open(os.path.join(OUT, 'sw.js'), 'w').write(sw)
print('Built', OUT, 'version', version, '-', round(len(html.encode()) / 1024), 'KB page')
