"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Play, Star } from "lucide-react"
import { getPosterUrl } from "@/lib/tmdb-api"
import type { TMDBMovie } from "@/lib/tmdb-api"

interface TMDBMovieCardProps {
  movie: TMDBMovie
  onClick?: () => void
}

export function TMDBMovieCard({ movie, onClick }: TMDBMovieCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const router = useRouter()

  const handleClick = () => {
    if (onClick) {
      onClick()
      return
    }

    console.log(`[v0] Selected TMDB movie: ${movie.title} - navigating to search`)
    router.push(`/search?q=${encodeURIComponent(movie.title)}`)
  }

  return (
    <Card
      className="group relative overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 border-0 bg-card"
      onClick={handleClick}
    >
      <CardContent className="p-0">
        <div className="relative aspect-[2/3] overflow-hidden bg-muted/50 rounded-lg">
          {!imageLoaded && <div className="absolute inset-0 bg-muted animate-pulse" />}
          <img
            src={getPosterUrl(movie.poster_path, "w342") || "/placeholder.svg"}
            alt={movie.title}
            loading="lazy"
            decoding="async"
            fetchPriority="low"
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              imageLoaded ? "opacity-100" : "opacity-0"
            }`}
            onLoad={() => setImageLoaded(true)}
          />

          {movie.vote_average > 0 && (
            <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-sm px-2 py-1 rounded flex items-center gap-1">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span className="text-xs font-medium text-white">{movie.vote_average.toFixed(1)}</span>
            </div>
          )}

          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <div className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-full">
              <Play className="w-4 h-4 fill-current" />
              <span className="text-sm font-medium">Search</span>
            </div>
          </div>
        </div>

        <div className="p-2">
          <h3 className="font-medium text-sm line-clamp-2 text-center">{movie.title}</h3>
          {movie.release_date && (
            <p className="text-xs text-muted-foreground text-center mt-1">{movie.release_date.split("-")[0]}</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
