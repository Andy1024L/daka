export interface CheckInRecord {
  id: string
  timestamp: number
  date: string
  category: "锻炼" | "拉伸"
  duration: number // 锻炼用分钟，拉伸用次数(1或2)
}

export type DurationOption = 30 | 60 | 90 | 120
export type StretchOption = 1 | 2
