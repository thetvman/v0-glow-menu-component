"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { MenuBar } from "@/components/menu-bar"
import { ThemeToggle } from "@/components/theme-toggle"
import { ContentCarousel } from "@/components/content-carousel"
import { TMDBMovieCard } from "@/components/tmdb-movie-card"
import { TMDBSeriesCard } from "@/components/tmdb-series-card"
import { LiveChannelCard } from "@/components/live-channel-card"
import { useXtream } from "@/lib/xtream-context"
import { Button } from "@/components/ui/button"
import { Plug, TrendingUp } from "lucide-react"
import { SkeletonCarousel } from "@/components/skeleton-carousel"
import { getTrendingMovies, getPopularSeries, type TMDBMovie, type TMDBSeries } from "@/lib/tmdb-api"

export default function Page() {
  const router = useRouter()
  const { isConnected, disconnect, credentials, api, availableContent } = useXtream()
  const [loading, setLoading] = useState(false)
  const [trendingMovies, setTrendingMovies] = useState<TMDBMovie[]>([])
  const [popularSeries, setPopularSeries] = useState<TMDBSeries[]>([])
  const [liveChannels, setLiveChannels] = useState<any[]>([])

  useEffect(() => {
    if (!isConnected) {
      router.push("/login")
    }
  }, [isConnected, router])

  useEffect(() => {
    if (isConnected && api && !availableContent.isLoading) {
      loadFeaturedContent()
    }
  }, [isConnected, api, availableContent.isLoading])

  async function loadFeaturedContent() {
    if (!api || !isConnected) {
      return
    }

    try {
      setLoading(true)
      const promises = []

      if (availableContent.hasMovies) {
        promises.push(
          getTrendingMovies("week")
            .then((data) => data.slice(0, 20))
            .catch((err) => {
              console.error("[v0] Error loading trending movies from TMDB:", err)
              return []
            }),
        )
      } else {
        promises.push(Promise.resolve([]))
      }

      if (availableContent.hasSeries) {
        promises.push(
          getPopularSeries()
            .then((data) => data.slice(0, 20))
            .catch((err) => {
              console.error("[v0] Error loading popular series from TMDB:", err)
              return []
            }),
        )
      } else {
        promises.push(Promise.resolve([]))
      }

      if (availableContent.hasLiveTV) {
        promises.push(
          api
            .getLiveStreams()
            .then((data) => data.slice(0, 20))
            .catch((err) => {
              console.error("[v0] Error loading live streams:", err)
              return []
            }),
        )
      } else {
        promises.push(Promise.resolve([]))
      }

      const [movies, series, live] = await Promise.all(promises)

      setTrendingMovies(movies)
      setPopularSeries(series)
      setLiveChannels(live)
    } catch (err) {
      console.error("[v0] Error loading featured content:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleTMDBMovieClick = async (movie: TMDBMovie) => {
    console.log("[v0] Selected TMDB movie:", movie.title, "- navigating to search")
    router.push(`/search?q=${encodeURIComponent(movie.title)}`)
  }

  const handleTMDBSeriesClick = async (series: TMDBSeries) => {
    console.log("[v0] Selected TMDB series:", series.name, "- navigating to search")
    router.push(`/search?q=${encodeURIComponent(series.name)}`)
  }

  const handleChannelClick = (channel: any) => {
    console.log("[v0] Selected channel:", channel)
  }

  if (!isConnected) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="truncate">Connected: {credentials?.username}</div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={disconnect}
                className="gap-2 bg-transparent flex-1 md:flex-initial"
              >
                <Plug className="h-4 w-4" />
                <span className="md:inline">Disconnect</span>
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-12 flex flex-col items-center justify-center min-h-[30vh] md:min-h-[40vh]">
          <div className="mb-8 text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]">
              amri's network
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
              amri's movie & series library
            </p>
          </div>

          <MenuBar />
        </div>

        {loading || availableContent.isLoading ? (
          <div className="space-y-8 py-8">
            <SkeletonCarousel />
            <SkeletonCarousel />
            <SkeletonCarousel />
          </div>
        ) : (
          <div className="space-y-8">
            {availableContent.hasMovies && trendingMovies.length > 0 && (
              <ContentCarousel title="Trending Movies" itemCount={trendingMovies.length}>
                {trendingMovies.map((movie) => (
                  <div key={movie.id} className="min-w-[160px]">
                    <TMDBMovieCard movie={movie} onClick={() => handleTMDBMovieClick(movie)} />
                  </div>
                ))}
              </ContentCarousel>
            )}

            {availableContent.hasSeries && popularSeries.length > 0 && (
              <ContentCarousel title="Popular Series" itemCount={popularSeries.length}>
                {popularSeries.map((series) => (
                  <div key={series.id} className="min-w-[160px]">
                    <TMDBSeriesCard series={series} onClick={() => handleTMDBSeriesClick(series)} />
                  </div>
                ))}
              </ContentCarousel>
            )}

            {availableContent.hasLiveTV && liveChannels.length > 0 && (
              <ContentCarousel title="Live Channels" itemCount={liveChannels.length}>
                {liveChannels.map((channel) => (
                  <LiveChannelCard
                    key={channel.stream_id}
                    channel={channel}
                    onClick={() => handleChannelClick(channel)}
                  />
                ))}
              </ContentCarousel>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12">
              {availableContent.hasMovies && (
                <Link href="/movies">
                  <Button variant="outline" size="lg" className="w-full h-24 text-lg bg-transparent">
                    <div className="flex flex-col items-center gap-2">
                      <TrendingUp className="w-6 h-6" />
                      <span>Browse All Movies</span>
                    </div>
                  </Button>
                </Link>
              )}
              {availableContent.hasSeries && (
                <Link href="/series">
                  <Button variant="outline" size="lg" className="w-full h-24 text-lg bg-transparent">
                    <div className="flex flex-col items-center gap-2">
                      <TrendingUp className="w-6 h-6" />
                      <span>Browse All Series</span>
                    </div>
                  </Button>
                </Link>
              )}
              {availableContent.hasLiveTV && (
                <Link href="/live">
                  <Button variant="outline" size="lg" className="w-full h-24 text-lg bg-transparent">
                    <div className="flex flex-col items-center gap-2">
                      <TrendingUp className="w-6 h-6" />
                      <span>Browse Live TV</span>
                    </div>
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
