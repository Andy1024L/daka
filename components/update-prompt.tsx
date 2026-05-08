'use client'

import { useEffect } from 'react'

export function UpdatePrompt() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return
    }

    // 仅注册 Service Worker，不自动检查更新
    // 更新由首页的"手动更新"按钮触发
    const registerSW = async () => {
      try {
        await navigator.serviceWorker.register('/sw.js')
        
        // 监听 controller 变化（新版本激活后刷新页面）
        let refreshing = false
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (refreshing) return
          refreshing = true
          window.location.reload()
        })
      } catch (error) {
        console.error('Service Worker 注册失败:', error)
      }
    }

    registerSW()
  }, [])

  // 不再显示自动更新提示，由首页手动更新按钮控制
  return null
}
