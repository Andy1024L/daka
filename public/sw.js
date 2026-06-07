const CACHE_VERSION = "daka-shell-v20260607-stretch-v2"
const APP_SHELL_URLS = [
  "/",
  "/stats",
  "/data",
  "/login",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
  "/apple-icon.png",
]

async function cacheAppShell() {
  const cache = await caches.open(CACHE_VERSION)
  const staticAssetUrls = new Set()

  await Promise.all(
    APP_SHELL_URLS.map(async (url) => {
      try {
        const response = await fetch(url, { cache: "reload" })

        if (response.ok) {
          await cache.put(url, response.clone())
        }

        if (response.headers.get("content-type")?.includes("text/html")) {
          const html = await response.text()
          for (const match of html.matchAll(/\/_next\/static\/[^"'<>\s]+/g)) {
            staticAssetUrls.add(match[0])
          }
        }
      } catch {
        // Keep installing even if one optional shell URL is temporarily unavailable.
      }
    })
  )

  await Promise.all(
    [...staticAssetUrls].map(async (url) => {
      try {
        const response = await fetch(url, { cache: "reload" })
        if (response.ok) {
          await cache.put(url, response)
        }
      } catch {
        // Runtime fetch handling will cache this asset later.
      }
    })
  )
}

async function deleteOldCaches() {
  const cacheNames = await caches.keys()
  await Promise.all(cacheNames.filter((name) => name !== CACHE_VERSION).map((name) => caches.delete(name)))
}

async function refreshCache(request) {
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(CACHE_VERSION)
      await cache.put(request, response.clone())
    }
    return response
  } catch {
    return null
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(cacheAppShell().then(() => self.skipWaiting()))
})

self.addEventListener("activate", (event) => {
  event.waitUntil(deleteOldCaches().then(() => self.clients.claim()))
})

self.addEventListener("fetch", (event) => {
  const { request } = event
  const url = new URL(request.url)

  if (request.method !== "GET" || url.origin !== self.location.origin) {
    return
  }

  if (url.pathname.startsWith("/api/")) {
    return
  }

  if (request.mode === "navigate") {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const preloadOrRefresh = event.preloadResponse.then((response) => {
          if (response) {
            caches.open(CACHE_VERSION).then((cache) => cache.put(request, response.clone()))
            return response
          }
          return refreshCache(request)
        })

        if (cachedResponse) {
          event.waitUntil(preloadOrRefresh)
          return cachedResponse
        }

        return preloadOrRefresh.then((response) => response ?? caches.match("/"))
      })
    )
    return
  }

  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icon") || url.pathname === "/manifest.json") {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse

        return fetch(request).then((response) => {
          if (response.ok) {
            const responseToCache = response.clone()
            caches.open(CACHE_VERSION).then((cache) => cache.put(request, responseToCache))
          }

          return response
        })
      })
    )
  }
})
