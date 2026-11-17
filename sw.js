// Offline support: precache the app shell, then serve cache-first and refresh in the background.
const VERSION = 'mai-grades-v9';
const SHELL = [
  './',
  './index.html',
  './404.html',
  './manifest.webmanifest',
  './assets/css/app.css',
  './assets/js/app.js',
  './assets/js/catalog.js',
  './assets/js/editor.js',
  './assets/js/grades.js',
  './assets/js/ics.js',
  './assets/js/install.js',
  './assets/js/share.js',
  './assets/js/progress.js',
  './assets/js/store.js',
  './assets/js/theme.js',
  './assets/js/ui.js',
  './assets/js/views/about.js',
  './assets/js/views/add.js',
  './assets/js/views/home.js',
  './assets/js/views/overview.js',
  './assets/js/views/settings.js',
  './assets/js/views/subject.js',
  './assets/fonts/inter-latin-opsz.woff2',
  './assets/fonts/inter-latin-ext-opsz.woff2',
  './assets/icons/icon.svg',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/maskable-512.png',
  './assets/icons/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;

  event.respondWith(
    caches.open(VERSION).then(async (cache) => {
      const cached = await cache.match(req, { ignoreSearch: true });
      const network = fetch(req)
        .then((res) => {
          if (res.ok) cache.put(req, res.clone());
          return res;
        })
        .catch(() => null);
      if (cached) {
        event.waitUntil(network);
        return cached;
      }
      const res = await network;
      if (res) return res;
      if (req.mode === 'navigate') return (await cache.match('./index.html')) || Response.error();
      return Response.error();
    }),
  );
});
