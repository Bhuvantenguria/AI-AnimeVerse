export default async function animeRoutes(fastify, options) {
  // Get anime list with filters
  fastify.get("/search", async (request, reply) => {
    try {
      const { query = "", page = 1 } = request.query
      
      // Search using both Jikan and AniList
      const [jikanResults, anilistResults] = await Promise.all([
        fastify.apiServices.jikan.searchAnime(query, page),
        fastify.apiServices.anilist.searchAnime(query, page)
      ])

      // Merge and deduplicate results
      const results = {
        data: [],
        pagination: {
          has_next_page: jikanResults.pagination?.has_next_page || false,
          current_page: page,
          items: {
            count: 0,
            total: jikanResults.pagination?.items?.total || 0,
            per_page: 20
          }
        }
      }

        // Process Jikan results
      if (jikanResults.data) {
        results.data.push(...jikanResults.data.map(anime => ({
          id: anime.mal_id?.toString(),
              title: anime.title,
          titleEnglish: anime.title_english,
              synopsis: anime.synopsis,
              coverImage: anime.images?.jpg?.large_image_url,
          bannerImage: anime.trailer?.images?.maximum_image_url,
              episodes: anime.episodes,
              status: anime.status,
          rating: anime.score,
              year: anime.year,
          genres: anime.genres?.map(g => g.name) || [],
          source: 'jikan'
        })))
        }

        // Process AniList results
      if (anilistResults.data?.Page?.media) {
        results.data.push(...anilistResults.data.Page.media.map(anime => ({
          id: anime.id?.toString(),
                title: anime.title.english || anime.title.romaji,
          titleEnglish: anime.title.english,
          synopsis: anime.description,
                coverImage: anime.coverImage?.large,
                bannerImage: anime.bannerImage,
                episodes: anime.episodes,
                status: anime.status,
          rating: anime.averageScore,
                year: anime.seasonYear,
                genres: anime.genres || [],
          source: 'anilist'
        })))
      }

      // Remove duplicates based on title
      results.data = Array.from(new Map(results.data.map(item => [item.title, item])).values())
      results.pagination.items.count = results.data.length

      return results
    } catch (error) {
      fastify.log.error("Error searching anime:", error)
      throw new Error("Failed to search anime")
    }
  })

  // Get anime by ID with episodes and streaming info
  fastify.get("/:id", async (request, reply) => {
    try {
      const { id } = request.params
      const userId = request.user?.id

      // Try to get from database first
      let anime = await fastify.prisma.anime.findUnique({
        where: { id },
        include: {
          characters: true,
        },
      })

      // If not in database, fetch from external APIs
      if (!anime) {
        const [jikanData, anilistData] = await Promise.allSettled([
          fastify.apiServices.jikan.getAnimeById(id),
          fastify.apiServices.anilist.searchAnime(id)
        ])

        // Check if Jikan API call succeeded
        if (jikanData.status === 'rejected' || !jikanData.value?.anime) {
          fastify.log.error("Failed to fetch anime from Jikan:", jikanData.reason || "No data")
          reply.code(404)
          return { error: "Anime not found" }
        }

        const animeData = jikanData.value.anime
        const characters = jikanData.value.characters || []

        anime = {
          id: animeData.mal_id?.toString(),
          malId: animeData.mal_id,
          title: animeData.title,
          titleJp: animeData.title_japanese,
          synopsis: animeData.synopsis,
          coverImage: animeData.images?.jpg?.large_image_url,
          bannerImage: animeData.trailer?.images?.maximum_image_url,
          episodes: animeData.episodes || 0,
          status: animeData.status,
          rating: animeData.score || 0,
          year: animeData.year || null,
          season: animeData.season || null,
          genres: animeData.genres?.map(g => g.name) || [],
          studios: animeData.studios?.map(s => s.name) || [],
          themes: animeData.themes?.map(t => t.name) || [],
          characters: characters.map(c => ({
            name: c.character?.name || '',
            nameJp: c.character?.name_kanji || '',
            description: c.character?.about || '',
            avatar: c.character?.images?.jpg?.image_url || null,
            personality: c.role || 'Unknown'
          }))
        }

        // Try to store in database but don't fail if it errors
        try {
          await fastify.prisma.anime.create({
            data: {
              id: anime.id,
              malId: anime.malId,
              title: anime.title,
              titleJp: anime.titleJp,
              synopsis: anime.synopsis,
              coverImage: anime.coverImage,
              bannerImage: anime.bannerImage,
              episodes: anime.episodes,
              status: anime.status,
              rating: anime.rating,
              year: anime.year,
              season: anime.season,
              genres: anime.genres,
              studios: anime.studios,
              themes: anime.themes,
              characters: {
                create: anime.characters.map(c => ({
                  name: c.name,
                  nameJp: c.nameJp,
                  description: c.description,
                  avatar: c.avatar,
                  personality: c.personality
                }))
              }
            }
          })
        } catch (dbError) {
          fastify.log.warn("Failed to store anime in database:", dbError)
        }
      }

      // Get anime progress if user is authenticated
      let animeProgress = null
      let watchlistStatus = null
      if (userId) {
        try {
          const [progress, watchlist] = await Promise.all([
            fastify.prisma.animeProgress.findUnique({
              where: {
                userId_animeId: {
                  userId,
                  animeId: id,
                }
              },
            }),
            fastify.prisma.watchlist.findUnique({
            where: {
                userId_animeId: {
              userId,
              animeId: id,
                }
            },
          })
          ])
          
          animeProgress = progress
          watchlistStatus = watchlist
        } catch (progressError) {
          fastify.log.warn("Failed to fetch user progress:", progressError)
        }
      }

      // Get streaming info using the improved Consumet service
      let streamingInfo = null
      try {
        // Convert MAL ID to AniList ID first
        let anilistId = id
        try {
          const anilistResponse = await fastify.apiServices.anilist.query(`
            query ($malId: Int) {
              Media(idMal: $malId, type: ANIME) {
                id
                title {
                  romaji
                  english
                }
              }
            }
          `, { malId: parseInt(id) })
          if (anilistResponse.data?.Media?.id) {
            anilistId = anilistResponse.data.Media.id
            fastify.log.info(`Converted MAL ID ${id} to AniList ID ${anilistId}`)
          }
        } catch (convertError) {
          fastify.log.warn("Failed to convert MAL ID to AniList ID:", convertError)
        }

        streamingInfo = await fastify.apiServices.consumet.getAnimeInfo(anilistId)
      } catch (streamError) {
        fastify.log.warn("Failed to fetch streaming info:", streamError)
      }

      // Merge episode data with streaming info
      let episodes = []
      if (streamingInfo && streamingInfo.episodes) {
        episodes = streamingInfo.episodes.map(ep => ({
          id: ep.id,
          number: ep.number || 1,
          title: ep.title || `Episode ${ep.number}`,
          thumbnail: ep.image || anime.coverImage,
          duration: ep.duration || 24
        }))
      } else {
        // Create episodes from anime.episodes count if streaming info not available
        const episodeCount = anime.episodes || 1
        episodes = Array.from({ length: episodeCount }, (_, i) => ({
          id: `${id}-ep-${i + 1}`,
          number: i + 1,
          title: `Episode ${i + 1}`,
          thumbnail: anime.coverImage,
          duration: 24
        }))
      }

      return {
        ...anime,
        episodes,
        animeProgress,
        watchlistStatus,
        isInWatchlist: !!watchlistStatus
      }
    } catch (error) {
      fastify.log.error("Error fetching anime:", error)
      reply.code(500)
      return { error: "Failed to fetch anime details" }
    }
  })

  // Get Gogoanime info for an anime
  fastify.get("/:id/gogoanime", async (request, reply) => {
    try {
      const { id } = request.params
      
      // Convert MAL ID to AniList ID first
      let anilistId = id
      try {
        const anilistResponse = await fastify.apiServices.anilist.query(`
          query ($malId: Int) {
            Media(idMal: $malId, type: ANIME) {
              id
              title {
                romaji
                english
              }
            }
          }
        `, { malId: parseInt(id) })
        if (anilistResponse.data?.Media?.id) {
          anilistId = anilistResponse.data.Media.id
        }
      } catch (convertError) {
        fastify.log.warn("Failed to convert MAL ID to AniList ID:", convertError)
      }

      const gogoanimeInfo = await fastify.apiServices.consumet.getAnimeInfo(anilistId)
      if (!gogoanimeInfo) {
        reply.code(404)
        return { error: 'Failed to fetch Gogoanime info' }
      }
      
      return gogoanimeInfo
    } catch (err) {
      fastify.log.error("Error fetching Gogoanime info:", err)
      reply.code(500)
      return { error: 'Failed to fetch Gogoanime info', details: err.message };
    }
  });

  // Enhanced streaming endpoint with multiple providers and better error handling
  fastify.get("/:animeId/episodes/:episodeId/stream", async (request, reply) => {
    try {
      const { animeId, episodeId } = request.params
      fastify.log.info(`Streaming request for anime: ${animeId}, episode: ${episodeId}`)

      // Set CORS headers for streaming
      reply.header('Access-Control-Allow-Origin', '*')
      reply.header('Access-Control-Allow-Methods', 'GET, OPTIONS')
      reply.header('Access-Control-Allow-Headers', 'Content-Type, Range')

      // Try to get from cache first (make Redis optional)
      const cacheKey = `stream:${animeId}:${episodeId}`
      let streamingData = null
      try {
        if (fastify.redis) {
          streamingData = await fastify.redis.get(cacheKey)
          if (streamingData) {
            streamingData = JSON.parse(streamingData)
            fastify.log.info(`Found cached streaming data for ${episodeId}`)
            return {
              sources: streamingData.sources,
              headers: streamingData.headers,
              subtitles: streamingData.subtitles || []
            }
          }
        }
      } catch (cacheError) {
        fastify.log.warn("Redis cache error:", cacheError)
      }

      // Convert MAL ID to AniList ID first for better API compatibility
      let anilistId = animeId
      try {
        const anilistResponse = await fastify.apiServices.anilist.query(`
          query ($malId: Int) {
            Media(idMal: $malId, type: ANIME) {
              id
              title {
                romaji
                english
                native
              }
              synonyms
            }
          }
        `, { malId: parseInt(animeId) })
        if (anilistResponse.data?.Media?.id) {
          anilistId = anilistResponse.data.Media.id
          fastify.log.info(`Converted MAL ID ${animeId} to AniList ID ${anilistId}`)
        }
      } catch (convertError) {
        fastify.log.warn("Failed to convert MAL ID to AniList ID:", convertError)
      }

      // Handle episode ID format and get the real episode ID
      let episodeNumber = 1
      let realEpisodeId = episodeId
      
      if (episodeId.includes('-ep-')) {
        episodeNumber = parseInt(episodeId.split('-ep-')[1])
        fastify.log.info(`Extracted episode number: ${episodeNumber}`)
      }

      // Try to get streaming data using the improved streaming service
      try {
        // Get anime title for better fallback handling
        let animeTitle = null
        try {
          const anilistResponse = await fastify.apiServices.anilist.query(`
            query ($id: Int) {
              Media(id: $id, type: ANIME) {
                title { romaji english native }
              }
            }
          `, { id: parseInt(anilistId) })
          
          if (anilistResponse.data?.Media) {
            animeTitle = anilistResponse.data.Media.title.english || 
                        anilistResponse.data.Media.title.romaji ||
                        anilistResponse.data.Media.title.native
          }
        } catch (titleError) {
          fastify.log.warn("Failed to get anime title:", titleError)
        }

        // Try to get streaming data with the new streaming service
        streamingData = await fastify.apiServices.streaming.getStreamingSources(episodeId, animeTitle)
        
        if (streamingData && (streamingData.sources?.length > 0 || streamingData.url || streamingData.links?.length > 0)) {
          // Cache for 1 hour (make Redis optional)
          try {
            if (fastify.redis) {
              await fastify.redis.set(cacheKey, JSON.stringify(streamingData), 'EX', 3600)
            }
          } catch (cacheError) {
            fastify.log.warn("Redis cache set error:", cacheError)
          }
          
          fastify.log.info(`Successfully got streaming data for episode ${episodeId}`)
          return streamingData
        }
      } catch (streamError) {
        fastify.log.error("Failed to get streaming data from streaming service:", streamError)
      }

      // If streaming service fails, return fallback links
      try {
        fastify.log.info("Streaming service failed, returning fallback links")
        
        // Get anime title for fallback links
        let animeTitle = null
        try {
          const anilistResponse = await fastify.apiServices.anilist.query(`
            query ($id: Int) {
              Media(id: $id, type: ANIME) {
                title { romaji english native }
              }
            }
          `, { id: parseInt(anilistId) })
          
          if (anilistResponse.data?.Media) {
            animeTitle = anilistResponse.data.Media.title.english || 
                        anilistResponse.data.Media.title.romaji ||
                        anilistResponse.data.Media.title.native
          }
        } catch (titleError) {
          fastify.log.warn("Failed to get anime title for fallback:", titleError)
        }

        // Return fallback links
        const fallbackLinks = fastify.apiServices.streaming.getFallbackLinks(episodeId, animeTitle)
        
        // Cache for 1 hour
            try {
              if (fastify.redis) {
            const fallbackData = { type: "fallback", links: fallbackLinks, provider: "fallback" }
            await fastify.redis.set(cacheKey, JSON.stringify(fallbackData), 'EX', 3600)
              }
            } catch (cacheError) {
              fastify.log.warn("Redis cache set error:", cacheError)
            }
        
        fastify.log.info("Returning fallback links")
            return {
          type: "fallback",
          links: fallbackLinks,
          provider: "fallback"
        }
      } catch (fallbackError) {
        fastify.log.error("Fallback links generation failed:", fallbackError)
      }

      // If all methods fail, return detailed error
      reply.code(404)
      return { 
        error: "No streaming sources available for this episode.",
        details: {
          animeId,
          episodeId,
          episodeNumber,
          anilistId,
          message: "All streaming providers failed to return valid sources"
        }
      }
    } catch (error) {
      fastify.log.error("Error fetching stream:", error)
      reply.code(500)
      return { error: "Failed to fetch streaming URL", details: error.message }
    }
  })

  // Update anime progress
  fastify.post("/:animeId/progress", async (request, reply) => {
    try {
      const { animeId } = request.params
      const { episodeId, progress } = request.body
      const userId = request.user?.id

      if (!userId) {
        reply.code(401)
        return { error: "Unauthorized" }
      }

      const animeProgress = await fastify.prisma.animeProgress.upsert({
          where: {
          userId_animeId: {
            userId,
            animeId,
            },
          },
          update: {
          currentEpisode: episodeId,
          progress,
            updatedAt: new Date(),
          },
          create: {
            userId,
          animeId,
          currentEpisode: episodeId,
          progress,
        },
      })

      return animeProgress
      } catch (error) {
      fastify.log.error("Error updating anime progress:", error)
      reply.code(500)
      return { error: "Failed to update progress" }
    }
  })

  // Get anime progress
  fastify.get("/:animeId/progress", async (request, reply) => {
    try {
      const { animeId } = request.params
      const userId = request.user?.id

      if (!userId) {
        reply.code(401)
        return { error: "Unauthorized" }
      }

      const animeProgress = await fastify.prisma.animeProgress.findUnique({
        where: {
          userId_animeId: {
            userId,
            animeId,
          },
        },
      })

      return animeProgress || { currentEpisode: 0, progress: 0 }
    } catch (error) {
      fastify.log.error("Error fetching anime progress:", error)
      reply.code(500)
      return { error: "Failed to fetch progress" }
    }
  })

  // Get trending anime
  fastify.get("/trending", async (request, reply) => {
    try {
      const { page = 1 } = request.query
      
      const [jikanTrending, anilistTrending] = await Promise.allSettled([
        fastify.apiServices.jikan.getTopAnime(page),
        fastify.apiServices.anilist.getTrendingAnime(page)
      ])

      const results = {
        data: [],
        pagination: {
          has_next_page: false,
          current_page: page,
          items: { count: 0, total: 0, per_page: 20 }
        }
      }

      // Process Jikan trending results
      if (jikanTrending.status === 'fulfilled' && jikanTrending.value.data) {
        results.data.push(...jikanTrending.value.data.map(anime => ({
          id: anime.mal_id?.toString(),
          title: anime.title,
          titleEnglish: anime.title_english,
          synopsis: anime.synopsis,
          coverImage: anime.images?.jpg?.large_image_url,
          bannerImage: anime.trailer?.images?.maximum_image_url,
          episodes: anime.episodes,
          status: anime.status,
          rating: anime.score,
          year: anime.year,
          genres: anime.genres?.map(g => g.name) || [],
          source: 'jikan'
        })))
      }

      // Process AniList trending results
      if (anilistTrending.status === 'fulfilled' && anilistTrending.value.data?.Page?.media) {
        results.data.push(...anilistTrending.value.data.Page.media.map(anime => ({
          id: anime.id?.toString(),
          title: anime.title.english || anime.title.romaji,
          titleEnglish: anime.title.english,
          synopsis: anime.description,
          coverImage: anime.coverImage?.large,
          bannerImage: anime.bannerImage,
          episodes: anime.episodes,
          status: anime.status,
          rating: anime.averageScore,
          year: anime.seasonYear,
          genres: anime.genres || [],
          source: 'anilist'
        })))
      }

      // Remove duplicates and limit results
      results.data = Array.from(new Map(results.data.map(item => [item.title, item])).values()).slice(0, 20)
      results.pagination.items.count = results.data.length
      results.pagination.has_next_page = results.data.length === 20

      return results
    } catch (error) {
      fastify.log.error("Error fetching trending anime:", error)
      reply.code(500)
      return { error: "Failed to fetch trending anime" }
    }
  })

  // Get seasonal anime
  fastify.get("/seasonal/:year/:season", async (request, reply) => {
    try {
      const { year, season } = request.params
      const { page = 1 } = request.query
      
      const seasonalData = await fastify.apiServices.jikan.getSeasonalAnime(year, season)
      
      if (!seasonalData.data) {
        reply.code(404)
        return { error: "Seasonal data not found" }
      }

      const results = {
        data: seasonalData.data.map(anime => ({
          id: anime.mal_id?.toString(),
          title: anime.title,
          titleEnglish: anime.title_english,
          synopsis: anime.synopsis,
          coverImage: anime.images?.jpg?.large_image_url,
          bannerImage: anime.trailer?.images?.maximum_image_url,
          episodes: anime.episodes,
          status: anime.status,
          rating: anime.score,
          year: anime.year,
          genres: anime.genres?.map(g => g.name) || [],
          source: 'jikan'
        })),
        pagination: {
          has_next_page: false,
          current_page: page,
          items: { count: seasonalData.data.length, total: seasonalData.data.length, per_page: 20 }
        }
      }

      return results
    } catch (error) {
      fastify.log.error("Error fetching seasonal anime:", error)
      reply.code(500)
      return { error: "Failed to fetch seasonal anime" }
    }
  })
}
