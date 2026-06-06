"use client"

import { useMemo } from "react"
import { getDailyStats } from "@/lib/storage"
import type { CheckInRecord } from "@/types"

interface HeatmapProps {
  records: CheckInRecord[]
  months: number
}

function getIntensityClass(minutes: number): string {
  if (minutes === 0) return "bg-muted"
  if (minutes < 30) return "bg-emerald-200"
  if (minutes < 60) return "bg-emerald-300"
  if (minutes < 90) return "bg-emerald-400"
  if (minutes < 120) return "bg-emerald-500"
  return "bg-emerald-600"
}

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0]
}

export function Heatmap({ records, months }: HeatmapProps) {
  const { dates, stats, weeks } = useMemo(() => {
    const today = new Date()
    const startDate = new Date(today)
    startDate.setMonth(startDate.getMonth() - months)
    startDate.setDate(startDate.getDate() - startDate.getDay())

    const dailyStats = getDailyStats(records)
    const allDates: Date[] = []
    const current = new Date(startDate)

    while (current <= today) {
      allDates.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }

    return {
      dates: allDates,
      stats: dailyStats,
      weeks: Math.ceil(allDates.length / 7),
    }
  }, [records, months])
  const weekDays = ["日", "一", "二", "三", "四", "五", "六"]

  return (
    <div className="overflow-x-auto">
      <div className="flex min-w-fit gap-1">
        <div className="flex flex-col gap-1 pr-2 text-xs text-muted-foreground">
          {weekDays.map((day, index) => (
            <div key={day} className="flex h-3 items-center">
              {index % 2 === 1 ? day : ""}
            </div>
          ))}
        </div>

        <div className="flex gap-1">
          {Array.from({ length: weeks }).map((_, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-1">
              {Array.from({ length: 7 }).map((_, dayIndex) => {
                const date = dates[weekIndex * 7 + dayIndex]
                if (!date || date > new Date()) return <div key={dayIndex} className="h-3 w-3" />

                const dateStr = formatDate(date)
                const total = stats.get(dateStr)?.total || 0

                return (
                  <div
                    key={dayIndex}
                    className={`h-3 w-3 cursor-default rounded-sm ${getIntensityClass(total)} transition-colors`}
                    title={`${dateStr}: ${total} 分钟`}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
        <span>少</span>
        <div className="flex gap-1">
          {["bg-muted", "bg-emerald-200", "bg-emerald-300", "bg-emerald-400", "bg-emerald-500", "bg-emerald-600"].map(
            (color) => (
              <div key={color} className={`h-3 w-3 rounded-sm ${color}`} />
            )
          )}
        </div>
        <span>多</span>
      </div>
    </div>
  )
}
