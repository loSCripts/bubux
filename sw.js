// LUMA — Service Worker (standalone version)
// Same logic as the Blob-registered SW embedded in luma-streaming-app.html.
// Use this file if you host index.html + manifest.json + sw.js as 3 separate
// files instead of the single HTML file (more reliable install behavior on
// some strict Android browsers). If you do, add to your HTML <head>:
//   <link rel="manifest" href="manifest.json">
// and replace the registerServiceWorker() body with:
//   navigator.serviceWorker.register('sw.js', {scope: './'});

const CACHE_NAME = 'luma-shell-v1';

self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = e.request.url;
  const isTMDB = url.indexOf('api.themoviedb.org') > -1 || url.indexOf('image.tmdb.org') > -1;

  e.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      if (isTMDB) {
        // Network-first for TMDB data/images, falling back to cache when offline.
        try {
          const res = await fetch(e.request);
          cache.put(e.request, res.clone());
          return res;
        } catch (err) {
          const cached = await cache.match(e.request);
          if (cached) return cached;
          throw err;
        }
      }
      // Cache-first for same-origin app shell files.
      const cached = await cache.match(e.request);
      if (cached) return cached;
      const res = await fetch(e.request);
      cache.put(e.request, res.clone());
      return res;
    })
  );
});
