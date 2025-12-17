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
          console.log("[v0] Sync update received")
          if (payload.new) {
            callback(this.mapSession(payload.new))
          }
        },
      )
      .subscribe()
  }

  unsubscribe(): void {
    if (this.channel) {
      this.channel.unsubscribe()
      this.channel = null
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
