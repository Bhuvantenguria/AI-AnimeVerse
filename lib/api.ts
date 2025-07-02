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
    episodes: number
    genres: string[]
    source?: string
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
    return this.request<AnimeResponse["data"][0]>(`/api/anime/${id}`)
  }

  async getEpisodeStream(animeId: string, episodeId: string) {
    const response = await this.request<{
      sources: Array<{
        url: string
        quality: string
        isM3U8?: boolean
      }>
      headers?: Record<string, string>
    }>(`/api/anime/${animeId}/episodes/${episodeId}/stream`)

    if (!response.sources?.length) {
      throw new Error("No streaming sources available")
    }

    // Filter and sort sources by quality
    const sources = response.sources
      .filter(source => source.url && source.quality)
      .sort((a, b) => {
        const qualityA = parseInt(a.quality.replace(/[^\d]/g, '')) || 0
        const qualityB = parseInt(b.quality.replace(/[^\d]/g, '')) || 0
        return qualityB - qualityA
      })

    if (!sources.length) {
      throw new Error("No valid streaming sources found")
    }

    return {
      sources,
      headers: response.headers || {}
    }
  }

  // Manga endpoints
  async searchManga(query = "", page = 1) {
    const params = new URLSearchParams({
      query,
      page: page.toString(),
    })
    return this.request<MangaResponse>(`/api/manga/search?${params}`)
  }

  async getMangaById(id: string) {
    return this.request<MangaResponse["data"][0]>(`/api/manga/${id}`)
  }

  async getChapterPages(mangaId: string, chapterId: string) {
    return this.request<{
      pages: Array<{ url: string }>
    }>(`/api/manga/${mangaId}/chapters/${chapterId}`)
  }

  // User endpoints
  async addToWatchlist(animeId: string) {
    return this.request(`/api/user/watchlist/${animeId}`, {
      method: "POST",
    })
  }

  async addToReadingList(mangaId: string) {
    return this.request(`/api/user/reading-list/${mangaId}`, {
      method: "POST",
    })
  }

  async updateWatchProgress(animeId: string, episodeId: string, progress: number) {
    return this.request(`/api/anime/${animeId}/episodes/${episodeId}/progress`, {
      method: "POST",
      body: JSON.stringify({ progress }),
    })
  }

  async updateReadProgress(mangaId: string, chapterId: string, page: number) {
    return this.request(`/api/manga/${mangaId}/chapters/${chapterId}/progress`, {
      method: "POST",
      body: JSON.stringify({ page }),
    })
  }
}

const api = new ApiClient(API_BASE_URL)
export default api