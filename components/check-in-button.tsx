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
    setTimeout(() => setIsAnimating(false), 600)
  }

  return (
    <button
      onClick={handleClick}
      className={`
        relative overflow-hidden rounded-2xl ${color} 
        w-full aspect-square flex flex-col items-center justify-center
        text-white font-semibold shadow-lg
        transition-all duration-200 ease-out
        hover:scale-105 hover:shadow-xl
        active:scale-95
        ${isAnimating ? "ring-4 ring-white/50" : ""}
      `}
    >
      <div
        className={`
          absolute inset-0 bg-white/30 rounded-full
          transition-transform duration-500 ease-out
          ${isAnimating ? "scale-[3] opacity-0" : "scale-0 opacity-100"}
        `}
      />
      
      {isAnimating ? (
        <div className="animate-bounce">
          <Check className="w-10 h-10 md:w-12 md:h-12" strokeWidth={3} />
        </div>
      ) : (
        <>
          <span className="text-3xl md:text-4xl font-bold">{duration}</span>
          <span className="text-sm md:text-base opacity-90">分钟</span>
        </>
      )}
    </button>
  )
}
