const CACHE_VERSION = 'v18';
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `dynamic-${CACHE_VERSION}`;

const CORE_ASSETS = [
  '/',
  '/stats',
  '/data',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
];

self.addEventListener('install', (event) => {
  console.log('[SW] Installing v18...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching core assets');
        return cache.addAll(CORE_ASSETS);
      })
      .then(() => {
        console.log('[SW] Skip waiting');
        return self.skipWaiting();
      })
  );
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating v18...');
  event.waitUntil(
    caches.keys()
      .then((keys) => {
        return Promise.all(
          keys
            .filter((key) => key !== STATIC_CACHE && key !== DYNAMIC_CACHE)
            .map((key) => {
              console.log('[SW] Removing old cache:', key);
              return caches.delete(key);
            })
        );
      })
      .then(() => {
        console.log('[SW] Claiming clients');
        return self.clients.claim();
      })
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (url.origin !== location.origin) {
    return;
  }

  const isNavigate = request.mode === 'navigate';
  const isGet = request.method === 'GET';
  const isRSC = url.searchParams.has('_rsc');
  const isNextInternal = url.pathname.startsWith('/_next/') || 
                         url.pathname.startsWith('/@') ||
                         url.searchParams.has('__rsc_id');

  if (isRSC || isNextInternal) {
    return;
  }

  if (isNavigate && isGet) {
    event.respondWith(
      caches.match(request, { ignoreSearch: true })
        .then((cached) => {
          if (cached) {
            fetch(request)
              .then((response) => {
                if (response.ok) {
                  caches.open(DYNAMIC_CACHE).then((cache) => {
                    cache.put(request, response.clone());
                  });
                }
              })
              .catch(() => {});
            return cached;
          }

          return fetch(request)
            .then((response) => {
              if (response.ok) {
                const responseClone = response.clone();
                caches.open(DYNAMIC_CACHE).then((cache) => {
                  cache.put(request, responseClone);
                });
              }
              return response;
            })
            .catch(() => {
              console.log('[SW] Network failed, trying static cache...');
              return caches.match('/', { ignoreSearch: true }).then((fallback) => {
                if (fallback) {
                  return fallback;
                }
                return new Response('离线模式 - 请连接网络', {
                  status: 503,
                  headers: { 'Content-Type': 'text/html; charset=utf-8' }
                });
              });
            });
        })
    );
    return;
  }

  if (isGet) {
    event.respondWith(
      caches.match(request)
        .then((cached) => {
          if (cached) {
            return cached;
          }

          return fetch(request)
            .then((response) => {
              if (response.ok) {
                const responseClone = response.clone();
                caches.open(DYNAMIC_CACHE).then((cache) => {
                  cache.put(request, responseClone);
                });
              }
              return response;
            })
            .catch(() => {
              console.log('[SW] Resource not cached and network unavailable:', url.pathname);
              return new Response('', {
                status: 503,
                statusText: 'Offline'
              });
            });
        })
    );
  }
});

self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});