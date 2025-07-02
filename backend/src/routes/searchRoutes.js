export default async function searchRoutes(fastify, options) {
  // Universal search endpoint
  fastify.get("/", async (request, reply) => {
    const { q: query, type = "all", source = "all", page = 1, limit = 20 } = request.query

    if (!query || query.trim().length < 2) {
      return reply.code(400).send({
        error: "Query must be at least 2 characters long",
      })
    }

    try {
      const results = {
        anime: [],
        manga: [],
        characters: [],
        total: 0,
      }

      // Search anime
      if (type === "all" || type === "anime") {
        const animePromises = []

        if (source === "all" || source === "jikan") {
          animePromises.push(
            fastify.apiServices.jikan
              .searchAnime(query, page, limit)
              .then((data) => ({ source: "jikan", data }))
              .catch((err) => ({ source: "jikan", error: err.message })),
          )
        }

        if (source === "all" || source === "anilist") {
          animePromises.push(
            fastify.apiServices.aniList
              .searchAnime(query, page, limit)
              .then((data) => ({ source: "anilist", data }))
              .catch((err) => ({ source: "anilist", error: err.message })),
          )
        }

        if (source === "all" || source === "kitsu") {
          animePromises.push(
            fastify.apiServices.kitsu
              .searchAnime(query, limit)
              .then((data) => ({ source: "kitsu", data }))
              .catch((err) => ({ source: "kitsu", error: err.message })),
          )
        }

        const animeResults = await Promise.all(animePromises)

        // Process and merge anime results
        for (const result of animeResults) {
          if (result.data && !result.error) {
            const transformedAnime = transformSearchResults(result.data, result.source, "anime")
            results.anime.push(...transformedAnime)
          }
        }
      }

      // Search manga
      if (type === "all" || type === "manga") {
        const mangaPromises = []

        if (source === "all" || source === "jikan") {
          mangaPromises.push(
            fastify.apiServices.jikan
              .searchManga(query, page, limit)
              .then((data) => ({ source: "jikan", data }))
              .catch((err) => ({ source: "jikan", error: err.message })),
          )
        }

        if (source === "all" || source === "anilist") {
          mangaPromises.push(
            fastify.apiServices.aniList
              .searchManga(query, page, limit)
              .then((data) => ({ source: "anilist", data }))
              .catch((err) => ({ source: "anilist", error: err.message })),
          )
        }

        if (source === "all" || source === "mangadx") {
          mangaPromises.push(
            fastify.apiServices.mangaDex
              .searchManga(query, limit)
              .then((data) => ({ source: "mangadx", data }))
              .catch((err) => ({ source: "mangadx", error: err.message })),
          )
        }

        const mangaResults = await Promise.all(mangaPromises)

        // Process and merge manga results
        for (const result of mangaResults) {
          if (result.data && !result.error) {
            const transformedManga = transformSearchResults(result.data, result.source, "manga")
            results.manga.push(...transformedManga)
          }
        }
      }

      // Search local database for characters
      if (type === "all" || type === "characters") {
        const characters = await fastify.prisma.character.findMany({
          where: {
            name: {
              contains: query,
              mode: "insensitive",
            },
          },
          include: {
            anime: {
              select: { title: true, coverImage: true },
            },
            manga: {
              select: { title: true, coverImage: true },
            },
          },
          take: Number.parseInt(limit),
        })

        results.characters = characters.map((char) => ({
          id: char.id,
          name: char.name,
          avatar: char.avatar,
          description: char.description,
          source: char.anime || char.manga,
          type: "character",
        }))
      }

      // Remove duplicates and sort by relevance
      results.anime = removeDuplicates(results.anime, "title")
      results.manga = removeDuplicates(results.manga, "title")

      results.total = results.anime.length + results.manga.length + results.characters.length

      return {
        query,
        results,
        pagination: {
          page: Number.parseInt(page),
          limit: Number.parseInt(limit),
          total: results.total,
        },
      }
    } catch (error) {
      fastify.log.error("Search error:", error)
      return reply.code(500).send({
        error: "Search failed",
        message: error.message,
      })
    }
  })

  // Get search suggestions
  fastify.get("/suggestions", async (request, reply) => {
    const { q: query } = request.query

    if (!query || query.trim().length < 2) {
      return []
    }

    try {
      // Get suggestions from local database
      const [animeResults, mangaResults, characterResults] = await Promise.all([
        fastify.prisma.anime.findMany({
          where: {
            title: {
              contains: query,
              mode: "insensitive",
            },
          },
          select: { title: true, coverImage: true },
          take: 5,
        }),
        fastify.prisma.manga.findMany({
          where: {
            title: {
              contains: query,
              mode: "insensitive",
            },
          },
          select: { title: true, coverImage: true },
          take: 5,
        }),
        fastify.prisma.character.findMany({
          where: {
            name: {
              contains: query,
              mode: "insensitive",
            },
          },
          select: { name: true, avatar: true },
          take: 5,
        }),
      ])

      const suggestions = [
        ...animeResults.map((anime) => ({
          text: anime.title,
          type: "anime",
          image: anime.coverImage,
        })),
        ...mangaResults.map((manga) => ({
          text: manga.title,
          type: "manga",
          image: manga.coverImage,
        })),
        ...characterResults.map((char) => ({
          text: char.name,
          type: "character",
          image: char.avatar,
        })),
      ]

      return suggestions.slice(0, 10)
    } catch (error) {
      fastify.log.error("Suggestions error:", error)
      return []
    }
  })

  // Advanced search with filters
  fastify.post("/advanced", async (request, reply) => {
    const {
      query,
      type = "all",
      genres = [],
      status,
      year,
      rating,
      page = 1,
      limit = 20,
      sortBy = "relevance",
    } = request.body

    try {
      const results = {
        anime: [],
        manga: [],
        total: 0,
      }

      // Build search parameters
      const searchParams = {
        query,
        genres,
        status,
        year,
        rating,
        page,
        limit,
        sortBy,
      }

      if (type === "all" || type === "anime") {
        // Search anime with filters
        const animeData = await searchAnimeWithFilters(searchParams, fastify)
        results.anime = animeData
      }

      if (type === "all" || type === "manga") {
        // Search manga with filters
        const mangaData = await searchMangaWithFilters(searchParams, fastify)
        results.manga = mangaData
      }

      results.total = results.anime.length + results.manga.length

      return {
        query,
        filters: { genres, status, year, rating, sortBy },
        results,
        pagination: {
          page: Number.parseInt(page),
          limit: Number.parseInt(limit),
          total: results.total,
        },
      }
    } catch (error) {
      fastify.log.error("Advanced search error:", error)
      return reply.code(500).send({
        error: "Advanced search failed",
        message: error.message,
      })
    }
  })
}

// Helper functions
function transformSearchResults(data, source, type) {
  switch (source) {
    case "jikan":
      return (
        data.data?.map((item) => ({
          id: `${source}-${item.mal_id}`,
          title: item.title || item.title_english,
          titleJp: item.title_japanese,
          synopsis: item.synopsis,
          coverImage: item.images?.jpg?.large_image_url || item.images?.jpg?.image_url,
          rating: item.score,
          year: item.year || (item.published ? new Date(item.published.from).getFullYear() : null),
          status: item.status,
          genres: item.genres?.map((g) => g.name) || [],
          episodes: type === "anime" ? item.episodes : undefined,
          chapters: type === "manga" ? item.chapters : undefined,
          source,
          type,
          malId: item.mal_id,
        })) || []
      )

    case "anilist":
      const items = data.data?.Page?.media || []
      return items.map((item) => ({
        id: `${source}-${item.id}`,
        title: item.title?.english || item.title?.romaji,
        titleJp: item.title?.native,
        synopsis: item.description?.replace(/<[^>]*>/g, ""),
        coverImage: item.coverImage?.large || item.coverImage?.medium,
        bannerImage: item.bannerImage,
        rating: item.averageScore ? item.averageScore / 10 : null,
        year: item.seasonYear || item.startDate?.year,
        status: item.status,
        genres: item.genres || [],
        episodes: item.episodes,
        chapters: item.chapters,
        popularity: item.popularity,
        favourites: item.favourites,
        source,
        type,
        anilistId: item.id,
      }))

    case "kitsu":
      const kitsuItems = data.data || []
      return kitsuItems.map((item) => {
        const attrs = item.attributes
        return {
          id: `${source}-${item.id}`,
          title: attrs.canonicalTitle || attrs.titles?.en,
          titleJp: attrs.titles?.ja_jp,
          synopsis: attrs.synopsis,
          coverImage: attrs.posterImage?.large || attrs.posterImage?.medium,
          bannerImage: attrs.coverImage?.large,
          rating: attrs.averageRating ? Number.parseFloat(attrs.averageRating) / 10 : null,
          year: attrs.startDate ? new Date(attrs.startDate).getFullYear() : null,
          status: attrs.status,
          genres: [],
          episodes: attrs.episodeCount,
          chapters: attrs.chapterCount,
          source,
          type,
          kitsuId: item.id,
        }
      })

    case "mangadx":
      const mangadxItems = data.data || []
      return mangadxItems.map((item) => {
        const attrs = item.attributes
        return {
          id: `${source}-${item.id}`,
          title: attrs.title?.en || Object.values(attrs.title)[0],
          titleJp: attrs.title?.ja,
          synopsis: attrs.description?.en || Object.values(attrs.description)[0],
          coverImage: null, // Would need to fetch cover art separately
          rating: null,
          year: attrs.year,
          status: attrs.status,
          genres:
            attrs.tags?.filter((tag) => tag.attributes.group === "genre").map((tag) => tag.attributes.name.en) || [],
          chapters: null,
          source,
          type,
          mangadxId: item.id,
        }
      })

    default:
      return []
  }
}

function removeDuplicates(items, key) {
  const seen = new Set()
  return items.filter((item) => {
    const value = item[key]?.toLowerCase()
    if (seen.has(value)) {
      return false
    }
    seen.add(value)
    return true
  })
}

async function searchAnimeWithFilters(params, fastify) {
  // Implementation for filtered anime search
  // This would combine multiple API calls with local filtering
  try {
    const jikanData = await fastify.apiServices.jikan.searchAnime(params.query, params.page, params.limit)
    return transformSearchResults(jikanData, "jikan", "anime")
  } catch (error) {
    fastify.log.error("Filtered anime search error:", error)
    return []
  }
}

async function searchMangaWithFilters(params, fastify) {
  // Implementation for filtered manga search
  try {
    const jikanData = await fastify.apiServices.jikan.searchManga(params.query, params.page, params.limit)
    return transformSearchResults(jikanData, "jikan", "manga")
  } catch (error) {
    fastify.log.error("Filtered manga search error:", error)
    return []
  }
}
