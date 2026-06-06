"use client"

import { useEffect, useMemo, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { BottomNav } from "@/components/bottom-nav"
import { getDailyStats, getMonthlyStats, getRecords } from "@/lib/storage"
import { loadCloudRecords } from "@/lib/records-api"
import type { CheckInRecord } from "@/types"

type TabType = "全部" | "锻炼" | "拉伸"

const tabs: TabType[] = ["全部", "锻炼", "拉伸"]
const weekDays = ["一", "二", "三", "四", "五", "六", "日"]

export default function StatsPage() {
  const [records, setRecords] = useState<CheckInRecord[]>([])
  const [activeTab, setActiveTab] = useState<TabType>("全部")
  const [viewMode, setViewMode] = useState<"month" | "year">("month")
  const [currentDate, setCurrentDate] = useState(new Date())
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    loadCloudRecords()
      .then((data) => {
        if (isMounted) setRecords(data)
      })
      .catch(() => {
        if (isMounted) setRecords(getRecords())
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const category = activeTab === "全部" ? undefined : activeTab
  const stats = useMemo(() => getMonthlyStats(records, year, month, category), [records, year, month, category])
  const dailyStats = useMemo(() => getDailyStats(records), [records])

  const monthCalendar = useMemo(() => {
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDayOfWeek = (firstDay.getDay() + 6) % 7
    const days: (number | null)[] = Array(startDayOfWeek).fill(null)

    for (let day = 1; day <= lastDay.getDate(); day += 1) {
      days.push(day)
    }

    return days
  }, [year, month])

  const yearCalendar = useMemo(() => {
    return Array.from({ length: 12 }, (_, monthIndex) => {
      const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
      const days = Array.from({ length: daysInMonth }, (_, dayIndex) => {
        const day = dayIndex + 1
        const dateStr = `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
        const dayData = dailyStats.get(dateStr)
        const hasWorkout = Boolean(dayData?.workout)
        const hasStretch = Boolean(dayData?.stretch)
        const hasRecord =
          activeTab === "全部" ? hasWorkout || hasStretch : activeTab === "锻炼" ? hasWorkout : hasStretch

        return { day, hasRecord }
      })

      return { month: monthIndex, days }
    })
  }, [year, dailyStats, activeTab])

  const stretchFrequency = useMemo(() => {
    const today = new Date()
    const isCurrentMonth = year === today.getFullYear() && month === today.getMonth()
    const monthDays = isCurrentMonth ? today.getDate() : new Date(year, month + 1, 0).getDate()
    const yearDays =
      year === today.getFullYear()
        ? Math.ceil((today.getTime() - new Date(year, 0, 1).getTime()) / 86400000) + 1
        : year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
          ? 366
          : 365
    const yearStretchCount = records
      .filter((record) => new Date(record.date).getFullYear() === year && record.category === "拉伸")
      .reduce((sum, record) => sum + record.duration, 0)

    return {
      monthFreq: stats.stretchCount > 0 ? Math.round(monthDays / stats.stretchCount) : 0,
      yearFreq: yearStretchCount > 0 ? Math.round(yearDays / yearStretchCount) : 0,
    }
  }, [records, year, month, stats.stretchCount])

  const navigate = (direction: -1 | 1) => {
    const nextDate = new Date(currentDate)

    if (viewMode === "month") {
      nextDate.setMonth(nextDate.getMonth() + direction)
    } else {
      nextDate.setFullYear(nextDate.getFullYear() + direction)
    }

    setCurrentDate(nextDate)
  }

  const isToday = (day: number) => {
    const today = new Date()
    return day === today.getDate() && month === today.getMonth() && year === today.getFullYear()
  }

  const getDayRecordInfo = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    const dayData = dailyStats.get(dateStr)
    if (!dayData) return null

    if (activeTab === "锻炼") return dayData.workout > 0 ? dayData : null
    if (activeTab === "拉伸") return dayData.stretch > 0 ? dayData : null
    return dayData.workout > 0 || dayData.stretch > 0 ? dayData : null
  }

  const getTabColor = (tab: TabType) => {
    if (tab === "锻炼") return "text-orange-600 border-orange-500 bg-orange-50"
    if (tab === "拉伸") return "text-teal-600 border-teal-500 bg-teal-50"
    return "text-foreground border-foreground bg-muted"
  }

  const getAccentColor = () => {
    if (activeTab === "锻炼") return "bg-orange-200 text-orange-700"
    if (activeTab === "拉伸") return "bg-teal-200 text-teal-700"
    return "bg-rose-200 text-rose-700"
  }

  return (
    <main className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-lg">
        <div className="mx-auto max-w-md px-4 py-4">
          <h1 className="text-center text-xl font-bold text-foreground">统计概览</h1>
        </div>
      </header>

      <div className="mx-auto max-w-md space-y-4 px-4 py-4">
        {isLoading ? (
          <div className="py-12 text-center text-sm text-muted-foreground">加载中...</div>
        ) : (
          <>
            <div className="flex gap-2 rounded-xl bg-muted/50 p-1">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`
                    flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200
                    ${activeTab === tab ? getTabColor(tab) : "text-muted-foreground hover:text-foreground"}
                  `}
                >
                  {tab}
                </button>
              ))}
            </div>

            <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {year}年{month + 1}月
                </span>
                <span className="text-xs text-muted-foreground">年度累计 {stats.yearTotalDays} 天</span>
              </div>

              <div className="grid grid-cols-4 gap-2">
                <div className="rounded-xl bg-muted/50 p-2 text-center">
                  <div className="text-2xl font-bold text-foreground">{stats.totalDays}</div>
                  <div className="text-[10px] text-muted-foreground">打卡天数</div>
                </div>
                {activeTab !== "拉伸" && (
                  <>
                    <div className="rounded-xl bg-orange-50 p-2 text-center">
                      <div className="text-2xl font-bold text-orange-600">{stats.workoutMinutes}</div>
                      <div className="text-[10px] text-orange-600/70">分钟</div>
                    </div>
                    <div className="rounded-xl bg-muted/50 p-2 text-center">
                      <div className="text-2xl font-bold text-foreground">{stats.avgMinutesPerDay}</div>
                      <div className="text-[10px] text-muted-foreground">日均</div>
                    </div>
                  </>
                )}
                {activeTab !== "锻炼" && (
                  <div className="rounded-xl bg-teal-50 p-2 text-center">
                    <div className="text-2xl font-bold text-teal-600">{stats.stretchCount}</div>
                    <div className="text-[10px] text-teal-600/70">拉伸次数</div>
                  </div>
                )}
                {activeTab === "拉伸" && (
                  <>
                    <div className="rounded-xl bg-teal-50/50 p-2 text-center">
                      <div className="text-2xl font-bold text-teal-600">{stretchFrequency.monthFreq || "-"}</div>
                      <div className="text-[10px] text-teal-600/70">天/次</div>
                    </div>
                    <div className="rounded-xl bg-teal-50/50 p-2 text-center">
                      <div className="text-2xl font-bold text-teal-600">{stretchFrequency.yearFreq || "-"}</div>
                      <div className="text-[10px] text-teal-600/70">年均</div>
                    </div>
                  </>
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <button onClick={() => navigate(-1)} className="rounded-lg p-1.5 transition-colors hover:bg-muted active:scale-95">
                    <ChevronLeft className="h-5 w-5 text-muted-foreground" />
                  </button>
                  <span className="min-w-[80px] text-center text-sm font-semibold text-foreground">
                    {viewMode === "month" ? `${year}年${month + 1}月` : `${year}年`}
                  </span>
                  <button onClick={() => navigate(1)} className="rounded-lg p-1.5 transition-colors hover:bg-muted active:scale-95">
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </button>
                </div>

                <div className="flex gap-1 rounded-lg bg-muted p-0.5">
                  {(["month", "year"] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setViewMode(mode)}
                      className={`rounded-md px-3 py-1 text-xs transition-all ${
                        viewMode === mode ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                      }`}
                    >
                      {mode === "month" ? "月" : "年"}
                    </button>
                  ))}
                </div>
              </div>

              {viewMode === "month" ? (
                <div>
                  <div className="mb-2 grid grid-cols-7 gap-1">
                    {weekDays.map((day) => (
                      <div key={day} className="py-1 text-center text-[10px] text-muted-foreground">
                        {day}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-1">
                    {monthCalendar.map((day, index) => {
                      if (day === null) return <div key={`empty-${index}`} className="aspect-square" />

                      const recordInfo = getDayRecordInfo(day)
                      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
                      const dayData = dailyStats.get(dateStr)
                      const hasWorkout = Boolean(dayData?.workout)
                      const hasStretch = Boolean(dayData?.stretch)
                      const todayCell = isToday(day)

                      return (
                        <div
                          key={day}
                          className={`
                            relative flex aspect-square flex-col items-center justify-center rounded-full text-xs transition-all duration-200
                            ${recordInfo ? getAccentColor() : "text-foreground"}
                            ${todayCell && !recordInfo ? "ring-2 ring-foreground/30 ring-inset" : ""}
                            ${!recordInfo && !todayCell ? "border border-dashed border-muted-foreground/20" : ""}
                          `}
                        >
                          <span className="font-medium">{day}</span>
                          {activeTab === "全部" && (hasWorkout || hasStretch) && (
                            <div className="absolute -bottom-1 flex gap-0.5">
                              {hasWorkout && <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />}
                              {hasStretch && <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />}
                            </div>
                          )}
                          {todayCell && <span className="absolute -bottom-3.5 text-[8px] text-muted-foreground">今天</span>}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {yearCalendar.map(({ month: monthIndex, days }) => (
                    <div key={monthIndex} className="space-y-1">
                      <span className="text-xs font-medium text-muted-foreground">{monthIndex + 1}月</span>
                      <div className="grid grid-cols-7 gap-[2px]">
                        {days.map(({ day, hasRecord }) => (
                          <div
                            key={day}
                            className={`
                              h-[6px] w-[6px] rounded-[1px] transition-colors
                              ${hasRecord
                                ? activeTab === "锻炼"
                                  ? "bg-orange-400"
                                  : activeTab === "拉伸"
                                    ? "bg-teal-400"
                                    : "bg-rose-300"
                                : "bg-muted"
                              }
                            `}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>

      <BottomNav />
    </main>
  )
}
