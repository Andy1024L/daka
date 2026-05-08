"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, Trash2, Save } from "lucide-react"
import { getRecords, saveRecords } from "@/lib/storage"
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

  useEffect(() => {
    const records = getRecords()
    const found = records.find((r) => r.id === id)
    if (found) {
      setRecord(found)
      setDate(found.date)
      setDuration(found.duration)
    }
  }, [id])

  const showToast = (message: string) => {
    setToast({ visible: true, message })
    setTimeout(() => setToast({ visible: false, message: "" }), 2000)
  }

  const handleSave = () => {
    if (!record) return
    
    const records = getRecords()
    const index = records.findIndex((r) => r.id === id)
    if (index === -1) return

    records[index] = {
      ...record,
      date,
      duration,
    }
    saveRecords(records)
    showToast("保存成功")
    setTimeout(() => router.back(), 500)
  }

  const handleDelete = () => {
    const records = getRecords()
    const filtered = records.filter((r) => r.id !== id)
    saveRecords(filtered)
    showToast("已删除")
    setTimeout(() => router.back(), 500)
  }

  if (!record) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <span className="text-muted-foreground">加载中...</span>
      </main>
    )
  }

  const isStretch = record.category === "拉伸"

  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 bg-background/80 backdrop-blur-lg border-b border-border z-40">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 rounded-lg hover:bg-muted transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold text-foreground">编辑记录</h1>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* 项目类型 */}
        <div className="bg-card rounded-2xl p-4 border border-border">
          <label className="text-sm font-medium text-muted-foreground block mb-2">
            项目类型
          </label>
          <div className={`
            text-lg font-semibold px-4 py-3 rounded-xl
            ${isStretch ? "bg-teal-100 text-teal-700" : "bg-orange-100 text-orange-700"}
          `}>
            {record.category}
          </div>
        </div>

        {/* 日期 */}
        <div className="bg-card rounded-2xl p-4 border border-border">
          <label className="text-sm font-medium text-muted-foreground block mb-2">
            日期
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full text-lg font-semibold px-4 py-3 rounded-xl bg-muted border-0 focus:ring-2 focus:ring-foreground/20 outline-none"
          />
        </div>

        {/* 数值 */}
        <div className="bg-card rounded-2xl p-4 border border-border">
          <label className="text-sm font-medium text-muted-foreground block mb-2">
            {isStretch ? "次数" : "时长(分钟)"}
          </label>
          {isStretch ? (
            <div className="flex gap-3">
              {[1, 2].map((val) => (
                <button
                  key={val}
                  onClick={() => setDuration(val)}
                  className={`
                    flex-1 py-4 rounded-xl text-xl font-bold transition-all
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
            <div className="grid grid-cols-2 gap-3">
              {[30, 60, 90, 120].map((val) => (
                <button
                  key={val}
                  onClick={() => setDuration(val)}
                  className={`
                    py-4 rounded-xl text-xl font-bold transition-all
                    ${duration === val 
                      ? "bg-orange-500 text-white shadow-lg" 
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }
                  `}
                >
                  {val}分钟
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="space-y-3 pt-4">
          <Button
            onClick={handleSave}
            className="w-full h-12 text-base gap-2"
          >
            <Save className="w-5 h-5" />
            保存修改
          </Button>

          {!showDeleteConfirm ? (
            <Button
              onClick={() => setShowDeleteConfirm(true)}
              variant="outline"
              className="w-full h-12 text-base gap-2 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
            >
              <Trash2 className="w-5 h-5" />
              删除记录
            </Button>
          ) : (
            <div className="flex gap-3">
              <Button
                onClick={() => setShowDeleteConfirm(false)}
                variant="outline"
                className="flex-1 h-12 text-base"
              >
                取消
              </Button>
              <Button
                onClick={handleDelete}
                variant="destructive"
                className="flex-1 h-12 text-base"
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
