const CACHE_NAME = 'daily-checkin-v12';
const STATIC_CACHE_NAME = 'daily-checkin-static-v12';

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

// Stale-While-Revalidate策略
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 只处理同源请求
  if (url.origin !== location.origin) {
    return;
  }

  // 跳过非GET请求
  if (request.method !== 'GET') {
    return;
  }

  const isNavigate = request.mode === 'navigate';

  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(request).then((cachedResponse) => {
        // 发起网络请求
        const fetchPromise = fetch(request).then((networkResponse) => {
          // 如果是成功的响应，缓存它
          if (networkResponse.ok && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            cache.put(request, responseToCache);
          }
          return networkResponse;
        }).catch(() => {
          // 网络失败，返回null
          return null;
        });

        // 如果有缓存，立即返回缓存，同时后台更新
        if (cachedResponse) {
          // 忽略fetchPromise的返回，因为我们已经有缓存了
          return cachedResponse;
        }

        // 没有缓存，等待网络响应
        return fetchPromise.then((networkResponse) => {
          if (networkResponse) {
            return networkResponse;
          }

          // 网络也失败了
          if (isNavigate) {
            return caches.match('/').then((fallback) => {
              return fallback || new Response('离线状态，请稍后重试', {
                status: 503,
                headers: { 'Content-Type': 'text/html; charset=utf-8' }
              });
            });
          }

          return new Response('Offline', { status: 503 });
        });
      });
    })
  );
});

// 监听来自页面的消息
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});
