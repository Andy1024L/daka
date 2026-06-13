"use client"

import { useState } from "react"
import { RefreshCw } from "lucide-react"
import { APP_UPDATED_AT, APP_VERSION } from "@/lib/app-version"

type VersionInfo = {
  version?: string
  updatedAt?: string
}

type UpdateState = "idle" | "checking" | "found" | "updating" | "current" | "error"

function waitForState(worker: ServiceWorker, state: ServiceWorkerState) {
  if (worker.state === state) return Promise.resolve()

  return new Promise<void>((resolve) => {
    worker.addEventListener("statechange", () => {
      if (worker.state === state) resolve()
    })
  })
}

async function activateWaitingWorker(registration: ServiceWorkerRegistration) {
  const waitingWorker = registration.waiting ?? registration.installing

  if (!waitingWorker) {
    window.location.reload()
    return
  }

  if (waitingWorker.state !== "installed") {
    await waitForState(waitingWorker, "installed")
  }

  waitingWorker.postMessage({ type: "ACTIVATE_UPDATE" })
}

async function updateCachedApp() {
  if (!("serviceWorker" in navigator)) {
    window.location.reload()
    return
  }

  let hasReloaded = false
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (hasReloaded) return
    hasReloaded = true
    window.location.reload()
  })

  const registration =
    (await navigator.serviceWorker.getRegistration()) ?? (await navigator.serviceWorker.register("/sw.js"))
  await registration.update()

  if (registration.waiting || registration.installing) {
    await activateWaitingWorker(registration)
    return
  }

  window.location.reload()
}

export function AppUpdateControl() {
  const [state, setState] = useState<UpdateState>("idle")

  const checkUpdate = async () => {
    if (state === "checking" || state === "updating") return

    setState("checking")

    try {
      const response = await fetch(`/version.json?t=${Date.now()}`, {
        cache: "no-store",
      })
      const latest = (await response.json()) as VersionInfo

      if (!latest.version || latest.version === APP_VERSION) {
        setState("current")
        window.setTimeout(() => setState("idle"), 2000)
        return
      }

      setState("found")
      window.setTimeout(() => {
        setState("updating")
        updateCachedApp().catch(() => setState("error"))
      }, 600)
    } catch {
      setState("error")
      window.setTimeout(() => setState("idle"), 2500)
    }
  }

  const label =
    state === "checking"
      ? "检查中..."
      : state === "found"
        ? "发现新版，正在自动更新中"
        : state === "updating"
          ? "正在更新..."
          : state === "current"
            ? "已是最新"
            : state === "error"
              ? "检查失败"
              : "检查更新"

  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">最近更新：{APP_UPDATED_AT}</p>
        </div>
        <button
          type="button"
          onClick={checkUpdate}
          disabled={state === "checking" || state === "updating"}
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-border px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-60"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${state === "checking" || state === "updating" ? "animate-spin" : ""}`} />
          {label}
        </button>
      </div>
    </section>
  )
}
