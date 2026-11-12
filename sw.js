// SyG — Maquinaria KOREI y Sheló NABEL
// Estrategia: red primero para el HTML y los JSON (cambios al momento), caché para lo demás.
const CACHE = 'syg-v1';
const CORE = ['./', './index.html', './catalogo.json', './catalogo-shelo.json', './manifest.json',
  './img/logo.webp', './img/portada.webp', './img/portada-shelo.webp', './img/icono.jpg'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (/\.pdf($|\?)/.test(url.pathname)) return; // los PDF siempre directos
  const esClave = e.request.mode === 'navigate' || /\.(html|json)($|\?)/.test(url.pathname);
  if (esClave) {
    e.respondWith(fetch(e.request).then(r => {
      const copia = r.clone();
      caches.open(CACHE).then(c => c.put(e.request, copia));
      return r;
    }).catch(() => caches.match(e.request)));
  } else {
    e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).then(r => {
      const copia = r.clone();
      caches.open(CACHE).then(c => c.put(e.request, copia));
      return r;
    })));
  }
});
