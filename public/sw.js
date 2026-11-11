/* Service worker Kediaman (PWA).
 * - Halaman (navigasi): network-first, cadangan salinan terakhir, lalu /offline.html.
 * - /assets/* (nama ber-hash) & font: cache-first, abadi.
 * - Foto /img/* & ikon: stale-while-revalidate, maks 150 file.
 * - API, admin, auth, dan request non-GET TIDAK pernah di-cache.
 * Ganti VERSION untuk memaksa cache lama dibuang.
 */
const VERSION = 'v1';
const PAGES = `kdm-pages-${VERSION}`;
const STATIC = `kdm-static-${VERSION}`;
const IMAGES = `kdm-img-${VERSION}`;
const PRECACHE = ['/offline.html', '/icons/icon-192.png', '/manifest.webmanifest'];
const MAX_IMAGES = 150;
const MAX_PAGES = 40;

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(STATIC).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keep = new Set([PAGES, STATIC, IMAGES]);
    for (const key of await caches.keys()) if (key.startsWith('kdm-') && !keep.has(key)) await caches.delete(key);
    if (self.registration.navigationPreload) await self.registration.navigationPreload.enable();
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

async function trim(cacheName, max) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - max; i++) await cache.delete(keys[i]);
}

const NO_CACHE = /^\/(admin|auth|api|rest|functions|unsubscribe)(\/|$)/;

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;           // API & layanan luar: langsung ke jaringan
  if (NO_CACHE.test(url.pathname)) return;
  if (url.pathname === '/sw.js' || url.pathname === '/sitemap.xml') return;

  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const preload = await event.preloadResponse;
        const res = preload || await fetch(req);
        if (res && res.ok && res.type === 'basic') {
          const copy = res.clone();
          caches.open(PAGES).then((c) => c.put(url.pathname, copy)).then(() => trim(PAGES, MAX_PAGES));
        }
        return res;
      } catch {
        const cached = await caches.match(url.pathname, { cacheName: PAGES })
          || await caches.match('/', { cacheName: PAGES });
        return cached || caches.match('/offline.html');
      }
    })());
    return;
  }

  if (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/fonts/')) {
    event.respondWith((async () => {
      const cached = await caches.match(req, { cacheName: STATIC });
      if (cached) return cached;
      const res = await fetch(req);
      if (res.ok) { const copy = res.clone(); caches.open(STATIC).then((c) => c.put(req, copy)); }
      return res;
    })());
    return;
  }

  if (req.destination === 'image' || url.pathname.startsWith('/img/') || url.pathname.startsWith('/icons/')) {
    event.respondWith((async () => {
      const cache = await caches.open(IMAGES);
      const cached = await cache.match(req);
      const network = fetch(req).then((res) => {
        if (res.ok) cache.put(req, res.clone()).then(() => trim(IMAGES, MAX_IMAGES));
        return res;
      }).catch(() => cached || Response.error());
      return cached || network;
    })());
  }
});
