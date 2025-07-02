import axios from "axios"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

export const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token")
      window.location.href = "/login"
    }
    return Promise.reject(error)
  },
)

// API functions
export const animeAPI = {
  search: (query: string, page = 1, limit = 20) => api.get("/anime", { params: { q: query, page, limit } }),

  getById: (id: string) => api.get(`/anime/${id}`),

  getTrending: () => api.get("/anime/trending"),

  getTop: (page = 1) => api.get("/anime/top", { params: { page } }),

  getSeasonal: (year?: number, season?: string) => api.get("/anime/seasonal", { params: { year, season } }),

  addToWatchlist: (animeId: string, status: string) => api.post(`/anime/${animeId}/watchlist`, { status }),

  updateProgress: (animeId: string, currentEpisode: number, totalEpisodes: number) =>
    api.post(`/anime/${animeId}/progress`, { currentEpisode, totalEpisodes }),
}

export const mangaAPI = {
  search: (query: string, page = 1, limit = 20) => api.get("/manga", { params: { q: query, page, limit } }),

  getById: (id: string) => api.get(`/manga/${id}`),

  getTrending: () => api.get("/manga/trending"),

  getTop: (page = 1) => api.get("/manga/top", { params: { page } }),

  getChapters: (mangaId: string) => api.get(`/manga/${mangaId}/chapters`),

  getChapter: (mangaId: string, chapterNumber: string) => api.get(`/manga/${mangaId}/chapters/${chapterNumber}`),

  addToReadingList: (mangaId: string, status: string) => api.post(`/manga/${mangaId}/reading-list`, { status }),

  updateProgress: (mangaId: string, currentChapter: number, currentPage: number) =>
    api.post(`/manga/${mangaId}/progress`, { currentChapter, currentPage }),
}

export const chatAPI = {
  startSession: (characterId: string) => api.post("/chat/start", { characterId }),

  sendMessage: (sessionId: string, message: string) => api.post("/chat/message", { sessionId, message }),

  getHistory: (sessionId: string) => api.get(`/chat/history/${sessionId}`),

  getSessions: () => api.get("/chat/sessions"),

  getCharacters: (search?: string, animeId?: string, mangaId?: string) =>
    api.get("/chat/characters", { params: { search, animeId, mangaId } }),

  getCharacter: (id: string) => api.get(`/chat/characters/${id}`),

  deleteSession: (sessionId: string) => api.delete(`/chat/sessions/${sessionId}`),
}

export const quizAPI = {
  getQuizzes: (page = 1, limit = 20, difficulty?: string) => api.get("/quiz", { params: { page, limit, difficulty } }),

  startQuiz: (quizId: string) => api.post(`/quiz/${quizId}/start`),

  submitQuiz: (quizId: string, answers: any[], timeSpent: number) =>
    api.post(`/quiz/${quizId}/submit`, { answers, timeSpent }),

  getLeaderboard: (period = "all") => api.get("/quiz/leaderboard", { params: { period } }),

  getHistory: (page = 1, limit = 20) => api.get("/quiz/history", { params: { page, limit } }),
}

export const communityAPI = {
  getPosts: (page = 1, limit = 20, tag?: string, sort = "recent") =>
    api.get("/community/posts", { params: { page, limit, tag, sort } }),

  createPost: (title: string, content: string, tags: string[], images: string[]) =>
    api.post("/community/posts", { title, content, tags, images }),

  getPost: (id: string) => api.get(`/community/posts/${id}`),

  likePost: (id: string) => api.post(`/community/posts/${id}/like`),

  addComment: (postId: string, content: string, parentId?: string) =>
    api.post(`/community/posts/${postId}/comments`, { content, parentId }),

  getTrendingTags: () => api.get("/community/tags/trending"),
}

export const searchAPI = {
  search: (query: string, type = "all", source = "all", page = 1, limit = 20) =>
    api.get("/search", { params: { q: query, type, source, page, limit } }),

  getSuggestions: (query: string) => api.get("/search/suggestions", { params: { q: query } }),

  advancedSearch: (params: any) => api.post("/search/advanced", params),
}

export const dashboardAPI = {
  getStats: () => api.get("/dashboard/stats"),

  getActivity: (limit = 20) => api.get("/dashboard/activity", { params: { limit } }),

  getRecommendations: () => api.get("/dashboard/recommendations"),

  getTrending: () => api.get("/dashboard/trending"),

  getAnalytics: () => api.get("/dashboard/analytics"),
}

export const aiAPI = {
  generatePreview: (mangaId: string, voiceType = "narrator", style = "anime") =>
    api.post("/ai/preview", { mangaId, voiceType, style }),

  getPreviewStatus: (requestId: string) => api.get(`/ai/preview/${requestId}`),

  generateNarration: (mangaId: string, chapterId: string, characterId: string, voiceType = "narrator") =>
    api.post("/ai/narration", { mangaId, chapterId, characterId, voiceType }),

  getNarrationStatus: (requestId: string) => api.get(`/ai/narration/${requestId}`),

  getHistory: (type?: string, page = 1, limit = 20) => api.get("/ai/history", { params: { type, page, limit } }),
}

export const userAPI = {
  getProfile: () => api.get("/users/me"),

  updateProfile: (data: any) => api.patch("/users/me", data),

  getWatchlist: (status?: string, page = 1, limit = 20) =>
    api.get("/users/me/watchlist", { params: { status, page, limit } }),

  getReadingList: (status?: string, page = 1, limit = 20) =>
    api.get("/users/me/reading-list", { params: { status, page, limit } }),

  getProgress: () => api.get("/users/me/progress"),

  getAchievements: () => api.get("/users/me/achievements"),

  getStats: () => api.get("/users/me/stats"),
}

export const authAPI = {
  login: (email: string, password: string) => api.post("/auth/login", { email, password }),

  register: (email: string, password: string, username: string) =>
    api.post("/auth/register", { email, password, username }),

  getMe: () => api.get("/auth/me"),

  refreshToken: () => api.post("/auth/refresh"),

  logout: () => api.post("/auth/logout"),
}
