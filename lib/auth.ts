export const AUTH_COOKIE = "daka_auth"

export function isAuthConfigured() {
  return Boolean(process.env.APP_PASSWORD && process.env.AUTH_SECRET)
}

async function sha256(value: string) {
  const data = new TextEncoder().encode(value)
  const digest = await crypto.subtle.digest("SHA-256", data)

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
}

export async function getAuthToken() {
  const password = process.env.APP_PASSWORD
  const secret = process.env.AUTH_SECRET

  if (!password || !secret) return null

  return sha256(`${password}:${secret}`)
}

export async function verifyPassword(password: string) {
  return Boolean(process.env.APP_PASSWORD && password === process.env.APP_PASSWORD)
}
