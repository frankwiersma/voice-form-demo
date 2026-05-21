import { NextResponse } from "next/server"

/**
 * Mints a short-lived Deepgram JWT from the server-side DEEPGRAM_API_KEY so the
 * browser can open the Voice Agent WebSocket without exposing the long-lived key.
 * If no server key is configured, returns { mode: "byok" } and the client falls
 * back to the user's own key from Settings (sent directly to Deepgram).
 */
export async function POST() {
  const key = process.env.DEEPGRAM_API_KEY
  if (!key) {
    return NextResponse.json({ mode: "byok" })
  }
  try {
    const res = await fetch("https://api.deepgram.com/v1/auth/grant", {
      method: "POST",
      headers: { Authorization: `Token ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ ttl_seconds: 60 }),
    })
    if (!res.ok) {
      return NextResponse.json({ mode: "byok" })
    }
    const data = await res.json()
    return NextResponse.json({ mode: "bearer", token: data.access_token })
  } catch {
    return NextResponse.json({ mode: "byok" })
  }
}
