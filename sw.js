/* Ironwood offline support. Build 52ebd9c7d8. */
const CACHE = 'ironwood-52ebd9c7d8';
const FILES = ["./", "index.html", "manifest.webmanifest", "vendor/htm-preact.umd.js", "privacy.html", "support.html", "pages.css", "fonts/barlow-latin-400-normal.woff2", "fonts/barlow-latin-500-normal.woff2", "fonts/barlow-latin-600-normal.woff2", "fonts/barlow-latin-700-normal.woff2", "fonts/barlow-condensed-latin-600-normal.woff2", "fonts/barlow-condensed-latin-700-normal.woff2", "icons/apple-touch-icon.png", "icons/icon-192.png", "icons/icon-512.png", "icons/icon-maskable-512.png"];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('ironwood-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
/* Open instantly from the cache (works with no signal); fetch a fresh copy in the background
   so the next launch picks up a new build. */
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  const nav = req.mode === 'navigate';
  e.respondWith(caches.open(CACHE).then(async c => {
    const hit = (await c.match(req, { ignoreSearch: nav })) || (nav ? await c.match('index.html') : null);
    const net = fetch(req).then(res => { if (res && res.ok && res.type === 'basic') c.put(req, res.clone()); return res; }).catch(() => null);
    if (hit) { e.waitUntil(net); return hit; }
    return (await net) || new Response('Offline', { status: 503 });
  }));
});
