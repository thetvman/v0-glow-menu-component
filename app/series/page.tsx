"use client"

import { useEffect, useState, useMemo } from "react"
import Link from "next/link"
import { useXtream } from "@/lib/xtream-context"
import type { SeriesCategory, Series } from "@/types/xtream"
import { MenuBar } from "@/components/menu-bar"
import { ThemeToggle } from "@/components/theme-toggle"
import { ContentCarousel } from "@/components/content-carousel"
import { SeriesCard } from "@/components/series-card"
import { SeriesEpisodeSelector } from "@/components/series-episode-selector"
import { Loader2, Tv, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { getOptimalItemsPerPage } from "@/lib/performance-utils"

export default function SeriesPage() {
  const { api, isConnected } = useXtream()
  const [categories, setCategories] = useState<SeriesCategory[]>([])
  const [seriesByCategory, setSeriesByCategory] = useState<Map<string, Series[]>>(new Map())
  const [categoryPages, setCategoryPages] = useState<Map<string, number>>(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [allSeries, setAllSeries] = useState<Series[]>([])
  const [selectedSeriesId, setSelectedSeriesId] = useState<number | null>(null)
  const [showEpisodeSelector, setShowEpisodeSelector] = useState(false)

  const ITEMS_PER_PAGE = useMemo(() => getOptimalItemsPerPage(), [])

  useEffect(() => {
    if (isConnected && api) {
      loadData()
    } else if (!isConnected) {
      setLoading(false)
    }
  }, [isConnected, api])

  async function loadData() {
    if (!api) return

    try {
      setLoading(true)
      setError(null)

      const [categoriesData, seriesData] = await Promise.all([api.getSeriesCategories(), api.getSeries()])

      setCategories(categoriesData)
      setAllSeries(seriesData)

      const seriesMap = new Map<string, Series[]>()
      const pageMap = new Map<string, number>()

      categoriesData.forEach((category) => {
        const categorySeries = seriesData.filter((s) => s.category_id === category.category_id)
        seriesMap.set(category.category_id, categorySeries.slice(0, ITEMS_PER_PAGE))
        pageMap.set(category.category_id, 1)
      })

      setSeriesByCategory(seriesMap)
      setCategoryPages(pageMap)
    } catch (err) {
      setError("Failed to load series. Please check your connection.")
      console.error("Error loading series:", err)
    } finally {
      setLoading(false)
    }
  }

  const loadMoreForCategory = (categoryId: string) => {
    const currentPage = categoryPages.get(categoryId) || 1
    const nextPage = currentPage + 1
    const categorySeries = allSeries.filter((s) => s.category_id === categoryId)
    const currentSeries = seriesByCategory.get(categoryId) || []

    const startIdx = currentPage * ITEMS_PER_PAGE
    const endIdx = nextPage * ITEMS_PER_PAGE
    const newSeries = categorySeries.slice(startIdx, endIdx)

    if (newSeries.length > 0) {
      setSeriesByCategory(new Map(seriesByCategory).set(categoryId, [...currentSeries, ...newSeries]))
      setCategoryPages(new Map(categoryPages).set(categoryId, nextPage))
    }
  }

  const handleSeriesClick = (selectedSeries: Series) => {
    setSelectedSeriesId(selectedSeries.series_id)
    setShowEpisodeSelector(true)
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background">
        <div className="fixed top-4 right-4 z-50">
          <ThemeToggle />
        </div>
        <div className="container mx-auto px-4 py-8 max-w-[1600px]">
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <Tv className="w-20 h-20 mx-auto mb-4 text-muted-foreground/30" />
            <h3 className="text-xl font-semibold mb-2">Not Connected</h3>
            <p className="text-muted-foreground mb-4">Please log in to access series</p>
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="fixed top-4 right-4 z-50">
          <ThemeToggle />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading series...</p>
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
          <h1 className="text-3xl font-bold mb-2">Series</h1>
          <p className="text-muted-foreground">Explore TV shows and series</p>
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
              const categorySeries = seriesByCategory.get(category.category_id) || []
              const totalCategorySeries = allSeries.filter((s) => s.category_id === category.category_id).length
              const hasMore = categorySeries.length < totalCategorySeries

              if (totalCategorySeries === 0) return null

              return (
                <div key={category.category_id}>
                  <ContentCarousel title={category.category_name} itemCount={categorySeries.length}>
                    {categorySeries.map((series) => (
                      <div key={series.series_id} className="flex-shrink-0 w-[150px] sm:w-[180px] md:w-[200px]">
                        <SeriesCard series={series} onClick={() => handleSeriesClick(series)} />
                      </div>
                    ))}
                  </ContentCarousel>
                  {hasMore && (
                    <div className="mt-4 text-center">
                      <button
                        onClick={() => loadMoreForCategory(category.category_id)}
                        className="px-6 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors"
                      >
                        Load More ({categorySeries.length} of {totalCategorySeries})
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-20">
            <Tv className="w-20 h-20 mx-auto mb-4 text-muted-foreground/30" />
            <h3 className="text-xl font-semibold mb-2">No series found</h3>
            <p className="text-muted-foreground">No series available</p>
          </div>
        )}
      </div>

      {selectedSeriesId && (
        <SeriesEpisodeSelector
          seriesId={selectedSeriesId}
          open={showEpisodeSelector}
          onClose={() => {
            setShowEpisodeSelector(false)
            setSelectedSeriesId(null)
          }}
        />
      )}
    </div>
  )
}
