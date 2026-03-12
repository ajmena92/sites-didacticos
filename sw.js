const CACHE_NAME = 'sites-didacticos-v1';

// Assets to pre-cache on install
const PRECACHE = [
  '/',
  '/index.html',
  '/assets/css/style.css',
  '/assets/js/ccna1-submit.js',
  '/assets/js/net-utils.js',
  '/assets/data/catalog.json',
  '/ccna/ccna1/index.html',
  '/ccna/ccna1/subnetting.html',
  '/ccna/ccna1/subnetting-practica.html',
  '/ccna/ccna1/subnetting-practica-final.html',
  '/ccna/ccna1/subnetting-vlsm.html',
  '/ccna/ccna1/dashboard.html',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin requests
  if (url.origin !== location.origin) return;

  // Network-first for HTML navigation
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(
      fetch(request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(request, clone));
          return res;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Cache-first for static assets (CSS, JS, JSON, fonts)
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(res => {
        if (!res || res.status !== 200 || res.type === 'opaque') return res;
        const clone = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(request, clone));
        return res;
      });
    })
  );
});
