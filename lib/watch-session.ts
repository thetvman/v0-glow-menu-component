import { createClient } from "@/lib/supabase/client"
import type { RealtimeChannel } from "@supabase/supabase-js"

export interface WatchSession {
  id: string
  code: string
  host_name: string
  video_identifier: string
  video_title: string
  video_type: "movie" | "series" | "live"
  stream_url: string
  playback_time: number
  is_playing: boolean
  participants: number
  created_at: string
  updated_at: string
  expires_at: string
}

export function generateSessionCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export async function createWatchSession(
  videoIdentifier: string,
  videoTitle: string,
  videoType: "movie" | "series" | "live",
  streamUrl: string,
  hostName = "Host",
): Promise<WatchSession | null> {
  const supabase = createClient()
  const code = generateSessionCode()

  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + 24)

  const { data, error } = await supabase
    .from("watch_sessions")
    .insert({
      code,
      host_name: hostName,
      video_identifier: videoIdentifier,
      video_title: videoTitle,
      video_type: videoType,
      stream_url: streamUrl,
      playback_time: 0,
      is_playing: false,
      participants: 1,
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single()

  if (error) {
    console.error("[v0] Error creating session:", error)
    return null
  }

  console.log("[v0] Session created in database:", data.code)
  return data
}

export async function joinWatchSession(code: string): Promise<WatchSession | null> {
  const supabase = createClient()

  console.log("[v0] Attempting to join session with code:", code)

  const { data, error } = await supabase.from("watch_sessions").select("*").eq("code", code.toUpperCase()).single()

  if (error || !data) {
    console.error("[v0] Session not found for code:", code, error)
    return null
  }

  const { error: updateError } = await supabase
    .from("watch_sessions")
    .update({
      participants: data.participants + 1,
      updated_at: new Date().toISOString(),
    })
    .eq("id", data.id)

  if (updateError) {
    console.error("[v0] Error updating participant count:", updateError)
  }

  console.log("[v0] Successfully joined session:", data.code)
  return data
}

export async function getSession(sessionId: string): Promise<WatchSession | null> {
  const supabase = createClient()

  const { data, error } = await supabase.from("watch_sessions").select("*").eq("id", sessionId).single()

  if (error) {
    console.error("[v0] Error fetching session:", error)
    return null
  }

  return data
}

export async function getSessionByCode(code: string): Promise<WatchSession | null> {
  const supabase = createClient()

  const { data, error } = await supabase.from("watch_sessions").select("*").eq("code", code.toUpperCase()).single()

  if (error) {
    console.error("[v0] Error fetching session by code:", error)
    return null
  }

  return data
}

export async function updateSessionState(
  sessionId: string,
  updates: Partial<Pick<WatchSession, "playback_time" | "is_playing">>,
): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from("watch_sessions")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", sessionId)

  if (error) {
    console.error("[v0] Error updating session state:", error)
  }
}

export async function leaveSession(sessionId: string): Promise<void> {
  const supabase = createClient()

  // Get current session
  const { data: session } = await supabase.from("watch_sessions").select("participants").eq("id", sessionId).single()

  if (!session) return

  const newParticipants = Math.max(0, session.participants - 1)

  if (newParticipants === 0) {
    await supabase.from("watch_sessions").delete().eq("id", sessionId)
    console.log("[v0] Session deleted (no participants):", sessionId)
  } else {
    await supabase
      .from("watch_sessions")
      .update({
        participants: newParticipants,
        updated_at: new Date().toISOString(),
      })
      .eq("id", sessionId)
    console.log("[v0] Left session:", sessionId)
  }
}

export function subscribeToSession(sessionId: string, onUpdate: (session: WatchSession) => void): RealtimeChannel {
  const supabase = createClient()

  console.log("[v0] Subscribing to session updates:", sessionId)

  const channel = supabase
    .channel(`watch_session:${sessionId}`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "watch_sessions",
        filter: `id=eq.${sessionId}`,
      },
      (payload) => {
        console.log("[v0] Received real-time update:", payload.new)
        onUpdate(payload.new as WatchSession)
      },
    )
    .subscribe((status) => {
      console.log("[v0] Subscription status:", status)
    })

  return channel
}

export async function unsubscribeFromSession(channel: RealtimeChannel): Promise<void> {
  const supabase = createClient()
  await supabase.removeChannel(channel)
  console.log("[v0] Unsubscribed from session updates")
}
