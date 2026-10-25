const CACHE_NAME = 'tbc-app-v4';
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

const SKIP_CACHE = [
  '/login.html',
  '/signup.html',
  '/auth.js'
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

  // Never intercept Firebase or Google auth requests
  if (url.hostname.includes('firebase') ||
      url.hostname.includes('googleapis') ||
      url.hostname.includes('gstatic') ||
      url.hostname.includes('identitytoolkit') ||
      url.hostname.includes('securetoken')) {
    return;
  }

  // Skip caching auth pages
  if (SKIP_CACHE.some((p) => url.pathname === p || url.pathname.endsWith(p))) {
    return;
  }

  if (url.origin !== location.origin) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
