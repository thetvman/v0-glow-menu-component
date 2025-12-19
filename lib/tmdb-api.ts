import { cache } from "react"

const TMDB_API_KEY = "0fd8ade0f772180c8f8d651787c35e14"
const TMDB_BASE_URL = "https://api.themoviedb.org/3"
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p"

export interface TMDBMovie {
  id: number
  title: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  release_date: string
  vote_average: number
  vote_count: number
  genre_ids: number[]
  popularity: number
}

export interface TMDBSeries {
  id: number
  name: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  first_air_date: string
  vote_average: number
  vote_count: number
  genre_ids: number[]
  popularity: number
}

export interface TMDBMovieDetails extends TMDBMovie {
  runtime: number
  genres: { id: number; name: string }[]
  tagline: string
  status: string
  budget: number
  revenue: number
}

async function fetchTMDB(endpoint: string) {
  const url = `${TMDB_BASE_URL}${endpoint}${endpoint.includes("?") ? "&" : "?"}api_key=${TMDB_API_KEY}`

  try {
    const response = await fetch(url, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    })

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error("[v0] TMDB API fetch error:", error)
    throw error
  }
}

// Get trending movies (daily or weekly)
export const getTrendingMovies = cache(async (timeWindow: "day" | "week" = "week"): Promise<TMDBMovie[]> => {
  const data = await fetchTMDB(`/trending/movie/${timeWindow}`)
  return data.results || []
})

// Get popular movies
export const getPopularMovies = cache(async (): Promise<TMDBMovie[]> => {
  const data = await fetchTMDB("/movie/popular")
  return data.results || []
})

// Get trending TV series
export const getTrendingSeries = cache(async (timeWindow: "day" | "week" = "week"): Promise<TMDBSeries[]> => {
  const data = await fetchTMDB(`/trending/tv/${timeWindow}`)
  return data.results || []
})

// Get popular TV series
export const getPopularSeries = cache(async (): Promise<TMDBSeries[]> => {
  const data = await fetchTMDB("/tv/popular")
  return data.results || []
})

// Search for a movie by title
export const searchMovie = cache(async (title: string): Promise<TMDBMovie[]> => {
  const data = await fetchTMDB(`/search/movie?query=${encodeURIComponent(title)}`)
  return data.results || []
})

// Search for a TV series by name
export const searchSeries = cache(async (name: string): Promise<TMDBSeries[]> => {
  const data = await fetchTMDB(`/search/tv?query=${encodeURIComponent(name)}`)
  return data.results || []
})

// Get movie details by TMDB ID
export const getMovieDetails = cache(async (tmdbId: number): Promise<TMDBMovieDetails | null> => {
  try {
    const data = await fetchTMDB(`/movie/${tmdbId}`)
    return data
  } catch (error) {
    return null
  }
})

// Helper to get poster URL
export function getPosterUrl(path: string | null, size: "w185" | "w342" | "w500" | "original" = "w342"): string {
  if (!path) return "/placeholder.svg?height=500&width=342"
  return `${TMDB_IMAGE_BASE}/${size}${path}`
}

// Helper to get backdrop URL
export function getBackdropUrl(path: string | null, size: "w780" | "w1280" | "original" = "w1280"): string {
  if (!path) return "/placeholder.svg?height=720&width=1280"
  return `${TMDB_IMAGE_BASE}/${size}${path}`
}

// Match IPTV movie with TMDB data
export async function matchMovieWithTMDB(title: string, year?: string): Promise<TMDBMovie | null> {
  try {
    const results = await searchMovie(title)

    if (results.length === 0) return null

    // If we have a year, try to find exact match
    if (year) {
      const exactMatch = results.find((movie) => {
        const movieYear = movie.release_date?.split("-")[0]
        return movieYear === year
      })
      if (exactMatch) return exactMatch
    }

    // Return first result (usually most relevant)
    return results[0]
  } catch (error) {
    console.error("[v0] Error matching movie with TMDB:", error)
    return null
  }
}
