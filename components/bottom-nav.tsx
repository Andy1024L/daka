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
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg">
      <div className="mx-auto flex max-w-md">
        {links.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || (href !== "/" && pathname?.startsWith(href))

          return (
            <Link
              key={href}
              href={href}
              replace
              className={`
                flex flex-1 flex-col items-center gap-1 py-3 transition-all duration-200
                ${isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground/70"}
              `}
            >
              <Icon className={`h-6 w-6 transition-transform ${isActive ? "scale-110" : ""}`} />
              <span className={`text-xs ${isActive ? "font-semibold" : "font-medium"}`}>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
