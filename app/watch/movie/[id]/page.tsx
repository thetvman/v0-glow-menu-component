"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { useXtream } from "@/lib/xtream-context"
import { VideoPlayer } from "@/components/video-player"
import type { VodInfo, VODStream } from "@/types/xtream"
import { ArrowLeft, Star, Clock, Calendar, Film } from "lucide-react"
import Link from "next/link"
import { MovieCard } from "@/components/movie-card"
import { WatchTogetherButton } from "@/components/watch-together-button"

export default function WatchMoviePage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { api, isConnected } = useXtream()
  const [movieInfo, setMovieInfo] = useState<VodInfo | null>(null)
  const [relatedMovies, setRelatedMovies] = useState<VODStream[]>([])
  const [streamUrl, setStreamUrl] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState<"overview" | "details">("overview")
  const sessionId = searchParams.get("session") || undefined
  const [sessionCode, setSessionCode] = useState(searchParams.get("code") || undefined)

  const handleSessionCreated = (newSessionId: string, code: string) => {
    const url = new URL(window.location.href)
    url.searchParams.set("session", newSessionId)
    url.searchParams.set("code", code)
    window.history.pushState({}, "", url.toString())

    setSessionCode(code)
    router.push(`/watch/movie/${params.id}?session=${newSessionId}&code=${code}`)
  }

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

        if (info.movie_data.category_id) {
          try {
            const allMovies = await api.getVODStreams(info.movie_data.category_id)
            const related = allMovies.filter((m) => m.stream_id !== movieId).slice(0, 6)
            setRelatedMovies(related)
          } catch (err) {
            console.error("[v0] Error loading related movies:", err)
          }
        }
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

  const quality = movieInfo.movie_data.container_extension?.toUpperCase() || "HD"
  const rating = movieInfo.info.rating ? Number.parseFloat(movieInfo.info.rating) : null

  return (
    <div className="min-h-screen bg-background">
      <div className="relative">
        <div className="absolute top-4 left-4 z-50 flex items-center gap-2">
          <Link
            href="/movies"
            className="flex items-center gap-2 px-4 py-2 bg-black/70 backdrop-blur-md text-white rounded-lg
              hover:bg-black/90 transition-all border border-white/10"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </Link>
        </div>

        <div className="absolute top-4 right-4 z-50">
          <div className="bg-black/70 backdrop-blur-md rounded-lg border border-white/10 p-1">
            <WatchTogetherButton
              videoUrl={`/watch/movie/${params.id}`}
              videoTitle={movieInfo.info.name}
              videoType="movie"
              streamUrl={streamUrl}
              onSessionCreated={handleSessionCreated}
            />
          </div>
        </div>

        <div className="w-full h-screen">
          <VideoPlayer
            src={streamUrl}
            title={`${movieInfo.info.name} ${quality ? `[${quality}]` : ""}`}
            subtitle={`${movieInfo.info.releasedate || ""} • ${movieInfo.info.duration || ""}`}
            autoPlay
            activeSessionId={sessionId}
            sessionCode={sessionCode}
            videoType="movie"
            videoIdentifier={params.id as string}
            streamUrl={streamUrl}
            onSessionStart={handleSessionCreated}
          />
        </div>
      </div>

      <div className="relative">
        {movieInfo.info.cover_big && (
          <div className="absolute inset-0 h-96">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background" />
            <img
              src={movieInfo.info.cover_big || "/placeholder.svg"}
              alt=""
              className="w-full h-full object-cover opacity-30"
            />
          </div>
        )}

        <div className="relative container mx-auto px-4 pt-8 pb-12">
          <div className="flex flex-col md:flex-row gap-8">
            {movieInfo.info.movie_image && (
              <div className="flex-shrink-0">
                <img
                  src={movieInfo.info.movie_image || "/placeholder.svg"}
                  alt={movieInfo.info.name}
                  className="w-48 h-72 object-cover rounded-lg shadow-2xl border border-white/10"
                />
              </div>
            )}

            <div className="flex-1 space-y-4">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold mb-2">{movieInfo.info.name}</h1>
                {movieInfo.info.o_name && movieInfo.info.o_name !== movieInfo.info.name && (
                  <p className="text-lg text-muted-foreground italic">{movieInfo.info.o_name}</p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-4">
                {rating && (
                  <div className="flex items-center gap-2 bg-yellow-500/20 border border-yellow-500/30 rounded-lg px-3 py-1.5">
                    <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                    <span className="font-bold text-lg">{rating.toFixed(1)}</span>
                    <span className="text-sm text-muted-foreground">/10</span>
                  </div>
                )}

                {quality && (
                  <div className="bg-primary/20 border border-primary/30 rounded-lg px-3 py-1.5">
                    <span className="font-semibold text-sm">{quality}</span>
                  </div>
                )}

                {movieInfo.info.duration && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">{movieInfo.info.duration}</span>
                  </div>
                )}

                {movieInfo.info.releasedate && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">{movieInfo.info.releasedate}</span>
                  </div>
                )}
              </div>

              {movieInfo.info.genre && (
                <div className="flex flex-wrap gap-2">
                  {movieInfo.info.genre.split(",").map((genre, i) => (
                    <span key={i} className="px-3 py-1 bg-muted rounded-full text-sm font-medium">
                      {genre.trim()}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-12">
        <div className="max-w-5xl mx-auto">
          {/* Tab buttons */}
          <div className="flex gap-1 border-b border-border mb-6">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-6 py-3 font-medium transition-colors relative ${
                activeTab === "overview" ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Overview
              {activeTab === "overview" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
            </button>
            <button
              onClick={() => setActiveTab("details")}
              className={`px-6 py-3 font-medium transition-colors relative ${
                activeTab === "details" ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Details
              {activeTab === "details" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
            </button>
          </div>

          {/* Tab content */}
          {activeTab === "overview" && (
            <div className="space-y-8">
              {/* Plot */}
              {movieInfo.info.plot && (
                <div>
                  <h2 className="text-2xl font-bold mb-4">Plot</h2>
                  <p className="text-muted-foreground leading-relaxed text-lg">{movieInfo.info.plot}</p>
                </div>
              )}

              {/* Cast & Crew */}
              <div className="grid md:grid-cols-2 gap-6">
                {movieInfo.info.director && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                      <Film className="w-5 h-5" />
                      Director
                    </h3>
                    <p className="text-muted-foreground">{movieInfo.info.director}</p>
                  </div>
                )}

                {(movieInfo.info.cast || movieInfo.info.actors) && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Cast</h3>
                    <p className="text-muted-foreground">{movieInfo.info.cast || movieInfo.info.actors}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "details" && (
            <div className="grid md:grid-cols-2 gap-6">
              {movieInfo.info.releasedate && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Release Date</h3>
                  <p className="text-lg">{movieInfo.info.releasedate}</p>
                </div>
              )}

              {movieInfo.info.duration && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Runtime</h3>
                  <p className="text-lg">{movieInfo.info.duration}</p>
                </div>
              )}

              {movieInfo.info.video && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Video Quality</h3>
                  <p className="text-lg">
                    {movieInfo.info.video.width}x{movieInfo.info.video.height} •{" "}
                    {movieInfo.info.video.codec_name?.toUpperCase()}
                  </p>
                </div>
              )}

              {movieInfo.info.audio && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Audio</h3>
                  <p className="text-lg">{movieInfo.info.audio.codec_name?.toUpperCase()}</p>
                </div>
              )}

              {movieInfo.info.bitrate && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Bitrate</h3>
                  <p className="text-lg">{(movieInfo.info.bitrate / 1000000).toFixed(2)} Mbps</p>
                </div>
              )}

              {movieInfo.movie_data.container_extension && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Format</h3>
                  <p className="text-lg">{movieInfo.movie_data.container_extension.toUpperCase()}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {relatedMovies.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold mb-6">More Like This</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {relatedMovies.map((movie) => (
                <MovieCard
                  key={movie.stream_id}
                  movie={movie}
                  onClick={() => router.push(`/watch/movie/${movie.stream_id}`)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
