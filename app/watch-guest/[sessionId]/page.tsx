"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { VideoPlayer } from "@/components/video-player"
import { WatchTogetherManager, type WatchSession } from "@/lib/watch-together"
import { ArrowLeft, Users } from "lucide-react"
import Link from "next/link"

export default function WatchGuestPage() {
  const params = useParams()
  const router = useRouter()
  const [session, setSession] = useState<WatchSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const loadSession = async () => {
      try {
        setLoading(true)
        const sessionId = params.sessionId as string
        const manager = new WatchTogetherManager()
        const foundSession = await manager.getSession(sessionId)

        if (!foundSession) {
          setError("Session not found or expired")
          return
        }

        setSession(foundSession)
      } catch (err) {
        console.error("[v0] Error loading session:", err)
        setError("Failed to load session")
      } finally {
        setLoading(false)
      }
    }

    loadSession()
  }, [params.sessionId])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-red-500">{error || "Session not found"}</p>
        <Link
          href="/screenshare"
          className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          Back to Join Page
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="absolute top-4 left-4 z-50">
        <Link
          href="/screenshare"
          className="flex items-center gap-2 px-4 py-2 bg-black/50 backdrop-blur-sm text-white rounded-lg
            hover:bg-black/70 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </Link>
      </div>

      <div className="absolute top-4 right-4 z-50">
        <div
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 
          border border-purple-500/30 rounded-lg backdrop-blur-sm"
        >
          <Users className="w-4 h-4 text-purple-400" />
          <span className="text-sm text-white/90">{session.participants} watching</span>
        </div>
      </div>

      <div className="w-full h-screen">
        <VideoPlayer
          src={session.streamUrl}
          title={session.videoTitle}
          subtitle="Watching Together"
          autoPlay
          activeSessionId={session.id}
          videoType={session.videoType}
          videoIdentifier={session.videoId}
        />
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl">
          <h1 className="text-3xl font-bold mb-4">{session.videoTitle}</h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>{session.participants} viewers</span>
            </div>
            <span>Session Code: {session.code}</span>
            <span>Type: {session.videoType}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
