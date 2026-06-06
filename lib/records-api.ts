import type { AppConfig, CheckInRecord } from "@/types"

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
  const data = await requestJson<{ records: CheckInRecord[] }>("/api/records", {
    method: "POST",
    body: JSON.stringify(record),
  })

  return data.records[0] ?? record
}

export async function importCloudRecords(records: CheckInRecord[]): Promise<CheckInRecord[]> {
  const data = await requestJson<{ records: CheckInRecord[] }>("/api/records", {
    method: "POST",
    body: JSON.stringify({ records }),
  })

  return data.records
}

export async function updateCloudRecord(
  id: string,
  updates: Partial<Pick<CheckInRecord, "date" | "duration">>
): Promise<CheckInRecord> {
  const data = await requestJson<{ record: CheckInRecord }>(`/api/records/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  })

  return data.record
}

export async function deleteCloudRecord(id: string): Promise<void> {
  await requestJson(`/api/records/${encodeURIComponent(id)}`, {
    method: "DELETE",
  })
}

export async function clearCloudRecords(): Promise<void> {
  await requestJson("/api/records", {
    method: "DELETE",
  })
}
