"use client"

import { Dumbbell, Sparkles } from "lucide-react"
import type { CheckInRecord } from "@/types"

interface RecordListProps {
  records: CheckInRecord[]
}

export function RecordList({ records }: RecordListProps) {
  const sortedRecords = [...records].sort((a, b) => b.timestamp - a.timestamp)

  if (sortedRecords.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        暂无打卡记录
      </div>
    )
  }

  return (
    <div className="space-y-2 max-h-80 overflow-y-auto">
      {sortedRecords.slice(0, 50).map((record) => (
        <div
          key={record.id}
          className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border"
        >
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              record.category === "体能训练"
                ? "bg-orange-100 text-orange-600"
                : "bg-teal-100 text-teal-600"
            }`}
          >
            {record.category === "体能训练" ? (
              <Dumbbell className="w-5 h-5" />
            ) : (
              <Sparkles className="w-5 h-5" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="font-medium text-foreground">{record.category}</div>
            <div className="text-sm text-muted-foreground">{record.date}</div>
          </div>
          
          <div className="text-right">
            <div className="font-bold text-foreground">{record.duration}分钟</div>
            <div className="text-xs text-muted-foreground">
              {new Date(record.timestamp).toLocaleTimeString("zh-CN", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
