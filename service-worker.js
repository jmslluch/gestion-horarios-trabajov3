const CACHE_NAME = 'gestion-horarios-trabajo-v2';
const ASSETS = [
  './index.html',
  './manifest.json',
  './icons/icon-48.png',
  './icons/icon-72.png',
  './icons/icon-96.png',
  './icons/icon-144.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-192.png',
  './icons/icon-maskable-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Estrategia: red primero, caché como respaldo (para que funcione sin conexión
// pero se actualice sola en cuanto haya red disponible).
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  // Solo la propia app: las consultas a servicios externos (festivos, geolocalización) van directas.
  if (new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(
    fetch(event.request)
      .then((resp) => {
        const copy = resp.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return resp;
      })
      .catch(() => caches.match(event.request, { ignoreSearch: true }).then((cached) => cached || caches.match('./index.html')))
  );
});
