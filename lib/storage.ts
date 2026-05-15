import type { CheckInRecord } from "@/types"

const STORAGE_KEY = "check-in-records"
const CACHE_KEY = "check-in-records-cache"

let XLSX: typeof import("xlsx") | null = null

async function getXLSX() {
  if (!XLSX) {
    XLSX = await import("xlsx")
  }
  return XLSX
}

// 检查 localStorage 是否可用
function isLocalStorageAvailable(): boolean {
  if (typeof window === "undefined") return false
  try {
    const testKey = "__storage_test__"
    localStorage.setItem(testKey, testKey)
    localStorage.removeItem(testKey)
    return true
  } catch {
    return false
  }
}

// 安全地从 localStorage 读取数据
function safeGetItem(key: string): string | null {
  if (!isLocalStorageAvailable()) return null
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

// 安全地写入 localStorage
function safeSetItem(key: string, value: string): boolean {
  if (!isLocalStorageAvailable()) return false
  try {
    localStorage.setItem(key, value)
    return true
  } catch {
    return false
  }
}

// 安全地删除 localStorage 数据
function safeRemoveItem(key: string): boolean {
  if (!isLocalStorageAvailable()) return false
  try {
    localStorage.removeItem(key)
    return true
  } catch {
    return false
  }
}

// 兼容旧数据：将"体能训练"转换为"锻炼"
function migrateRecord(record: CheckInRecord): CheckInRecord {
  if ((record.category as string) === "体能训练") {
    return { ...record, category: "锻炼" }
  }
  return record
}

// 验证记录是否有效
function isValidRecord(record: unknown): record is CheckInRecord {
  if (!record || typeof record !== "object") return false
  const r = record as Record<string, unknown>
  return (
    typeof r.id === "string" &&
    typeof r.timestamp === "number" &&
    typeof r.date === "string" &&
    (r.category === "锻炼" || r.category === "拉伸" || r.category === "体能训练") &&
    typeof r.duration === "number" &&
    r.duration > 0
  )
}

// 生成唯一 ID: YYYYMMDD-序号-时间戳后4位
function generateId(records: CheckInRecord[], date: string): string {
  const datePrefix = date.replace(/-/g, "")
  const todayRecords = records.filter(r => r.id?.startsWith(datePrefix))
  const nextNum = todayRecords.length + 1
  const timestamp = Date.now() % 10000
  return `${datePrefix}-${String(nextNum).padStart(3, "0")}-${timestamp}`
}

// 格式化时间戳为 HH:MM:SS
function formatTime(timestamp: number): string {
  const date = new Date(timestamp)
  if (isNaN(date.getTime())) return "00:00:00"
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}:${String(date.getSeconds()).padStart(2, "0")}`
}

// 解析时间字符串为当天的时间戳
function parseTimeToTimestamp(dateStr: string, timeStr: string): number {
  const [hours, minutes, seconds] = timeStr.split(":").map(Number)
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return Date.now()
  date.setHours(hours || 0, minutes || 0, seconds || 0, 0)
  return date.getTime()
}

// 内存缓存
let memoryCache: CheckInRecord[] | null = null

export function getRecords(): CheckInRecord[] {
  if (typeof window === "undefined") return []
  
  // 首先尝试从内存缓存读取
  if (memoryCache !== null) {
    return [...memoryCache]
  }
  
  const data = safeGetItem(STORAGE_KEY)
  if (!data) {
    // 尝试从备份缓存恢复
    const cacheData = safeGetItem(CACHE_KEY)
    if (cacheData) {
      try {
        const parsed = JSON.parse(cacheData)
        if (Array.isArray(parsed)) {
          const validRecords = parsed.filter(isValidRecord).map(migrateRecord)
          memoryCache = validRecords
          // 尝试恢复主存储
          safeSetItem(STORAGE_KEY, JSON.stringify(validRecords))
          return [...validRecords]
        }
      } catch {
        // 备份也损坏，返回空数组
      }
    }
    memoryCache = []
    return []
  }
  
  try {
    const parsed = JSON.parse(data)
    if (!Array.isArray(parsed)) {
      memoryCache = []
      return []
    }
    const validRecords = parsed.filter(isValidRecord).map(migrateRecord)
    memoryCache = validRecords
    return [...validRecords]
  } catch {
    // JSON 解析失败，尝试从缓存恢复
    const cacheData = safeGetItem(CACHE_KEY)
    if (cacheData) {
      try {
        const parsed = JSON.parse(cacheData)
        if (Array.isArray(parsed)) {
          const validRecords = parsed.filter(isValidRecord).map(migrateRecord)
          memoryCache = validRecords
          safeSetItem(STORAGE_KEY, JSON.stringify(validRecords))
          return [...validRecords]
        }
      } catch {
        // 备份也损坏
      }
    }
    memoryCache = []
    return []
  }
}

export function saveRecords(records: CheckInRecord[]): boolean {
  if (typeof window === "undefined") return false
  
  // 过滤无效记录
  const validRecords = records.filter(isValidRecord)
  const data = JSON.stringify(validRecords)
  
  // 同时保存到主存储和备份
  const mainSaved = safeSetItem(STORAGE_KEY, data)
  safeSetItem(CACHE_KEY, data) // 备份
  
  // 更新内存缓存
  memoryCache = [...validRecords]
  
  return mainSaved
}

export function addRecord(category: "锻炼" | "拉伸", duration: number): CheckInRecord | null {
  if (duration <= 0) return null
  
  const records = getRecords()
  const now = new Date()
  const date = now.toISOString().split("T")[0]
  
  const record: CheckInRecord = {
    id: generateId(records, date),
    timestamp: now.getTime(),
    date,
    category,
    duration,
  }
  
  records.push(record)
  const saved = saveRecords(records)
  
  return saved ? record : null
}

export function updateRecord(id: string, updates: Partial<Pick<CheckInRecord, "date" | "duration">>): boolean {
  if (!id) return false
  
  const records = getRecords()
  const index = records.findIndex(r => r.id === id)
  if (index === -1) return false
  
  if (updates.date && typeof updates.date === "string") {
    records[index].date = updates.date
  }
  if (typeof updates.duration === "number" && updates.duration > 0) {
    records[index].duration = updates.duration
  }
  
  return saveRecords(records)
}

export function deleteRecord(id: string): boolean {
  if (!id) return false
  
  const records = getRecords()
  const filtered = records.filter(r => r.id !== id)
  if (filtered.length === records.length) return false
  
  return saveRecords(filtered)
}

export function clearRecords(): boolean {
  if (typeof window === "undefined") return false
  
  memoryCache = []
  const mainCleared = safeRemoveItem(STORAGE_KEY)
  safeRemoveItem(CACHE_KEY)
  
  return mainCleared
}

// 导出为 CSV，格式: 日期,时间,习惯名称,数值,量词
export function exportToCSV(): string {
  const records = getRecords()
  const headers = ["日期", "时间", "习惯名称", "数值", "量词"]
  const rows = [...records]
    .sort((a, b) => b.timestamp - a.timestamp)
    .map((r) => {
      const dateFormatted = r.date.replace(/-/g, "/")
      const time = formatTime(r.timestamp)
      const value = r.category === "拉伸" ? `*${r.duration}` : String(r.duration)
      const unit = r.category === "拉伸" ? "次数" : "分钟"
      return [dateFormatted, time, r.category, value, unit]
    })
  const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n")
  return csvContent
}

export function downloadCSV(): void {
  const csvContent = exportToCSV()
  const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `打卡记录_${new Date().toISOString().split("T")[0]}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export async function downloadXLSX(): Promise<void> {
  if (typeof window === "undefined") return
  
  const XLSX = await getXLSX()
  const records = getRecords()
  
  const headers = ["日期", "时间", "习惯名称", "数值", "量词"]
  const rows = [...records]
    .sort((a, b) => b.timestamp - a.timestamp)
    .map((r) => {
      const dateFormatted = r.date.replace(/-/g, "/")
      const time = formatTime(r.timestamp)
      const value = r.category === "拉伸" ? `*${r.duration}` : String(r.duration)
      const unit = r.category === "拉伸" ? "次数" : "分钟"
      return [dateFormatted, time, r.category, value, unit]
    })
  
  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows])
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, "打卡记录")
  
  const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "array" })
  const blob = new Blob([wbout], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `打卡记录_${new Date().toISOString().split("T")[0]}.xlsx`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function importFromCSV(csvText: string, mode: "replace" | "merge"): number {
  const lines = csvText.trim().split("\n")
  if (lines.length < 2) return 0

  const existingRecords = mode === "merge" ? getRecords() : []
  const newRecords: CheckInRecord[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",")
    if (values.length >= 4) {
      // 支持新格式: 日期,时间,习惯名称,数值,量词
      // 也支持旧格式: ID,时间戳,日期,项目,数值
      let date: string
      let timestamp: number
      let category: "锻炼" | "拉伸"
      let duration: number

      if (values[0].includes("/")) {
        // 新格式
        date = values[0].replace(/\//g, "-")
        const time = values[1] || "00:00:00"
        timestamp = parseTimeToTimestamp(date, time)
        const categoryRaw = values[2]
        category = categoryRaw === "体能训练" ? "锻炼" : categoryRaw as "锻炼" | "拉伸"
        const valueStr = values[3].replace("*", "")
        duration = parseInt(valueStr)
      } else {
        // 旧格式
        timestamp = parseInt(values[1])
        date = values[2]
        const categoryRaw = values[3]
        category = categoryRaw === "体能训练" ? "锻炼" : categoryRaw as "锻炼" | "拉伸"
        duration = parseInt(values[4])
      }

      const id = generateId([...existingRecords, ...newRecords], date)
      
      newRecords.push({
        id,
        timestamp,
        date,
        category,
        duration,
      })
    }
  }

  if (mode === "replace") {
    saveRecords(newRecords)
  } else {
    saveRecords([...existingRecords, ...newRecords])
  }

  return newRecords.length
}

export async function importFromXLSX(buffer: ArrayBuffer, mode: "replace" | "merge"): Promise<number> {
  const XLSX = await getXLSX()

  const workbook = XLSX.read(buffer, { type: "array" })
  const sheetName = workbook.SheetNames[0]
  if (!sheetName) return 0

  const worksheet = workbook.Sheets[sheetName]
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false }) as (string | number | boolean)[][]

  if (data.length < 2) return 0

  const existingRecords = mode === "merge" ? getRecords() : []
  const newRecords: CheckInRecord[] = []

  for (let i = 1; i < data.length; i++) {
    const row = data[i]
    if (!row || row.length < 4) continue

    let dateStr = String(row[0] || "").trim()
    if (dateStr === "") continue

    let date: string
    let timestamp: number
    let category: "锻炼" | "拉伸"
    let duration: number

    if (!isNaN(Number(row[0]))) {
      const excelDateNum = Number(row[0])
      const dateObj = XLSX.SSF.iso_date(excelDateNum)
      if (dateObj) {
        const dateParts = dateObj.split("T")[0].split("-")
        date = `${dateParts[0]}-${String(dateParts[1]).padStart(2, "0")}-${String(dateParts[2]).padStart(2, "0")}`
      } else {
        continue
      }
    } else if (dateStr.includes("/")) {
      const parts = dateStr.split("/")
      if (parts.length === 3) {
        let year = parseInt(parts[2])
        const month = parseInt(parts[0])
        const day = parseInt(parts[1])
        if (year < 100) {
          year = year > 50 ? 1900 + year : 2000 + year
        }
        date = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
      } else {
        continue
      }
    } else if (dateStr.includes("-")) {
      const parts = dateStr.split("-")
      if (parts.length === 3) {
        let year = parseInt(parts[0])
        const month = parseInt(parts[1])
        const day = parseInt(parts[2])
        if (year < 100) {
          year = year > 50 ? 1900 + year : 2000 + year
        }
        date = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
      } else {
        continue
      }
    } else {
      continue
    }

    let timeStr = String(row[1] || "").trim()
    if (timeStr === "" || timeStr === "null" || timeStr === "undefined") {
      timeStr = "00:00:00"
    }

    timestamp = parseTimeToTimestamp(date, timeStr)

    const categoryRaw = String(row[2] || "").trim()
    if (!categoryRaw) continue

    category = categoryRaw === "体能训练" ? "锻炼" : categoryRaw as "锻炼" | "拉伸"
    if (category !== "锻炼" && category !== "拉伸") continue

    const valueStr = String(row[3] || "").trim().replace("*", "")
    duration = parseInt(valueStr) || 0

    if (isNaN(duration) || duration <= 0) continue

    const id = generateId([...existingRecords, ...newRecords], date)

    newRecords.push({
      id,
      timestamp,
      date,
      category,
      duration,
    })
  }

  if (mode === "replace") {
    saveRecords(newRecords)
  } else {
    saveRecords([...existingRecords, ...newRecords])
  }

  return newRecords.length
}

// 获取统计数据
export interface StatsData {
  totalDays: number
  totalMinutes: number
  avgMinutesPerDay: number
  yearTotalDays: number
  workoutMinutes: number
  stretchCount: number
}

export function getMonthlyStats(records: CheckInRecord[], year: number, month: number, category?: "锻炼" | "拉伸"): StatsData {
  let filtered = records.filter(r => {
    const d = new Date(r.date)
    return d.getFullYear() === year && d.getMonth() === month
  })
  
  if (category) {
    filtered = filtered.filter(r => r.category === category)
  }

  const yearFiltered = category 
    ? records.filter(r => new Date(r.date).getFullYear() === year && r.category === category)
    : records.filter(r => new Date(r.date).getFullYear() === year)

  const uniqueDays = new Set(filtered.map(r => r.date)).size
  const yearUniqueDays = new Set(yearFiltered.map(r => r.date)).size
  
  const workoutRecords = filtered.filter(r => r.category === "锻炼")
  const stretchRecords = filtered.filter(r => r.category === "拉伸")
  
  const totalMinutes = workoutRecords.reduce((sum, r) => sum + r.duration, 0)
  const stretchCount = stretchRecords.reduce((sum, r) => sum + r.duration, 0)

  return {
    totalDays: uniqueDays,
    totalMinutes,
    avgMinutesPerDay: uniqueDays > 0 ? Math.round(totalMinutes / uniqueDays) : 0,
    yearTotalDays: yearUniqueDays,
    workoutMinutes: totalMinutes,
    stretchCount,
  }
}

export function getDailyStats(records: CheckInRecord[]): Map<string, { total: number; workout: number; stretch: number }> {
  const stats = new Map<string, { total: number; workout: number; stretch: number }>()

  records.forEach((r) => {
    const migrated = migrateRecord(r)
    const existing = stats.get(migrated.date) || { total: 0, workout: 0, stretch: 0 }
    if (migrated.category === "锻炼") {
      existing.workout += migrated.duration
      existing.total += migrated.duration
    } else {
      existing.stretch += migrated.duration
      existing.total += 1 // 拉伸算1天
    }
    stats.set(migrated.date, existing)
  })

  return stats
}

// 获取年度每月统计数据
export function getYearlyMonthlyStats(records: CheckInRecord[], year: number, category?: "锻炼" | "拉伸"): number[] {
  const monthlyData: number[] = new Array(12).fill(0)
  
  let filtered = records.filter(r => new Date(r.date).getFullYear() === year)
  if (category) {
    filtered = filtered.filter(r => r.category === category)
  }

  filtered.forEach(r => {
    const month = new Date(r.date).getMonth()
    if (r.category === "锻炼") {
      monthlyData[month] += r.duration
    } else {
      monthlyData[month] += r.duration
    }
  })

  return monthlyData
}
