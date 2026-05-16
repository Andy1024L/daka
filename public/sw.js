// 简化版 Service Worker - 仅用于 PWA 安装能力
const CACHE_NAME = 'daka-v1';

// 安装时缓存基础资源
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/manifest.json',
        '/icon-192.png',
        '/icon-512.png',
      ]);
    })
  );
  self.skipWaiting();
});

// 激活时清理旧缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// 网络优先策略 - 让浏览器正常处理请求
self.addEventListener('fetch', (event) => {
  // 不拦截任何请求，让浏览器使用默认行为
  return;
});
