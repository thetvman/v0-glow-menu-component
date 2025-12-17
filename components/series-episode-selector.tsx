"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useXtream } from "@/lib/xtream-context"
import type { SeriesInfo } from "@/types/xtream"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loader2, Play } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SeriesEpisodeSelectorProps {
  seriesId: number
  open: boolean
  onClose: () => void
}

export function SeriesEpisodeSelector({ seriesId, open, onClose }: SeriesEpisodeSelectorProps) {
  const router = useRouter()
  const { api } = useXtream()
  const [seriesInfo, setSeriesInfo] = useState<SeriesInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedSeason, setSelectedSeason] = useState<string | null>(null)

  useEffect(() => {
    if (open && api) {
      loadSeriesInfo()
    }
  }, [open, seriesId, api])

  const loadSeriesInfo = async () => {
    if (!api) return

    try {
      setLoading(true)
      const info = await api.getSeriesInfo(seriesId)
      setSeriesInfo(info)

      // Select first season by default
      const seasons = Object.keys(info.episodes).sort((a, b) => Number.parseInt(a) - Number.parseInt(b))
      if (seasons.length > 0) {
        setSelectedSeason(seasons[0])
      }
    } catch (err) {
      console.error("[v0] Error loading series info:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleEpisodeClick = (episodeId: string) => {
    router.push(`/watch/series/${seriesId}/${episodeId}`)
    onClose()
  }

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (!seriesInfo) {
    return null
  }

  const seasons = Object.keys(seriesInfo.episodes).sort((a, b) => Number.parseInt(a) - Number.parseInt(b))
  const currentSeasonEpisodes = selectedSeason ? seriesInfo.episodes[selectedSeason] : []

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl">{seriesInfo.info.name}</DialogTitle>
          {seriesInfo.info.plot && <p className="text-sm text-muted-foreground line-clamp-2">{seriesInfo.info.plot}</p>}
        </DialogHeader>

        {/* Season Selector */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {seasons.map((season) => (
            <Button
              key={season}
              variant={selectedSeason === season ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedSeason(season)}
              className="whitespace-nowrap"
            >
              Season {season}
            </Button>
          ))}
        </div>

        {/* Episodes Grid */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 p-1">
            {currentSeasonEpisodes.map((episode) => (
              <button
                key={episode.id}
                onClick={() => handleEpisodeClick(episode.id)}
                className="group relative p-4 rounded-lg border-2 border-border hover:border-primary
                  transition-all hover:scale-105 bg-card text-left"
              >
                {episode.container_extension && (
                  <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm px-1.5 py-0.5 rounded text-[10px] font-medium text-white uppercase z-10">
                    {episode.container_extension}
                  </div>
                )}

                <div
                  className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 
                  transition-opacity rounded-lg flex items-center justify-center"
                >
                  <Play className="w-8 h-8 text-primary" />
                </div>

                <div className="text-sm font-medium mb-1">Episode {episode.episode_num}</div>
                {episode.title && (
                  <div className="text-xs text-muted-foreground line-clamp-2 mb-2">{episode.title}</div>
                )}
                {episode.info.duration && <div className="text-xs text-muted-foreground">{episode.info.duration}</div>}
              </button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
