"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import Link from "next/link"
import { useRouter, useParams } from "next/navigation"
import { useXtream } from "@/lib/xtream-context"
import type { VODCategory, VODStream } from "@/types/xtream"
import { MenuBar } from "@/components/menu-bar"
import { ThemeToggle } from "@/components/theme-toggle"
import { MovieCard } from "@/components/movie-card"
import { Loader2, Film, AlertCircle, ArrowLeft } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { SkeletonCard } from "@/components/skeleton-card"

const MOVIES_PER_PAGE = 30

export default function CategoryPage() {
  const router = useRouter()
  const params = useParams()
  const categoryId = params.categoryId as string
  const { api, isConnected } = useXtream()
  const [category, setCategory] = useState<VODCategory | null>(null)
  const [movies, setMovies] = useState<VODStream[]>([])
  const [displayedMovies, setDisplayedMovies] = useState<VODStream[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const loaderRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isConnected && api && categoryId) {
      loadCategoryData()
    }
  }, [isConnected, api, categoryId])

  // Infinite scroll observer
  useEffect(() => {
    if (!loaderRef.current || movies.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && displayedMovies.length < movies.length && !loadingMore) {
          loadMoreMovies()
        }
      },
      { rootMargin: "200px" },
    )

    observer.observe(loaderRef.current)
    return () => observer.disconnect()
  }, [displayedMovies.length, movies.length, loadingMore])

  async function loadCategoryData() {
    if (!api) return

    try {
      setLoading(true)
      setError(null)

      // Load category info
      const categories = await api.getVodCategories()
      const categoryData = categories.find((cat) => cat.category_id === categoryId)
      setCategory(categoryData || null)

      // Load all movies for this category
      const categoryMovies = await api.getVodStreams(categoryId)
      setMovies(categoryMovies)

      // Display first batch
      setDisplayedMovies(categoryMovies.slice(0, MOVIES_PER_PAGE))
    } catch (err) {
      setError("Failed to load category movies. Please check your connection.")
      console.error("[v0] Error loading category:", err)
    } finally {
      setLoading(false)
    }
  }

  const loadMoreMovies = useCallback(() => {
    if (loadingMore || displayedMovies.length >= movies.length) return

    setLoadingMore(true)
    setTimeout(() => {
      const nextBatch = movies.slice(displayedMovies.length, displayedMovies.length + MOVIES_PER_PAGE)
      setDisplayedMovies((prev) => [...prev, ...nextBatch])
      setLoadingMore(false)
    }, 300)
  }, [movies, displayedMovies.length, loadingMore])

  const handleMovieClick = (movie: VODStream) => {
    router.push(`/watch/movie/${movie.stream_id}`)
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background">
        <div className="fixed top-4 right-4 z-50">
          <ThemeToggle />
        </div>
        <div className="container mx-auto px-4 py-8 max-w-[1600px]">
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <Film className="w-20 h-20 mx-auto mb-4 text-muted-foreground/30" />
            <h3 className="text-xl font-semibold mb-2">Not Connected</h3>
            <p className="text-muted-foreground mb-4">Please log in to access movies</p>
            <Link href="/login">
              <Button variant="default">Go to Login</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="fixed top-4 right-4 z-50">
          <ThemeToggle />
        </div>

        <div className="container mx-auto px-4 py-8 max-w-[1600px]">
          <div className="mb-8">
            <MenuBar />
          </div>

          <div className="mb-8">
            <Link href="/movies">
              <Button variant="ghost" size="sm" className="gap-2 mb-4">
                <ArrowLeft className="h-4 w-4" />
                Back to Movies
              </Button>
            </Link>
            <div className="h-9 w-64 bg-muted rounded animate-pulse mb-2" />
            <div className="h-5 w-32 bg-muted rounded animate-pulse" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {[...Array(18)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <div className="container mx-auto px-4 py-8 max-w-[1600px]">
        <div className="mb-8">
          <MenuBar />
        </div>

        <div className="mb-8">
          <Link href="/movies">
            <Button variant="ghost" size="sm" className="gap-2 mb-4">
              <ArrowLeft className="h-4 w-4" />
              Back to Movies
            </Button>
          </Link>
          <h1 className="text-3xl font-bold mb-2">{category?.category_name || "Category"}</h1>
          <p className="text-muted-foreground">
            {movies.length} {movies.length === 1 ? "movie" : "movies"} available
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {displayedMovies.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {displayedMovies.map((movie) => (
                <MovieCard key={movie.stream_id} movie={movie} onClick={() => handleMovieClick(movie)} />
              ))}
            </div>

            {/* Infinite scroll trigger */}
            <div ref={loaderRef} className="flex justify-center py-8">
              {loadingMore && <Loader2 className="w-8 h-8 animate-spin text-primary" />}
              {displayedMovies.length >= movies.length && (
                <p className="text-muted-foreground text-sm">All movies loaded</p>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-20">
            <Film className="w-20 h-20 mx-auto mb-4 text-muted-foreground/30" />
            <h3 className="text-xl font-semibold mb-2">No movies found</h3>
            <p className="text-muted-foreground">This category has no movies</p>
          </div>
        )}
      </div>
    </div>
  )
}
