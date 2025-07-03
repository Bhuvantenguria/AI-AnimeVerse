const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

interface AuthHeaders {
  Authorization?: string
  "Content-Type": string
}

interface MangaResponse {
  data: Array<{
    malId: string
    title: string
    titleEnglish?: string
    titleJapanese?: string
    coverImage: string
    rating: number | null
    chapters: number | null
    volumes: number | null
    status: string
    year: number | null
    genres: Array<{ id: number, name: string }>
    synopsis: string | null
    authors: Array<{ id: number, name: string }>
    isInReadingList?: boolean
    readingStatus?: string
  }>
  pagination: {
    has_next_page: boolean
    current_page: number
    items: {
      count: number
      total: number
      per_page: number
    }
  }
}

interface AnimeResponse {
  data: Array<{
    id: string
    title: string
    titleEnglish?: string
    synopsis: string
    coverImage: string
    bannerImage?: string
    rating: number
    year: number
    status: string
    episodes: Array<{
      id: string
      number: number
      title: string
      thumbnail: string
      duration: number
    }>
    genres: string[]
    source?: string
    isInWatchlist?: boolean
    watchlistStatus?: string
  }>
  pagination: {
    has_next_page: boolean
    current_page: number
    items: {
      count: number
      total: number
      per_page: number
    }
  }
}

interface AnimeDetails {
  id: string
  malId?: number
  title: string
  titleJp?: string
  synopsis: string
  coverImage: string
  bannerImage?: string
  rating: number
  year: number
  status: string
  episodes: Array<{
    id: string
    number: number
    title: string
    thumbnail: string
    duration: number
  }>
  season?: string
  genres: string[]
  studios: string[]
  themes: string[]
  characters: Array<{
    name: string
    nameJp?: string
    description: string
    avatar: string
    personality: string
  }>
  animeProgress?: {
    currentEpisode: number
    totalEpisodes?: number
  }
  watchlistStatus?: {
    status: string
    rating?: number
  }
  streamingInfo?: any
  isInWatchlist: boolean
}

interface StreamingSource {
  url: string
  quality: string
  isM3U8?: boolean
  size?: string
}

interface FallbackLink {
  name: string
  url: string
  type: string
}

interface StreamingResponse {
  type: "stream" | "embed" | "fallback"
  sources?: StreamingSource[]
  url?: string
  links?: FallbackLink[]
  provider?: string
  headers?: Record<string, string>
  subtitles?: Array<{
    lang: string
    language: string
    url: string
  }>
}

class ApiClient {
  private baseURL: string
  private token: string | null = null

  constructor(baseURL: string) {
    this.baseURL = baseURL
  }

  setToken(token: string) {
    this.token = token
  }

  clearToken() {
    this.token = null
  }

  private async getHeaders(): Promise<AuthHeaders> {
    const headers: AuthHeaders = {
      "Content-Type": "application/json",
    }
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`
    }
    return headers
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers = await this.getHeaders()
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }))
      throw new Error(error.message || `API request failed: ${response.statusText}`)
    }

    return response.json()
  }

  // Anime endpoints
  async searchAnime(query = "", page = 1) {
    const params = new URLSearchParams({
      query,
      page: page.toString(),
    })
    return this.request<AnimeResponse>(`/api/anime/search?${params}`)
  }

  async getAnimeById(id: string) {
    return this.request<AnimeDetails>(`/api/anime/${id}`)
  }

  async getEpisodeStream(animeId: string, episodeId: string) {
    try {
      const response = await this.request<StreamingResponse>(`/api/anime/${animeId}/episodes/${episodeId}/stream`)

      // Handle different streaming response types
      if (response.type === "stream" && response.sources && response.sources.length > 0) {
        // Filter and sort sources by quality
        const sources = response.sources
          .filter(source => source.url && source.quality)
          .sort((a, b) => {
            const qualityA = parseInt(a.quality.replace(/[^\d]/g, '')) || 0
            const qualityB = parseInt(b.quality.replace(/[^\d]/g, '')) || 0
            return qualityB - qualityA
          })

        if (sources.length > 0) {
          return {
            ...response,
            sources
          }
        }
      }

      // Return the response as is for embed and fallback types
      return response
    } catch (error) {
      console.error("Streaming API error:", error)
      throw error
    }
  }

  async updateAnimeProgress(animeId: string, episodeId: string, progress: number) {
    return this.request(`/api/anime/${animeId}/progress`, {
      method: "POST",
      body: JSON.stringify({ episodeId, progress }),
    })
  }

  // Manga endpoints
  async getManga(options: {
    page?: number
    limit?: number
    search?: string
    genre?: string
    status?: string
    year?: number
  } = {}) {
    const params = new URLSearchParams()
    
    if (options.search) params.append('search', options.search)
    if (options.page) params.append('page', options.page.toString())
    if (options.limit) params.append('limit', options.limit.toString())
    if (options.genre && options.genre !== 'any') params.append('genre', options.genre)
    if (options.status && options.status !== 'any') params.append('status', options.status)
    if (options.year) params.append('year', options.year.toString())
    
    return this.request<MangaResponse>(`/api/manga?${params}`)
  }

  async searchManga(query = "", page = 1) {
    const params = new URLSearchParams({
      search: query,
      page: page.toString(),
    })
    return this.request<MangaResponse>(`/api/manga?${params}`)
  }

  async getMangaById(id: string) {
    return this.request(`/api/manga/${id}`)
  }

  async getMangaChapters(mangaId: string, page = 1, limit = 50) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    })
    return this.request(`/api/manga/${mangaId}/chapters?${params}`)
  }

  async getChapterPages(mangaId: string, chapterId: string) {
    return this.request(`/api/manga/${mangaId}/chapters/${chapterId}/pages`)
  }

  // User endpoints
  async getProfile() {
    return this.request("/api/user/profile")
  }

  async updateProfile(data: { username?: string; bio?: string; avatar?: string }) {
    return this.request("/api/user/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  // Watchlist endpoints
  async getWatchlist(status?: string, page = 1, limit = 20) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    })
    if (status) {
      params.append("status", status)
    }
    return this.request(`/api/user/watchlist?${params}`)
  }

  async addToWatchlist(animeId: string, status = "plan_to_watch") {
    return this.request("/api/user/watchlist", {
      method: "POST",
      body: JSON.stringify({ animeId, status }),
    })
  }

  async updateWatchlistItem(animeId: string, status: string, rating?: number) {
    return this.request(`/api/user/watchlist/${animeId}`, {
      method: "PUT",
      body: JSON.stringify({ status, rating }),
    })
  }

  async removeFromWatchlist(animeId: string) {
    return this.request(`/api/user/watchlist/${animeId}`, {
      method: "DELETE",
    })
  }

  // Reading list endpoints
  async getReadingList(status?: string, page = 1, limit = 20) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    })
    if (status) {
      params.append("status", status)
    }
    return this.request(`/api/user/reading-list?${params}`)
  }

  async addToReadingList(mangaId: string, status = "plan_to_read") {
    return this.request("/api/user/reading-list", {
      method: "POST",
      body: JSON.stringify({ mangaId, status }),
    })
  }

  async removeFromReadingList(mangaId: string) {
    return this.request(`/api/user/reading-list/${mangaId}`, {
      method: "DELETE",
    })
  }

  async updateReadProgress(mangaId: string, chapterId: string, page: number) {
    return this.request(`/api/user/reading-list/${mangaId}/progress`, {
      method: "PUT",
      body: JSON.stringify({ chapterId, page }),
    })
  }

  // Stats and achievements
  async getUserStats() {
    return this.request("/api/user/stats")
  }

  async getUserAchievements() {
    return this.request("/api/user/achievements")
  }

  async getUserProgress() {
    return this.request("/api/user/progress")
  }
}

const api = new ApiClient(API_BASE_URL)

export default api