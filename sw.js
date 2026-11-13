// Bubux: Service Worker. Reseau d'abord (toujours la derniere version), cache en secours hors ligne.
const CACHE_NAME = 'bubux-shell-v3';

self.addEventListener('install', () => { self.skipWaiting(); });

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  const sameOrigin = url.origin === self.location.origin;
  const isData = url.hostname.endsWith('workers.dev') || url.hostname === 'image.tmdb.org' || url.hostname === 'api.themoviedb.org';
  if (!sameOrigin && !isData) return; // lecteur, YouTube, pubs : on ne touche pas
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res && res.ok) { const copy = res.clone(); caches.open(CACHE_NAME).then((c) => c.put(e.request, copy)); }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
