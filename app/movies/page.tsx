"use client"

import { useEffect, useState, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useXtream } from "@/lib/xtream-context"
import type { VODCategory, VODStream } from "@/types/xtream"
import { MenuBar } from "@/components/menu-bar"
import { ThemeToggle } from "@/components/theme-toggle"
import { ContentCarousel } from "@/components/content-carousel"
import { MovieCard } from "@/components/movie-card"
import { Loader2, Film, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { getOptimalItemsPerPage } from "@/lib/performance-utils"

const ITEMS_PER_PAGE = 20

export default function MoviesPage() {
  const router = useRouter()
  const { api, isConnected, availableContent } = useXtream()
  const [categories, setCategories] = useState<VODCategory[]>([])
  const [moviesByCategory, setMoviesByCategory] = useState<Map<string, VODStream[]>>(new Map())
  const [categoryPages, setCategoryPages] = useState<Map<string, number>>(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [allMovies, setAllMovies] = useState<VODStream[]>([])

  const adaptiveITEMS_PER_PAGE = useMemo(() => getOptimalItemsPerPage(), [])

  useEffect(() => {
    if (isConnected && api) {
      loadData()
    } else if (!isConnected) {
      setLoading(false)
    }
  }, [isConnected, api])

  useEffect(() => {
    if (!availableContent.isLoading && isConnected && !availableContent.hasMovies) {
      router.push("/")
    }
  }, [availableContent, isConnected, router])

  async function loadData() {
    if (!api) return

    try {
      setLoading(true)
      setError(null)

      const [categoriesData, moviesData] = await Promise.all([api.getVodCategories(), api.getVodStreams()])

      setCategories(categoriesData)
      setAllMovies(moviesData)

      const movieMap = new Map<string, VODStream[]>()
      const pageMap = new Map<string, number>()

      categoriesData.forEach((category) => {
        const categoryMovies = moviesData.filter((m) => m.category_id === category.category_id)
        movieMap.set(category.category_id, categoryMovies.slice(0, adaptiveITEMS_PER_PAGE))
        pageMap.set(category.category_id, 1)
      })

      setMoviesByCategory(movieMap)
      setCategoryPages(pageMap)
    } catch (err) {
      setError("Failed to load movies. Please check your connection.")
      console.error("Error loading movies:", err)
    } finally {
      setLoading(false)
    }
  }

  const loadMoreForCategory = (categoryId: string) => {
    const currentPage = categoryPages.get(categoryId) || 1
    const nextPage = currentPage + 1
    const categoryMovies = allMovies.filter((m) => m.category_id === categoryId)
    const currentMovies = moviesByCategory.get(categoryId) || []

    const startIdx = currentPage * adaptiveITEMS_PER_PAGE
    const endIdx = nextPage * adaptiveITEMS_PER_PAGE
    const newMovies = categoryMovies.slice(startIdx, endIdx)

    if (newMovies.length > 0) {
      setMoviesByCategory(new Map(moviesByCategory).set(categoryId, [...currentMovies, ...newMovies]))
      setCategoryPages(new Map(categoryPages).set(categoryId, nextPage))
    }
  }

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
              <Button variant="default" className="gap-2">
                Go to Login
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!availableContent.isLoading && !availableContent.hasMovies) {
    return (
      <div className="min-h-screen bg-background">
        <div className="fixed top-4 right-4 z-50">
          <ThemeToggle />
        </div>
        <div className="container mx-auto px-4 py-8 max-w-[1600px]">
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <Film className="w-20 h-20 mx-auto mb-4 text-muted-foreground/30" />
            <h3 className="text-xl font-semibold mb-2">Movies Not Available</h3>
            <p className="text-muted-foreground mb-4">Your playlist does not include movies</p>
            <Link href="/">
              <Button variant="default" className="gap-2">
                Go to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (loading || availableContent.isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="fixed top-4 right-4 z-50">
          <ThemeToggle />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading movies...</p>
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
          <h1 className="text-3xl font-bold mb-2">Movies</h1>
          <p className="text-muted-foreground">Browse and discover your favorite films</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {categories.length > 0 ? (
          <div className="space-y-6">
            {categories.map((category) => {
              const categoryMovies = moviesByCategory.get(category.category_id) || []
              const totalCategoryMovies = allMovies.filter((m) => m.category_id === category.category_id).length
              const hasMore = categoryMovies.length < totalCategoryMovies

              if (totalCategoryMovies === 0) return null

              return (
                <div key={category.category_id}>
                  <ContentCarousel title={category.category_name} itemCount={categoryMovies.length}>
                    {categoryMovies.map((movie) => (
                      <div key={movie.stream_id} className="flex-shrink-0 w-[150px] sm:w-[180px] md:w-[200px]">
                        <MovieCard movie={movie} onClick={() => handleMovieClick(movie)} />
                      </div>
                    ))}
                  </ContentCarousel>
                  {hasMore && (
                    <div className="mt-4 text-center">
                      <button
                        onClick={() => loadMoreForCategory(category.category_id)}
                        className="px-6 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors"
                      >
                        Load More ({categoryMovies.length} of {totalCategoryMovies})
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-20">
            <Film className="w-20 h-20 mx-auto mb-4 text-muted-foreground/30" />
            <h3 className="text-xl font-semibold mb-2">No movies found</h3>
            <p className="text-muted-foreground">No movies available</p>
          </div>
        )}
      </div>
    </div>
  )
}
