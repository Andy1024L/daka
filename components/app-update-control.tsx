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
    <div className="flex flex-col items-center gap-1 pt-1">
      {state !== "idle" && (
        <p className="text-center text-[11px] leading-4 text-muted-foreground">
          最近更新：{APP_UPDATED_AT} · {label}
        </p>
      )}
      <button
        type="button"
        onClick={checkUpdate}
        disabled={state === "checking" || state === "updating"}
        className="inline-flex h-7 items-center gap-1 rounded-full px-2 text-[11px] font-medium text-muted-foreground/70 transition-colors hover:bg-muted/50 hover:text-muted-foreground disabled:pointer-events-none disabled:opacity-60"
      >
        <RefreshCw className={`h-3 w-3 ${state === "checking" || state === "updating" ? "animate-spin" : ""}`} />
        {state === "idle" ? "检查更新" : state === "current" ? "再检查一次" : label}
      </button>
    </div>
  )
}
