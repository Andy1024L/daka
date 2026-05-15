"use client"

import { Check } from "lucide-react"

interface SuccessToastProps {
  message: string
  isVisible: boolean
}

export function SuccessToast({ message, isVisible }: SuccessToastProps) {
  // 不渲染空消息或不可见的 toast
  if (!isVisible || !message) return null

  return (
    <div
      className={`
        fixed bottom-24 left-1/2 -translate-x-1/2 z-50
        bg-foreground text-background px-6 py-3 rounded-full
        flex items-center gap-2 shadow-lg
        transition-all duration-300 ease-out
        opacity-100 translate-y-0
      `}
    >
      <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
        <Check className="w-3 h-3 text-white" strokeWidth={3} />
      </div>
      <span className="font-medium">{message}</span>
    </div>
  )
}
