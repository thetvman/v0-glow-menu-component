"use client"

import { useState } from "react"
import type { VODStream } from "@/types/xtream"
import { Card, CardContent } from "@/components/ui/card"
import { Play } from "lucide-react"

interface MovieCardProps {
  movie: VODStream
  onClick: () => void
}

export function MovieCard({ movie, onClick }: MovieCardProps) {
  const [imageError, setImageError] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  return (
    <Card
      className="group relative overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 border-0 bg-card"
      onClick={onClick}
    >
      <CardContent className="p-0">
        <div className="relative aspect-[2/3] overflow-hidden bg-muted/50 rounded-lg">
          {movie.stream_icon && !imageError ? (
            <>
              {!imageLoaded && <div className="absolute inset-0 bg-muted animate-pulse" />}
              <img
                src={movie.stream_icon || "/placeholder.svg"}
                alt={movie.name}
                loading="lazy"
                decoding="async"
                fetchPriority="low"
                className={`w-full h-full object-cover transition-opacity duration-300 ${
                  imageLoaded ? "opacity-100" : "opacity-0"
                }`}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
              />
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <Play className="w-12 h-12 text-muted-foreground/30" />
            </div>
          )}

          {movie.container_extension && (
            <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm px-2 py-1 rounded text-xs font-medium text-white uppercase">
              {movie.container_extension}
            </div>
          )}

          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <div className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-full">
              <Play className="w-4 h-4 fill-current" />
              <span className="text-sm font-medium">Play</span>
            </div>
          </div>
        </div>

        <div className="p-2">
          <h3 className="font-medium text-sm line-clamp-2 text-center">{movie.name}</h3>
        </div>
      </CardContent>
    </Card>
  )
}
