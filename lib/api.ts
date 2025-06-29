const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

class ApiClient {
  private baseURL: string

  constructor(baseURL: string) {
    this.baseURL = baseURL
  }

  private async getAuthHeaders() {
    try {
      const { getToken } = await import("@clerk/nextjs")
      const token = await getToken()
      return token ? { Authorization: `Bearer ${token}` } : {}
    } catch {
      return {}
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`
    const authHeaders = await this.getAuthHeaders()

    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Network error" }))
      throw new Error(error.error || `HTTP ${response.status}`)
    }

    return response.json()
  }

  // Anime API methods
  async getAnime(
    params: {
      page?: number
      limit?: number
      genre?: string
      status?: string
      year?: number
      search?: string
    } = {},
  ) {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString())
      }
    })

    return this.request(`/api/anime?${searchParams}`)
  }

  async getAnimeById(id: string) {
    return this.request(`/api/anime/${id}`)
  }

  async getTrendingAnime() {
    return this.request("/api/anime/trending/now")
  }

  async addToWatchlist(animeId: string, status = "watching", rating?: number) {
    return this.request(`/api/anime/${animeId}/watchlist`, {
      method: "POST",
      body: JSON.stringify({ status, rating }),
    })
  }

  async removeFromWatchlist(animeId: string) {
    return this.request(`/api/anime/${animeId}/watchlist`, {
      method: "DELETE",
    })
  }

  async updateAnimeProgress(animeId: string, currentEpisode: number, totalEpisodes?: number) {
    return this.request(`/api/anime/${animeId}/progress`, {
      method: "POST",
      body: JSON.stringify({ currentEpisode, totalEpisodes }),
    })
  }

  // Manga API methods
  async getManga(
    params: {
      page?: number
      limit?: number
      genre?: string
      status?: string
      year?: number
      search?: string
    } = {},
  ) {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString())
      }
    })

    return this.request(`/api/manga?${searchParams}`)
  }

  async getMangaById(id: string) {
    return this.request(`/api/manga/${id}`)
  }

  async getMangaChapters(mangaId: string, page = 1, limit = 50) {
    return this.request(`/api/manga/${mangaId}/chapters?page=${page}&limit=${limit}`)
  }

  async getChapterContent(mangaId: string, chapterNumber: string) {
    return this.request(`/api/manga/${mangaId}/chapters/${chapterNumber}`)
  }

  async addToReadingList(mangaId: string, status = "reading", rating?: number) {
    return this.request(`/api/manga/${mangaId}/reading-list`, {
      method: "POST",
      body: JSON.stringify({ status, rating }),
    })
  }

  async updateMangaProgress(mangaId: string, currentChapter: number, currentPage?: number, totalChapters?: number) {
    return this.request(`/api/manga/${mangaId}/progress`, {
      method: "POST",
      body: JSON.stringify({ currentChapter, currentPage, totalChapters }),
    })
  }

  // Chat API methods
  async startChatSession(characterId: string) {
    return this.request("/api/chat/start", {
      method: "POST",
      body: JSON.stringify({ characterId }),
    })
  }

  async sendMessage(sessionId: string, message: string) {
    return this.request("/api/chat/message", {
      method: "POST",
      body: JSON.stringify({ sessionId, message }),
    })
  }

  async getChatHistory(sessionId: string) {
    return this.request(`/api/chat/history/${sessionId}`)
  }

  async getChatSessions() {
    return this.request("/api/chat/sessions")
  }

  async deleteChatSession(sessionId: string) {
    return this.request(`/api/chat/sessions/${sessionId}`, {
      method: "DELETE",
    })
  }

  async getChatCharacters(
    params: {
      search?: string
      animeId?: string
      mangaId?: string
      page?: number
      limit?: number
    } = {},
  ) {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString())
      }
    })

    return this.request(`/api/chat/characters?${searchParams}`)
  }

  async getCharacterDetails(characterId: string) {
    return this.request(`/api/chat/characters/${characterId}`)
  }

  // User API methods
  async getCurrentUser() {
    return this.request("/api/users/me")
  }

  async updateUserProfile(data: { username?: string; bio?: string; avatar?: string }) {
    return this.request("/api/users/me", {
      method: "PATCH",
      body: JSON.stringify(data),
    })
  }

  async getUserWatchlist(status?: string, page = 1, limit = 20) {
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() })
    if (status) params.append("status", status)
    return this.request(`/api/users/me/watchlist?${params}`)
  }

  async getUserReadingList(status?: string, page = 1, limit = 20) {
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() })
    if (status) params.append("status", status)
    return this.request(`/api/users/me/reading-list?${params}`)
  }

  async getUserProgress() {
    return this.request("/api/users/me/progress")
  }

  async getUserStats() {
    return this.request("/api/users/me/stats")
  }

  async getUserAchievements() {
    return this.request("/api/users/me/achievements")
  }

  // Quiz API methods
  async getQuizzes(
    params: {
      page?: number
      limit?: number
      difficulty?: string
      animeId?: string
      mangaId?: string
    } = {},
  ) {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString())
      }
    })

    return this.request(`/api/quiz?${searchParams}`)
  }

  async startQuiz(quizId: string) {
    return this.request(`/api/quiz/${quizId}/start`, {
      method: "POST",
    })
  }

  async submitQuiz(quizId: string, answers: number[], timeSpent: number) {
    return this.request(`/api/quiz/${quizId}/submit`, {
      method: "POST",
      body: JSON.stringify({ answers, timeSpent }),
    })
  }

  async getQuizLeaderboard(period = "all", limit = 50) {
    return this.request(`/api/quiz/leaderboard?period=${period}&limit=${limit}`)
  }

  async getQuizHistory(page = 1, limit = 20) {
    return this.request(`/api/quiz/history?page=${page}&limit=${limit}`)
  }

  // Community API methods
  async getPosts(
    params: {
      page?: number
      limit?: number
      tag?: string
      sort?: string
    } = {},
  ) {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString())
      }
    })

    return this.request(`/api/community/posts?${searchParams}`)
  }

  async createPost(data: { title: string; content: string; tags?: string[]; images?: string[] }) {
    return this.request("/api/community/posts", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async getPost(postId: string) {
    return this.request(`/api/community/posts/${postId}`)
  }

  async likePost(postId: string) {
    return this.request(`/api/community/posts/${postId}/like`, {
      method: "POST",
    })
  }

  async addComment(postId: string, content: string, parentId?: string) {
    return this.request(`/api/community/posts/${postId}/comments`, {
      method: "POST",
      body: JSON.stringify({ content, parentId }),
    })
  }

  async getTrendingTags() {
    return this.request("/api/community/tags/trending")
  }

  // AI API methods
  async requestPreview(mangaId: string, voiceType = "narrator", style = "anime") {
    return this.request("/api/ai/preview", {
      method: "POST",
      body: JSON.stringify({ mangaId, voiceType, style }),
    })
  }

  async getPreviewStatus(requestId: string) {
    return this.request(`/api/ai/preview/${requestId}`)
  }

  async requestNarration(mangaId: string, chapterId: string, characterId?: string, voiceType = "narrator") {
    return this.request("/api/ai/narration", {
      method: "POST",
      body: JSON.stringify({ mangaId, chapterId, characterId, voiceType }),
    })
  }

  async getNarrationStatus(requestId: string) {
    return this.request(`/api/ai/narration/${requestId}`)
  }

  async getAIHistory(type?: string, page = 1, limit = 20) {
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() })
    if (type) params.append("type", type)
    return this.request(`/api/ai/history?${params}`)
  }

  // Subscription API methods
  async getSubscriptionStatus() {
    return this.request("/api/subscription/status")
  }

  async getSubscriptionPlans() {
    return this.request("/api/subscription/plans")
  }

  async createSubscription(planId: string) {
    return this.request("/api/subscription/create", {
      method: "POST",
      body: JSON.stringify({ planId }),
    })
  }

  async cancelSubscription() {
    return this.request("/api/subscription/cancel", {
      method: "POST",
    })
  }

  // Notification API methods
  async getNotifications(page = 1, limit = 20) {
    return this.request(`/api/notifications?page=${page}&limit=${limit}`)
  }

  async markNotificationAsRead(notificationId: string) {
    return this.request(`/api/notifications/${notificationId}/read`, {
      method: "POST",
    })
  }

  async markAllNotificationsAsRead() {
    return this.request("/api/notifications/read-all", {
      method: "POST",
    })
  }
}

export const api = new ApiClient(API_BASE_URL)
export default api
