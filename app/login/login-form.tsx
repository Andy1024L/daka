"use client"

import { FormEvent, useState } from "react"
import { LockKeyhole } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const setupMissing = searchParams.get("setup") === "1"

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")
    setIsSubmitting(true)

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      })
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        setError(typeof data.error === "string" ? data.error : "登录失败")
        return
      }

      router.replace(searchParams.get("next") || "/")
      router.refresh()
    } catch {
      setError("网络异常，请重试")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-5">
        <div className="space-y-3 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
            <LockKeyhole className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">每日打卡</h1>
        </div>

        <div className="space-y-3">
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="输入访问密码"
            autoFocus
            className="h-12 w-full rounded-xl border border-border bg-background px-4 text-center text-base text-foreground outline-none transition focus:ring-2 focus:ring-orange-500"
          />
          <Button type="submit" disabled={isSubmitting || !password} className="h-12 w-full">
            {isSubmitting ? "验证中..." : "进入"}
          </Button>
        </div>

        {setupMissing && <p className="text-center text-sm text-destructive">生产环境还没有配置 APP_PASSWORD 和 AUTH_SECRET。</p>}
        {error && <p className="text-center text-sm text-destructive">{error}</p>}
      </form>
    </main>
  )
}
