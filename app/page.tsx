"use client"

import { useState, useCallback } from "react"
import { Dumbbell, Sparkles, Check, RefreshCw } from "lucide-react"
import { BottomNav } from "@/components/bottom-nav"
import { SuccessToast } from "@/components/success-toast"
import { addRecord } from "@/lib/storage"

export default function HomePage() {
  const [toast, setToast] = useState({ visible: false, message: "" })
  const [animatingBtn, setAnimatingBtn] = useState<string | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)

  const showToast = useCallback((message: string) => {
    setToast({ visible: true, message })
    setTimeout(() => setToast({ visible: false, message: "" }), 2000)
  }, [])

  const handleManualUpdate = useCallback(async () => {
    if (isUpdating) return
    setIsUpdating(true)

    try {
      if (!("serviceWorker" in navigator)) {
        showToast("浏览器不支持离线功能")
        setIsUpdating(false)
        return
      }

      const registration = await navigator.serviceWorker.getRegistration()
      if (!registration) {
        showToast("未找到 Service Worker")
        setIsUpdating(false)
        return
      }

      await registration.update()

      if (registration.waiting) {
        registration.waiting.postMessage("skipWaiting")
        showToast("更新成功，正在刷新...")
        setTimeout(() => window.location.reload(), 1000)
      } else if (registration.installing) {
        showToast("正在下载更新...")
        registration.installing.addEventListener("statechange", (e) => {
          const sw = e.target as ServiceWorker
          if (sw.state === "installed") {
            sw.postMessage("skipWaiting")
            showToast("更新成功，正在刷新...")
            setTimeout(() => window.location.reload(), 1000)
          }
        })
      } else {
        showToast("已是最新版本")
      }
    } catch (error) {
      console.error("更新失败:", error)
      showToast("更新失败，请检查网络")
    } finally {
      setTimeout(() => setIsUpdating(false), 2000)
    }
  }, [isUpdating, showToast])

  const handleWorkoutCheckIn = useCallback(
    (duration: number) => {
      addRecord("锻炼", duration)
      setAnimatingBtn(`workout-${duration}`)
      setTimeout(() => setAnimatingBtn(null), 600)
      showToast(`锻炼 ${duration}分钟`)
    },
    [showToast]
  )

  const handleStretchCheckIn = useCallback(
    (count: 1 | 2) => {
      addRecord("拉伸", count)
      setAnimatingBtn(`stretch-${count}`)
      setTimeout(() => setAnimatingBtn(null), 600)
      showToast(`拉伸 x${count}`)
    },
    [showToast]
  )

  const WorkoutButton = ({
    duration,
    isPrimary = false,
  }: {
    duration: number
    isPrimary?: boolean
  }) => {
    const isAnimating = animatingBtn === `workout-${duration}`

    return (
      <button
        onClick={() => handleWorkoutCheckIn(duration)}
        className={`
          relative overflow-hidden rounded-2xl
          ${isPrimary
            ? "bg-gradient-to-br from-orange-500 to-rose-500 col-span-3 h-28"
            : "bg-gradient-to-br from-orange-400 to-orange-500 h-20"
          }
          flex flex-col items-center justify-center
          text-white font-semibold shadow-lg
          transition-all duration-200 ease-out
          hover:scale-[1.02] hover:shadow-xl
          active:scale-95
          ${isAnimating ? "ring-4 ring-white/50" : ""}
        `}
      >
        <span className={`${isPrimary ? "text-4xl" : "text-2xl"} font-bold`}>
          {duration}
        </span>
        <span className={`${isPrimary ? "text-base" : "text-xs"} opacity-80`}>分钟</span>
        {isAnimating && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/20">
            <Check className="w-12 h-12 text-white animate-bounce" />
          </div>
        )}
      </button>
    )
  }

  const StretchButton = ({ count }: { count: 1 | 2 }) => {
    const isAnimating = animatingBtn === `stretch-${count}`

    return (
      <button
        onClick={() => handleStretchCheckIn(count)}
        className={`
          relative overflow-hidden rounded-2xl h-24
          bg-gradient-to-br from-teal-400 to-teal-500
          flex flex-col items-center justify-center
          text-white font-semibold shadow-lg
          transition-all duration-200 ease-out
          hover:scale-[1.02] hover:shadow-xl
          active:scale-95
          ${isAnimating ? "ring-4 ring-white/50" : ""}
        `}
      >
        <span className="text-3xl font-bold">x{count}</span>
        <span className="text-xs opacity-80">次</span>
        {isAnimating && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/20">
            <Check className="w-10 h-10 text-white animate-bounce" />
          </div>
        )}
      </button>
    )
  }

  return (
    <main className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 bg-background/95 backdrop-blur-lg border-b border-border z-40">
        <div className="max-w-md mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-foreground text-center">每日打卡</h1>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* 锻炼区块 */}
        <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
              <Dumbbell className="w-6 h-6 text-orange-600" />
            </div>
            <h2 className="text-lg font-bold text-foreground">锻炼</h2>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <WorkoutButton duration={90} isPrimary />
            <WorkoutButton duration={30} />
            <WorkoutButton duration={60} />
            <WorkoutButton duration={120} />
          </div>
        </div>

        {/* 拉伸区块 */}
        <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-teal-600" />
            </div>
            <h2 className="text-lg font-bold text-foreground">拉伸</h2>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <StretchButton count={1} />
            <StretchButton count={2} />
          </div>
        </div>
      </div>

      <SuccessToast message={toast.message} isVisible={toast.visible} />
      <BottomNav />

      <footer className="fixed bottom-20 left-0 right-0 flex items-center justify-center gap-3 py-2">
        <span className="text-xs text-muted-foreground/50">V9</span>
        <button
          onClick={handleManualUpdate}
          disabled={isUpdating}
          className="text-xs text-muted-foreground/50 hover:text-muted-foreground flex items-center gap-1 transition-colors disabled:opacity-50 active:scale-95"
        >
          <RefreshCw className={`w-3 h-3 ${isUpdating ? "animate-spin" : ""}`} />
          {isUpdating ? "更新中" : "手动更新"}
        </button>
      </footer>
    </main>
  )
}
