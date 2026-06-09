"use client"

import { BarChart3, Database, Home } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

const links = [
  { href: "/", icon: Home, label: "打卡" },
  { href: "/stats", icon: BarChart3, label: "统计" },
  { href: "/data", icon: Database, label: "数据" },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-[calc(env(safe-area-inset-bottom)+12px)]">
      <div className="mx-auto flex max-w-sm rounded-full border border-border/70 bg-background/90 p-1.5 shadow-lg shadow-black/5 backdrop-blur-xl">
        {links.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || (href !== "/" && pathname?.startsWith(href))

          return (
            <Link
              key={href}
              href={href}
              replace
              prefetch={false}
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
