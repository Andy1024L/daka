"use client"

import { useEffect } from "react"

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("caches" in window) || process.env.NODE_ENV !== "production") {
      return
    }

    const isLocalPreview = ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname)

    if (isLocalPreview) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => registration.unregister())
      })
      caches.keys().then((cacheNames) => {
        cacheNames.forEach((cacheName) => caches.delete(cacheName))
      })
      return
    }

    const register = () => {
      navigator.serviceWorker
        .register("/sw.js")
        .catch(() => {
          // The app still works without offline startup caching.
        })
    }

    const scheduleRegister = () => {
      const registerWhenIdle =
        "requestIdleCallback" in window
          ? window.requestIdleCallback
          : (callback: IdleRequestCallback) => window.setTimeout(callback, 4000)

      const idleId = registerWhenIdle(register, { timeout: 8000 })

      return () => {
        if ("cancelIdleCallback" in window && typeof idleId === "number") {
          window.cancelIdleCallback(idleId)
        } else if (typeof idleId === "number") {
          window.clearTimeout(idleId)
        }
      }
    }

    let cancelScheduledRegister: (() => void) | undefined

    const onLoad = () => {
      cancelScheduledRegister = scheduleRegister()
    }

    if (document.readyState === "complete") {
      cancelScheduledRegister = scheduleRegister()
      return () => cancelScheduledRegister?.()
    }

    window.addEventListener("load", onLoad, { once: true })
    return () => {
      window.removeEventListener("load", onLoad)
      cancelScheduledRegister?.()
    }
  }, [])

  return null
}
