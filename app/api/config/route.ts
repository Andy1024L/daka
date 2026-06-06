import { NextResponse } from "next/server"
import { isAuthConfigured } from "@/lib/auth"
import { isSupabaseConfigured } from "@/lib/supabase-admin"

export const dynamic = "force-dynamic"

export async function GET() {
  return NextResponse.json({
    cloudEnabled: isSupabaseConfigured(),
    authEnabled: isAuthConfigured(),
  })
}
