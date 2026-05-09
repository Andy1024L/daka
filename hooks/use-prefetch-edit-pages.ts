"use client"

import { useEffect } from "react"
import { getRecords } from "@/lib/storage"

export function usePrefetchEditPages() {
  useEffect(() => {
    const prefetchEditPages = async () => {
      if (!("caches" in window)) return

      const records = getRecords()
      const editUrls = records.map((record) => `/edit/${record.id}`)

      console.log("[Prefetch] Caching edit pages:", editUrls.length)

      try {
        const cache = await caches.open(`dynamic-v15`)
        await Promise.all(
          editUrls.map(async (url) => {
            try {
              const fullUrl = `${window.location.origin}${url}`
              const response = await fetch(fullUrl)
              if (response.ok) {
                await cache.put(url, response.clone())
                console.log("[Prefetch] Cached:", url)
              }
            } catch (error) {
              console.log("[Prefetch] Failed to cache:", url)
            }
          })
        )
        console.log("[Prefetch] Done")
      } catch (error) {
        console.error("[Prefetch] Error:", error)
      }
    }

    prefetchEditPages()
  }, [])
}
