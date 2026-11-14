// Groway Merchant OS — Service Worker
const CACHE_NAME = 'groway-v1';
const STATIC_ASSETS = ['/', '/manifest.json', '/groway-logo.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS).catch(() => {})).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((names) => Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  if (request.url.includes('/api/') || request.url.includes('/merchant-os/api/')) return;
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).then((response) => { const c = response.clone(); caches.open(CACHE_NAME).then((cache) => cache.put(request, c)); return response; }).catch(() => caches.match(request)));
    return;
  }
  event.respondWith(caches.match(request).then((cached) => cached || fetch(request).then((response) => { if (response.status === 200 && response.type === 'basic') { const c = response.clone(); caches.open(CACHE_NAME).then((cache) => cache.put(request, c)); } return response; })));
});
