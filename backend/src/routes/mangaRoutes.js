import axios from 'axios'

const BASE_URL = 'https://api.mangadex.org'

// Helper function to process mangadex results to match frontend expectations
const processmangadexResults = (mangaList) => {
  return mangaList.map(manga => {
    const attributes = manga.attributes
    
    // Find cover art relationship
    const coverArt = manga.relationships?.find(rel => rel.type === 'cover_art')
    const coverUrl = coverArt ? 
      `https://uploads.mangadex.org/covers/${manga.id}/${coverArt.attributes?.fileName}` : 
      '/placeholder.jpg'
    
    // Extract authors
    const authors = manga.relationships?.filter(rel => rel.type === 'author')
      .map(rel => ({
        id: rel.id,
        name: rel.attributes?.name || 'Unknown Author'
      })) || []
    
    // Extract genres from tags
    const genres = attributes.tags?.map(tag => ({
      id: tag.id,
      name: tag.attributes?.name?.en || Object.values(tag.attributes?.name || {})[0] || 'Unknown'
    })) || []
    
    return {
      malId: manga.id,
      title: attributes.title?.en || Object.values(attributes.title || {})[0] || 'Unknown Title',
      titleEnglish: attributes.title?.en,
      titleJapanese: attributes.title?.ja,
      coverImage: coverUrl,
      rating: attributes.rating || null,
      chapters: attributes.lastChapter ? parseInt(attributes.lastChapter) : null,
      volumes: attributes.lastVolume ? parseInt(attributes.lastVolume) : null,
      status: attributes.status || 'unknown',
      year: attributes.year || null,
      genres: genres,
      synopsis: attributes.description?.en || 
               Object.values(attributes.description || {})[0] || 
               'No description available',
      authors: authors.length > 0 ? authors : [{ id: 'unknown', name: 'Unknown Author' }],
      source: 'mangadex',
      isInReadingList: false,
      readingStatus: undefined
    }
  })
}

export default async function mangaRoutes(fastify, options) {
  // Get manga list (search/browse)
  fastify.get("/", async (request, reply) => {
    const { 
      q: search, 
      page = 1, 
      limit = 20,
      genre,
      status,
      year 
    } = request.query

    try {
      const params = {
        limit: Math.min(limit, 100),
        offset: (page - 1) * limit,
        order: { followedCount: 'desc', rating: 'desc' },
        contentRating: ['safe', 'suggestive', 'erotica'],
        includes: ['cover_art', 'author', 'artist'],
        hasAvailableChapters: true
      }

      // Add search query if provided
      if (search && search.trim()) {
        params.title = search.trim()
      }

      // Add filters
      if (status && status !== 'any') {
        params.status = [status]
      }
      
      if (year && year !== 'any') {
        params.year = year
      }

      const response = await axios.get(`${BASE_URL}/manga`, { params })
      
      if (!response.data?.data) {
        throw new Error('Invalid response from mangadex API')
      }

      const processedData = processmangadexResults(response.data.data)

      return {
        data: processedData,
        pagination: {
          current_page: parseInt(page),
          has_next_page: response.data.offset + response.data.limit < response.data.total,
          items: {
            count: response.data.data.length,
            total: response.data.total,
            per_page: parseInt(limit)
          }
        }
      }
    } catch (error) {
      fastify.log.error("Manga route error:", error)
      return reply.code(500).send({ 
        error: "Failed to fetch manga",
        message: error.message || "An unexpected error occurred"
      })
    }
  })

  // Get manga by ID
  fastify.get("/:id", async (request, reply) => {
    const { id } = request.params

    try {
      const response = await axios.get(`${BASE_URL}/manga/${id}`, {
        params: {
          includes: ['cover_art', 'author', 'artist']
        }
      })
      
      if (!response.data?.data) {
        return reply.code(404).send({ error: "Manga not found" })
      }

      const processedData = processmangadexResults([response.data.data])
      return processedData[0]
    } catch (error) {
      fastify.log.error("Failed to get manga by ID:", error)
      return reply.code(500).send({ 
        error: "Failed to fetch manga details",
        message: error.message || "An unexpected error occurred"
      })
    }
  })

  // Get manga chapters
  fastify.get("/:id/chapters", async (request, reply) => {
    const { id } = request.params
    const { page = 1, limit = 50 } = request.query

    try {
      const response = await axios.get(`${BASE_URL}/chapter`, {
        params: {
          manga: id,
          translatedLanguage: ['en'],
          order: { chapter: 'asc' },
          limit: Math.min(limit, 500),
          offset: (page - 1) * limit
        }
      })
      
      return {
        data: response.data.data,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: response.data.total,
          hasNext: response.data.offset + response.data.limit < response.data.total,
        }
      }
    } catch (error) {
      fastify.log.error("Failed to get manga chapters:", error)
      return reply.code(500).send({ error: "Failed to fetch manga chapters" })
    }
  })

  // Get chapter content/pages
  fastify.get("/:id/chapters/:chapterNumber", async (request, reply) => {
    const { id, chapterNumber } = request.params

    try {
      // First, get the chapter by manga ID and chapter number
      const chaptersResponse = await axios.get(`${BASE_URL}/chapter`, {
        params: {
          manga: id,
          chapter: chapterNumber,
          translatedLanguage: ['en'],
          limit: 10 // Get more results to find the best match
        }
      })

      if (!chaptersResponse.data?.data || chaptersResponse.data.data.length === 0) {
        return reply.code(404).send({ error: 'Chapter not found' })
      }

      // Find the best matching chapter (prefer chapters with actual pages)
      let chapterData = chaptersResponse.data.data.find(ch => 
        ch.attributes.chapter === chapterNumber && ch.attributes.pages > 0
      )
      
      // If no chapter with pages found, take the first match
      if (!chapterData) {
        chapterData = chaptersResponse.data.data[0]
      }

      // Check if chapter has external URL (hosted elsewhere)
      if (chapterData.attributes.externalUrl) {
        return {
          chapter: chapterNumber,
          title: chapterData.attributes.title || `Chapter ${chapterNumber}`,
          externalUrl: chapterData.attributes.externalUrl,
          pages: [],
          total: 0,
          source: 'external',
          message: 'This chapter is hosted on an external site. Please visit the provided URL to read it.'
        }
      }

      // Check if chapter has pages
      if (chapterData.attributes.pages === 0) {
        return reply.code(404).send({ 
          error: 'Chapter pages not available',
          message: 'This chapter does not have readable pages on MangaDx'
        })
      }
      
      // Get the pages for this chapter
      const pagesResponse = await axios.get(`${BASE_URL}/at-home/server/${chapterData.id}`)
      
      if (!pagesResponse.data) {
        return reply.code(404).send({ error: 'Chapter pages not found' })
      }

      const baseUrl = pagesResponse.data.baseUrl
      const chapterHash = pagesResponse.data.chapter.hash
      const pageFilenames = pagesResponse.data.chapter.data

      const pages = pageFilenames.map((filename, index) => ({
        number: index + 1,
        url: `${baseUrl}/data/${chapterHash}/${filename}`,
        filename: filename
      }))

      return {
        chapter: chapterNumber,
        title: chapterData.attributes.title || `Chapter ${chapterNumber}`,
        pages: pages,
        total: pages.length,
        source: 'mangadx'
      }
    } catch (error) {
      fastify.log.error("Failed to get chapter content:", error)
      return reply.code(500).send({ error: "Failed to fetch chapter content" })
    }
  })

  // Get trending manga
  fastify.get("/trending", async (request, reply) => {
    try {
      const response = await axios.get(`${BASE_URL}/manga`, {
        params: {
          limit: 20,
          order: { followedCount: 'desc' },
          contentRating: ['safe', 'suggestive', 'erotica'],
          includes: ['cover_art', 'author', 'artist'],
          hasAvailableChapters: true
        }
      })
      
      const processedData = processmangadexResults(response.data.data)
      return {
        data: processedData,
        pagination: {
          current_page: 1,
          has_next_page: true,
          items: {
            count: processedData.length,
            total: response.data.total,
            per_page: 20
          }
        }
      }
    } catch (error) {
      fastify.log.error("Trending manga error:", error)
      return reply.code(500).send({ error: "Failed to fetch trending manga" })
    }
  })

  // Get top manga (alias for trending)
  fastify.get("/top", async (request, reply) => {
    try {
      const response = await axios.get(`${BASE_URL}/manga`, {
        params: {
          limit: 20,
          order: { rating: 'desc' },
          contentRating: ['safe', 'suggestive', 'erotica'],
          includes: ['cover_art', 'author', 'artist'],
          hasAvailableChapters: true
        }
      })
      
      const processedData = processmangadexResults(response.data.data)
      return {
        data: processedData,
        pagination: {
          current_page: 1,
          has_next_page: true,
          items: {
            count: processedData.length,
            total: response.data.total,
            per_page: 20
          }
        }
      }
    } catch (error) {
      fastify.log.error("Top manga error:", error)
      return reply.code(500).send({ error: "Failed to fetch top manga" })
    }
  })
}
