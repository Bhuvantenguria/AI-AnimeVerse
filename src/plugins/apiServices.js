import fp from "fastify-plugin"
import axios from "axios"

async function apiServicesPlugin(fastify, options) {
  // Create axios instances for different APIs
  const jikanAPI = axios.create({
    baseURL: "https://api.jikan.moe/v4",
    timeout: 10000,
  })

  const kitsuAPI = axios.create({
    baseURL: "https://kitsu.io/api/edge",
    timeout: 10000,
    headers: {
      Accept: "application/vnd.api+json",
      "Content-Type": "application/vnd.api+json",
    },
  })

  const animeChanAPI = axios.create({
    baseURL: "https://animechan.xyz/api",
    timeout: 5000,
  })

  const mangaDexAPI = axios.create({
    baseURL: "https://api.mangadex.org",
    timeout: 10000,
  })

  // Rate limiting helpers
  const rateLimiter = {
    jikan: { lastCall: 0, minInterval: 1000 }, // 1 second between calls
    kitsu: { lastCall: 0, minInterval: 500 }, // 0.5 seconds
    mangadex: { lastCall: 0, minInterval: 200 }, // 0.2 seconds
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
    async searchAnime(query, page = 1, limit = 25) {
      await waitForRateLimit("jikan")
      try {
        const response = await jikanAPI.get("/anime", {
          params: { q: query, page, limit, order_by: "score", sort: "desc" },
        })
        return response.data
      } catch (error) {
        fastify.log.error("Jikan API error:", error.message)
        throw new Error("Failed to fetch anime from Jikan API")
      }
    },

    async getAnimeById(id) {
      await waitForRateLimit("jikan")
      try {
        const [animeResponse, charactersResponse, episodesResponse] = await Promise.all([
          jikanAPI.get(`/anime/${id}`),
          jikanAPI.get(`/anime/${id}/characters`).catch(() => ({ data: { data: [] } })),
          jikanAPI.get(`/anime/${id}/episodes`).catch(() => ({ data: { data: [] } })),
        ])

        return {
          anime: animeResponse.data.data,
          characters: charactersResponse.data.data,
          episodes: episodesResponse.data.data,
        }
      } catch (error) {
        fastify.log.error("Jikan API error:", error.message)
        throw new Error("Failed to fetch anime details from Jikan API")
      }
    },

    async getTopAnime(type = "anime", page = 1) {
      await waitForRateLimit("jikan")
      try {
        const response = await jikanAPI.get(`/top/${type}`, {
          params: { page },
        })
        return response.data
      } catch (error) {
        fastify.log.error("Jikan API error:", error.message)
        throw new Error("Failed to fetch top anime from Jikan API")
      }
    },

    async getSeasonalAnime(year, season) {
      await waitForRateLimit("jikan")
      try {
        const response = await jikanAPI.get(`/seasons/${year}/${season}`)
        return response.data
      } catch (error) {
        fastify.log.error("Jikan API error:", error.message)
        throw new Error("Failed to fetch seasonal anime from Jikan API")
      }
    },

    async searchManga(query, page = 1, limit = 25) {
      await waitForRateLimit("jikan")
      try {
        const response = await jikanAPI.get("/manga", {
          params: { q: query, page, limit, order_by: "score", sort: "desc" },
        })
        return response.data
      } catch (error) {
        fastify.log.error("Jikan API error:", error.message)
        throw new Error("Failed to fetch manga from Jikan API")
      }
    },

    async getMangaById(id) {
      await waitForRateLimit("jikan")
      try {
        const [mangaResponse, charactersResponse] = await Promise.all([
          jikanAPI.get(`/manga/${id}`),
          jikanAPI.get(`/manga/${id}/characters`).catch(() => ({ data: { data: [] } })),
        ])

        return {
          manga: mangaResponse.data.data,
          characters: charactersResponse.data.data,
        }
      } catch (error) {
        fastify.log.error("Jikan API error:", error.message)
        throw new Error("Failed to fetch manga details from Jikan API")
      }
    },
  }

  // Kitsu API service
  const kitsuService = {
    async getTrendingAnime(limit = 20) {
      try {
        const response = await kitsuAPI.get("/trending/anime", {
          params: {
            "page[limit]": limit,
            include: "categories",
          },
        })
        return response.data
      } catch (error) {
        fastify.log.error("Kitsu API error:", error.message)
        throw new Error("Failed to fetch trending anime from Kitsu API")
      }
    },

    async searchAnime(query, limit = 20) {
      try {
        const response = await kitsuAPI.get("/anime", {
          params: {
            "filter[text]": query,
            "page[limit]": limit,
            include: "categories",
          },
        })
        return response.data
      } catch (error) {
        fastify.log.error("Kitsu API error:", error.message)
        throw new Error("Failed to fetch anime from Kitsu API")
      }
    },

    async getAnimeById(id) {
      try {
        const response = await kitsuAPI.get(`/anime/${id}`, {
          params: {
            include: "categories,episodes,characters",
          },
        })
        return response.data
      } catch (error) {
        fastify.log.error("Kitsu API error:", error.message)
        throw new Error("Failed to fetch anime details from Kitsu API")
      }
    },
  }

  // AnimeChan API service
  const animeChanService = {
    async getRandomQuote() {
      try {
        const response = await animeChanAPI.get("/random")
        return response.data
      } catch (error) {
        fastify.log.error("AnimeChan API error:", error.message)
        throw new Error("Failed to fetch quote from AnimeChan API")
      }
    },

    async getQuotesByAnime(anime) {
      try {
        const response = await animeChanAPI.get("/quotes/anime", {
          params: { title: anime },
        })
        return response.data
      } catch (error) {
        fastify.log.error("AnimeChan API error:", error.message)
        throw new Error("Failed to fetch quotes from AnimeChan API")
      }
    },

    async getQuotesByCharacter(character) {
      try {
        const response = await animeChanAPI.get("/quotes/character", {
          params: { name: character },
        })
        return response.data
      } catch (error) {
        fastify.log.error("AnimeChan API error:", error.message)
        throw new Error("Failed to fetch character quotes from AnimeChan API")
      }
    },
  }

  // MangaDex API service
  const mangaDexService = {
    async searchManga(title, limit = 20) {
      await waitForRateLimit("mangadx")
      try {
        const response = await mangaDexAPI.get("/manga", {
          params: {
            title,
            limit,
            "order[rating]": "desc",
            includes: ["cover_art", "author", "artist"],
          },
        })
        return response.data
      } catch (error) {
        fastify.log.error("MangaDex API error:", error.message)
        throw new Error("Failed to fetch manga from MangaDex API")
      }
    },

    async getMangaById(id) {
      await waitForRateLimit("mangadx")
      try {
        const response = await mangaDexAPI.get(`/manga/${id}`, {
          params: {
            includes: ["cover_art", "author", "artist"],
          },
        })
        return response.data
      } catch (error) {
        fastify.log.error("MangaDex API error:", error.message)
        throw new Error("Failed to fetch manga details from MangaDex API")
      }
    },

    async getMangaChapters(mangaId, limit = 100) {
      await waitForRateLimit("mangadx")
      try {
        const response = await mangaDexAPI.get("/chapter", {
          params: {
            manga: mangaId,
            limit,
            "order[chapter]": "asc",
            "translatedLanguage[]": "en",
          },
        })
        return response.data
      } catch (error) {
        fastify.log.error("MangaDex API error:", error.message)
        throw new Error("Failed to fetch manga chapters from MangaDex API")
      }
    },

    async getChapterPages(chapterId) {
      await waitForRateLimit("mangadx")
      try {
        const response = await mangaDexAPI.get(`/at-home/server/${chapterId}`)
        return response.data
      } catch (error) {
        fastify.log.error("MangaDex API error:", error.message)
        throw new Error("Failed to fetch chapter pages from MangaDex API")
      }
    },
  }

  // AniList GraphQL service
  const aniListService = {
    async query(query, variables = {}) {
      try {
        const response = await axios.post(
          "https://graphql.anilist.co",
          {
            query,
            variables,
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
          },
        )
        return response.data
      } catch (error) {
        fastify.log.error("AniList API error:", error.message)
        throw new Error("Failed to fetch data from AniList API")
      }
    },

    async searchAnime(search, page = 1, perPage = 20) {
      const query = `
        query ($search: String, $page: Int, $perPage: Int) {
          Page(page: $page, perPage: $perPage) {
            pageInfo {
              total
              currentPage
              lastPage
              hasNextPage
            }
            media(search: $search, type: ANIME) {
              id
              title {
                romaji
                english
                native
              }
              description
              episodes
              status
              averageScore
              seasonYear
              season
              genres
              studios {
                nodes {
                  name
                }
              }
              coverImage {
                large
                medium
              }
              bannerImage
              trailer {
                id
                site
              }
            }
          }
        }
      `
      return await this.query(query, { search, page, perPage })
    },

    async getAnimeById(id) {
      const query = `
        query ($id: Int) {
          Media(id: $id, type: ANIME) {
            id
            title {
              romaji
              english
              native
            }
            description
            episodes
            status
            averageScore
            seasonYear
            season
            genres
            studios {
              nodes {
                name
              }
            }
            coverImage {
              large
              medium
            }
            bannerImage
            trailer {
              id
              site
            }
            characters {
              nodes {
                id
                name {
                  full
                  native
                }
                image {
                  large
                  medium
                }
                description
              }
            }
          }
        }
      `
      return await this.query(query, { id })
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
            media(sort: TRENDING_DESC, type: ANIME) {
              id
              title {
                romaji
                english
                native
              }
              description
              episodes
              status
              averageScore
              seasonYear
              season
              genres
              coverImage {
                large
                medium
              }
              bannerImage
            }
          }
        }
      `
      return await this.query(query, { page, perPage })
    },
  }

  // Decorate fastify with API services
  fastify.decorate("apiServices", {
    jikan: jikanService,
    kitsu: kitsuService,
    animeChan: animeChanService,
    mangaDex: mangaDexService,
    aniList: aniListService,
  })

  fastify.log.info("✅ API Services plugin initialized")
}

export default fp(apiServicesPlugin, {
  name: "apiServices",
})
