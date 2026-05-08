"use client"

import { useMemo } from "react"
import type { CheckInRecord } from "@/types"
import { getDailyStats } from "@/lib/storage"

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

    const weekCount = Math.ceil(allDates.length / 7)

    return { dates: allDates, stats: dailyStats, weeks: weekCount }
  }, [records, months])

  const weekDays = ["日", "一", "二", "三", "四", "五", "六"]

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-1 min-w-fit">
        <div className="flex flex-col gap-1 text-xs text-muted-foreground pr-2">
          {weekDays.map((day, i) => (
            <div key={i} className="h-3 flex items-center">
              {i % 2 === 1 ? day : ""}
            </div>
          ))}
        </div>
        
        <div className="flex gap-1">
          {Array.from({ length: weeks }).map((_, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-1">
              {Array.from({ length: 7 }).map((_, dayIndex) => {
                const dateIndex = weekIndex * 7 + dayIndex
                const date = dates[dateIndex]
                
                if (!date || date > new Date()) {
                  return <div key={dayIndex} className="w-3 h-3" />
                }

                const dateStr = formatDate(date)
                const dayStats = stats.get(dateStr)
                const total = dayStats?.total || 0

                return (
                  <div
                    key={dayIndex}
                    className={`w-3 h-3 rounded-sm ${getIntensityClass(total)} transition-colors cursor-default`}
                    title={`${dateStr}: ${total}分钟`}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
        <span>少</span>
        <div className="flex gap-1">
          {["bg-muted", "bg-emerald-200", "bg-emerald-300", "bg-emerald-400", "bg-emerald-500", "bg-emerald-600"].map(
            (color) => (
              <div key={color} className={`w-3 h-3 rounded-sm ${color}`} />
            )
          )}
        </div>
        <span>多</span>
      </div>
    </div>
  )
}
