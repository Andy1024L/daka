import { NextResponse } from "next/server"
import { AUTH_COOKIE, getAuthToken, isAuthConfigured, verifyPassword } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  if (!isAuthConfigured()) {
    return NextResponse.json({ error: "密码环境变量还没有配置" }, { status: 500 })
  }

  const body = await request.json().catch(() => null)
  const password = typeof body?.password === "string" ? body.password : ""

  if (!(await verifyPassword(password))) {
    return NextResponse.json({ error: "密码不正确" }, { status: 401 })
  }

  const token = await getAuthToken()
  const response = NextResponse.json({ ok: true })

  response.cookies.set(AUTH_COOKIE, token ?? "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 180,
  })

  return response
}
