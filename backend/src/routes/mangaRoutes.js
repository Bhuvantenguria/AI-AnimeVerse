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
    const { page = 1, limit = 100 } = request.query // Increased default limit

    console.log('📖 CHAPTERS REQUEST:')
    console.log('  - Manga ID:', id)
    console.log('  - Page:', page)
    console.log('  - Limit:', limit)

    try {
      const response = await axios.get(`${BASE_URL}/chapter`, {
        params: {
          manga: id,
          translatedLanguage: ['en'],
          order: { chapter: 'asc' },
          limit: Math.min(limit, 500), // Allow up to 500 chapters
          offset: (page - 1) * limit,
          includes: ['scanlation_group']
        }
      })
      
      console.log('✅ MANGADX CHAPTERS RESPONSE:')
      console.log('  - Status Code:', response.status)
      console.log('  - Chapters Found:', response.data?.data?.length || 0)
      console.log('  - Total Available:', response.data?.total || 0)
      console.log('  - Has Next Page:', response.data.offset + response.data.limit < response.data.total)
      
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
      console.error('❌ CHAPTERS FETCH ERROR:', error.response?.data || error.message)
      fastify.log.error("Failed to get manga chapters:", error)
      return reply.code(500).send({ error: "Failed to fetch manga chapters" })
    }
  })

  // Get chapter content/pages
  fastify.get("/:id/chapters/:chapterNumber", async (request, reply) => {
    const { id, chapterNumber } = request.params

    console.log('📄 CHAPTER CONTENT REQUEST:')
    console.log('  - Manga ID:', id)
    console.log('  - Chapter Number:', chapterNumber)

    try {
      console.log('📡 MANGADX API REQUEST (Finding Chapter):', `${BASE_URL}/chapter`)
      console.log('   Params:', { manga: id, chapter: chapterNumber, translatedLanguage: ['en'], limit: 10 })
      
      // First, get the chapter by manga ID and chapter number
      const chaptersResponse = await axios.get(`${BASE_URL}/chapter`, {
        params: {
          manga: id,
          chapter: chapterNumber,
          translatedLanguage: ['en'],
          limit: 10 // Get more results to find the best match
        }
      })

      console.log('✅ MANGADX CHAPTERS SEARCH RESPONSE:')
      console.log('  - Status Code:', chaptersResponse.status)
      console.log('  - Chapters Found:', chaptersResponse.data?.data?.length || 0)
      console.log('  - All Chapters:', chaptersResponse.data?.data?.map(ch => ({
        id: ch.id,
        chapter: ch.attributes.chapter,
        title: ch.attributes.title,
        pages: ch.attributes.pages,
        externalUrl: ch.attributes.externalUrl
      })) || [])

      if (!chaptersResponse.data?.data || chaptersResponse.data.data.length === 0) {
        console.log('❌ No chapters found for this manga/chapter combination')
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

  // Request manga narration
  fastify.post("/:id/narrate", async (request, reply) => {
    const { id } = request.params
    const { 
      chapterNumber, 
      voiceType = 'narrator', 
      language = 'en',
      speed = 1.0,
      includeDialogue = true,
      includeNarration = true 
    } = request.body

    console.log('🔊 MANGA NARRATION REQUEST:')
    console.log('  - Manga ID:', id)
    console.log('  - Chapter:', chapterNumber)
    console.log('  - Voice Type:', voiceType)
    console.log('  - Language:', language)

    try {
      // Get manga details
      const mangaResponse = await axios.get(`${BASE_URL}/manga/${id}`, {
        params: {
          includes: ['cover_art', 'author', 'artist']
        }
      })
      
      if (!mangaResponse.data?.data) {
        return reply.code(404).send({ error: "Manga not found" })
      }

      const manga = mangaResponse.data.data
      
      // Get chapter content
      const chapterResponse = await axios.get(`${BASE_URL}/chapter`, {
        params: {
          manga: id,
          chapter: chapterNumber,
          translatedLanguage: [language],
          limit: 1
        }
      })

      if (!chapterResponse.data?.data || chapterResponse.data.data.length === 0) {
        return reply.code(404).send({ error: "Chapter not found" })
      }

      const chapter = chapterResponse.data.data[0]

      // Create narration request
      const narrationRequest = {
        id: `narration_${Date.now()}`,
        mangaId: id,
        mangaTitle: manga.attributes.title?.en || Object.values(manga.attributes.title || {})[0],
        chapterNumber: chapterNumber,
        chapterTitle: chapter.attributes.title || `Chapter ${chapterNumber}`,
        voiceType,
        language,
        speed,
        includeDialogue,
        includeNarration,
        status: 'processing',
        createdAt: new Date().toISOString()
      }

      // In a real implementation, you would:
      // 1. Add to narration job queue
      // 2. Process manga pages with OCR to extract text
      // 3. Generate audio using TTS service
      // 4. Store the audio file
      
      // For now, simulate the process
      console.log('✅ Narration request created:', narrationRequest.id)
      
      return {
        requestId: narrationRequest.id,
        status: 'processing',
        manga: {
          id: manga.id,
          title: narrationRequest.mangaTitle,
          chapter: narrationRequest.chapterNumber,
          chapterTitle: narrationRequest.chapterTitle
        },
        settings: {
          voiceType,
          language,
          speed,
          includeDialogue,
          includeNarration
        },
        estimatedTime: '2-5 minutes',
        message: 'Narration generation started. You will be notified when ready.'
      }
    } catch (error) {
      console.error('❌ NARRATION REQUEST ERROR:', error)
      fastify.log.error("Narration request error:", error)
      return reply.code(500).send({ 
        error: "Failed to request narration",
        message: error.message || "An unexpected error occurred"
      })
    }
  })

  // Get narration status
  fastify.get("/narration/:requestId", async (request, reply) => {
    const { requestId } = request.params

    try {
      // In a real implementation, you would check the database/cache for request status
      // For now, simulate different statuses
      const mockStatus = {
        requestId,
        status: 'completed', // or 'processing', 'failed'
        audioUrl: '/api/audio/sample-narration.mp3', // Mock audio URL
        duration: 180, // 3 minutes
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString()
      }

      return mockStatus
    } catch (error) {
      fastify.log.error("Get narration status error:", error)
      return reply.code(500).send({ error: "Failed to get narration status" })
    }
  })

  // Get available voices
  fastify.get("/voices", async (request, reply) => {
    try {
      const voices = [
        {
          id: 'narrator-male',
          name: 'Male Narrator',
          type: 'narrator',
          gender: 'male',
          language: 'en',
          description: 'Professional male narrator voice'
        },
        {
          id: 'narrator-female',
          name: 'Female Narrator',
          type: 'narrator',
          gender: 'female',
          language: 'en',
          description: 'Professional female narrator voice'
        },
        {
          id: 'character-young-male',
          name: 'Young Male Character',
          type: 'character',
          gender: 'male',
          language: 'en',
          description: 'Young male character voice'
        },
        {
          id: 'character-young-female',
          name: 'Young Female Character',
          type: 'character',
          gender: 'female',
          language: 'en',
          description: 'Young female character voice'
        },
        {
          id: 'character-old-male',
          name: 'Elder Male Character',
          type: 'character',
          gender: 'male',
          language: 'en',
          description: 'Wise elder male voice'
        }
      ]

      return {
        voices,
        defaultVoice: 'narrator-male',
        supportedLanguages: ['en', 'ja', 'es', 'fr', 'de']
      }
    } catch (error) {
      fastify.log.error("Get voices error:", error)
      return reply.code(500).send({ error: "Failed to get available voices" })
    }
  })

  // Start manga chat session
  fastify.post("/:id/chat", async (request, reply) => {
    const { id } = request.params
    const { chapterNumber, context } = request.body

    console.log('💬 MANGA CHAT SESSION REQUEST:')
    console.log('  - Manga ID:', id)
    console.log('  - Chapter:', chapterNumber)
    console.log('  - Context:', context)

    try {
      // Get manga details
      const mangaResponse = await axios.get(`${BASE_URL}/manga/${id}`, {
        params: {
          includes: ['cover_art', 'author', 'artist']
        }
      })
      
      if (!mangaResponse.data?.data) {
        return reply.code(404).send({ error: "Manga not found" })
      }

      const manga = mangaResponse.data.data
      const mangaTitle = manga.attributes.title?.en || Object.values(manga.attributes.title || {})[0]

      // Create chat session
      const chatSession = {
        id: `manga_chat_${Date.now()}`,
        mangaId: id,
        mangaTitle,
        chapterNumber,
        character: {
          id: 'manga-expert',
          name: 'Manga Expert',
          avatar: '/placeholder.svg?height=50&width=50',
          description: `Expert on ${mangaTitle} - ready to explain panels, characters, and story elements!`,
          personality: ['Knowledgeable', 'Helpful', 'Enthusiastic', 'Patient']
        },
        context: context || {},
        createdAt: new Date().toISOString(),
        welcomeMessage: `Hello! I'm here to help you understand ${mangaTitle}${chapterNumber ? ` Chapter ${chapterNumber}` : ''}. Feel free to ask me about any panels, characters, plot points, or anything else you'd like to know! 📚✨`
      }

      console.log('✅ Chat session created:', chatSession.id)

      return {
        sessionId: chatSession.id,
        character: chatSession.character,
        manga: {
          id: manga.id,
          title: mangaTitle,
          chapter: chapterNumber
        },
        welcomeMessage: chatSession.welcomeMessage,
        context: chatSession.context
      }
    } catch (error) {
      console.error('❌ CHAT SESSION ERROR:', error)
      fastify.log.error("Chat session error:", error)
      return reply.code(500).send({ 
        error: "Failed to create chat session",
        message: error.message || "An unexpected error occurred"
      })
    }
  })

  // Send message to manga chat
  fastify.post("/chat/:sessionId/message", async (request, reply) => {
    const { sessionId } = request.params
    const { message, panelNumber, pageNumber } = request.body

    console.log('💬 MANGA CHAT MESSAGE:')
    console.log('  - Session ID:', sessionId)
    console.log('  - Message:', message)
    console.log('  - Panel:', panelNumber)
    console.log('  - Page:', pageNumber)

    try {
      // In a real implementation, you would:
      // 1. Validate session exists
      // 2. Get manga context and current chapter
      // 3. Use AI to generate contextual response
      // 4. Store conversation history
      
      // For now, simulate AI response
      const aiResponse = generateMangaChatResponse(message, {
        sessionId,
        panelNumber,
        pageNumber
      })

      const response = {
        id: `msg_${Date.now()}`,
        sessionId,
        message: aiResponse,
        timestamp: new Date().toISOString(),
        type: 'assistant'
      }

      return response
    } catch (error) {
      console.error('❌ CHAT MESSAGE ERROR:', error)
      fastify.log.error("Chat message error:", error)
      return reply.code(500).send({ 
        error: "Failed to send message",
        message: error.message || "An unexpected error occurred"
      })
    }
  })
}

// Helper function to generate manga chat responses
function generateMangaChatResponse(message, context) {
  const lowerMessage = message.toLowerCase()
  
  // Context-aware responses based on message content
  if (lowerMessage.includes('panel') || lowerMessage.includes('scene')) {
    return `I can see you're asking about a specific panel! ${context.panelNumber ? `Looking at panel ${context.panelNumber}` : 'If you can point me to which panel you mean'}, I can explain the artistic techniques, story significance, or character emotions shown. What specifically would you like to know about this scene?`
  }
  
  if (lowerMessage.includes('character')) {
    return `Character analysis is one of my favorites! I can explain character motivations, relationships, development arcs, and how they're portrayed visually in the manga. Which character are you curious about?`
  }
  
  if (lowerMessage.includes('story') || lowerMessage.includes('plot')) {
    return `Great question about the story! I can help explain plot points, foreshadowing, themes, and how this chapter fits into the larger narrative. What aspect of the story would you like me to clarify?`
  }
  
  if (lowerMessage.includes('art') || lowerMessage.includes('draw')) {
    return `The artwork in manga is so important for storytelling! I can discuss artistic techniques, panel composition, visual metaphors, and how the art style contributes to the mood and narrative. What artistic element caught your attention?`
  }
  
  // General helpful response
  return `That's an interesting question! I'm here to help you understand every aspect of this manga - from character motivations and plot developments to artistic techniques and cultural references. Could you be more specific about what you'd like to know? You can ask about specific panels, characters, story elements, or anything else! 📚✨`
}
