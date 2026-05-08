"use client"

import { useState, useEffect, useMemo } from "react"
import { ChevronLeft, ChevronRight, TrendingUp } from "lucide-react"
import { BottomNav } from "@/components/bottom-nav"
import { getRecords, getMonthlyStats, getDailyStats, getYearlyMonthlyStats } from "@/lib/storage"
import type { CheckInRecord } from "@/types"

type TabType = "全部" | "锻炼" | "拉伸"

export default function StatsPage() {
  const [records, setRecords] = useState<CheckInRecord[]>([])
  const [activeTab, setActiveTab] = useState<TabType>("全部")
  const [viewMode, setViewMode] = useState<"month" | "year">("month")
  const [currentDate, setCurrentDate] = useState(new Date())

  useEffect(() => {
    setRecords(getRecords())
  }, [])

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  // 统计数据
  const stats = useMemo(() => {
    const category = activeTab === "全部" ? undefined : activeTab
    return getMonthlyStats(records, year, month, category)
  }, [records, year, month, activeTab])

  const dailyStats = useMemo(() => getDailyStats(records), [records])

  // 年度每月数据（用于图表）
  const yearlyData = useMemo(() => {
    const category = activeTab === "全部" ? undefined : activeTab
    return getYearlyMonthlyStats(records, year, category)
  }, [records, year, activeTab])

  const maxYearlyValue = Math.max(...yearlyData, 1)

  // 月历数据
  const monthCalendar = useMemo(() => {
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDayOfWeek = (firstDay.getDay() + 6) % 7

    const days: (number | null)[] = []
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null)
    }
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(i)
    }
    return days
  }, [year, month])

  // 年历数据
  const yearCalendar = useMemo(() => {
    const months: { month: number; days: { day: number; hasRecord: boolean }[] }[] = []

    for (let m = 0; m < 12; m++) {
      const daysInMonth = new Date(year, m + 1, 0).getDate()
      const monthDays: { day: number; hasRecord: boolean }[] = []

      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`
        const dayData = dailyStats.get(dateStr)
        
        let hasRecord = false
        if (dayData) {
          if (activeTab === "全部") {
            hasRecord = dayData.total > 0 || dayData.stretch > 0
          } else if (activeTab === "锻炼") {
            hasRecord = dayData.workout > 0
          } else {
            hasRecord = dayData.stretch > 0
          }
        }
        
        monthDays.push({ day: d, hasRecord })
      }

      months.push({ month: m, days: monthDays })
    }

    return months
  }, [year, dailyStats, activeTab])

  const navigatePrev = () => {
    const newDate = new Date(currentDate)
    if (viewMode === "month") {
      newDate.setMonth(newDate.getMonth() - 1)
    } else {
      newDate.setFullYear(newDate.getFullYear() - 1)
    }
    setCurrentDate(newDate)
  }

  const navigateNext = () => {
    const newDate = new Date(currentDate)
    if (viewMode === "month") {
      newDate.setMonth(newDate.getMonth() + 1)
    } else {
      newDate.setFullYear(newDate.getFullYear() + 1)
    }
    setCurrentDate(newDate)
  }

  const today = new Date()
  const isToday = (day: number) => {
    return (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    )
  }

  const getDayRecordInfo = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    const dayData = dailyStats.get(dateStr)
    if (!dayData) return null
    
    if (activeTab === "锻炼") return dayData.workout > 0 ? dayData : null
    if (activeTab === "拉伸") return dayData.stretch > 0 ? dayData : null
    return dayData.total > 0 || dayData.stretch > 0 ? dayData : null
  }

  const weekDays = ["一", "二", "三", "四", "五", "六", "日"]
  const tabs: TabType[] = ["全部", "锻炼", "拉伸"]

  const getTabColor = (tab: TabType) => {
    switch (tab) {
      case "锻炼": return "text-orange-600 border-orange-500 bg-orange-50"
      case "拉伸": return "text-teal-600 border-teal-500 bg-teal-50"
      default: return "text-foreground border-foreground bg-muted"
    }
  }

  const getAccentColor = () => {
    switch (activeTab) {
      case "锻炼": return "bg-orange-200 text-orange-700"
      case "拉伸": return "bg-teal-200 text-teal-700"
      default: return "bg-rose-200 text-rose-700"
    }
  }

  return (
    <main className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 bg-background/95 backdrop-blur-lg border-b border-border z-40">
        <div className="max-w-md mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-foreground text-center">统计概览</h1>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-4 space-y-4">
        {/* Tab 切换 */}
        <div className="flex gap-2 bg-muted/50 p-1 rounded-xl">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`
                flex-1 py-2 px-3 rounded-lg text-sm font-medium
                transition-all duration-200
                ${activeTab === tab
                  ? getTabColor(tab)
                  : "text-muted-foreground hover:text-foreground"
                }
              `}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* 统计卡片 */}
        <div className="bg-card rounded-2xl p-4 border border-border shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">
              {year}年{month + 1}月
            </span>
            <span className="text-xs text-muted-foreground">
              年度累计 {stats.yearTotalDays} 天
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2">
            <div className="text-center p-2 bg-muted/50 rounded-xl">
              <div className="text-2xl font-bold text-foreground">{stats.totalDays}</div>
              <div className="text-[10px] text-muted-foreground">打卡天数</div>
            </div>
            {activeTab !== "拉伸" && (
              <div className="text-center p-2 bg-orange-50 rounded-xl">
                <div className="text-2xl font-bold text-orange-600">{stats.workoutMinutes}</div>
                <div className="text-[10px] text-orange-600/70">分钟</div>
              </div>
            )}
            {activeTab !== "锻炼" && (
              <div className="text-center p-2 bg-teal-50 rounded-xl">
                <div className="text-2xl font-bold text-teal-600">{stats.stretchCount}</div>
                <div className="text-[10px] text-teal-600/70">拉伸次</div>
              </div>
            )}
            {activeTab !== "拉伸" && (
              <div className="text-center p-2 bg-muted/50 rounded-xl">
                <div className="text-2xl font-bold text-foreground">{stats.avgMinutesPerDay}</div>
                <div className="text-[10px] text-muted-foreground">日均</div>
              </div>
            )}
          </div>
        </div>



        {/* 日历区域 */}
        <div className="bg-card rounded-2xl p-4 border border-border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-1">
              <button
                onClick={navigatePrev}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors active:scale-95"
              >
                <ChevronLeft className="w-5 h-5 text-muted-foreground" />
              </button>
              <span className="text-sm font-semibold text-foreground min-w-[80px] text-center">
                {viewMode === "month"
                  ? `${year}年${month + 1}月`
                  : `${year}年`}
              </span>
              <button
                onClick={navigateNext}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors active:scale-95"
              >
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div className="flex gap-1 bg-muted rounded-lg p-0.5">
              <button
                onClick={() => setViewMode("month")}
                className={`px-3 py-1 text-xs rounded-md transition-all ${
                  viewMode === "month"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground"
                }`}
              >
                月
              </button>
              <button
                onClick={() => setViewMode("year")}
                className={`px-3 py-1 text-xs rounded-md transition-all ${
                  viewMode === "year"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground"
                }`}
              >
                年
              </button>
            </div>
          </div>

          {viewMode === "month" ? (
            <div>
              <div className="grid grid-cols-7 gap-1 mb-2">
                {weekDays.map((day) => (
                  <div key={day} className="text-center text-[10px] text-muted-foreground py-1">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {monthCalendar.map((day, index) => {
                  if (day === null) {
                    return <div key={`empty-${index}`} className="aspect-square" />
                  }

                  const recordInfo = getDayRecordInfo(day)
                  const hasRecord = !!recordInfo
                  const isTodayCell = isToday(day)

                  return (
                    <div
                      key={day}
                      className={`
                        aspect-square flex flex-col items-center justify-center rounded-full
                        text-xs relative transition-all duration-200
                        ${hasRecord ? getAccentColor() : "text-foreground"}
                        ${isTodayCell && !hasRecord ? "ring-2 ring-foreground/30 ring-inset" : ""}
                        ${!hasRecord && !isTodayCell ? "border border-dashed border-muted-foreground/20" : ""}
                      `}
                    >
                      <span className="font-medium">{day}</span>
                      {isTodayCell && (
                        <span className="absolute -bottom-3.5 text-[8px] text-muted-foreground">今天</span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {yearCalendar.map(({ month: m, days }) => (
                <div key={m} className="space-y-1">
                  <span className="text-xs font-medium text-muted-foreground">{m + 1}月</span>
                  <div className="grid grid-cols-7 gap-[2px]">
                    {days.map(({ day, hasRecord }) => (
                      <div
                        key={day}
                        className={`
                          w-[6px] h-[6px] rounded-[1px] transition-colors
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
        </div>
      </div>

      <BottomNav />
    </main>
  )
}
