/* Ironwood offline support. Build 4b8558d44c. */
const CACHE = 'ironwood-4b8558d44c';
const FILES = ["./", "index.html", "manifest.webmanifest", "vendor/htm-preact.umd.js", "privacy.html", "support.html", "pages.css", "fonts/barlow-latin-400-normal.woff2", "fonts/barlow-latin-500-normal.woff2", "fonts/barlow-latin-600-normal.woff2", "fonts/barlow-latin-700-normal.woff2", "fonts/barlow-condensed-latin-600-normal.woff2", "fonts/barlow-condensed-latin-700-normal.woff2", "icons/apple-touch-icon.png", "icons/icon-192.png", "icons/icon-512.png", "icons/icon-maskable-512.png"];

self.addEventListener('install', e => {
  /* cache: 'reload' skips the browser's own cache, so a new build never stores a stale copy of a file */
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(FILES.map(f => fetch(new Request(f, { cache: 'reload' })).then(r => { if (!r.ok) throw new Error(f); return c.put(f, r); })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('ironwood-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
/* The app page: ask the network first (a few seconds at most) so a new build shows on the next open, and fall back to
   the saved copy with no signal. Everything else (fonts, icons, scripts) comes from this build's cache. */
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  const nav = req.mode === 'navigate';
  e.respondWith(caches.open(CACHE).then(async c => {
    if (nav) {
      /* Only the app page itself refreshes the saved app page. Other pages (privacy, support) are cached under their
         own address at install, so opening them can't replace the app's offline copy. */
      const path = new URL(req.url).pathname; const shell = path.endsWith('/') || path.endsWith('/index.html');
      const net = fetch(req, { cache: 'no-cache' }).then(res => { if (shell && res && res.ok && res.type === 'basic') { c.put('index.html', res.clone()); c.put('./', res.clone()); } return res; }).catch(() => null);
      const quick = await Promise.race([net, new Promise(r => setTimeout(() => r(null), 3500))]);
      if (quick && quick.ok) return quick;  /* an error page from the server is never shown over the saved copy */
      return (await c.match(req, { ignoreSearch: true })) || (shell ? await c.match('index.html') : null) || (await net) || new Response('Offline', { status: 503 });
    }
    const hit = await c.match(req);
    if (hit) return hit;
    const res = await fetch(req).catch(() => null);
    if (res && res.ok && res.type === 'basic') c.put(req, res.clone());
    return res || new Response('Offline', { status: 503 });
  }));
});
