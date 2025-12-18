"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { useXtream } from "@/lib/xtream-context"
import { VideoPlayer } from "@/components/video-player"
import type { VodInfo } from "@/types/xtream"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function WatchMoviePage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { api, isConnected } = useXtream()
  const [movieInfo, setMovieInfo] = useState<VodInfo | null>(null)
  const [streamUrl, setStreamUrl] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const sessionId = searchParams.get("session") || undefined

  useEffect(() => {
    if (!isConnected || !api) {
      router.push("/login")
      return
    }

    const loadMovie = async () => {
      try {
        setLoading(true)
        const movieId = Number.parseInt(params.id as string)
        const info = await api.getVodInfo(movieId)
        setMovieInfo(info)

        const extension = info.movie_data.container_extension || "mp4"
        const url = api.getVodStreamUrl(movieId, extension)
        setStreamUrl(url)
      } catch (err) {
        console.error("[v0] Error loading movie:", err)
        setError("Failed to load movie")
      } finally {
        setLoading(false)
      }
    }

    loadMovie()
  }, [params.id, api, isConnected, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !movieInfo) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-red-500">{error || "Movie not found"}</p>
        <Link
          href="/movies"
          className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          Back to Movies
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="absolute top-4 left-4 z-50">
        <Link
          href="/movies"
          className="flex items-center gap-2 px-4 py-2 bg-black/50 backdrop-blur-sm text-white rounded-lg
            hover:bg-black/70 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </Link>
      </div>

      <div className="w-full h-screen">
        <VideoPlayer
          src={streamUrl}
          title={`${movieInfo.info.name} ${movieInfo.movie_data.container_extension ? `[${movieInfo.movie_data.container_extension.toUpperCase()}]` : ""}`}
          subtitle={`${movieInfo.info.releaseDate || ""} • ${movieInfo.info.duration || ""}`}
          autoPlay
          activeSessionId={sessionId} // Fixed prop name from sessionId to activeSessionId
          videoType="movie"
          videoIdentifier={params.id as string}
          streamUrl={streamUrl}
        />
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl">
          <h1 className="text-3xl font-bold mb-4">{movieInfo.info.name}</h1>
          {movieInfo.info.plot && <p className="text-muted-foreground mb-6">{movieInfo.info.plot}</p>}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {movieInfo.info.director && (
              <div>
                <span className="text-muted-foreground">Director:</span>
                <p className="font-medium">{movieInfo.info.director}</p>
              </div>
            )}
            {movieInfo.info.cast && (
              <div>
                <span className="text-muted-foreground">Cast:</span>
                <p className="font-medium">{movieInfo.info.cast}</p>
              </div>
            )}
            {movieInfo.info.genre && (
              <div>
                <span className="text-muted-foreground">Genre:</span>
                <p className="font-medium">{movieInfo.info.genre}</p>
              </div>
            )}
            {movieInfo.info.rating && (
              <div>
                <span className="text-muted-foreground">Rating:</span>
                <p className="font-medium">{movieInfo.info.rating}/10</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
