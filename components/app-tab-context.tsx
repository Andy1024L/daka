"use client"

import { createContext, useContext } from "react"

export type AppTab = "home" | "stats" | "data"

type AppTabContextValue = {
  activeTab: AppTab
  setActiveTab: (tab: AppTab) => void
}

const AppTabContext = createContext<AppTabContextValue | null>(null)

export function AppTabProvider({
  children,
  value,
}: {
  children: React.ReactNode
  value: AppTabContextValue
}) {
  return <AppTabContext.Provider value={value}>{children}</AppTabContext.Provider>
}

export function useAppTab() {
  return useContext(AppTabContext)
}

