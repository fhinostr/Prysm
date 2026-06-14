// ═══════════════════════════════════════════════════════════════
// PRYSM ABA LMS — Service Worker v13 (Network-First)
// Always fetches from network first to ensure instant updates without clearing cache.
// ═══════════════════════════════════════════════════════════════
const CACHE_VERSION = 'v14';
const CACHE_NAME = `aba-lms-cache-${CACHE_VERSION}`;

// Files that should NEVER be served from cache (always network-first)
const AUTH_CRITICAL_PATTERNS = [
  'auth-guard',
  'auth-utils',
  'supabase-client',
  'supabase-data'
];

const STATIC_ASSETS = [
  './',
  './index.html',
  './treatment-plan.html',
  './session-book.html',
  './bcba.html',
  './billing.html',
  './files.html',
  './contacts.html',
  './plan.html',
  './client-hub.html',
  './get-started.html',
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
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'
];

// ── Install ──────────────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// ── Activate ─────────────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    Promise.all([
      // Purge every cache except the current version
      caches.keys().then(keys =>
        Promise.all(
          keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
        )
      ),
      self.clients.claim()
    ])
  );
});

// ── Fetch ────────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = event.request.url;

  // Network-First Strategy for all assets
  // This guarantees updates are immediately visible without clearing cache
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Cache the fresh copy for offline fallback
        if (url.startsWith('http')) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        // If network fails (offline), fallback to cache
        return caches.match(event.request);
      })
  );
});

// ── Message Handler (Nuclear Cache Clear) ────────────────────
self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data === 'CLEAR_ALL_CACHES') {
    caches.keys().then(keys =>
      Promise.all(keys.map(k => caches.delete(k)))
    ).then(() => {
      // Notify all clients to reload
      self.clients.matchAll().then(clients => {
        clients.forEach(client => client.postMessage('CACHES_CLEARED'));
      });
    });
  }
});
