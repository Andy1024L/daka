const CACHE_VERSION = "daka-shell-v20260613-manual-update-v1"
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

self.addEventListener("install", (event) => {
  event.waitUntil(cacheAppShell())
})

self.addEventListener("activate", (event) => {
  event.waitUntil(deleteOldCaches().then(() => self.clients.claim()))
})

self.addEventListener("message", (event) => {
  if (event.data?.type === "ACTIVATE_UPDATE") {
    self.skipWaiting()
  }
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

  if (url.pathname === "/version.json") {
    event.respondWith(fetch(request))
    return
  }

  if (request.mode === "navigate") {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse
        }

        return fetch(request)
          .then((response) => {
            if (response.ok) {
              const responseToCache = response.clone()
              caches.open(CACHE_VERSION).then((cache) => cache.put(request, responseToCache))
            }

            return response
          })
          .catch(() => caches.match("/"))
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
