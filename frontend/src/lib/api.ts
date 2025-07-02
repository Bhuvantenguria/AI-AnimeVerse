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
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token")
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
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
      if (typeof window !== "undefined") {
        localStorage.removeItem("token")
        window.location.href = "/login"
      }
    }
    return Promise.reject(error)
  },
)

// API functions
export const authAPI = {
  login: (email: string, password: string) => api.post("/auth/login", { email, password }),

  register: (email: string, username: string, password: string) =>
    api.post("/auth/register", { email, username, password }),

  getMe: () => api.get("/auth/me"),

  refreshToken: () => api.post("/auth/refresh"),

  logout: () => api.post("/auth/logout"),
}

export const animeAPI = {
  search: (query: string, page = 1, limit = 20) => api.get("/anime", { params: { q: query, page, limit } }),

  getById: (id: string) => api.get(`/anime/${id}`),

  getTrending: () => api.get("/anime/trending/now"),

  addToWatchlist: (animeId: string, status: string) => api.post(`/anime/${animeId}/watchlist`, { status }),

  removeFromWatchlist: (animeId: string) => api.delete(`/anime/${animeId}/watchlist`),
}

export const mangaAPI = {
  search: (query: string, page = 1, limit = 20) => api.get("/manga", { params: { q: query, page, limit } }),

  getById: (id: string) => api.get(`/manga/${id}`),

  getTrending: () => api.get("/manga/trending"),

  getChapters: (mangaId: string) => api.get(`/manga/${mangaId}/chapters`),

  addToReadingList: (mangaId: string, status: string) => api.post(`/manga/${mangaId}/reading-list`, { status }),

  removeFromReadingList: (mangaId: string) => api.delete(`/manga/${mangaId}/reading-list`),
}

export const searchAPI = {
  search: (query: string, type = "all", page = 1, limit = 20) =>
    api.get("/search", { params: { q: query, type, page, limit } }),

  getSuggestions: (query: string) => api.get("/search/suggestions", { params: { q: query } }),
}

export const dashboardAPI = {
  getStats: () => api.get("/dashboard/stats"),

  getActivity: (limit = 20) => api.get("/dashboard/activity", { params: { limit } }),

  getRecommendations: () => api.get("/dashboard/recommendations"),

  getTrending: () => api.get("/dashboard/trending"),
}

export default api
