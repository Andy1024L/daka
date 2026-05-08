"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, Trash2, Save, Clock } from "lucide-react"
import { getRecords, updateRecord, deleteRecord } from "@/lib/storage"
import { Button } from "@/components/ui/button"
import { SuccessToast } from "@/components/success-toast"
import type { CheckInRecord } from "@/types"

export default function EditRecordPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [record, setRecord] = useState<CheckInRecord | null>(null)
  const [date, setDate] = useState("")
  const [duration, setDuration] = useState(0)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [toast, setToast] = useState({ visible: false, message: "" })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const records = getRecords()
    const found = records.find((r) => r.id === id)
    if (found) {
      setRecord(found)
      setDate(found.date)
      setDuration(found.duration)
    }
    setIsLoading(false)
  }, [id])

  const showToast = (message: string) => {
    setToast({ visible: true, message })
    setTimeout(() => setToast({ visible: false, message: "" }), 2000)
  }

  const formatTime = (timestamp: number) => {
    const d = new Date(timestamp)
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`
  }

  const handleSave = () => {
    if (!record) return

    const success = updateRecord(id, { date, duration })
    if (success) {
      showToast("保存成功")
      setTimeout(() => router.push("/data"), 500)
    } else {
      showToast("保存失败")
    }
  }

  const handleDelete = () => {
    const success = deleteRecord(id)
    if (success) {
      showToast("已删除")
      setTimeout(() => router.push("/data"), 500)
    } else {
      showToast("删除失败")
    }
  }

  const goBack = () => {
    router.push("/data")
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <span className="text-muted-foreground">加载中...</span>
      </main>
    )
  }

  if (!record) {
    return (
      <main className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <span className="text-muted-foreground">记录不存在</span>
        <Button onClick={goBack} variant="outline">
          返回
        </Button>
      </main>
    )
  }

  const isStretch = record.category === "拉伸"

  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 bg-background/95 backdrop-blur-lg border-b border-border z-40">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={goBack}
            className="p-2 -ml-2 rounded-lg hover:bg-muted transition-colors active:scale-95"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-bold text-foreground">编辑记录</h1>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-6 space-y-4">
        {/* 项目类型 */}
        <div className="bg-card rounded-2xl p-4 border border-border shadow-sm">
          <label className="text-xs font-medium text-muted-foreground block mb-2">
            项目类型
          </label>
          <div
            className={`
              text-base font-semibold px-4 py-3 rounded-xl flex items-center gap-2
              ${isStretch ? "bg-teal-100 text-teal-700" : "bg-orange-100 text-orange-700"}
            `}
          >
            {record.category}
          </div>
        </div>

        {/* 记录时间 */}
        <div className="bg-card rounded-2xl p-4 border border-border shadow-sm">
          <label className="text-xs font-medium text-muted-foreground block mb-2">
            记录时间
          </label>
          <div className="flex items-center gap-2 text-muted-foreground px-4 py-3 bg-muted rounded-xl">
            <Clock className="w-4 h-4" />
            <span className="text-sm">{formatTime(record.timestamp)}</span>
          </div>
        </div>

        {/* 日期 */}
        <div className="bg-card rounded-2xl p-4 border border-border shadow-sm">
          <label className="text-xs font-medium text-muted-foreground block mb-2">
            日期
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full text-base font-medium px-4 py-3 rounded-xl bg-muted border-0 focus:ring-2 focus:ring-foreground/20 outline-none transition-shadow"
          />
        </div>

        {/* 数值 */}
        <div className="bg-card rounded-2xl p-4 border border-border shadow-sm">
          <label className="text-xs font-medium text-muted-foreground block mb-2">
            {isStretch ? "次数" : "时长(分钟)"}
          </label>
          {isStretch ? (
            <div className="flex gap-3">
              {[1, 2].map((val) => (
                <button
                  key={val}
                  onClick={() => setDuration(val)}
                  className={`
                    flex-1 py-4 rounded-xl text-xl font-bold transition-all active:scale-95
                    ${duration === val
                      ? "bg-teal-500 text-white shadow-lg"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }
                  `}
                >
                  x{val}
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-4 gap-2">
                {[30, 60, 90, 120].map((val) => (
                  <button
                    key={val}
                    onClick={() => setDuration(val)}
                    className={`
                      py-3 rounded-xl text-base font-bold transition-all active:scale-95
                      ${duration === val
                        ? "bg-orange-500 text-white shadow-lg"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }
                    `}
                  >
                    {val}
                  </button>
                ))}
              </div>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full text-center text-xl font-bold px-4 py-3 rounded-xl bg-muted border-0 focus:ring-2 focus:ring-foreground/20 outline-none"
                placeholder="自定义分钟数"
              />
            </div>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="space-y-3 pt-4">
          <Button
            onClick={handleSave}
            className="w-full h-12 text-base gap-2 transition-transform active:scale-[0.98]"
          >
            <Save className="w-5 h-5" />
            保存修改
          </Button>

          {!showDeleteConfirm ? (
            <Button
              onClick={() => setShowDeleteConfirm(true)}
              variant="outline"
              className="w-full h-12 text-base gap-2 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30 transition-transform active:scale-[0.98]"
            >
              <Trash2 className="w-5 h-5" />
              删除记录
            </Button>
          ) : (
            <div className="flex gap-3">
              <Button
                onClick={() => setShowDeleteConfirm(false)}
                variant="outline"
                className="flex-1 h-12 text-base transition-transform active:scale-[0.98]"
              >
                取消
              </Button>
              <Button
                onClick={handleDelete}
                variant="destructive"
                className="flex-1 h-12 text-base transition-transform active:scale-[0.98]"
              >
                确认删除
              </Button>
            </div>
          )}
        </div>
      </div>

      <SuccessToast message={toast.message} isVisible={toast.visible} />
    </main>
  )
}
