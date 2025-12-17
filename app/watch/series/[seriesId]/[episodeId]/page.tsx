"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { useXtream } from "@/lib/xtream-context"
import { VideoPlayer } from "@/components/video-player"
import type { SeriesInfo } from "@/types/xtream"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function WatchSeriesPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { api, isConnected } = useXtream()
  const [seriesInfo, setSeriesInfo] = useState<SeriesInfo | null>(null)
  const [streamUrl, setStreamUrl] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [currentSeason, setCurrentSeason] = useState(1)
  const [currentEpisode, setCurrentEpisode] = useState(1)
  const sessionId = searchParams.get("session") || undefined

  const seriesId = Number.parseInt(params.seriesId as string)
  const episodeId = params.episodeId as string

  useEffect(() => {
    if (!isConnected || !api) {
      router.push("/login")
      return
    }

    const loadSeries = async () => {
      try {
        setLoading(true)
        const info = await api.getSeriesInfo(seriesId)
        setSeriesInfo(info)

        let foundEpisode: any = null
        let foundSeason = 1

        Object.keys(info.episodes).forEach((seasonKey) => {
          const episodes = info.episodes[seasonKey]
          const episode = episodes.find((ep) => ep.id === episodeId)
          if (episode) {
            foundEpisode = episode
            foundSeason = Number.parseInt(seasonKey)
          }
        })

        if (foundEpisode) {
          setCurrentSeason(foundSeason)
          setCurrentEpisode(foundEpisode.episode_num)
          const extension = foundEpisode.container_extension || "mp4"
          const url = api.getSeriesStreamUrl(Number.parseInt(episodeId), extension)
          setStreamUrl(url)
        } else {
          setError("Episode not found")
        }
      } catch (err) {
        console.error("[v0] Error loading series:", err)
        setError("Failed to load episode")
      } finally {
        setLoading(false)
      }
    }

    loadSeries()
  }, [params.seriesId, params.episodeId, api, isConnected, router, episodeId, seriesId])

  const getCurrentEpisode = () => {
    if (!seriesInfo) return null
    const episodes = seriesInfo.episodes[currentSeason.toString()] || []
    return episodes.find((ep) => ep.id === episodeId)
  }

  const getNextEpisode = () => {
    if (!seriesInfo) return null
    const episodes = seriesInfo.episodes[currentSeason.toString()] || []
    const currentIndex = episodes.findIndex((ep) => ep.id === episodeId)
    if (currentIndex < episodes.length - 1) {
      return episodes[currentIndex + 1]
    }
    const nextSeasonEpisodes = seriesInfo.episodes[(currentSeason + 1).toString()]
    if (nextSeasonEpisodes && nextSeasonEpisodes.length > 0) {
      return nextSeasonEpisodes[0]
    }
    return null
  }

  const getPreviousEpisode = () => {
    if (!seriesInfo) return null
    const episodes = seriesInfo.episodes[currentSeason.toString()] || []
    const currentIndex = episodes.findIndex((ep) => ep.id === episodeId)
    if (currentIndex > 0) {
      return episodes[currentIndex - 1]
    }
    const prevSeasonEpisodes = seriesInfo.episodes[(currentSeason - 1).toString()]
    if (prevSeasonEpisodes && prevSeasonEpisodes.length > 0) {
      return prevSeasonEpisodes[prevSeasonEpisodes.length - 1]
    }
    return null
  }

  const handleNext = () => {
    const next = getNextEpisode()
    if (next) {
      const url = sessionId
        ? `/watch/series/${seriesId}/${next.id}?session=${sessionId}`
        : `/watch/series/${seriesId}/${next.id}`
      router.push(url)
    }
  }

  const handlePrevious = () => {
    const prev = getPreviousEpisode()
    if (prev) {
      const url = sessionId
        ? `/watch/series/${seriesId}/${prev.id}?session=${sessionId}`
        : `/watch/series/${seriesId}/${prev.id}`
      router.push(url)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !seriesInfo) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-red-500">{error || "Episode not found"}</p>
        <Link
          href="/series"
          className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          Back to Series
        </Link>
      </div>
    )
  }

  const currentEp = getCurrentEpisode()

  return (
    <div className="min-h-screen bg-background">
      <div className="absolute top-4 left-4 z-50">
        <Link
          href="/series"
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
          title={`${seriesInfo.info.name} ${currentEp?.container_extension ? `[${currentEp.container_extension.toUpperCase()}]` : ""}`}
          subtitle={`Season ${currentSeason} Episode ${currentEpisode}${currentEp?.title ? ` - ${currentEp.title}` : ""}`}
          onNext={handleNext}
          onPrevious={handlePrevious}
          hasNext={!!getNextEpisode()}
          hasPrevious={!!getPreviousEpisode()}
          autoPlay
          sessionId={sessionId}
          videoType="series"
          videoIdentifier={`${seriesId}/${episodeId}`}
        />
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl">
          <h1 className="text-3xl font-bold mb-2">{seriesInfo.info.name}</h1>
          <p className="text-xl text-muted-foreground mb-6">
            Season {currentSeason} Episode {currentEpisode}
            {currentEp?.title && ` - ${currentEp.title}`}
          </p>

          {currentEp?.info.plot && <p className="text-muted-foreground mb-8">{currentEp.info.plot}</p>}

          <div className="space-y-6">
            {Object.keys(seriesInfo.episodes)
              .sort((a, b) => Number.parseInt(a) - Number.parseInt(b))
              .map((seasonKey) => {
                const episodes = seriesInfo.episodes[seasonKey]
                return (
                  <div key={seasonKey}>
                    <h3 className="text-lg font-semibold mb-4">Season {seasonKey}</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {episodes.map((ep) => (
                        <Link
                          key={ep.id}
                          href={
                            sessionId
                              ? `/watch/series/${seriesId}/${ep.id}?session=${sessionId}`
                              : `/watch/series/${seriesId}/${ep.id}`
                          }
                          className={`p-4 rounded-lg border-2 transition-all hover:scale-105 ${
                            ep.id === episodeId
                              ? "border-primary bg-primary/10"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <div className="text-sm font-medium mb-1">Episode {ep.episode_num}</div>
                          {ep.title && <div className="text-xs text-muted-foreground truncate">{ep.title}</div>}
                          {ep.info.duration && (
                            <div className="text-xs text-muted-foreground mt-1">{ep.info.duration}</div>
                          )}
                        </Link>
                      ))}
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      </div>
    </div>
  )
}
