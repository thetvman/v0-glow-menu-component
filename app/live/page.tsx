"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { MenuBar } from "@/components/menu-bar"
import { ThemeToggle } from "@/components/theme-toggle"
import { LiveChannelCard } from "@/components/live-channel-card"
import { useXtream } from "@/lib/xtream-context"
import { Button } from "@/components/ui/button"
import { Loader2, ChevronRight, Radio } from "lucide-react"
import Link from "next/link"

interface LiveCategory {
  category_id: string
  category_name: string
  parent_id: number
}

interface LiveStream {
  num: number
  name: string
  stream_type: string
  stream_id: number
  stream_icon: string
  epg_channel_id: string
  added: string
  is_adult: string
  category_id: string
  custom_sid: string
  tv_archive: number
  direct_source: string
  tv_archive_duration: number
}

export default function LivePage() {
  const router = useRouter()
  const { isConnected, api } = useXtream()
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<LiveCategory[]>([])
  const [streamsByCategory, setStreamsByCategory] = useState<Record<string, LiveStream[]>>({})
  const [displayedCountByCategory, setDisplayedCountByCategory] = useState<Record<string, number>>({})

  useEffect(() => {
    if (isConnected && api) {
      loadData()
    }
  }, [isConnected, api])

  async function loadData() {
    if (!api) return

    try {
      setLoading(true)
      const [categoriesData, streamsData] = await Promise.all([api.getLiveCategories(), api.getLiveStreams()])

      setCategories(categoriesData)

      const grouped = streamsData.reduce(
        (acc, stream) => {
          const catId = stream.category_id
          if (!acc[catId]) {
            acc[catId] = []
          }
          acc[catId].push(stream)
          return acc
        },
        {} as Record<string, LiveStream[]>,
      )

      setStreamsByCategory(grouped)

      const initialCounts: Record<string, number> = {}
      categoriesData.forEach((cat) => {
        initialCounts[cat.category_id] = 20
      })
      setDisplayedCountByCategory(initialCounts)
    } catch (err) {
      console.error("Error loading live channels:", err)
    } finally {
      setLoading(false)
    }
  }

  const loadMoreForCategory = (categoryId: string) => {
    setDisplayedCountByCategory((prev) => ({
      ...prev,
      [categoryId]: (prev[categoryId] || 20) + 20,
    }))
  }

  const handleChannelClick = (channel: LiveStream) => {
    router.push(`/watch/live/${channel.stream_id}`)
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background">
        <div className="absolute top-4 right-4 z-50">
          <ThemeToggle />
        </div>
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <Radio className="w-20 h-20 mx-auto mb-4 text-muted-foreground/30" />
            <h3 className="text-xl font-semibold mb-2">Not Connected</h3>
            <p className="text-muted-foreground mb-4">Please log in to access live TV</p>
            <Link href="/login">
              <Button variant="default" className="gap-2">
                Go to Login
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex justify-center">
          <MenuBar />
        </div>

        <h1 className="text-4xl font-bold mb-8">Live TV</h1>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">Loading channels...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-12">
            {categories.map((category) => {
              const streams = streamsByCategory[category.category_id] || []
              const displayCount = displayedCountByCategory[category.category_id] || 20
              const visibleStreams = streams.slice(0, displayCount)
              const hasMore = displayCount < streams.length

              if (streams.length === 0) return null

              return (
                <div key={category.category_id} className="space-y-4">
                  <h2 className="text-2xl font-semibold">{category.category_name}</h2>
                  <div className="relative">
                    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                      {visibleStreams.map((stream) => (
                        <LiveChannelCard
                          key={stream.stream_id}
                          channel={stream}
                          onClick={() => handleChannelClick(stream)}
                        />
                      ))}
                      {hasMore && (
                        <div className="min-w-[160px] flex items-center justify-center">
                          <Button
                            variant="outline"
                            size="lg"
                            onClick={() => loadMoreForCategory(category.category_id)}
                            className="h-[240px] w-full flex flex-col gap-2"
                          >
                            <ChevronRight className="w-8 h-8" />
                            <span className="text-sm">
                              Load More
                              <br />({displayCount} of {streams.length})
                            </span>
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
