const CACHE_NAME = 'tbc-app-v3';
const ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/theme.js',
  '/auth.js',
  '/home-layout.js',
  '/welcome-home.js',
  '/tbclogo.jpeg',
  '/app-icon.png',
  '/app-icon-519.png',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== location.origin) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request)
        .then((response) => {
          if (response && response.status === 200 && response.type === 'basic') {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'tbc-sync') {
    event.waitUntil(Promise.resolve());
  }
});

self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'tbc-periodic') {
    event.waitUntil(Promise.resolve());
  }
});

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : { title: 'TBC', body: 'New update' };
  event.waitUntil(
    self.registration.showNotification(data.title || 'Temple Baptist Church', {
      body: data.body || '',
      icon: '/app-icon.png'
    })
  );
});
