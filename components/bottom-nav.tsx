"use client"

import { Home, BarChart3, Database } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

export function BottomNav() {
  const pathname = usePathname()

  const links = [
    { href: "/", icon: Home, label: "打卡" },
    { href: "/stats", icon: BarChart3, label: "统计" },
    { href: "/data", icon: Database, label: "数据" },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border z-50 pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-md mx-auto flex">
        {links.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || (href !== "/" && pathname?.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={`
                flex-1 flex flex-col items-center gap-1 py-3
                transition-all duration-200
                ${isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground/70"}
              `}
              replace
            >
              <Icon className={`w-6 h-6 transition-transform ${isActive ? "scale-110" : ""}`} />
              <span className={`text-xs ${isActive ? "font-semibold" : "font-medium"}`}>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
