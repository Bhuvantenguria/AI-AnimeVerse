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
    return this.request(`/api/anime/${id}`)
  }

  async getTrendingAnime() {
    return this.request<AnimeResponse>(`/api/anime/trending`)
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
    
    if (options.search) params.append('q', options.search)
    if (options.page) params.append('page', options.page.toString())
    if (options.limit) params.append('limit', options.limit.toString())
    if (options.genre && options.genre !== 'any') params.append('genre', options.genre)
    if (options.status && options.status !== 'any') params.append('status', options.status)
    if (options.year) params.append('year', options.year.toString())
    
    return this.request<MangaResponse>(`/api/manga?${params}`)
  }

  async searchManga(query = "", page = 1) {
    const params = new URLSearchParams({
      q: query,
      page: page.toString(),
    })
    return this.request<MangaResponse>(`/api/manga?${params}`)
  }

  async getTrendingManga() {
    return this.request<MangaResponse>(`/api/manga/trending`)
  }

  async getMangaById(id: string) {
    return this.request(`/api/manga/${id}`)
  }

  async getChapterContent(mangaId: string, chapterNumber: string) {
    return this.request(`/api/manga/${mangaId}/chapters/${chapterNumber}`)
  }

  // Dashboard endpoints
  async getDashboardTrending() {
    return this.request(`/api/dashboard/trending`)
  }
}

const api = new ApiClient(API_BASE_URL)

export default api 