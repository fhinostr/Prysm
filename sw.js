const CACHE_NAME = 'aba-lms-cache-v10';
const ASSETS = [
  './',
  './index.html',
  './treatment-plan.html',
  './session-book.html',
  './bcba.html',
  './billing.html',
  './files.html',
  './contacts.html',
  './plan.html',
  './style.css',
  './nav.js',
  './app.js',
  './bcba.js',
  './billing.js',
  './clients-data.js',
  './contacts.js',
  './files.js',
  './program-data.js',
  './treatment-plan.js',
  './assets/prysm-logo-new.png',
  'https://unpkg.com/lucide@latest',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(keys => {
        return Promise.all(
          keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
        );
      }),
      // Immediately take control of all open clients
      self.clients.claim()
    ])
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      return cachedResponse || fetch(event.request).then(response => {
        return caches.open(CACHE_NAME).then(cache => {
          if (event.request.url.startsWith('http')) {
            cache.put(event.request, response.clone());
          }
          return response;
        });
      });
    }).catch(() => {
      // Return a fallback or just fail gracefully if offline
    })
  );
});
