import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Generate random 6-digit code
function generateSessionCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789" // Removed confusing chars
  let code = ""
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

// Create new watch session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { videoType, videoId, streamUrl, title, hostName } = body

    if (!videoType || !videoId || !streamUrl) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = await createClient()
    const code = generateSessionCode()
    const sessionId = `session_${Date.now()}`

    const { data, error } = await supabase
      .from("watch_sessions")
      .insert({
        id: sessionId,
        code,
        host_name: hostName || "Anonymous",
        video_type: videoType,
        video_identifier: videoId,
        video_title: title || "Untitled",
        stream_url: streamUrl,
        playback_time: 0,
        is_playing: false,
        participants: 1,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating session:", error)
      return NextResponse.json({ error: "Failed to create session" }, { status: 500 })
    }

    return NextResponse.json({ session: data })
  } catch (error) {
    console.error("[v0] Error in POST /api/watch-session:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Update watch session state
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, playbackTime, isPlaying } = body

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID required" }, { status: 400 })
    }

    const supabase = await createClient()

    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (typeof playbackTime === "number") {
      updateData.playback_time = playbackTime
    }
    if (typeof isPlaying === "boolean") {
      updateData.is_playing = isPlaying
    }

    const { data, error } = await supabase
      .from("watch_sessions")
      .update(updateData)
      .eq("id", sessionId)
      .select()
      .single()

    if (error) {
      console.error("[v0] Error updating session:", error)
      return NextResponse.json({ error: "Failed to update session" }, { status: 500 })
    }

    return NextResponse.json({ session: data })
  } catch (error) {
    console.error("[v0] Error in PATCH /api/watch-session:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
