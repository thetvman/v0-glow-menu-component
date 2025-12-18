"use client"

import { useState, useEffect, useCallback } from "react"
import { useXtream } from "@/lib/xtream-context"
import { useRouter } from "next/navigation"
import { MenuBar } from "@/components/menu-bar"
import { MovieCard } from "@/components/movie-card"
import { SeriesCard } from "@/components/series-card"
import { LiveChannelCard } from "@/components/live-channel-card"
import { Search, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { VodStream, Series, LiveStream } from "@/lib/xtream-api"

export default function SearchPage() {
  const { isConnected, api } = useXtream()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [activeTab, setActiveTab] = useState("all")

  const [movieResults, setMovieResults] = useState<VodStream[]>([])
  const [seriesResults, setSeriesResults] = useState<Series[]>([])
  const [liveResults, setLiveResults] = useState<LiveStream[]>([])

  const [allMovies, setAllMovies] = useState<VodStream[]>([])
  const [allSeries, setAllSeries] = useState<Series[]>([])
  const [allLive, setAllLive] = useState<LiveStream[]>([])

  useEffect(() => {
    if (!isConnected || !api) {
      router.push("/login")
      return
    }

    // Load all content once for client-side filtering
    const loadAllContent = async () => {
      try {
        const [movies, series, live] = await Promise.all([
          api.getVodStreams().catch(() => []),
          api.getSeries().catch(() => []),
          api.getLiveStreams().catch(() => []),
        ])

        setAllMovies(movies)
        setAllSeries(series)
        setAllLive(live)
      } catch (error) {
        console.error("[v0] Error loading content:", error)
      }
    }

    loadAllContent()
  }, [isConnected, api, router])

  // Debounced search function
  const performSearch = useCallback(
    (query: string) => {
      if (!query.trim()) {
        setMovieResults([])
        setSeriesResults([])
        setLiveResults([])
        setIsSearching(false)
        return
      }

      setIsSearching(true)

      const lowerQuery = query.toLowerCase()

      // Filter movies
      const filteredMovies = allMovies.filter((movie) => movie.name.toLowerCase().includes(lowerQuery))

      // Filter series
      const filteredSeries = allSeries.filter((series) => series.name.toLowerCase().includes(lowerQuery))

      // Filter live channels
      const filteredLive = allLive.filter((channel) => channel.name.toLowerCase().includes(lowerQuery))

      setMovieResults(filteredMovies.slice(0, 50)) // Limit to 50 results
      setSeriesResults(filteredSeries.slice(0, 50))
      setLiveResults(filteredLive.slice(0, 50))
      setIsSearching(false)
    },
    [allMovies, allSeries, allLive],
  )

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(searchQuery)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery, performSearch])

  const totalResults = movieResults.length + seriesResults.length + liveResults.length
  const hasSearched = searchQuery.trim().length > 0

  return (
    <div className="min-h-screen bg-background pb-8">
      <div className="max-w-7xl mx-auto px-4 pt-8">
        <div className="mb-8 flex justify-center">
          <MenuBar />
        </div>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-6 text-balance">Search Content</h1>

          <div className="relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search for movies, series, or live channels..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-4 h-14 text-lg bg-card/50 backdrop-blur-sm border-border/40 focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
            />
            {isSearching && (
              <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground animate-spin" />
            )}
          </div>
        </div>

        {hasSearched && (
          <div className="mb-4 text-muted-foreground">
            Found {totalResults} result{totalResults !== 1 ? "s" : ""} for "{searchQuery}"
          </div>
        )}

        {hasSearched && totalResults === 0 && !isSearching && (
          <div className="text-center py-16">
            <Search className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">No results found for "{searchQuery}"</p>
            <p className="text-sm text-muted-foreground mt-2">Try searching with different keywords</p>
          </div>
        )}

        {hasSearched && totalResults > 0 && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-6 bg-card/50 backdrop-blur-sm">
              <TabsTrigger value="all">All ({totalResults})</TabsTrigger>
              <TabsTrigger value="movies">Movies ({movieResults.length})</TabsTrigger>
              <TabsTrigger value="series">Series ({seriesResults.length})</TabsTrigger>
              <TabsTrigger value="live">Live TV ({liveResults.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-8">
              {movieResults.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold mb-4">Movies</h2>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-4">
                    {movieResults.slice(0, 16).map((movie) => (
                      <MovieCard
                        key={movie.stream_id}
                        movie={movie}
                        onClick={() => router.push(`/watch/movie/${movie.stream_id}`)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {seriesResults.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold mb-4">Series</h2>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-4">
                    {seriesResults.slice(0, 16).map((series) => (
                      <SeriesCard
                        key={series.series_id}
                        series={series}
                        onClick={() => router.push(`/series/${series.series_id}`)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {liveResults.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold mb-4">Live TV</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {liveResults.slice(0, 12).map((channel) => (
                      <LiveChannelCard
                        key={channel.stream_id}
                        channel={channel}
                        onClick={() => router.push(`/watch/live/${channel.stream_id}`)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="movies">
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-4">
                {movieResults.map((movie) => (
                  <MovieCard
                    key={movie.stream_id}
                    movie={movie}
                    onClick={() => router.push(`/watch/movie/${movie.stream_id}`)}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="series">
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-4">
                {seriesResults.map((series) => (
                  <SeriesCard
                    key={series.series_id}
                    series={series}
                    onClick={() => router.push(`/series/${series.series_id}`)}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="live">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {liveResults.map((channel) => (
                  <LiveChannelCard
                    key={channel.stream_id}
                    channel={channel}
                    onClick={() => router.push(`/watch/live/${channel.stream_id}`)}
                  />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  )
}
