/* Mocksy service worker
   Caches the app shell so the installed app opens instantly and keeps
   working offline. Uses a "network first, falling back to cache" strategy
   for navigations, and "cache first" for the static build assets, so
   updates are picked up quickly but the app never shows a blank screen
   when the network is unavailable. */

// Bumped from v1 -> v2: the old cache had permanently pinned the previous
// logo192/512/apple-touch-icon bytes (which had transparent corners that
// rendered as a black square behind the logo on the install splash screen
// and iOS home-screen icon). Because static assets are served cache-first,
// simply replacing those files on the server was NOT enough — the already-
// installed app kept serving the old cached bytes forever. Bumping the
// version here is what makes `activate` below actually delete the old
// cache and start fresh with the corrected, opaque icons.
//
// Bumped again v2 -> v3: devices that had already installed the app before
// the v2 deploy went out were still opening straight into the old cached
// `mocksy-v2` cache entry for logo192/512 (a cache-first strategy only
// refreshes once the new SW takes over, and some installs never got that
// far). This bump — together with the matching `?v=3` query bust on the
// icon URLs below and in manifest.json/index.html — guarantees every
// existing install throws away its old icon bytes and re-fetches the
// corrected, opaque-background PNGs on next launch.
const CACHE_VERSION = 'mocksy-v3';
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/logo192.png?v=3',
  '/logo512.png?v=3',
  '/apple-touch-icon.png?v=3',
  '/mocksy-logo.jpg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // don't intercept API/CDN calls

  // Navigations: try the network first (so users get fresh content when
  // online), fall back to the cached shell when offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put('/index.html', copy));
          return response;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Static assets: cache first, then network, then cache the result.
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((response) => {
          if (response && response.status === 200 && response.type === 'basic') {
            const copy = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached);
    })
  );
});