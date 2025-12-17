export interface VODCategory {
  category_id: string
  category_name: string
  parent_id: number
}

export interface VODStream {
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

export interface VODInfo {
  info: {
    movie_image: string
    tmdb_id: string
    name: string
    o_name: string
    cover_big: string
    releasedate: string
    youtube_trailer: string
    director: string
    actors: string
    cast: string
    description: string
    plot: string
    age: string
    duration: string
    duration_secs: number
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
    rating: string
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

export interface SeriesCategory {
  category_id: string
  category_name: string
  parent_id: number
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
  seasons: Array<{
    air_date: string
    episode_count: number
    id: number
    name: string
    overview: string
    season_number: number
    cover: string
    cover_big: string
  }>
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
    [seasonNumber: string]: Array<{
      id: string
      episode_num: number
      title: string
      container_extension: string
      info: {
        movie_image: string
        plot: string
        duration: string
        duration_secs: number
        video: any
        audio: any
        bitrate: number
        rating: string
      }
    }>
  }
}
