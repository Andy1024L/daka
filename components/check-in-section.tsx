"use client"

import { CheckInButton } from "./check-in-button"
import type { DurationOption } from "@/types"

interface CheckInSectionProps {
  title: string
  icon: React.ReactNode
  colors: string[]
  onCheckIn: (duration: DurationOption) => void
}

const durations: DurationOption[] = [30, 60, 90, 120]

export function CheckInSection({ title, icon, colors, onCheckIn }: CheckInSectionProps) {
  return (
    <div className="bg-card rounded-3xl p-5 md:p-6 shadow-sm border border-border">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-muted flex items-center justify-center">
          {icon}
        </div>
        <h2 className="text-xl md:text-2xl font-bold text-foreground">{title}</h2>
      </div>
      
      <div className="grid grid-cols-4 gap-3 md:gap-4">
        {durations.map((duration, index) => (
          <CheckInButton
            key={duration}
            duration={duration}
            color={colors[index]}
            onClick={onCheckIn}
          />
        ))}
      </div>
    </div>
  )
}
