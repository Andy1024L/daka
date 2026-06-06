"use client"

import { Check } from "lucide-react"

interface SuccessToastProps {
  message: string
  isVisible: boolean
}

export function SuccessToast({ message, isVisible }: SuccessToastProps) {
  if (!isVisible || !message) return null

  return (
    <div className="fixed bottom-24 left-1/2 z-50 flex -translate-x-1/2 translate-y-0 items-center gap-2 rounded-full bg-foreground px-6 py-3 text-background opacity-100 shadow-lg transition-all duration-300 ease-out">
      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500">
        <Check className="h-3 w-3 text-white" strokeWidth={3} />
      </div>
      <span className="font-medium">{message}</span>
    </div>
  )
}
