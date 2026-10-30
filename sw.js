// Service worker: deja la app instalable, abre rápido y se actualiza sola.
//
// Actualización automática (sin borrar nada del navegador):
//  - Los archivos se piden siempre a la red revalidando (cache: 'no-cache'), así nunca
//    se queda pegada una versión vieja por la caché HTTP del navegador.
//  - La caché de este archivo solo sirve de respaldo sin internet.
//  - Al detectar un sw.js nuevo se instala y toma el control solo (skipWaiting + clients.claim)
//    y la página se recarga una vez (ver app.js). Los datos del usuario (progreso del
//    cuestionario, sesión) viven en localStorage / IndexedDB y NO se tocan.
//
// IMPORTANTE: al publicar cambios, sube también este archivo y cambia VERSION (v10, v11…).
// Ese cambio es la señal que hace que los dispositivos se actualicen solos.
const VERSION = 'v9';
const CACHE = 'cuestionario-' + VERSION;
const SHELL = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './questions.js',
  './score.js',
  './interpretaciones.js',
  './firebase-config.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      // cache: 'reload' = ignora la caché HTTP y baja la versión más reciente
      .then((c) => Promise.all(SHELL.map((u) => c.add(new Request(u, { cache: 'reload' })).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      // Solo se borran cachés de la app de versiones anteriores, nunca datos del usuario.
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('cuestionario-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (e) => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  // Solo archivos propios; Firebase y Google Fonts (otro dominio) pasan directo a la red.
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;

  // Páginas: red primero (revalidando), caché como respaldo (el ?t=TOKEN no afecta).
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req.url, { cache: 'no-cache' })
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put('./index.html', copy));
          }
          return res;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Resto: red primero (revalidando) con respaldo en caché si no hay internet.
  e.respondWith(
    fetch(req, { cache: 'no-cache' })
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req))
  );
});
