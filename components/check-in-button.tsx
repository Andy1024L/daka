"use client"

import { useState } from "react"
import { Check } from "lucide-react"
import type { DurationOption } from "@/types"

interface CheckInButtonProps {
  duration: DurationOption
  color: string
  onClick: (duration: DurationOption) => void
}

export function CheckInButton({ duration, color, onClick }: CheckInButtonProps) {
  const [isAnimating, setIsAnimating] = useState(false)

  const handleClick = () => {
    setIsAnimating(true)
    onClick(duration)
    window.setTimeout(() => setIsAnimating(false), 600)
  }

  return (
    <button
      onClick={handleClick}
      className={`
        relative flex aspect-square w-full flex-col items-center justify-center overflow-hidden rounded-2xl
        ${color} text-white font-semibold shadow-lg transition-all duration-200 ease-out
        hover:scale-105 hover:shadow-xl active:scale-95
        ${isAnimating ? "ring-4 ring-white/50" : ""}
      `}
    >
      <div
        className={`
          absolute inset-0 rounded-full bg-white/30 transition-transform duration-500 ease-out
          ${isAnimating ? "scale-[3] opacity-0" : "scale-0 opacity-100"}
        `}
      />

      {isAnimating ? (
        <div className="animate-bounce">
          <Check className="h-10 w-10 md:h-12 md:w-12" strokeWidth={3} />
        </div>
      ) : (
        <>
          <span className="text-3xl font-bold md:text-4xl">{duration}</span>
          <span className="text-sm opacity-90 md:text-base">分钟</span>
        </>
      )}
    </button>
  )
}
