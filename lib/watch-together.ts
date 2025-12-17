import { createClient } from "@/lib/supabase/client"
import type { RealtimeChannel } from "@supabase/supabase-js"

export interface WatchSession {
  id: string
  code: string
  videoType: string
  videoId: string
  videoTitle: string
  streamUrl: string
  playbackTime: number
  isPlaying: boolean
  participants: number
}

export class WatchTogetherManager {
  private supabase = createClient()
  private channel: RealtimeChannel | null = null

  // Create a new watch session
  async createSession(
    videoType: string,
    videoId: string,
    videoTitle: string,
    streamUrl: string,
  ): Promise<{ code: string; sessionId: string } | null> {
    try {
      const response = await fetch("/api/watch-together", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoType, videoId, videoTitle, streamUrl }),
      })

      if (!response.ok) throw new Error("Failed to create session")

      const data = await response.json()
      console.log("[v0] Watch session created:", data.code)
      return { code: data.code, sessionId: data.id }
    } catch (error) {
      console.error("[v0] Failed to create session:", error)
      return null
    }
  }

  // Join an existing session by code
  async joinSession(code: string): Promise<WatchSession | null> {
    try {
      const { data, error } = await this.supabase
        .from("watch_sessions")
        .select("*")
        .eq("code", code.toUpperCase())
        .single()

      if (error || !data) {
        console.error("[v0] Session not found")
        return null
      }

      // Increment participant count
      await this.supabase
        .from("watch_sessions")
        .update({ participants: (data.participants || 1) + 1 })
        .eq("id", data.id)

      console.log("[v0] Joined session:", data.code)
      return this.mapSession(data)
    } catch (error) {
      console.error("[v0] Failed to join session:", error)
      return null
    }
  }

  // Get session details
  async getSession(sessionId: string): Promise<WatchSession | null> {
    try {
      const { data, error } = await this.supabase.from("watch_sessions").select("*").eq("id", sessionId).single()

      if (error || !data) return null
      return this.mapSession(data)
    } catch (error) {
      console.error("[v0] Failed to get session:", error)
      return null
    }
  }

  // Update playback state
  async updatePlayback(sessionId: string, time: number, playing: boolean): Promise<void> {
    try {
      await fetch("/api/watch-together", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, time, playing }),
      })
    } catch (error) {
      console.error("[v0] Failed to update playback:", error)
    }
  }

  // Subscribe to session changes
  subscribe(sessionId: string, callback: (session: WatchSession) => void): void {
    if (this.channel) {
      this.channel.unsubscribe()
    }

    console.log("[v0] Setting up realtime subscription for session:", sessionId)

    this.channel = this.supabase
      .channel(`session:${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "watch_sessions",
          filter: `id=eq.${sessionId}`,
        },
        (payload) => {
          console.log("[v0] ⚡ Realtime update received!", payload)
          if (payload.new) {
            const session = this.mapSession(payload.new)
            console.log("[v0] Syncing to:", {
              time: session.playbackTime,
              playing: session.isPlaying,
              participants: session.participants,
            })
            callback(session)
          }
        },
      )
      .subscribe((status, err) => {
        console.log("[v0] Subscription status:", status)
        if (err) {
          console.error("[v0] Subscription error:", err)
        }
        if (status === "SUBSCRIBED") {
          console.log("[v0] ✅ Successfully subscribed to realtime updates")
        }
      })
  }

  unsubscribe(): void {
    if (this.channel) {
      this.channel.unsubscribe()
      this.channel = null
    }
  }

  async restartSession(sessionId: string): Promise<void> {
    try {
      console.log("[v0] Restarting session for all participants:", sessionId)
      await fetch("/api/watch-together", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, time: 0, playing: true }),
      })
      console.log("[v0] Restart command sent - all participants should seek to 0 and play")
    } catch (error) {
      console.error("[v0] Failed to restart session:", error)
    }
  }

  private mapSession(data: any): WatchSession {
    return {
      id: data.id,
      code: data.code,
      videoType: data.video_type,
      videoId: data.video_identifier,
      videoTitle: data.video_title,
      streamUrl: data.stream_url,
      playbackTime: data.playback_time || 0,
      isPlaying: data.is_playing || false,
      participants: data.participants || 1,
    }
  }
}
