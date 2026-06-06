import { NextResponse } from "next/server"
import { createSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase-admin"

export const dynamic = "force-dynamic"

interface Params {
  params: Promise<{ id: string }>
}

function assertConfigured() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase 还没有配置" }, { status: 503 })
  }

  return null
}

export async function PATCH(request: Request, { params }: Params) {
  const setupError = assertConfigured()
  if (setupError) return setupError

  const { id } = await params
  const body = await request.json().catch(() => null)
  const updates: Record<string, unknown> = {}

  if (typeof body?.date === "string") updates.date = body.date
  if (typeof body?.duration === "number" && body.duration > 0) updates.duration = body.duration

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "没有有效更新" }, { status: 400 })
  }

  const supabase = createSupabaseAdmin()
  const { data, error } = await supabase
    .from("check_in_records")
    .update(updates)
    .eq("id", id)
    .select("id,timestamp,date,category,duration")
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ record: data })
}

export async function DELETE(_request: Request, { params }: Params) {
  const setupError = assertConfigured()
  if (setupError) return setupError

  const { id } = await params
  const supabase = createSupabaseAdmin()
  const { error } = await supabase.from("check_in_records").delete().eq("id", id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
