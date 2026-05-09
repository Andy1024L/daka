const CACHE_VERSION = 'v14';
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `dynamic-${CACHE_VERSION}`;

// 核心资源列表
const CORE_ASSETS = [
  '/',
  '/stats',
  '/data',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
];

// 安装阶段 - 缓存核心资源
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching core assets');
        return cache.addAll(CORE_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// 激活阶段 - 清理旧缓存
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
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

// 请求拦截
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 只处理同源请求
  if (url.origin !== location.origin) {
    return;
  }

  const isNavigate = request.mode === 'navigate';
  const isGet = request.method === 'GET';

  // 对于导航请求（页面切换），使用缓存优先
  if (isNavigate && isGet) {
    event.respondWith(
      caches.match(request)
        .then((cached) => {
          if (cached) {
            // 返回缓存，同时更新缓存
            fetchAndCache(request);
            return cached;
          }

          // 没有缓存，尝试网络
          return fetchAndCache(request);
        })
        .catch(() => {
          // 网络失败，返回首页缓存作为后备
          return caches.match('/').then((fallback) => {
            if (fallback) {
              return fallback;
            }
            return new Response('离线模式', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
        })
    );
    return;
  }

  // 对于其他资源，使用缓存优先策略
  if (isGet) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) {
          return cached;
        }
        return fetchAndCache(request);
      })
    );
  }
});

// 获取并缓存
function fetchAndCache(request) {
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
    .catch((error) => {
      console.error('[SW] Fetch failed:', error);
      throw error;
    });
}

// 处理来自页面的消息
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});
