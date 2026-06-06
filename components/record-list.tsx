"use client"

import { Dumbbell, Sparkles } from "lucide-react"
import type { CheckInRecord } from "@/types"

interface RecordListProps {
  records: CheckInRecord[]
}

export function RecordList({ records }: RecordListProps) {
  const sortedRecords = [...records].sort((a, b) => b.timestamp - a.timestamp)

  if (sortedRecords.length === 0) {
    return <div className="py-8 text-center text-muted-foreground">暂无打卡记录</div>
  }

  return (
    <div className="max-h-80 space-y-2 overflow-y-auto">
      {sortedRecords.slice(0, 50).map((record) => (
        <div key={record.id} className="flex items-center gap-3 rounded-xl border border-border bg-muted/50 p-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-lg ${
              record.category === "锻炼" ? "bg-orange-100 text-orange-600" : "bg-teal-100 text-teal-600"
            }`}
          >
            {record.category === "锻炼" ? <Dumbbell className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
          </div>

          <div className="min-w-0 flex-1">
            <div className="font-medium text-foreground">{record.category}</div>
            <div className="text-sm text-muted-foreground">{record.date}</div>
          </div>

          <div className="text-right">
            <div className="font-bold text-foreground">
              {record.category === "锻炼" ? `${record.duration} 分钟` : `x${record.duration}`}
            </div>
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
