import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("")
}

export async function POST(request: NextRequest) {
  try {
    const { videoType, videoId, videoTitle, streamUrl } = await request.json()

    const supabase = await createClient()
    const code = generateCode()
    const sessionId = `session_${Date.now()}`

    const { data, error } = await supabase
      .from("watch_sessions")
      .insert({
        id: sessionId,
        code,
        host_name: "Host",
        video_type: videoType,
        video_identifier: videoId,
        video_title: videoTitle,
        stream_url: streamUrl,
        playback_time: 0,
        is_playing: false,
        participants: 1,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Create session error:", error)
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { sessionId, time, playing } = await request.json()

    console.log("[v0] API: Updating session", sessionId, "to time:", time, "playing:", playing)

    const supabase = await createClient()

    const { error } = await supabase
      .from("watch_sessions")
      .update({
        playback_time: time,
        is_playing: playing,
        updated_at: new Date().toISOString(),
      })
      .eq("id", sessionId)

    if (error) throw error

    console.log("[v0] API: Session updated successfully, Supabase will broadcast to all subscribers")
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Update session error:", error)
    return NextResponse.json({ error: "Failed to update session" }, { status: 500 })
  }
}
