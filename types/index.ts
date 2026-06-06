export interface CheckInRecord {
  id: string
  timestamp: number
  date: string
  category: "锻炼" | "拉伸"
  duration: number
}

export interface AppConfig {
  cloudEnabled: boolean
  authEnabled: boolean
}

export type DurationOption = 30 | 60 | 90 | 120
export type StretchOption = 1 | 2
