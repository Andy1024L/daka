"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Download, Upload, Trash2, Pencil, X } from "lucide-react"
import { BottomNav } from "@/components/bottom-nav"
import { SuccessToast } from "@/components/success-toast"
import { getRecords, deleteRecord, downloadXLSX, importFromXLSX, clearRecords, updateRecord } from "@/lib/storage"
import type { CheckInRecord } from "@/types"
import { Button } from "@/components/ui/button"

export default function DataPage() {
  const [records, setRecords] = useState<CheckInRecord[]>([])
  const [toast, setToast] = useState({ visible: false, message: "" })
  const [showConfirm, setShowConfirm] = useState(false)
  const [editingRecord, setEditingRecord] = useState<CheckInRecord | null>(null)
  const [editDate, setEditDate] = useState("")
  const [editDuration, setEditDuration] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setRecords(getRecords())
  }, [])

  const showToast = useCallback((message: string) => {
    setToast({ visible: true, message })
    setTimeout(() => setToast({ visible: false, message: "" }), 2000)
  }, [])

  const handleExport = async () => {
    await downloadXLSX()
    showToast("表格导出成功")
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      const buffer = event.target?.result as ArrayBuffer
      const mode = records.length > 0 ? "merge" : "replace"
      const count = await importFromXLSX(buffer, mode)
      setRecords(getRecords())
      showToast(`导入 ${count} 条记录`)
    }
    reader.readAsArrayBuffer(file)
    e.target.value = ""
  }

  const handleClear = () => {
    clearRecords()
    setRecords([])
    setShowConfirm(false)
    showToast("数据已清除")
  }

  const handleDeleteRecord = (id: string) => {
    const success = deleteRecord(id)
    if (success) {
      setRecords(getRecords())
      showToast("记录已删除")
    }
  }

  const handleEditClick = (record: CheckInRecord) => {
    setEditingRecord(record)
    setEditDate(record.date)
    setEditDuration(String(record.duration))
  }

  const handleEditSave = () => {
    if (!editingRecord) return
    
    const newDate = editDate.trim()
    const newDuration = parseInt(editDuration)
    
    if (!newDate || isNaN(newDuration) || newDuration <= 0) {
      showToast("请输入有效数据")
      return
    }
    
    updateRecord(editingRecord.id, { date: newDate, duration: newDuration })
    setRecords(getRecords())
    setEditingRecord(null)
    showToast("记录已更新")
  }

  const handleEditCancel = () => {
    setEditingRecord(null)
  }

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`
  }

  const sortedRecords = records.sort((a, b) => b.timestamp - a.timestamp)

  return (
    <main className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 bg-background/95 backdrop-blur-lg border-b border-border z-40">
        <div className="max-w-md mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-foreground text-center">数据管理</h1>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-4 space-y-4">
        <div className="bg-card rounded-2xl p-4 border border-border shadow-sm">
          <h2 className="text-sm font-medium text-muted-foreground mb-3">数据管理</h2>
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={handleExport}
              variant="outline"
              className="h-11 gap-2 text-sm"
            >
              <Download className="w-4 h-4" />
              导出表格
            </Button>
            <Button
              onClick={handleImportClick}
              variant="outline"
              className="h-11 gap-2 text-sm"
            >
              <Upload className="w-4 h-4" />
              导入表格
            </Button>
          </div>

          {!showConfirm ? (
            <Button
              onClick={() => setShowConfirm(true)}
              variant="outline"
              className="w-full h-11 gap-2 text-sm mt-2 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
            >
              <Trash2 className="w-4 h-4" />
              清除所有数据
            </Button>
          ) : (
            <div className="flex gap-2 mt-2">
              <Button
                onClick={() => setShowConfirm(false)}
                variant="outline"
                className="flex-1 h-11 text-sm"
              >
                取消
              </Button>
              <Button
                onClick={handleClear}
                variant="destructive"
                className="flex-1 h-11 text-sm"
              >
                确认清除
              </Button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h2 className="text-sm font-medium text-muted-foreground">
              记录列表
            </h2>
            <span className="text-xs text-muted-foreground">
              共 {sortedRecords.length} 条
            </span>
          </div>

          <div className="max-h-[50vh] overflow-y-auto divide-y divide-border">
            {sortedRecords.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">
                暂无记录
              </div>
            ) : (
              sortedRecords.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div
                      className={`
                        w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold
                        ${record.category === "锻炼"
                          ? "bg-orange-100 text-orange-600"
                          : "bg-teal-100 text-teal-600"
                        }
                      `}
                    >
                      {record.category === "锻炼" ? record.duration : `x${record.duration}`}
                    </div>
                    <div>
                      <div className="font-medium text-foreground text-sm">
                        {record.category}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {record.date.replace(/-/g, "/")} {formatTime(record.timestamp)}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleEditClick(record)
                    }}
                    className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors active:scale-90"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteRecord(record.id)
                    }}
                    className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors active:scale-90"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <SuccessToast message={toast.message} isVisible={toast.visible} />

      {editingRecord && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-lg font-bold text-foreground">编辑记录</h3>
              <button
                onClick={handleEditCancel}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  类型
                </label>
                <div className="px-3 py-2 bg-muted rounded-lg text-foreground font-medium">
                  {editingRecord.category}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  日期
                </label>
                <input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  {editingRecord.category === "锻炼" ? "时长（分钟）" : "次数"}
                </label>
                <input
                  type="number"
                  value={editDuration}
                  onChange={(e) => setEditDuration(e.target.value)}
                  min="1"
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            
            <div className="p-4 flex gap-3">
              <Button
                onClick={handleEditCancel}
                variant="outline"
                className="flex-1"
              >
                取消
              </Button>
              <Button
                onClick={handleEditSave}
                className="flex-1"
              >
                保存
              </Button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </main>
  )
}
