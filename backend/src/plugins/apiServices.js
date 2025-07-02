import fp from "fastify-plugin"
import axios from "axios"
import { JSDOM } from "jsdom"
import { config } from "../config/env.js"

async function apiServicesPlugin(fastify, options) {
  // Rate limiting helpers
  const rateLimiter = {
    jikan: { lastCall: 0, minInterval: config.JIKAN_RATE_LIMIT },
    kitsu: { lastCall: 0, minInterval: config.KITSU_RATE_LIMIT },
    mangadx: { lastCall: 0, minInterval: config.MANGADX_RATE_LIMIT },
    anilist: { lastCall: 0, minInterval: config.ANILIST_RATE_LIMIT },
    animechan: { lastCall: 0, minInterval: 1000 },
  }

  const waitForRateLimit = async (api) => {
    const now = Date.now()
    const timeSinceLastCall = now - rateLimiter[api].lastCall
    const waitTime = rateLimiter[api].minInterval - timeSinceLastCall

    if (waitTime > 0) {
      await new Promise((resolve) => setTimeout(resolve, waitTime))
    }

    rateLimiter[api].lastCall = Date.now()
  }

  // Jikan API service
  const jikanService = {
    baseUrl: config.JIKAN_API_URL,

    async searchAnime(query, page = 1, limit = 25) {
      try {
        await waitForRateLimit("jikan")
        const response = await axios.get(
          `${this.baseUrl}/anime?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}&order_by=score&sort=desc`
        )
        return response.data
      } catch (error) {
        fastify.log.error("Jikan search anime error:", error.message)
        return { data: [], pagination: { has_next_page: false } }
      }
    },

    async getAnimeById(id) {
      try {
        await waitForRateLimit("jikan")
        const [animeRes, charactersRes] = await Promise.all([
          axios.get(`${this.baseUrl}/anime/${id}`),
          axios.get(`${this.baseUrl}/anime/${id}/characters`),
        ])

        return {
          anime: animeRes.data.data,
          characters: charactersRes.data.data || [],
        }
      } catch (error) {
        fastify.log.error("Jikan get anime error:", error.message)
        return { anime: null, characters: [] }
      }
    },

    async getTopAnime(page = 1, filter = "bypopularity") {
      try {
        await waitForRateLimit("jikan")
        const response = await axios.get(
          `${this.baseUrl}/top/anime?page=${page}&limit=20&filter=${filter}&order_by=score&sort=desc`
        )
        return response.data
      } catch (error) {
        fastify.log.error("Jikan top anime error:", error.message)
        return { data: [], pagination: { has_next_page: false } }
      }
    },

    async getCurrentSeason() {
      try {
        await waitForRateLimit("jikan")
        const response = await axios.get(`${this.baseUrl}/seasons/now`)
        return response.data
      } catch (error) {
        fastify.log.error("Jikan current season error:", error.message)
        return { data: [] }
      }
    },

    async getSeasonalAnime(year, season) {
      try {
        await waitForRateLimit("jikan")
        const response = await axios.get(`${this.baseUrl}/seasons/${year}/${season}`)
        return response.data
      } catch (error) {
        fastify.log.error("Jikan seasonal anime error:", error.message)
        return { data: [] }
      }
    },

    async searchManga(query, page = 1, limit = 25) {
      try {
        await waitForRateLimit("jikan")
        const response = await axios.get(
          `${this.baseUrl}/manga?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}&order_by=score&sort=desc`
        )
        return response.data
      } catch (error) {
        fastify.log.error("Jikan search manga error:", error.message)
        return { data: [], pagination: { has_next_page: false } }
      }
    },

    async getMangaById(id) {
      try {
        await waitForRateLimit("jikan")
        const [mangaRes, charactersRes] = await Promise.all([
          axios.get(`${this.baseUrl}/manga/${id}`),
          axios.get(`${this.baseUrl}/manga/${id}/characters`),
        ])

        return {
          manga: mangaRes.data.data,
          characters: charactersRes.data.data || [],
        }
      } catch (error) {
        fastify.log.error("Jikan get manga error:", error.message)
        return { manga: null, characters: [] }
      }
    },
  }

  // Kitsu API service
  const kitsuService = {
    baseUrl: "https://kitsu.io/api/edge",

    async getTrendingAnime(limit = 20) {
      await waitForRateLimit("kitsu")
      const response = await axios.get(`${this.baseUrl}/trending/anime?page[limit]=${limit}`)
      if (!response.ok) throw new Error(`Kitsu API error: ${response.status}`)
      return await response.json()
    },

    async searchAnime(query, limit = 20) {
      await waitForRateLimit("kitsu")
      const response = await axios.get(
        `${this.baseUrl}/anime?filter[text]=${encodeURIComponent(query)}&page[limit]=${limit}`
      )
      if (!response.ok) throw new Error(`Kitsu API error: ${response.status}`)
      return await response.json()
    },

    async getTrendingManga(limit = 20) {
      await waitForRateLimit("kitsu")
      const response = await axios.get(`${this.baseUrl}/trending/manga?page[limit]=${limit}`)
      if (!response.ok) throw new Error(`Kitsu API error: ${response.status}`)
      return await response.json()
    },
  }

  // AniList GraphQL service
  const aniListService = {
    baseUrl: config.ANILIST_API_URL,

    async query(query, variables = {}) {
      try {
        await waitForRateLimit("anilist")
        const response = await axios.post(this.baseUrl, {
          query,
          variables,
        })
        return response.data
      } catch (error) {
        fastify.log.error("AniList query error:", error.message)
        return { data: null }
      }
    },

    async getTrendingAnime(page = 1, perPage = 20) {
      const query = `
        query ($page: Int, $perPage: Int) {
          Page(page: $page, perPage: $perPage) {
            pageInfo {
              total
              currentPage
              lastPage
              hasNextPage
            }
            media(type: ANIME, sort: TRENDING_DESC) {
              id
              title { english romaji native }
              description
              coverImage { large medium }
              bannerImage
              averageScore
              seasonYear
              status
              genres
              episodes
              popularity
              favourites
            }
          }
        }
      `
      return this.query(query, { page, perPage })
    },

    async getTrendingManga(page = 1, perPage = 20) {
      const query = `
        query ($page: Int, $perPage: Int) {
          Page(page: $page, perPage: $perPage) {
            pageInfo {
              total
              currentPage
              lastPage
              hasNextPage
            }
            media(type: MANGA, sort: TRENDING_DESC) {
              id
              title { english romaji native }
              description
              coverImage { large medium }
              bannerImage
              averageScore
              startDate { year }
              status
              genres
              chapters
              popularity
              favourites
            }
          }
        }
      `
      return this.query(query, { page, perPage })
    },

    async searchAnime(search, page = 1, perPage = 20) {
      const query = `
        query ($page: Int, $perPage: Int, $search: String) {
          Page(page: $page, perPage: $perPage) {
            pageInfo {
              total
              currentPage
              lastPage
              hasNextPage
            }
            media(type: ANIME, search: $search) {
              id
              title {
                english
                romaji
                native
              }
              description
              coverImage {
                large
                medium
              }
              bannerImage
              averageScore
              seasonYear
              status
              episodes
              genres
            }
          }
        }
      `
      return this.query(query, { page, perPage, search })
    },

    async searchManga(search, page = 1, perPage = 20) {
      const query = `
        query ($search: String, $page: Int, $perPage: Int) {
          Page(page: $page, perPage: $perPage) {
            pageInfo {
              total
              currentPage
              lastPage
              hasNextPage
            }
            media(type: MANGA, search: $search, sort: SCORE_DESC) {
              id
              title { english romaji native }
              description
              coverImage { large medium }
              bannerImage
              averageScore
              startDate { year }
              status
              genres
              chapters
              popularity
              favourites
            }
          }
        }
      `
      return this.query(query, { search, page, perPage })
    },
  }

  // AnimeChan API service
  const animeChanService = {
    baseUrl: "https://animechan.xyz/api",

    async getRandomQuote() {
      await waitForRateLimit("animechan")
      const response = await axios.get(`${this.baseUrl}/random`)
      if (!response.ok) throw new Error(`AnimeChan API error: ${response.status}`)
      return await response.json()
    },

    async getQuotesByAnime(anime) {
      await waitForRateLimit("animechan")
      const response = await axios.get(`${this.baseUrl}/quotes/anime?title=${encodeURIComponent(anime)}`)
      if (!response.ok) return []
      return await response.json()
    },

    async getQuotesByCharacter(character) {
      await waitForRateLimit("animechan")
      const response = await axios.get(`${this.baseUrl}/quotes/character?name=${encodeURIComponent(character)}`)
      if (!response.ok) return []
      return await response.json()
    },
  }

  // MangaDex API service
  const mangaDexService = {
    baseUrl: "https://api.mangadx.org",

    async searchManga(title, limit = 20, offset = 0) {
      await waitForRateLimit("mangadx")
      const response = await axios.get(
        `${this.baseUrl}/manga?title=${encodeURIComponent(title)}&limit=${limit}&offset=${offset}&includes[]=cover_art&order[rating]=desc`
      )
      if (!response.ok) throw new Error(`MangaDx API error: ${response.status}`)
      return await response.json()
    },

    async getPopularManga(limit = 20, offset = 0) {
      await waitForRateLimit("mangadx")
      const response = await axios.get(
        `${this.baseUrl}/manga?limit=${limit}&offset=${offset}&includes[]=cover_art&order[followedCount]=desc`
      )
      if (!response.ok) throw new Error(`MangaDx API error: ${response.status}`)
      return await response.json()
    },

    async getMangaById(id) {
      await waitForRateLimit("mangadx")
      const response = await axios.get(
        `${this.baseUrl}/manga/${id}?includes[]=cover_art&includes[]=author&includes[]=artist`
      )
      if (!response.ok) throw new Error(`MangaDx API error: ${response.status}`)
      return await response.json()
    },

    async getMangaChapters(mangaId, limit = 50, offset = 0) {
      await waitForRateLimit("mangadx")
      const response = await axios.get(
        `${this.baseUrl}/manga/${mangaId}/feed?limit=${limit}&offset=${offset}&order[chapter]=asc&translatedLanguage[]=en`
      )
      if (!response.ok) throw new Error(`MangaDx API error: ${response.status}`)
      return await response.json()
    },

    async getChapterPages(chapterId) {
      await waitForRateLimit("mangadx")
      const response = await axios.get(`${this.baseUrl}/at-home/server/${chapterId}`)
      if (!response.ok) throw new Error(`MangaDx API error: ${response.status}`)
      return await response.json()
    },
  }

  // Streaming services
  const gogoanimeService = new GogoanimeAPI()
  const consumetService = {
    baseUrl: config.CONSUMET_API_URL,

    async getAnimeInfo(anilistId) {
      try {
        const response = await axios.get(`${this.baseUrl}/meta/anilist/info/${anilistId}?provider=gogoanime`)
        return response.data
      } catch (error) {
        fastify.log.error("Consumet get anime info error:", error.message)
        return null
      }
    },

    async getStreamingUrl(episodeId) {
      try {
        // First get the episode sources
        const response = await axios.get(`${this.baseUrl}/meta/anilist/watch/${episodeId}?provider=gogoanime`)
        
        if (!response.data?.sources?.length) {
          throw new Error("No streaming sources available")
        }

        // Filter and sort sources by quality
        const sources = response.data.sources
          .filter(source => source.url && source.quality)
          .sort((a, b) => {
            const qualityA = parseInt(a.quality.replace(/[^\d]/g, '')) || 0
            const qualityB = parseInt(b.quality.replace(/[^\d]/g, '')) || 0
            return qualityB - qualityA
          })

        if (!sources.length) {
          throw new Error("No valid streaming sources found")
        }

        // Get headers for the highest quality source
        const headers = {}
        try {
          const headResponse = await axios.head(sources[0].url)
          Object.assign(headers, {
            'Content-Type': headResponse.headers['content-type'],
            'Content-Length': headResponse.headers['content-length'],
            'Accept-Ranges': 'bytes'
          })
        } catch (error) {
          fastify.log.warn("Failed to get source headers:", error.message)
        }

        return {
          sources,
          headers
        }
      } catch (error) {
        fastify.log.error("Consumet get streaming URL error:", error.message)
        throw error
      }
    }
  }

  // Decorate fastify with API services
  const services = {
    jikan: jikanService,
    kitsu: kitsuService,
    anilist: aniListService,
    animeChan: animeChanService,
    mangaDx: mangaDexService,
    gogoanime: gogoanimeService,
    consumet: consumetService,
  }

  fastify.decorate("apiServices", services)
  fastify.log.info("🌐 API services plugin registered")
}

class ApiServices {
  constructor(fastify) {
    this.fastify = fastify
    this.jikan = new JikanAPI()
    this.aniList = new AniListAPI()
    this.gogoanime = new GogoanimeAPI()
    this.consumet = new ConsumetAPI()
  }
}

class JikanAPI {
  constructor() {
    this.baseURL = config.JIKAN_API_URL
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
    })
  }

  // ... existing methods ...
}

class AniListAPI {
  constructor() {
    this.baseURL = config.ANILIST_API_URL
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
    })
  }

  // ... existing methods ...
}

class GogoanimeAPI {
  constructor() {
    this.baseURL = "https://gogoanime.consumet.stream"
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
    })
  }

  async getAnimeInfo(malId) {
    try {
      // First get anime details from Jikan
      const jikanResponse = await axios.get(`${config.JIKAN_API_URL}/anime/${malId}/full`)
      const animeData = jikanResponse.data.data

      // Search Gogoanime using the English title
      const searchResponse = await this.client.get("/anime/gogoanime/search", {
        params: { query: animeData.title_english || animeData.title }
      })

      if (!searchResponse.data.results?.length) {
        throw new Error("Anime not found on Gogoanime")
      }

      // Get the first result that best matches
      const animeId = searchResponse.data.results[0].id

      // Get episode list
      const infoResponse = await this.client.get(`/anime/gogoanime/info/${animeId}`)
      const episodes = infoResponse.data.episodes || []

      return {
        id: animeId,
        title: animeData.title,
        episodes: episodes.map(ep => ({
          id: ep.id,
          number: ep.number,
          title: ep.title,
          thumbnail: ep.image || null,
          duration: null // Gogoanime doesn't provide duration
        }))
      }
    } catch (error) {
      console.error("Gogoanime API error:", error)
      throw error
    }
  }

  async getStreamingUrl(episodeId) {
    try {
      const response = await this.client.get(`/anime/gogoanime/watch/${episodeId}`)
      
      // Get the highest quality source
      const sources = response.data.sources || []
      const sortedSources = sources.sort((a, b) => {
        const qualityA = parseInt(a.quality) || 0
        const qualityB = parseInt(b.quality) || 0
        return qualityB - qualityA
      })

      return sortedSources[0]?.url
    } catch (error) {
      console.error("Gogoanime streaming error:", error)
      throw error
    }
  }
}

export class ConsumetAPI {
  constructor() {
    this.baseUrl = config.CONSUMET_API_URL || "https://api.consumet.org/anime"
    this.defaultProvider = "gogoanime" // Can be changed based on preference
  }

  async getAnimeInfo(anilistId) {
    try {
      const response = await axios.get(`${this.baseUrl}/${this.defaultProvider}/info/${anilistId}`)
      return response.data
    } catch (error) {
      console.error("Consumet getAnimeInfo error:", error)
      return null
    }
  }

  async getStreamingUrl(episodeId) {
    try {
      // Get streaming sources
      const response = await axios.get(`${this.baseUrl}/${this.defaultProvider}/watch/${episodeId}`, {
        validateStatus: status => status < 500
      })

      if (!response.data?.sources?.length) {
        throw new Error("No streaming sources available")
      }

      // Filter and transform sources
      const sources = response.data.sources
        .filter(source => source.quality && source.url)
        .map(source => ({
          url: source.url,
          quality: source.quality,
          isM3U8: source.url.includes('.m3u8')
        }))
        .sort((a, b) => {
          const qualityA = parseInt(a.quality.replace('p', '')) || 0
          const qualityB = parseInt(b.quality.replace('p', '')) || 0
          return qualityB - qualityA
        })

      // Add headers for CORS and streaming
      const headers = {
        'Referer': response.data.headers?.Referer || '*',
        'User-Agent': response.data.headers?.['User-Agent'] || 'Mozilla/5.0',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Range',
        'Access-Control-Expose-Headers': 'Content-Range, Accept-Ranges'
      }

      // Add subtitles if available
      const subtitles = response.data.subtitles?.map(sub => ({
        lang: sub.lang,
        language: sub.language,
        url: sub.url
      })) || []

      return {
        sources,
        headers,
        subtitles
      }
    } catch (error) {
      console.error("Consumet getStreamingUrl error:", error)
      throw new Error(error.message || "Failed to get streaming URL")
    }
  }
}

export default fp(apiServicesPlugin, {
  name: "apiServices"
})
