"use client"

import { useEffect } from "react"

const VERSION_KEY = "app-version"
const CURRENT_VERSION = 17

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return
    }

    let refreshing = false

    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js")

        // 监听 controller 变化（新版本激活后刷新页面）
        navigator.serviceWorker.addEventListener("controllerchange", () => {
          if (refreshing) return
          refreshing = true
          window.location.reload()
        })

        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing
          if (!newWorker) return

          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              const stored = localStorage.getItem(VERSION_KEY)
              const storedVersion = stored ? parseInt(stored) : 0

              if (storedVersion < CURRENT_VERSION) {
                localStorage.setItem(VERSION_KEY, String(CURRENT_VERSION))
              }
            }
          })
        })

        const stored = localStorage.getItem(VERSION_KEY)
        if (!stored) {
          localStorage.setItem(VERSION_KEY, String(CURRENT_VERSION))
        }
      } catch (error) {
        console.error("Service Worker 注册失败:", error)
      }
    }

    registerSW()
  }, [])

  return null
}
