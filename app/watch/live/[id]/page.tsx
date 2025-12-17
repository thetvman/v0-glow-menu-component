"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useXtream } from "@/lib/xtream-context"
import { VideoPlayer } from "@/components/video-player"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function WatchLivePage() {
  const params = useParams()
  const router = useRouter()
  const { api, isConnected } = useXtream()
  const [channelName, setChannelName] = useState("")
  const [streamUrl, setStreamUrl] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!isConnected || !api) {
      router.push("/login")
      return
    }

    const loadChannel = async () => {
      try {
        setLoading(true)
        const channelId = Number.parseInt(params.id as string)

        // Get all live streams to find the channel name
        const streams = await api.getLiveStreams()
        const channel = streams.find((s) => s.stream_id === channelId)

        if (channel) {
          setChannelName(channel.name)
          const url = api.getLiveStreamUrl(channelId, "m3u8")
          setStreamUrl(url)
        } else {
          setError("Channel not found")
        }
      } catch (err) {
        console.error("[v0] Error loading channel:", err)
        setError("Failed to load channel")
      } finally {
        setLoading(false)
      }
    }

    loadChannel()
  }, [params.id, api, isConnected, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !streamUrl) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-red-500">{error || "Channel not found"}</p>
        <Link href="/live" className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
          Back to Live TV
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Back Button */}
      <div className="absolute top-4 left-4 z-50">
        <Link
          href="/live"
          className="flex items-center gap-2 px-4 py-2 bg-black/50 backdrop-blur-sm text-white rounded-lg
            hover:bg-black/70 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </Link>
      </div>

      {/* Video Player */}
      <div className="w-full h-screen">
        <VideoPlayer src={streamUrl} title={channelName} subtitle="Live TV" autoPlay />
      </div>
    </div>
  )
}
