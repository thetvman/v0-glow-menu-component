"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { MenuBar } from "@/components/menu-bar"
import { ThemeToggle } from "@/components/theme-toggle"
import { ContentCarousel } from "@/components/content-carousel"
import { MovieCard } from "@/components/movie-card"
import { SeriesCard } from "@/components/series-card"
import { LiveChannelCard } from "@/components/live-channel-card"
import { useXtream } from "@/lib/xtream-context"
import { Button } from "@/components/ui/button"
import { Plug, Loader2, TrendingUp } from "lucide-react"
import type { VODStream, Series } from "@/types/xtream"

export default function Page() {
  const router = useRouter()
  const { isConnected, disconnect, credentials, api } = useXtream()
  const [loading, setLoading] = useState(false)
  const [featuredMovies, setFeaturedMovies] = useState<VODStream[]>([])
  const [featuredSeries, setFeaturedSeries] = useState<Series[]>([])
  const [liveChannels, setLiveChannels] = useState<any[]>([])

  useEffect(() => {
    if (!isConnected) {
      router.push("/login")
    } else if (api) {
      loadFeaturedContent()
    }
  }, [isConnected, api, router])

  async function loadFeaturedContent() {
    if (!api || !isConnected) {
      return
    }

    try {
      setLoading(true)
      const [movies, series, live] = await Promise.all([
        api
          .getVodStreams()
          .then((data) => data.slice(0, 20))
          .catch((err) => {
            console.error("Error loading movies:", err)
            return []
          }),
        api
          .getSeries()
          .then((data) => data.slice(0, 20))
          .catch((err) => {
            console.error("Error loading series:", err)
            return []
          }),
        api
          .getLiveStreams()
          .then((data) => data.slice(0, 20))
          .catch((err) => {
            console.error("Error loading live streams:", err)
            return []
          }),
      ])

      setFeaturedMovies(movies)
      setFeaturedSeries(series)
      setLiveChannels(live)
    } catch (err) {
      console.error("Error loading featured content:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleMovieClick = (movie: VODStream) => {
    console.log("[v0] Selected movie:", movie)
  }

  const handleSeriesClick = (series: Series) => {
    console.log("[v0] Selected series:", series)
  }

  const handleChannelClick = (channel: any) => {
    console.log("[v0] Selected channel:", channel)
  }

  if (!isConnected) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="absolute top-4 right-4 flex items-center gap-2 z-50">
        <div className="flex items-center gap-2">
          <div className="text-sm text-muted-foreground">Connected: {credentials?.username}</div>
          <Button variant="outline" size="sm" onClick={disconnect} className="gap-2 bg-transparent">
            <Plug className="h-4 w-4" />
            Disconnect
          </Button>
        </div>
        <ThemeToggle />
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-12 flex flex-col items-center justify-center min-h-[40vh]">
          <div className="mb-8 text-center">
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-500 via-purple-500 to-red-500 bg-clip-text text-transparent">
              IPTV Player
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Discover thousands of movies, series, and live channels
            </p>
          </div>

          <MenuBar />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">Loading content...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Trending Movies */}
            {featuredMovies.length > 0 && (
              <ContentCarousel title="Trending Movies" itemCount={featuredMovies.length}>
                {featuredMovies.map((movie) => (
                  <div key={movie.stream_id} className="min-w-[160px]">
                    <MovieCard movie={movie} onClick={() => handleMovieClick(movie)} />
                  </div>
                ))}
              </ContentCarousel>
            )}

            {/* Popular Series */}
            {featuredSeries.length > 0 && (
              <ContentCarousel title="Popular Series" itemCount={featuredSeries.length}>
                {featuredSeries.map((series) => (
                  <div key={series.series_id} className="min-w-[160px]">
                    <SeriesCard series={series} onClick={() => handleSeriesClick(series)} />
                  </div>
                ))}
              </ContentCarousel>
            )}

            {/* Live Channels */}
            {liveChannels.length > 0 && (
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

            {/* Quick links */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12">
              <Link href="/movies">
                <Button variant="outline" size="lg" className="w-full h-24 text-lg bg-transparent">
                  <div className="flex flex-col items-center gap-2">
                    <TrendingUp className="w-6 h-6" />
                    <span>Browse All Movies</span>
                  </div>
                </Button>
              </Link>
              <Link href="/series">
                <Button variant="outline" size="lg" className="w-full h-24 text-lg bg-transparent">
                  <div className="flex flex-col items-center gap-2">
                    <TrendingUp className="w-6 h-6" />
                    <span>Browse All Series</span>
                  </div>
                </Button>
              </Link>
              <Link href="/live">
                <Button variant="outline" size="lg" className="w-full h-24 text-lg bg-transparent">
                  <div className="flex flex-col items-center gap-2">
                    <TrendingUp className="w-6 h-6" />
                    <span>Browse Live TV</span>
                  </div>
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
