// Service worker: deja la app instalable y que abra rápido.
// Cambia VERSION cuando actualices archivos para forzar la recarga en los dispositivos.
const VERSION = 'v5';
const CACHE = 'cuestionario-' + VERSION;
const SHELL = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './questions.js',
  './score.js',
  './firebase-config.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  // Solo archivos propios; Firebase (otro dominio) pasa directo a la red.
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;

  // Páginas: red primero, caché como respaldo (el ?t=TOKEN no afecta).
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put('./index.html', copy));
          return res;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Resto: red primero con respaldo en caché (así siempre ves la última versión si hay internet).
  e.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
        return res;
      })
      .catch(() => caches.match(req))
  );
});
