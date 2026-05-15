const CACHE_VERSION = 'v20';
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `dynamic-${CACHE_VERSION}`;

const CORE_ASSETS = [
  '/',
  '/stats/',
  '/data/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
];

// 安装时预缓存核心资源
self.addEventListener('install', (event) => {
  console.log('[SW] Installing v20...');
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
      .catch((error) => {
        console.log('[SW] Cache addAll failed:', error);
      })
  );
});

// 激活时清理旧缓存
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating v20...');
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

// 网络优先，缓存回退策略
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    // 网络失败，尝试缓存
    const cached = await caches.match(request, { ignoreSearch: true });
    if (cached) {
      return cached;
    }
    throw error;
  }
}

// 缓存优先，网络回退策略（用于静态资源）
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.log('[SW] Resource not cached and network unavailable:', request.url);
    return new Response('', {
      status: 503,
      statusText: 'Offline'
    });
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 忽略非同源请求
  if (url.origin !== location.origin) {
    return;
  }

  const isNavigate = request.mode === 'navigate';
  const isGet = request.method === 'GET';
  const isRSC = url.searchParams.has('_rsc');
  const isNextInternal = url.pathname.startsWith('/_next/') || 
                         url.pathname.startsWith('/@') ||
                         url.searchParams.has('__rsc_id');

  // 跳过 RSC 和 Next.js 内部请求
  if (isRSC || isNextInternal) {
    return;
  }

  // 页面导航请求：网络优先
  if (isNavigate && isGet) {
    event.respondWith(
      networkFirst(request)
        .catch(() => {
          console.log('[SW] Network failed for navigation, trying static cache...');
          return caches.match('/', { ignoreSearch: true }).then((fallback) => {
            if (fallback) {
              return fallback;
            }
            return caches.match('/index.html').then((htmlFallback) => {
              if (htmlFallback) {
                return htmlFallback;
              }
              return new Response(`
                <!DOCTYPE html>
                <html lang="zh-CN">
                <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>离线模式</title>
                  <style>
                    body {
                      font-family: system-ui, -apple-system, sans-serif;
                      display: flex;
                      justify-content: center;
                      align-items: center;
                      min-height: 100vh;
                      margin: 0;
                      background: #f5f5f5;
                      color: #333;
                    }
                    .container {
                      text-align: center;
                      padding: 2rem;
                    }
                    h1 { font-size: 1.5rem; margin-bottom: 1rem; }
                    p { color: #666; margin-bottom: 1.5rem; }
                    button {
                      background: #f97316;
                      color: white;
                      border: none;
                      padding: 0.75rem 1.5rem;
                      border-radius: 0.5rem;
                      font-size: 1rem;
                      cursor: pointer;
                    }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <h1>离线模式</h1>
                    <p>当前无法连接到网络，请检查网络连接后重试。</p>
                    <button onclick="window.location.reload()">重试</button>
                  </div>
                </body>
                </html>
              `, {
                status: 503,
                headers: { 'Content-Type': 'text/html; charset=utf-8' }
              });
            });
          });
        })
    );
    return;
  }

  // 其他 GET 请求：缓存优先
  if (isGet) {
    event.respondWith(cacheFirst(request));
  }
});

self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});
