import { NextResponse, type NextRequest } from "next/server"
import { AUTH_COOKIE, getAuthToken, isAuthConfigured } from "@/lib/auth"

const PUBLIC_PATHS = ["/login", "/api/auth/login", "/api/auth/logout", "/manifest.json", "/favicon.ico"]

function isPublicPath(pathname: string) {
  return (
    PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`)) ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/icon") ||
    pathname.startsWith("/placeholder")
  )
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (isPublicPath(pathname)) {
    return NextResponse.next()
  }

  if (!isAuthConfigured()) {
    if (process.env.NODE_ENV !== "production") {
      return NextResponse.next()
    }

    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("setup", "1")
    return NextResponse.redirect(loginUrl)
  }

  const token = await getAuthToken()
  const cookieToken = request.cookies.get(AUTH_COOKIE)?.value

  if (token && cookieToken === token) {
    return NextResponse.next()
  }

  const loginUrl = new URL("/login", request.url)
  loginUrl.searchParams.set("next", pathname)

  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ["/((?!.*\\..*).*)", "/api/:path*"],
}
