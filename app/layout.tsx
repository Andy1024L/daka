import type { Metadata, Viewport } from "next"
import { ServiceWorkerRegistration } from "@/components/service-worker-registration"
import "./globals.css"

export const metadata: Metadata = {
  title: "每日打卡",
  description: "记录锻炼和拉伸的个人打卡工具",
  generator: "v0.app",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "每日打卡",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icon-192.png",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#f97316",
  viewportFit: "cover",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN" className="bg-background">
      <body className="bg-background font-sans text-foreground antialiased">
        {children}
        <ServiceWorkerRegistration />
      </body>
    </html>
  )
}
