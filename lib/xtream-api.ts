// IPTV Xtream Protocol API Parser
// This module handles all Xtream API interactions for live streams, VOD, and series

export interface XtreamCredentials {
  username: string
  password: string
  baseUrl: string
}

export interface LiveStream {
  num: number
  name: string
  stream_type: string
  stream_id: number
  stream_icon: string
  epg_channel_id: string
  added: string
  category_id: string
  category_name: string
  custom_sid: string
  tv_archive: number
  direct_source: string
  tv_archive_duration: number
}

export interface Category {
  category_id: string
  category_name: string
  parent_id: number
}

export interface VodStream {
  num: number
  name: string
  stream_type: string
  stream_id: number
  stream_icon: string
  rating: string
  rating_5based: number
  added: string
  category_id: string
  container_extension: string
  custom_sid: string
  direct_source: string
}

export interface VodInfo {
  info: {
    tmdb_id: string
    name: string
    cover: string
    plot: string
    cast: string
    director: string
    genre: string
    releaseDate: string
    last_modified: string
    rating: string
    rating_5based: number
    backdrop_path: string[]
    youtube_trailer: string
    duration: string
    video: {
      index: number
      codec_name: string
      codec_long_name: string
      profile: string
      codec_type: string
      width: number
      height: number
    }
    audio: {
      index: number
      codec_name: string
      codec_long_name: string
      profile: string
      codec_type: string
    }
    bitrate: number
  }
  movie_data: {
    stream_id: number
    name: string
    added: string
    category_id: string
    container_extension: string
    custom_sid: string
    direct_source: string
  }
}

export interface Series {
  num: number
  name: string
  series_id: number
  cover: string
  plot: string
  cast: string
  director: string
  genre: string
  releaseDate: string
  last_modified: string
  rating: string
  rating_5based: number
  backdrop_path: string[]
  youtube_trailer: string
  episode_run_time: string
  category_id: string
}

export interface SeriesInfo {
  seasons: {
    air_date: string
    episode_count: number
    id: number
    name: string
    overview: string
    season_number: number
    cover: string
    cover_tmdb: string
  }[]
  info: {
    name: string
    cover: string
    plot: string
    cast: string
    director: string
    genre: string
    releaseDate: string
    last_modified: string
    rating: string
    rating_5based: number
    backdrop_path: string[]
    youtube_trailer: string
    episode_run_time: string
    category_id: string
  }
  episodes: {
    [season: string]: {
      id: string
      episode_num: number
      title: string
      container_extension: string
      info: {
        tmdb_id: string
        releasedate: string
        plot: string
        duration_secs: number
        duration: string
        video: object
        audio: object
        bitrate: number
        rating: string
      }
      custom_sid: string
      added: string
      season: number
      direct_source: string
    }[]
  }
}

export class XtreamAPI {
  private credentials: XtreamCredentials

  constructor(credentials: XtreamCredentials) {
    this.credentials = credentials
  }

  private async apiRequest(action: string, params?: Record<string, string | number>): Promise<any> {
    // Try server-side proxy first
    try {
      const response = await fetch("/api/xtream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          credentials: this.credentials,
          params: params || {},
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        // If we get a 511, try direct client-side request as fallback
        if (response.status === 511) {
          console.log("[v0] Server proxy blocked with 511, trying direct client request...")
          return this.directApiRequest(action, params)
        }
        throw new Error(error.error || "Failed to fetch from IPTV service")
      }

      return response.json()
    } catch (error) {
      console.error("[v0] API request failed:", error)
      throw error
    }
  }

  private async directApiRequest(action: string, params?: Record<string, string | number>): Promise<any> {
    const { username, password, baseUrl } = this.credentials

    const urlParams = new URLSearchParams({
      username,
      password,
      action,
      ...(params as Record<string, string>),
    })

    const url = `${baseUrl}/player_api.php?${urlParams.toString()}`

    const response = await fetch(url, {
      method: "GET",
      mode: "cors",
    })

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`)
    }

    return response.json()
  }

  // LIVE STREAMS
  async getLiveStreams(categoryId?: string): Promise<LiveStream[]> {
    return this.apiRequest("get_live_streams", categoryId ? { category_id: categoryId } : undefined)
  }

  async getLiveCategories(): Promise<Category[]> {
    return this.apiRequest("get_live_categories")
  }

  // VOD / MOVIES
  async getVodStreams(categoryId?: string): Promise<VodStream[]> {
    return this.apiRequest("get_vod_streams", categoryId ? { category_id: categoryId } : undefined)
  }

  async getVodCategories(): Promise<Category[]> {
    return this.apiRequest("get_vod_categories")
  }

  async getVodInfo(vodId: number): Promise<VodInfo> {
    return this.apiRequest("get_vod_info", { vod_id: vodId })
  }

  // SERIES
  async getSeries(categoryId?: string): Promise<Series[]> {
    return this.apiRequest("get_series", categoryId ? { category_id: categoryId } : undefined)
  }

  async getSeriesCategories(): Promise<Category[]> {
    return this.apiRequest("get_series_categories")
  }

  async getSeriesInfo(seriesId: number): Promise<SeriesInfo> {
    return this.apiRequest("get_series_info", { series_id: seriesId })
  }

  // STREAM URL BUILDERS
  getLiveStreamUrl(streamId: number, extension = "m3u8"): string {
    const { username, password, baseUrl } = this.credentials
    return `${baseUrl}/live/${username}/${password}/${streamId}.${extension}`
  }

  getVodStreamUrl(streamId: number, extension = "mp4"): string {
    const { username, password, baseUrl } = this.credentials
    return `${baseUrl}/movie/${username}/${password}/${streamId}.${extension}`
  }

  getSeriesStreamUrl(streamId: number, extension = "mp4"): string {
    const { username, password, baseUrl } = this.credentials
    return `${baseUrl}/series/${username}/${password}/${streamId}.${extension}`
  }
}
