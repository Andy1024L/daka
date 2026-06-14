"use client"

import { useEffect, useState } from "react"
import { BarChart3, Database, Home } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { type AppTab, useAppTab } from "@/components/app-tab-context"

const links: Array<{ href: string; tab: AppTab; icon: typeof Home; label: string }> = [
  { href: "/", tab: "home", icon: Home, label: "打卡" },
  { href: "/stats", tab: "stats", icon: BarChart3, label: "统计" },
  { href: "/data", tab: "data", icon: Database, label: "数据" },
]

export function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const appTab = useAppTab()
  const [pendingHref, setPendingHref] = useState<string | null>(null)

  useEffect(() => {
    if (appTab) return

    const prefetchPages = () => {
      router.prefetch("/stats")
      router.prefetch("/data")
    }

    const schedulePrefetch =
      "requestIdleCallback" in window
        ? window.requestIdleCallback
        : (callback: IdleRequestCallback) => window.setTimeout(callback, 1800)

    const idleId = schedulePrefetch(prefetchPages, { timeout: 3500 })

    return () => {
      if ("cancelIdleCallback" in window && typeof idleId === "number") {
        window.cancelIdleCallback(idleId)
      } else if (typeof idleId === "number") {
        window.clearTimeout(idleId)
      }
    }
  }, [appTab, router])

  useEffect(() => {
    setPendingHref(null)
  }, [pathname])

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-[calc(env(safe-area-inset-bottom)+12px)]">
      <div className="mx-auto flex max-w-sm rounded-full border border-border/70 bg-background/90 p-1.5 shadow-lg shadow-black/5 backdrop-blur-xl">
        {links.map(({ href, tab, icon: Icon, label }) => {
          if (appTab) {
            const isActive = appTab.activeTab === tab

            return (
              <button
                key={tab}
                type="button"
                onClick={() => appTab.setActiveTab(tab)}
                className={`
                  flex flex-1 flex-col items-center gap-0.5 rounded-full py-2 transition-all duration-200
                  ${isActive ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground/70"}
                `}
              >
                <Icon className={`h-5 w-5 transition-transform ${isActive ? "scale-105" : ""}`} />
                <span className={`text-[11px] leading-none ${isActive ? "font-semibold" : "font-medium"}`}>{label}</span>
              </button>
            )
          }

          const activePath = pendingHref ?? pathname
          const isActive = activePath === href || (href !== "/" && activePath?.startsWith(href))

          return (
            <Link
              key={href}
              href={href}
              replace
              prefetch={false}
              onTouchStart={() => {
                if (href !== "/") router.prefetch(href)
              }}
              onMouseEnter={() => {
                if (href !== "/") router.prefetch(href)
              }}
              onClick={() => setPendingHref(href)}
              className={`
                flex flex-1 flex-col items-center gap-0.5 rounded-full py-2 transition-all duration-200
                ${isActive ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground/70"}
              `}
            >
              <Icon className={`h-5 w-5 transition-transform ${isActive ? "scale-105" : ""}`} />
              <span className={`text-[11px] leading-none ${isActive ? "font-semibold" : "font-medium"}`}>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

