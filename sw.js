const CACHE_NAME = 'remidos-app-v1';

self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  return self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // Permite que as requisições de rede continuem normalmente
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});
