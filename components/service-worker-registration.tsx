"use client"

import { useEffect } from "react"

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return
    }

    // 简单注册 Service Worker，用于 PWA 安装能力
    navigator.serviceWorker.register("/sw.js").catch((error) => {
      console.error("Service Worker 注册失败:", error)
    })
  }, [])

  return null
}
