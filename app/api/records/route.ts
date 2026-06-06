import { NextResponse } from "next/server"
import { createSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase-admin"
import type { CheckInRecord } from "@/types"

export const dynamic = "force-dynamic"

function normalizeRecord(value: unknown): CheckInRecord | null {
  if (!value || typeof value !== "object") return null

  const raw = value as Record<string, unknown>
  const category = raw.category === "锻炼" || raw.category === "拉伸" ? raw.category : null
  const duration = Number(raw.duration)
  const timestamp = Number(raw.timestamp)
  const date = typeof raw.date === "string" ? raw.date : ""
  const id = typeof raw.id === "string" ? raw.id : ""

  if (!id || !category || !date || Number.isNaN(duration) || duration <= 0 || Number.isNaN(timestamp)) {
    return null
  }

  return { id, timestamp, date, category, duration }
}

function assertConfigured() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase 还没有配置" }, { status: 503 })
  }

  return null
}

export async function GET() {
  const setupError = assertConfigured()
  if (setupError) return setupError

  const supabase = createSupabaseAdmin()
  const { data, error } = await supabase
    .from("check_in_records")
    .select("id,timestamp,date,category,duration")
    .order("timestamp", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ records: data ?? [] })
}

export async function POST(request: Request) {
  const setupError = assertConfigured()
  if (setupError) return setupError

  const body = await request.json().catch(() => null)
  const recordsInput = Array.isArray(body?.records) ? body.records : [body]
  const records = recordsInput
    .map(normalizeRecord)
    .filter((record: CheckInRecord | null): record is CheckInRecord => Boolean(record))

  if (records.length === 0) {
    return NextResponse.json({ error: "没有有效记录" }, { status: 400 })
  }

  const supabase = createSupabaseAdmin()
  const { data, error } = await supabase
    .from("check_in_records")
    .upsert(records, { onConflict: "id" })
    .select("id,timestamp,date,category,duration")

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ records: data ?? [] })
}

export async function DELETE() {
  const setupError = assertConfigured()
  if (setupError) return setupError

  const supabase = createSupabaseAdmin()
  const { error } = await supabase.from("check_in_records").delete().neq("id", "__never__")

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
