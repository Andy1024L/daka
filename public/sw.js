const CACHE_NAME = 'daily-checkin-v10';

// 需要预缓存的所有页面路由
const PRECACHE_ROUTES = [
  '/',
  '/stats',
  '/data',
];

// 安装事件 - 预缓存所有页面
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ROUTES);
    }).then(() => {
      // 安装完成后立即激活
      return self.skipWaiting();
    })
  );
});

// 激活事件 - 清理旧缓存并接管所有客户端
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        );
      }),
      self.clients.claim()
    ])
  );
});

// 请求拦截 - 缓存优先策略，确保离线可用
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 只处理同源请求
  if (url.origin !== location.origin) {
    return;
  }

  // 跳过非 GET 请求
  if (request.method !== 'GET') {
    return;
  }

  // 所有请求：缓存优先，有缓存立即返回，不等待网络
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        // 有缓存，立即返回，后台静默更新
        fetch(request)
          .then((response) => {
            if (response.ok) {
              const responseClone = response.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, responseClone);
              });
            }
          })
          .catch(() => {
            // 网络失败，忽略，继续用缓存
          });
        return cached;
      }

      // 无缓存，尝试网络
      return fetch(request)
        .then((response) => {
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // 网络失败且无缓存
          if (request.mode === 'navigate') {
            return caches.match('/').then((fallback) => {
              return fallback || new Response('离线状态，请稍后重试', {
                status: 503,
                headers: { 'Content-Type': 'text/html; charset=utf-8' }
              });
            });
          }
          return new Response('Offline', { status: 503 });
        });
    })
  );
});

// 监听来自页面的消息 - 手动触发更新
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});
