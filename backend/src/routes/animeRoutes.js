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
          id: anime.mal_id,
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
          id: anime.id,
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
          genres: true,
          episodes: true,
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
          title: animeData.title,
          titleEnglish: animeData.title_english,
          synopsis: animeData.synopsis,
          coverImage: animeData.images?.jpg?.large_image_url,
          bannerImage: animeData.trailer?.images?.maximum_image_url,
          episodes: animeData.episodes || 0,
          status: animeData.status,
          rating: animeData.score || 0,
          year: animeData.year || null,
          genres: animeData.genres?.map(g => ({ name: g.name })) || [],
          characters: characters.map(c => ({
            name: c.character?.name || '',
            role: c.role || 'Unknown',
            image: c.character?.images?.jpg?.image_url || null
          }))
        }

        // Try to store in database but don't fail if it errors
        try {
          await fastify.prisma.anime.create({
            data: {
              ...anime,
              genres: {
                create: anime.genres
              },
              characters: {
                create: anime.characters
              }
            }
          })
        } catch (dbError) {
          fastify.log.warn("Failed to store anime in database:", dbError)
        }
      }

      // Get watch progress if user is authenticated
      let watchProgress = null
      if (userId) {
        try {
          watchProgress = await fastify.prisma.watchProgress.findMany({
            where: {
              userId,
              animeId: id,
            },
          })
        } catch (progressError) {
          fastify.log.warn("Failed to fetch watch progress:", progressError)
        }
      }

      // Get streaming info
      let streamingInfo = null
      try {
        streamingInfo = await fastify.apiServices.consumet.getAnimeInfo(id)
      } catch (streamError) {
        fastify.log.warn("Failed to fetch streaming info:", streamError)
      }

      return {
        ...anime,
        watchProgress,
        streamingInfo
      }
    } catch (error) {
      fastify.log.error("Error fetching anime:", error)
      reply.code(500)
      return { error: "Failed to fetch anime" }
    }
  })

  // Get streaming URL for an episode
  fastify.get("/:animeId/episodes/:episodeId/stream", async (request, reply) => {
    try {
      const { animeId, episodeId } = request.params
      
      // Set CORS headers for streaming
      reply.header('Access-Control-Allow-Origin', '*')
      reply.header('Access-Control-Allow-Methods', 'GET, OPTIONS')
      reply.header('Access-Control-Allow-Headers', 'Content-Type, Range')
      
      // Try to get from cache first
      const cacheKey = `stream:${animeId}:${episodeId}`
      let streamingData = await fastify.redis.get(cacheKey)
      
      if (!streamingData) {
        // Get fresh streaming data
        streamingData = await fastify.apiServices.consumet.getStreamingUrl(episodeId)
        
        if (!streamingData?.sources?.length) {
          reply.code(404)
          throw new Error("No streaming sources available")
        }
        
        // Cache for 1 hour
        await fastify.redis.set(cacheKey, JSON.stringify(streamingData), 'EX', 3600)
      } else {
        streamingData = JSON.parse(streamingData)
      }

      // Add required streaming headers
      const headers = {
        'Accept-Ranges': 'bytes',
        'Content-Type': 'application/json',
        ...streamingData.headers
      }

      return {
        sources: streamingData.sources,
        headers
      }
    } catch (error) {
      fastify.log.error("Error fetching stream:", error)
      if (error.message === "No streaming sources available") {
        reply.code(404)
        return { error: error.message }
      }
      reply.code(500)
      return { error: "Failed to fetch streaming URL" }
    }
  })

  // Update watch progress
  fastify.post("/:animeId/episodes/:episodeId/progress", async (request, reply) => {
    try {
      const { animeId, episodeId } = request.params
      const { progress } = request.body
      const userId = request.user?.id

      if (!userId) {
        reply.code(401)
        throw new Error("Authentication required")
      }

      const watchProgress = await fastify.prisma.watchProgress.upsert({
          where: {
          userId_animeId_episodeId: {
            userId,
            animeId,
            episodeId,
            },
          },
          update: {
          progress,
            updatedAt: new Date(),
          },
          create: {
            userId,
          animeId,
          episodeId,
          progress,
        },
      })

      return watchProgress
      } catch (error) {
      fastify.log.error("Error updating watch progress:", error)
      throw new Error("Failed to update watch progress")
    }
  })
}
