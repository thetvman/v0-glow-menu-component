import { createClient } from "@/lib/supabase/client"
import type { RealtimeChannel } from "@supabase/supabase-js"

export interface WatchSession {
  id: string
  code: string
  videoType: "movie" | "series" | "live"
  videoIdentifier: string
  streamUrl: string
  title: string
  currentTime: number
  isPlaying: boolean
  hostId: string
  participants: string[]
  createdAt: string
  updatedAt: string
}

function generateSessionCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789" // Removed similar chars
  return Array.from({ length: 6 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join("")
}

function getParticipantId(): string {
  let participantId = localStorage.getItem("watch_participant_id")
  if (!participantId) {
    participantId = `participant_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    localStorage.setItem("watch_participant_id", participantId)
  }
  return participantId
}

export class WatchSessionManager {
  private supabase = createClient()
  private channel: RealtimeChannel | null = null
  private onStateChange?: (session: WatchSession) => void

  async createSession(
    videoType: "movie" | "series" | "live",
    videoIdentifier: string,
    streamUrl: string,
    title: string,
  ): Promise<{ code: string; sessionId: string }> {
    const code = generateSessionCode()
    const sessionId = `session_${Date.now()}`
    const hostId = getParticipantId()

    const { error } = await this.supabase.from("watch_sessions").insert({
      id: sessionId,
      code,
      video_type: videoType,
      video_identifier: videoIdentifier,
      stream_url: streamUrl,
      title,
      current_time: 0,
      is_playing: false,
      host_id: hostId,
      participants: [hostId],
    })

    if (error) {
      console.error("[v0] Error creating watch session:", error)
      throw new Error("Failed to create watch session")
    }

    console.log("[v0] Created watch session:", { code, sessionId })
    return { code, sessionId }
  }

  async joinSession(code: string): Promise<WatchSession | null> {
    const { data, error } = await this.supabase
      .from("watch_sessions")
      .select("*")
      .eq("code", code.toUpperCase())
      .single()

    if (error || !data) {
      console.error("[v0] Error joining session:", error)
      return null
    }

    // Add current participant to the session
    const participantId = getParticipantId()
    const participants = data.participants as string[]

    if (!participants.includes(participantId)) {
      const { error: updateError } = await this.supabase
        .from("watch_sessions")
        .update({
          participants: [...participants, participantId],
        })
        .eq("id", data.id)

      if (updateError) {
        console.error("[v0] Error adding participant:", updateError)
      }
    }

    console.log("[v0] Joined watch session:", data)
    return this.mapToSession(data)
  }

  async getSession(sessionId: string): Promise<WatchSession | null> {
    const { data, error } = await this.supabase.from("watch_sessions").select("*").eq("id", sessionId).single()

    if (error || !data) {
      console.error("[v0] Error getting session:", error)
      return null
    }

    return this.mapToSession(data)
  }

  async updatePlaybackState(sessionId: string, currentTime: number, isPlaying: boolean): Promise<void> {
    const { error } = await this.supabase
      .from("watch_sessions")
      .update({
        current_time: currentTime,
        is_playing: isPlaying,
      })
      .eq("id", sessionId)

    if (error) {
      console.error("[v0] Error updating playback state:", error)
    }
  }

  subscribeToSession(sessionId: string, callback: (session: WatchSession) => void): void {
    this.onStateChange = callback

    // Unsubscribe from previous channel if exists
    if (this.channel) {
      this.channel.unsubscribe()
    }

    // Create new channel for this session
    this.channel = this.supabase
      .channel(`watch_session_${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "watch_sessions",
          filter: `id=eq.${sessionId}`,
        },
        (payload) => {
          console.log("[v0] Realtime update received:", payload)
          if (payload.new) {
            const session = this.mapToSession(payload.new)
            callback(session)
          }
        },
      )
      .subscribe((status) => {
        console.log("[v0] Realtime subscription status:", status)
      })
  }

  unsubscribe(): void {
    if (this.channel) {
      this.channel.unsubscribe()
      this.channel = null
    }
  }

  private mapToSession(data: any): WatchSession {
    return {
      id: data.id,
      code: data.code,
      videoType: data.video_type,
      videoIdentifier: data.video_identifier,
      streamUrl: data.stream_url,
      title: data.title,
      currentTime: data.current_time,
      isPlaying: data.is_playing,
      hostId: data.host_id,
      participants: data.participants || [],
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }
  }

  async deleteOldSessions(hoursOld = 24): Promise<void> {
    const cutoffDate = new Date()
    cutoffDate.setHours(cutoffDate.getHours() - hoursOld)

    const { error } = await this.supabase.from("watch_sessions").delete().lt("created_at", cutoffDate.toISOString())

    if (error) {
      console.error("[v0] Error deleting old sessions:", error)
    }
  }
}
