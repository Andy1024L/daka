import { BottomNav } from "@/components/bottom-nav"

export default function StatsLoading() {
  return (
    <main className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-lg">
        <div className="mx-auto max-w-md px-4 py-4">
          <h1 className="text-center text-xl font-bold text-foreground">统计概览</h1>
        </div>
      </header>
      <div className="mx-auto max-w-md space-y-4 px-4 py-4">
        <div className="h-10 animate-pulse rounded-xl bg-muted" />
        <div className="h-28 animate-pulse rounded-2xl bg-muted" />
        <div className="h-72 animate-pulse rounded-2xl bg-muted" />
      </div>
      <BottomNav />
    </main>
  )
}

