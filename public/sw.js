const CACHE_NAME = 'daily-checkin-v8';

// 需要预缓存的核心资源
const STATIC_ASSETS = [
  '/',
  '/stats',
  '/manifest.json',
];

// 安装事件 - 预缓存核心资源，但不立即激活
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  // 不调用 skipWaiting()，等待手动触发
});

// 激活事件 - 清理旧缓存并立即接管
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // 清理旧版本缓存
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        );
      }),
      // 立即接管所有客户端
      self.clients.claim()
    ])
  );
});

// 请求拦截 - 绝对缓存优先策略，确保秒开
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

  // 所有请求：绝对缓存优先，有缓存立即返回，不等待网络
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        // 有缓存，立即返回，后台静默更新（不阻塞）
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
            // 导航请求，尝试返回首页缓存
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
