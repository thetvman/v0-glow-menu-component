"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useXtream } from "@/lib/xtream-context"
import type { VODCategory, VODStream } from "@/types/xtream"
import { MenuBar } from "@/components/menu-bar"
import { ThemeToggle } from "@/components/theme-toggle"
import { ContentCarousel } from "@/components/content-carousel"
import { MovieCard } from "@/components/movie-card"
import { Film, AlertCircle, ArrowRight } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { SkeletonCarousel } from "@/components/skeleton-carousel"

const INITIAL_MOVIES_PER_CATEGORY = 6
const LOAD_MORE_COUNT = 15

export default function MoviesPage() {
  const router = useRouter()
  const { api, isConnected, availableContent } = useXtream()
  const [categories, setCategories] = useState<VODCategory[]>([])
  const [allMovies, setAllMovies] = useState<VODStream[]>([])
  const [moviesByCategory, setMoviesByCategory] = useState<
    Record<string, { movies: VODStream[]; loaded: number; hasMore: boolean; loading: boolean }>
  >({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isConnected && api) {
      loadCategories()
    } else if (!isConnected) {
      setLoading(false)
    }
  }, [isConnected, api])

  useEffect(() => {
    if (!availableContent.isLoading && isConnected && !availableContent.hasMovies) {
      router.push("/")
    }
  }, [availableContent, isConnected, router])

  async function loadCategories() {
    if (!api) return

    try {
      setLoading(true)
      setError(null)

      console.log("[v0] Fetching movie categories and streams...")
      const [categoriesData, moviesData] = await Promise.all([api.getVodCategories(), api.getVodStreams()])

      console.log("[v0] Movies data loaded:", {
        totalCategories: categoriesData.length,
        totalMovies: moviesData.length,
        sampleMovie: moviesData[0],
      })

      setCategories(categoriesData)
      setAllMovies(moviesData)

      const initialState: Record<string, any> = {}
      categoriesData.forEach((cat) => {
        const categoryMovies = moviesData.filter((m) => m.category_id === cat.category_id)
        console.log(`[v0] Category "${cat.category_name}": ${categoryMovies.length} movies`)
        if (categoryMovies.length > 0) {
          console.log(`[v0] First movie in category:`, {
            name: categoryMovies[0].name,
            stream_icon: categoryMovies[0].stream_icon,
            hasIcon: !!categoryMovies[0].stream_icon,
          })
        }
        initialState[cat.category_id] = {
          movies: categoryMovies.slice(0, INITIAL_MOVIES_PER_CATEGORY),
          loaded: INITIAL_MOVIES_PER_CATEGORY,
          hasMore: categoryMovies.length > INITIAL_MOVIES_PER_CATEGORY,
          loading: false,
        }
      })
      setMoviesByCategory(initialState)
    } catch (err) {
      setError("Failed to load movies. Please check your connection.")
      console.error("[v0] Error loading categories:", err)
    } finally {
      setLoading(false)
    }
  }

  async function loadMoviesForCategory(categoryId: string, limit: number) {
    const currentState = moviesByCategory[categoryId]
    if (currentState?.loading) return

    try {
      setMoviesByCategory((prev) => ({
        ...prev,
        [categoryId]: { ...prev[categoryId], loading: true },
      }))

      const allCategoryMovies = allMovies.filter((m) => m.category_id === categoryId)
      const currentLoaded = currentState?.loaded || 0
      const newMovies = allCategoryMovies.slice(currentLoaded, currentLoaded + limit)
      const hasMore = currentLoaded + limit < allCategoryMovies.length

      setMoviesByCategory((prev) => ({
        ...prev,
        [categoryId]: {
          movies: [...(prev[categoryId]?.movies || []), ...newMovies],
          loaded: currentLoaded + newMovies.length,
          hasMore,
          loading: false,
        },
      }))
    } catch (err) {
      console.error(`[v0] Error loading movies for category ${categoryId}:`, err)
      setMoviesByCategory((prev) => ({
        ...prev,
        [categoryId]: { ...prev[categoryId], loading: false },
      }))
    }
  }

  const handleLoadMore = async (categoryId: string) => {
    const state = moviesByCategory[categoryId]

    if (!state?.hasMore || state.loading) {
      return
    }

    await loadMoviesForCategory(categoryId, LOAD_MORE_COUNT)
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

          <div className="space-y-6">
            <SkeletonCarousel />
            <SkeletonCarousel />
            <SkeletonCarousel />
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
              const state = moviesByCategory[category.category_id]
              if (!state) return null

              return (
                <div key={category.category_id}>
                  <ContentCarousel
                    title={category.category_name}
                    itemCount={state.movies.length}
                    hasMore={state.hasMore}
                    loading={state.loading}
                    onLoadMore={() => handleLoadMore(category.category_id)}
                    actionButton={
                      <Link href={`/movies/category/${category.category_id}`}>
                        <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground hover:text-foreground">
                          View All
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    }
                  >
                    {state.movies.map((movie) => (
                      <div key={movie.stream_id} className="flex-shrink-0 w-[150px] sm:w-[180px] md:w-[200px]">
                        <MovieCard movie={movie} onClick={() => handleMovieClick(movie)} />
                      </div>
                    ))}
                  </ContentCarousel>
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
