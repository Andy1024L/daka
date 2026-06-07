import type { AppConfig, CheckInRecord } from "@/types"
import { getRecords, saveRecords } from "@/lib/storage"

function mergeRecords(records: CheckInRecord[], nextRecord: CheckInRecord): CheckInRecord[] {
  const nextRecords = records.filter((record) => record.id !== nextRecord.id)
  return [nextRecord, ...nextRecords]
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  })
  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(typeof data.error === "string" ? data.error : "请求失败")
  }

  return data as T
}

export async function getAppConfig(): Promise<AppConfig> {
  return requestJson<AppConfig>("/api/config")
}

export async function loadCloudRecords(): Promise<CheckInRecord[]> {
  const data = await requestJson<{ records: CheckInRecord[] }>("/api/records")
  saveRecords(data.records)
  return data.records
}

export function createOptimisticRecord(category: CheckInRecord["category"], duration: number): CheckInRecord {
  const now = new Date()
  const date = now.toISOString().split("T")[0]

  return {
    id: `${date.replace(/-/g, "")}-${crypto.randomUUID()}`,
    timestamp: now.getTime(),
    date,
    category,
    duration,
  }
}

export async function saveCloudRecord(record: CheckInRecord): Promise<CheckInRecord> {
  saveRecords(mergeRecords(getRecords(), record))

  const data = await requestJson<{ records: CheckInRecord[] }>("/api/records", {
    method: "POST",
    body: JSON.stringify(record),
  })

  const savedRecord = data.records[0] ?? record
  saveRecords(mergeRecords(getRecords(), savedRecord))
  return savedRecord
}

export async function importCloudRecords(records: CheckInRecord[]): Promise<CheckInRecord[]> {
  saveRecords(records)

  const data = await requestJson<{ records: CheckInRecord[] }>("/api/records", {
    method: "POST",
    body: JSON.stringify({ records }),
  })

  saveRecords(data.records)
  return data.records
}

export async function updateCloudRecord(
  id: string,
  updates: Partial<Pick<CheckInRecord, "date" | "duration">>
): Promise<CheckInRecord> {
  const previousRecords = getRecords()
  const optimisticRecords = previousRecords.map((record) =>
    record.id === id
      ? {
          ...record,
          date: updates.date ?? record.date,
          duration: updates.duration ?? record.duration,
        }
      : record
  )
  saveRecords(optimisticRecords)

  const data = await requestJson<{ record: CheckInRecord }>(`/api/records/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  })

  saveRecords(mergeRecords(getRecords(), data.record))
  return data.record
}

export async function deleteCloudRecord(id: string): Promise<void> {
  const previousRecords = getRecords()
  saveRecords(previousRecords.filter((record) => record.id !== id))

  await requestJson(`/api/records/${encodeURIComponent(id)}`, {
    method: "DELETE",
  }).catch((error) => {
    saveRecords(previousRecords)
    throw error
  })
}

export async function clearCloudRecords(): Promise<void> {
  const previousRecords = getRecords()
  saveRecords([])

  await requestJson("/api/records", {
    method: "DELETE",
  }).catch((error) => {
    saveRecords(previousRecords)
    throw error
  })
}
