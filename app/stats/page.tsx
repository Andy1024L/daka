"use client"

import { useEffect, useMemo, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { BottomNav } from "@/components/bottom-nav"
import { getDailyStats, getRecords } from "@/lib/storage"
import { loadCloudRecords } from "@/lib/records-api"
import type { CheckInRecord } from "@/types"

type TabType = "全部" | "锻炼" | "拉伸"

const tabs: TabType[] = ["锻炼", "拉伸", "全部"]
const weekDays = ["一", "二", "三", "四", "五", "六", "日"]

function getUniqueDays(records: CheckInRecord[]) {
  return new Set(records.map((record) => record.date)).size
}

function getDaysInYear(year: number) {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) ? 366 : 365
}

function formatCompactNumber(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "-"
  return value >= 10 ? String(Math.round(value)) : String(Math.round(value * 10) / 10)
}

function parseRecordDate(value: string) {
  const [recordYear, recordMonth, recordDay] = value.split("-").map((part) => Number(part))
  return {
    year: recordYear,
    month: (recordMonth || 1) - 1,
    day: recordDay || 1,
  }
}

export default function StatsPage() {
  const [records, setRecords] = useState<CheckInRecord[]>(() => getRecords())
  const [activeTab, setActiveTab] = useState<TabType>("锻炼")
  const [viewMode, setViewMode] = useState<"month" | "year">("month")
  const [currentDate, setCurrentDate] = useState(new Date())
  useEffect(() => {
    let isMounted = true

    loadCloudRecords()
      .then((data) => {
        if (isMounted) setRecords(data)
      })
      .catch(() => {
        if (isMounted) setRecords((current) => (current.length > 0 ? current : getRecords()))
      })

    return () => {
      isMounted = false
    }
  }, [])

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const dailyStats = useMemo(() => getDailyStats(records), [records])
  const periodInfo = useMemo(() => {
    const today = new Date()
    const isCurrentYear = year === today.getFullYear()
    const isCurrentMonth = isCurrentYear && month === today.getMonth()
    const periodDays =
      viewMode === "month"
        ? isCurrentMonth
          ? today.getDate()
          : new Date(year, month + 1, 0).getDate()
        : isCurrentYear
          ? Math.ceil((today.getTime() - new Date(year, 0, 1).getTime()) / 86400000) + 1
          : getDaysInYear(year)

    const periodRecords = records.filter((record) => {
      const date = parseRecordDate(record.date)
      if (date.year !== year) return false
      return viewMode === "year" || date.month === month
    })
    const yearRecords = records.filter((record) => parseRecordDate(record.date).year === year)
    const filteredRecords = activeTab === "全部" ? periodRecords : periodRecords.filter((record) => record.category === activeTab)
    const yearFilteredRecords = activeTab === "全部" ? yearRecords : yearRecords.filter((record) => record.category === activeTab)
    const workoutMinutes = filteredRecords
      .filter((record) => record.category === "锻炼")
      .reduce((sum, record) => sum + record.duration, 0)
    const stretchCount = filteredRecords
      .filter((record) => record.category === "拉伸")
      .reduce((sum, record) => sum + record.duration, 0)
    const workoutDays = getUniqueDays(filteredRecords.filter((record) => record.category === "锻炼"))
    const stretchDays = getUniqueDays(filteredRecords.filter((record) => record.category === "拉伸"))
    const totalDays = getUniqueDays(filteredRecords)
    const yearTotalDays = getUniqueDays(yearFilteredRecords)
    const yearWorkoutDays = getUniqueDays(yearRecords.filter((record) => record.category === "锻炼"))
    const yearStretchRecords = yearRecords.filter((record) => record.category === "拉伸")
    const yearStretchDays = getUniqueDays(yearStretchRecords)
    const yearElapsedDays = isCurrentYear
      ? Math.ceil((today.getTime() - new Date(year, 0, 1).getTime()) / 86400000) + 1
      : getDaysInYear(year)

    return {
      totalDays,
      workoutDays,
      stretchDays,
      workoutMinutes,
      stretchCount,
      avgMinutesPerDay: totalDays > 0 ? Math.round(workoutMinutes / totalDays) : 0,
      weeklyDays: totalDays / Math.max(periodDays / 7, 1),
      stretchFrequency: stretchDays > 0 ? Math.round(periodDays / stretchDays) : 0,
      yearTotalDays,
      yearWorkoutDays,
      yearWorkoutWeeklyDays: yearWorkoutDays / Math.max(yearElapsedDays / 7, 1),
      yearStretchDays,
      yearStretchFrequency: yearStretchDays > 0 ? Math.round(yearElapsedDays / yearStretchDays) : 0,
    }
  }, [records, year, month, viewMode, activeTab])

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

        return { day, dayData, hasRecord }
      })

      return { month: monthIndex, days }
    })
  }, [year, dailyStats, activeTab])

  const summaryContent =
    activeTab === "锻炼" ? (
      <>
        年度累计 <strong className="font-bold text-orange-600">{periodInfo.yearWorkoutDays}</strong> 天，平均{" "}
        <strong className="font-bold text-orange-600">{formatCompactNumber(periodInfo.yearWorkoutWeeklyDays)}</strong> 天/周
      </>
    ) : activeTab === "拉伸" ? (
      <>
        年度累计 <strong className="font-bold text-teal-600">{periodInfo.yearStretchDays}</strong> 天，平均{" "}
        <strong className="font-bold text-teal-600">{periodInfo.yearStretchFrequency || "-"}</strong> 天/次
      </>
    ) : (
      <>
        年度累计 <strong className="font-bold text-slate-800">{periodInfo.yearTotalDays}</strong> 天
      </>
    )

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

  const getMetricCardClass = () => {
    if (activeTab === "锻炼") return "bg-orange-50 text-orange-700"
    if (activeTab === "拉伸") return "bg-teal-50 text-teal-700"
    return "bg-slate-100 text-slate-800"
  }

  const getMetricLabelClass = () => {
    if (activeTab === "锻炼") return "text-orange-600/70"
    if (activeTab === "拉伸") return "text-teal-600/70"
    return "text-slate-500"
  }

  const getWorkoutHeatClass = (minutes = 0) => {
    if (minutes >= 120) return "bg-red-500 text-white"
    if (minutes >= 90) return "bg-orange-400 text-white"
    if (minutes >= 60) return "bg-orange-300 text-orange-950"
    if (minutes >= 30) return "bg-orange-200 text-orange-900"
    if (minutes > 0) return "bg-orange-100 text-orange-800"
    return ""
  }

  const getStretchHeatClass = (count = 0) => {
    if (count >= 2) return "bg-[#009360] text-white"
    if (count >= 1) return "bg-teal-100 text-teal-900"
    return ""
  }

  const getDayHeatClass = (dayData?: { workout: number; stretch: number } | null) => {
    if (!dayData) return ""
    if (activeTab === "锻炼") return getWorkoutHeatClass(dayData.workout)
    if (activeTab === "拉伸") return getStretchHeatClass(dayData.stretch)
    if (dayData.workout > 0) return getWorkoutHeatClass(dayData.workout)
    return getStretchHeatClass(dayData.stretch)
  }

  const getDayValue = (dayData?: { workout: number; stretch: number } | null) => {
    if (!dayData) return ""
    if (activeTab === "锻炼") return dayData.workout ? String(dayData.workout) : ""
    if (activeTab === "拉伸") return dayData.stretch ? `x${dayData.stretch}` : ""
    return ""
  }

  return (
    <main className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-lg">
        <div className="mx-auto max-w-md px-4 py-4">
          <h1 className="text-center text-xl font-bold text-foreground">统计概览</h1>
        </div>
      </header>

      <div className="mx-auto max-w-md space-y-4 px-4 py-4">
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
                  {viewMode === "month" ? `${year}年${month + 1}月` : `${year}年`}
                </span>
                <span className="text-xs text-muted-foreground">{summaryContent}</span>
              </div>

              <div className={`grid gap-2 ${activeTab === "锻炼" ? "grid-cols-4" : activeTab === "拉伸" ? "grid-cols-2" : "grid-cols-3"}`}>
                <div className={`rounded-xl p-2 text-center ${getMetricCardClass()}`}>
                  <div className="text-2xl font-bold">
                    {activeTab === "锻炼"
                      ? periodInfo.workoutDays
                      : activeTab === "拉伸"
                        ? periodInfo.stretchDays
                        : periodInfo.totalDays}
                  </div>
                  <div className={`text-[10px] ${getMetricLabelClass()}`}>
                    {activeTab === "锻炼" ? "锻炼天数" : activeTab === "拉伸" ? "拉伸天数" : "打卡天数"}
                  </div>
                </div>
                {activeTab === "全部" ? (
                  <>
                    <div className={`rounded-xl p-2 text-center ${getMetricCardClass()}`}>
                      <div className="text-2xl font-bold">{periodInfo.workoutDays}</div>
                      <div className={`text-[10px] ${getMetricLabelClass()}`}>锻炼天数</div>
                    </div>
                    <div className={`rounded-xl p-2 text-center ${getMetricCardClass()}`}>
                      <div className="text-2xl font-bold">{periodInfo.stretchDays}</div>
                      <div className={`text-[10px] ${getMetricLabelClass()}`}>拉伸天数</div>
                    </div>
                  </>
                ) : activeTab === "锻炼" ? (
                  <>
                    <div className={`rounded-xl p-2 text-center ${getMetricCardClass()}`}>
                      <div className="text-2xl font-bold">{periodInfo.workoutMinutes}</div>
                      <div className={`text-[10px] ${getMetricLabelClass()}`}>分钟</div>
                    </div>
                    <div className={`rounded-xl p-2 text-center ${getMetricCardClass()}`}>
                      <div className="text-2xl font-bold">{periodInfo.avgMinutesPerDay}</div>
                      <div className={`text-[10px] ${getMetricLabelClass()}`}>日均</div>
                    </div>
                    <div className={`rounded-xl p-2 text-center ${getMetricCardClass()}`}>
                      <div className="text-2xl font-bold">{formatCompactNumber(periodInfo.weeklyDays)}</div>
                      <div className={`text-[10px] ${getMetricLabelClass()}`}>周均天数</div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className={`rounded-xl p-2 text-center ${getMetricCardClass()}`}>
                      <div className="text-2xl font-bold">{periodInfo.stretchFrequency || "-"}</div>
                      <div className={`text-[10px] ${getMetricLabelClass()}`}>天/次</div>
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
                      if (day === null) return <div key={`empty-${index}`} className="h-14" />

                      const recordInfo = getDayRecordInfo(day)
                      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
                      const dayData = dailyStats.get(dateStr)
                      const hasWorkout = Boolean(dayData?.workout)
                      const hasStretch = Boolean(dayData?.stretch)
                      const todayCell = isToday(day)
                      const heatClass = getDayHeatClass(dayData)
                      const dayValue = getDayValue(dayData)
                      const isAllView = activeTab === "全部"

                      return (
                        <div
                          key={day}
                          className={`
                            relative flex h-14 flex-col items-center justify-start text-xs transition-all duration-200
                          `}
                        >
                          <span
                            className={`
                              relative flex h-9 w-9 items-center justify-center rounded-xl font-semibold
                              ${
                                isAllView
                                  ? todayCell
                                    ? "border-2 border-foreground/45 text-foreground"
                                    : "border border-dashed border-muted-foreground/25 text-foreground"
                                  : recordInfo
                                    ? heatClass
                                    : todayCell
                                      ? "border-2 border-foreground/45 text-foreground"
                                      : "border border-dashed border-muted-foreground/25 text-muted-foreground"
                              }
                            `}
                          >
                            {day}
                          </span>
                          {isAllView && (hasWorkout || hasStretch) && (
                            <span className="mt-0.5 flex h-2 items-center gap-1">
                              {hasWorkout && <span className="h-2 w-2 rounded-full bg-orange-500" />}
                              {hasStretch && (
                                <span
                                  className={`h-2 w-2 rounded-full ${
                                    (dayData?.stretch ?? 0) >= 2 ? "bg-[#009360]" : "bg-teal-400"
                                  }`}
                                />
                              )}
                            </span>
                          )}
                          {!isAllView && dayValue && (
                            <span className="mt-1 h-3 text-[9px] font-semibold leading-none opacity-60">{dayValue}</span>
                          )}
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
                        {days.map(({ day, dayData, hasRecord }) => (
                          <div
                            key={day}
                            className={`
                              h-[6px] w-[6px] rounded-[1px] transition-colors
                              ${hasRecord ? getDayHeatClass(dayData) : "bg-muted"}
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
      </div>

      <BottomNav />
    </main>
  )
}
