"use client"

import { useCallback, useState } from "react"
import { Check, Dumbbell, Sparkles } from "lucide-react"
import { BottomNav } from "@/components/bottom-nav"
import { SuccessToast } from "@/components/success-toast"
import { createOptimisticRecord, saveCloudRecord } from "@/lib/records-api"

export default function HomePage() {
  const [toast, setToast] = useState({ visible: false, message: "" })
  const [animatingButton, setAnimatingButton] = useState<string | null>(null)

  const showToast = useCallback((message: string) => {
    setToast({ visible: true, message })
    window.setTimeout(() => setToast({ visible: false, message: "" }), 2000)
  }, [])

  const handleWorkoutCheckIn = useCallback(
    (duration: number) => {
      const record = createOptimisticRecord("锻炼", duration)

      setAnimatingButton(`workout-${duration}`)
      window.setTimeout(() => setAnimatingButton(null), 600)
      showToast(`锻炼 ${duration} 分钟`)

      saveCloudRecord(record).catch(() => {
        showToast("云端保存失败，请稍后重试")
      })
    },
    [showToast]
  )

  const handleStretchCheckIn = useCallback(
    (count: 1) => {
      const record = createOptimisticRecord("拉伸", count)

      setAnimatingButton(`stretch-${count}`)
      window.setTimeout(() => setAnimatingButton(null), 600)
      showToast(`拉伸 x${count}`)

      saveCloudRecord(record).catch(() => {
        showToast("云端保存失败，请稍后重试")
      })
    },
    [showToast]
  )

  const WorkoutButton = ({ duration, isPrimary = false }: { duration: number; isPrimary?: boolean }) => {
    const isAnimating = animatingButton === `workout-${duration}`
    const colorClass =
      duration >= 120
        ? "bg-gradient-to-br from-red-500 to-rose-600"
        : duration >= 90
          ? "bg-gradient-to-br from-orange-500 to-rose-500"
          : duration >= 60
            ? "bg-gradient-to-br from-orange-400 to-orange-500"
            : "bg-gradient-to-br from-orange-300 to-orange-400"

    return (
      <button
        onClick={() => handleWorkoutCheckIn(duration)}
        className={`
          relative overflow-hidden rounded-2xl
          ${colorClass}
          ${isPrimary ? "col-span-3 h-28" : "h-20"}
          flex flex-col items-center justify-center text-white font-semibold shadow-lg
          transition-all duration-200 ease-out hover:scale-[1.02] hover:shadow-xl active:scale-95
          ${isAnimating ? "ring-4 ring-white/50" : ""}
        `}
      >
        <span className={`${isPrimary ? "text-4xl" : "text-2xl"} font-bold`}>{duration}</span>
        <span className={`${isPrimary ? "text-base" : "text-xs"} opacity-80`}>分钟</span>
        {isAnimating && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/20">
            <Check className="h-12 w-12 animate-bounce text-white" />
          </div>
        )}
      </button>
    )
  }

  const StretchButton = ({ count }: { count: 1 }) => {
    const isAnimating = animatingButton === `stretch-${count}`

    return (
      <button
        onClick={() => handleStretchCheckIn(count)}
        className={`
          relative h-24 overflow-hidden rounded-2xl bg-gradient-to-br from-teal-400 to-teal-500
          flex flex-col items-center justify-center text-white font-semibold shadow-lg
          transition-all duration-200 ease-out hover:scale-[1.02] hover:shadow-xl active:scale-95
          ${isAnimating ? "ring-4 ring-white/50" : ""}
        `}
      >
        <span className="text-3xl font-bold">x{count}</span>
        <span className="text-xs opacity-80">次</span>
        {isAnimating && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/20">
            <Check className="h-10 w-10 animate-bounce text-white" />
          </div>
        )}
      </button>
    )
  }

  return (
    <main className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-lg">
        <div className="mx-auto max-w-md px-4 py-4">
          <h1 className="text-center text-xl font-bold text-foreground">每日打卡</h1>
        </div>
      </header>

      <div className="mx-auto max-w-md space-y-6 px-4 py-6">
        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100">
              <Dumbbell className="h-6 w-6 text-orange-600" />
            </div>
            <h2 className="text-lg font-bold text-foreground">锻炼</h2>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <WorkoutButton duration={90} isPrimary />
            <WorkoutButton duration={30} />
            <WorkoutButton duration={60} />
            <WorkoutButton duration={120} />
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100">
              <Sparkles className="h-6 w-6 text-teal-600" />
            </div>
            <h2 className="text-lg font-bold text-foreground">拉伸</h2>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <StretchButton count={1} />
          </div>
        </section>
      </div>

      <SuccessToast message={toast.message} isVisible={toast.visible} />
      <BottomNav />
    </main>
  )
}
