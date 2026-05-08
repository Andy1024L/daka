const CACHE_NAME = 'daily-checkin-v11';
const STATIC_CACHE_NAME = 'daily-checkin-static-v11';

// 需要预缓存的静态路由
const PRECACHE_ROUTES = [
  '/',
  '/stats',
  '/data',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ROUTES);
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME && name !== STATIC_CACHE_NAME)
            .map((name) => caches.delete(name))
        );
      }),
      self.clients.claim()
    ])
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (url.origin !== location.origin) {
    return;
  }

  if (request.method !== 'GET') {
    return;
  }

  const isNavigate = request.mode === 'navigate';

  event.respondWith(
    Promise.all([
      // 优先尝试网络
      fetch(request).then((response) => {
        if (response.ok) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      }).catch(() => null),
      // 同时检查缓存
      caches.match(request).then((cached) => cached)
    ]).then((results) => {
      const networkResponse = results[0];
      const cachedResponse = results[1];

      if (networkResponse && networkResponse.ok) {
        return networkResponse;
      }

      if (cachedResponse) {
        return cachedResponse;
      }

      if (isNavigate) {
        return caches.match('/').then((fallback) => {
          return fallback || new Response('离线状态，请稍后重试', {
            status: 503,
            headers: { 'Content-Type': 'text/html; charset=utf-8' }
          });
        });
      }

      return new Response('Offline', { status: 503 });
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});
