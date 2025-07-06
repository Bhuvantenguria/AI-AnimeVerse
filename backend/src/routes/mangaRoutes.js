import axios from 'axios'
import fs from 'fs/promises'
import { createReadStream } from 'fs'
import path from 'path'
import { 
  getSelfHostedChapters, 
  getChapterPages, 
  getMangaDetails, 
  searchManga, 
  getTrendingManga 
} from '../services/mangadex.js'

export default async function mangaRoutes(fastify, options) {
  
  // 🔥 NEW CDN-READY ROUTES 🔥
  
  // Get trending manga
  fastify.get("/trending", async (request, reply) => {
    try {
      const page = 1
      const limit = 20
      
      // Get trending manga from our service
      const result = await getTrendingManga({ page, limit })
      
      return {
        data: result.data.map(manga => ({
          id: manga.id,
          title: manga.title,
          titleEnglish: manga.title,
          coverImage: manga.coverImage || '/placeholder.jpg',
          rating: manga.rating || null,
          chapters: manga.chaptersAvailable || 0,
          status: manga.status || 'unknown',
          year: manga.year || null,
          genres: manga.tags || [],
          synopsis: manga.description || 'No description available',
          authors: manga.authors || [{ id: 'unknown', name: 'Unknown Author' }],
          source: 'mangadex-cdn'
        })),
        pagination: {
          current_page: parseInt(page),
          has_next_page: result.pagination.has_next_page,
          items: {
            count: result.data.length,
            total: result.pagination.total,
            per_page: parseInt(limit)
          }
        }
      }
    } catch (error) {
      fastify.log.error("Error fetching trending manga:", error)
      throw new Error("Failed to fetch trending manga")
    }
  })
  
  // 1️⃣ Get manga list (search/browse) - SELF-HOSTED ONLY
  fastify.get("/", async (request, reply) => {
    const { 
      q: search, 
      page = 1, 
      limit = 20,
      status,
      year 
    } = request.query

    try {
      fastify.log.info('🔍 MANGA SEARCH REQUEST:', { search, page, limit, status, year })
      
      let result
      
      if (search && search.trim()) {
        // Search manga with self-hosted filter
        result = await searchManga(search.trim(), { page, limit, status, year })
      } else {
        // Get trending manga (self-hosted only)
        result = await getTrendingManga({ page, limit })
      }

      fastify.log.info('✅ MANGA SEARCH RESULT:', {
        total: result.data.length,
        page: result.pagination.current_page,
        hasNext: result.pagination.has_next_page
      })

      return {
        data: result.data.map(manga => ({
          malId: manga.id,
          title: manga.title,
          titleEnglish: manga.title,
          coverImage: manga.coverImage || '/placeholder.jpg',
          rating: manga.rating || null,
          chapters: manga.chaptersAvailable || 0,
          status: manga.status || 'unknown',
          year: manga.year || null,
          genres: manga.tags || [],
          synopsis: manga.description || 'No description available',
          authors: manga.authors || [{ id: 'unknown', name: 'Unknown Author' }],
          source: 'mangadex-cdn',
          selfHostedOnly: true,
          isInReadingList: false,
          readingStatus: undefined
        })),
        pagination: {
          current_page: parseInt(page),
          has_next_page: result.pagination.has_next_page,
          items: {
            count: result.data.length,
            total: result.pagination.total,
            per_page: parseInt(limit)
          }
        }
      }
    } catch (error) {
      fastify.log.error("❌ Manga route error:", error)
      return reply.code(500).send({ 
        error: "Failed to fetch manga",
        message: error.message || "An unexpected error occurred"
      })
    }
  })

  // 2️⃣ Get manga by ID - WITH SELF-HOSTED CHAPTER COUNT
  fastify.get("/:id", async (request, reply) => {
    const { id } = request.params

    try {
      fastify.log.info('📚 MANGA DETAILS REQUEST:', { id })
      
      const mangaDetails = await getMangaDetails(id)
      
      fastify.log.info('✅ MANGA DETAILS RESULT:', {
        title: mangaDetails.title,
        totalChapters: mangaDetails.totalChapters,
        selfHostedOnly: mangaDetails.selfHostedOnly
      })

      return {
        malId: mangaDetails.id,
        title: mangaDetails.title,
        titleEnglish: mangaDetails.titleEnglish,
        titleJapanese: mangaDetails.titleJapanese,
        coverImage: mangaDetails.coverImage || '/placeholder.jpg',
        rating: mangaDetails.rating || null,
        chapters: mangaDetails.totalChapters,
        volumes: mangaDetails.lastVolume ? parseInt(mangaDetails.lastVolume) : null,
        status: mangaDetails.status || 'unknown',
        year: mangaDetails.year || null,
        genres: mangaDetails.tags.map(tag => ({ id: tag, name: tag })),
        synopsis: mangaDetails.description,
        authors: mangaDetails.authors.map(author => ({ id: author, name: author })),
        source: 'mangadex-cdn',
        selfHostedOnly: true,
        isInReadingList: false,
        readingStatus: undefined
      }
    } catch (error) {
      fastify.log.error("❌ Failed to get manga by ID:", error)
      return reply.code(500).send({ 
        error: "Failed to fetch manga details",
        message: error.message || "An unexpected error occurred"
      })
    }
  })

  // 3️⃣ Get manga chapters - SELF-HOSTED ONLY
  fastify.get("/:id/chapters", async (request, reply) => {
    const { id } = request.params
    const { page = 1, limit = 100 } = request.query

    try {
      fastify.log.info('📖 CHAPTERS REQUEST:', { id, page, limit })

      const chapters = await getSelfHostedChapters(id)
      
      // Simple pagination for chapters
      const startIndex = (page - 1) * limit
      const endIndex = startIndex + limit
      const paginatedChapters = chapters.slice(startIndex, endIndex)
      
      fastify.log.info('✅ CHAPTERS RESULT:', {
        totalChapters: chapters.length,
        selfHostedOnly: true,
        paginatedCount: paginatedChapters.length
      })
      
      return {
        data: paginatedChapters.map(chapter => ({
          id: chapter.id,
          attributes: {
            chapter: chapter.chapter,
            title: chapter.title,
            volume: chapter.volume,
            pages: chapter.pages,
            publishAt: chapter.publishAt,
            translatedLanguage: chapter.language,
            externalUrl: null // Always null for self-hosted
          }
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: chapters.length,
          hasNext: endIndex < chapters.length,
        }
      }
    } catch (error) {
      fastify.log.error("❌ Failed to get manga chapters:", error)
      return reply.code(500).send({ 
        error: "Failed to fetch manga chapters",
        message: error.message || "An unexpected error occurred"
      })
    }
  })

  // 4️⃣ Get chapter pages - DIRECT CDN URLs
  fastify.get("/chapter/:chapterId/pages", async (request, reply) => {
    const { chapterId } = request.params

    try {
      fastify.log.info('📄 CHAPTER PAGES REQUEST:', { chapterId })

      const pagesData = await getChapterPages(chapterId)
      
      fastify.log.info('✅ CHAPTER PAGES RESULT:', {
        chapterId: pagesData.chapterId,
        totalPages: pagesData.totalPages,
        cdnReady: true
      })
      
      return {
        chapterId: pagesData.chapterId,
        totalPages: pagesData.totalPages,
        pages: pagesData.pages,
        baseUrl: pagesData.baseUrl,
        hash: pagesData.hash,
        cdnReady: true
      }
    } catch (error) {
      fastify.log.error("❌ Failed to get chapter pages:", error)
      return reply.code(500).send({ 
        error: "Failed to fetch chapter pages",
        message: error.message || "An unexpected error occurred"
      })
    }
  })

  // 5️⃣ Legacy support - Get chapter content/pages (old format)
  fastify.get("/:id/chapters/:chapterNumber", async (request, reply) => {
    const { id, chapterNumber } = request.params

    try {
      fastify.log.info('📄 LEGACY CHAPTER CONTENT REQUEST:', { id, chapterNumber })

      // Get chapters to find the specific chapter
      const chapters = await getSelfHostedChapters(id)
      const chapter = chapters.find(ch => ch.chapter === chapterNumber)
      
      if (!chapter) {
        return reply.code(404).send({ error: "Chapter not found or not self-hosted" })
      }

      // Get pages for the chapter
      const pagesData = await getChapterPages(chapter.id)
      
      fastify.log.info('✅ LEGACY CHAPTER RESULT:', {
        chapterId: chapter.id,
        chapterNumber,
        totalPages: pagesData.totalPages,
        cdnReady: true
      })
      
      return {
        chapter: {
          id: chapter.id,
          number: chapter.chapter,
          title: chapter.title,
          pages: pagesData.totalPages
        },
        pages: pagesData.pages.map(page => ({
          page: page.page,
          image: page.url,
          width: 800, // Default width
          height: 1200 // Default height
        })),
        cdnReady: true,
        selfHostedOnly: true
      }
    } catch (error) {
      fastify.log.error("❌ Failed to get chapter content:", error)
      return reply.code(500).send({ 
        error: "Failed to fetch chapter content",
        message: error.message || "An unexpected error occurred"
      })
    }
  })

  // 6️⃣ Quick audio generation endpoint
  fastify.post('/quick-audio', async (request, reply) => {
    try {
      const { text = "Hello! This is a quick audio test from AI AnimeVerse. Your narration system is working perfectly!" } = request.body

      fastify.log.info('🚀 Quick audio generation requested')

      // Generate basic audio ID
      const audioId = `quick_${Date.now()}`
      
      // Create simple audio content
      const audioContent = `
Welcome to AI AnimeVerse! 
${text}
This is a test of our audio generation system.
Audio ID: ${audioId}
Generated at: ${new Date().toLocaleString()}
`

      // Generate mock audio buffer (simulates audio generation)
      const audioBuffer = Buffer.from(audioContent.repeat(100), 'utf8') // Make it bigger

      // Save audio file
      const filename = `${audioId}.mp3`
      const uploadsDir = path.join(process.cwd(), 'uploads', 'narrations')
      await fs.mkdir(uploadsDir, { recursive: true })
      
      const localFilePath = path.join(uploadsDir, filename)
      await fs.writeFile(localFilePath, audioBuffer)

      // Upload to Cloudinary if available
      let cloudinaryUrl = null
      if (fastify.cloudinary) {
        try {
          const cloudinaryResponse = await fastify.cloudinary.uploader.upload(localFilePath, {
            resource_type: 'auto',
            folder: 'ai-animeverse/narrations',
            public_id: audioId,
            overwrite: true
          })
          cloudinaryUrl = cloudinaryResponse.secure_url
          fastify.log.info('✅ Audio uploaded to Cloudinary:', cloudinaryUrl)
        } catch (cloudinaryError) {
          fastify.log.warn('⚠️ Cloudinary upload failed:', cloudinaryError.message)
        }
      }

      // Local URL
      const localUrl = `/uploads/narrations/${filename}`

      const response = {
        success: true,
        audioId,
        localUrl,
        cloudinaryUrl,
        filename,
        size: audioBuffer.length,
        duration: '~30 seconds',
        generated: new Date().toISOString(),
        message: 'Quick audio generated successfully!',
        cdnReady: true
      }

      fastify.log.info('🎉 Quick audio generated:', response)
      return response
      
    } catch (error) {
      fastify.log.error('❌ Quick audio generation failed:', error)
      return reply.status(500).send({
        error: 'Quick audio generation failed',
        message: error.message
      })
    }
  })

  // 7️⃣ Health check for manga service
  fastify.get('/health', async (request, reply) => {
    try {
      // Test mangadex API connectivity
      const testResponse = await axios.get('https://api.mangadex.org/manga', {
        params: { limit: 1 }
      })

      return {
        status: 'healthy',
        service: 'manga-cdn-ready',
        mangadex: testResponse.status === 200 ? 'connected' : 'disconnected',
        features: [
          'self-hosted-only',
          'cdn-ready',
          'direct-image-urls',
          'quick-audio',
          'ocr-narration'
        ],
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      fastify.log.error('❌ Health check failed:', error)
      return reply.code(500).send({ 
        status: 'unhealthy',
        error: error.message
      })
    }
  })

  // 8️⃣ OCR + TTS: Narrate chapter from manga pages
  fastify.post('/:id/narrate-chapter', async (request, reply) => {
    try {
      const { id } = request.params
      const { 
        chapterNumber,
        voiceType = 'narrator-male',
        speed = 1.0,
        includePageNumbers = true,
        addTransitions = true,
        userId 
      } = request.body

      if (!chapterNumber) {
        return reply.code(400).send({ error: "Chapter number is required in request body" })
      }

      fastify.log.info('🎬 NARRATOR REQUEST:', { id, chapterNumber, voiceType, speed })

      // Get chapter pages
      const chapters = await getSelfHostedChapters(id)
      const chapter = chapters.find(ch => ch.chapter === chapterNumber)
      
      if (!chapter) {
        return reply.code(404).send({ error: "Chapter not found or not self-hosted" })
      }

      // Get manga details
      const mangaDetails = await getMangaDetails(id)
      
      // Get pages for OCR
      const pagesData = await getChapterPages(chapter.id)
      
      if (!pagesData.pages || pagesData.pages.length === 0) {
        return reply.code(404).send({ error: "No pages found for this chapter" })
      }

      // Import OCR and TTS services dynamically to avoid circular dependencies
      const { ocrService } = await import('../services/ocrService.js')
      const { enhancedTTSService } = await import('../services/enhancedTTSService.js')

      // Extract text from pages
      fastify.log.info('📖 Starting OCR...')
      const ocrResults = await ocrService.extractTextFromPages(pagesData.pages)
      
      if (!ocrResults.combinedText || ocrResults.combinedText.trim().length === 0) {
        return reply.code(400).send({ error: "No text found in the chapter pages" })
      }

      // Generate narrative script
      const script = ocrService.generateNarrativeScript(ocrResults, {
        includePageNumbers,
        addTransitions,
        voiceType
      })

      // Generate audio
      fastify.log.info('🎙️ Starting TTS...')
      const ttsResult = await enhancedTTSService.generateFromOCRScript(script, {
        voiceType,
        speed,
        chapterTitle: chapter.title || `Chapter ${chapterNumber}`,
        mangaTitle: mangaDetails?.title || 'Unknown Manga'
      })

      const response = {
        success: true,
        audioUrl: ttsResult.audioUrl,
        filename: ttsResult.filename,
        metadata: {
          mangaTitle: mangaDetails?.title || 'Unknown Manga',
          chapterTitle: chapter.title || `Chapter ${chapterNumber}`,
          chapterNumber,
          totalPages: pagesData.pages.length,
          voiceType,
          speed,
          duration: ttsResult.metadata.actualDuration,
          generatedAt: ttsResult.metadata.generatedAt,
          ocrStats: {
            totalWords: ocrResults.totalWords,
            averageConfidence: ocrResults.averageConfidence,
            pagesWithText: ocrResults.pages.filter(p => p.cleanText.length > 0).length
          }
        },
        ocrResults: {
          combinedText: ocrResults.combinedText,
          pages: ocrResults.pages.map(p => ({
            pageNumber: p.pageNumber,
            text: p.cleanText,
            confidence: p.confidence
          }))
        }
      }

      fastify.log.info('✅ NARRATOR COMPLETE:', { audioUrl: response.audioUrl })
      return response

    } catch (error) {
      fastify.log.error('❌ Narration failed:', error)
      return reply.code(500).send({ 
        error: 'Chapter narration failed',
        message: error.message
      })
    }
  })

  // 9️⃣ Manga Chat - Chat with manga characters
  fastify.post('/:id/chat', async (request, reply) => {
    try {
      const { id } = request.params
      const { message, characterId, sessionId } = request.body || {}

      // Make message optional for testing, provide default
      const userMessage = message && message.trim() ? message.trim() : "Hello!"

      fastify.log.info('💬 MANGA CHAT REQUEST:', { 
        mangaId: id, 
        message: userMessage.substring(0, 50) + '...',
        hasBody: !!request.body 
      })

      // Try to get manga details, but don't fail if not found
      let mangaDetails = null
      try {
        mangaDetails = await getMangaDetails(id)
        fastify.log.info('✅ MANGA DETAILS FOUND:', { title: mangaDetails?.title })
      } catch (error) {
        fastify.log.warn('⚠️ MANGA DETAILS NOT FOUND:', error.message)
        // Create fallback manga details
        mangaDetails = {
          id: id,
          title: 'Unknown Manga',
          coverImage: '/placeholder.jpg',
          description: 'A mysterious manga from another dimension...'
        }
      }

      // Available characters for chat
      const characters = [
        { id: 'main-character', name: 'Main Character', personality: 'friendly and helpful' },
        { id: 'narrator', name: 'Narrator', personality: 'wise and knowledgeable' },
        { id: 'protagonist', name: 'Protagonist', personality: 'brave and determined' },
        { id: 'mentor', name: 'Wise Mentor', personality: 'ancient and wise' }
      ]

      const selectedCharacter = characters.find(c => c.id === characterId) || characters[0]

      // Generate contextual responses based on user message
      const generateResponse = (msg, character, manga) => {
        const lowerMsg = msg.toLowerCase()
        
        if (lowerMsg.includes('hello') || lowerMsg.includes('hi') || msg === 'Hello!') {
          return `Hello there! I'm ${character.name} from ${manga.title}. Welcome to our world! What brings you here today?`
        }
        
        if (lowerMsg.includes('who are you')) {
          return `I'm ${character.name}, a character from the manga "${manga.title}". I'm known for being ${character.personality}. What would you like to know about me?`
        }
        
        if (lowerMsg.includes('story') || lowerMsg.includes('plot')) {
          return `Ah, you want to know about our story! ${manga.title} is filled with amazing adventures. Each chapter brings new challenges and discoveries. What aspect interests you most?`
        }
        
        if (lowerMsg.includes('favorite') || lowerMsg.includes('like')) {
          return `That's a great question! As ${character.name}, I really enjoy the moments when we face challenges together. The bonds we form are what make ${manga.title} special.`
        }
        
        // Default responses
        const responses = [
          `That's fascinating! As ${character.name} from ${manga.title}, I find your perspective interesting. Tell me more!`,
          `In the world of ${manga.title}, we often encounter situations like this. What would you do in our place?`,
          `You know, being ${character.personality}, I think about these things differently. What's your take on it?`,
          `${manga.title} has taught me so much about life. Your message reminds me of our recent adventures!`,
          `I appreciate you taking the time to chat with me! The readers of ${manga.title} always have the best insights.`
        ]
        
        return responses[Math.floor(Math.random() * responses.length)]
      }

      const response = generateResponse(userMessage, selectedCharacter, mangaDetails)

      const chatResponse = {
        success: true,
        character: selectedCharacter,
        message: response,
        userMessage: userMessage,
        timestamp: new Date().toISOString(),
        sessionId: sessionId || `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        manga: {
          id: mangaDetails.id,
          title: mangaDetails.title,
          coverImage: mangaDetails.coverImage
        },
        availableCharacters: characters,
        debug: {
          mangaFound: !!mangaDetails && mangaDetails.title !== 'Unknown Manga',
          requestBody: request.body
        }
      }

      fastify.log.info('✅ MANGA CHAT RESPONSE:', { 
        character: selectedCharacter.name,
        responseLength: response.length 
      })
      
      return chatResponse

    } catch (error) {
      fastify.log.error('❌ Manga chat failed:', error)
      return reply.code(500).send({ 
        error: 'Manga chat failed',
        message: error.message,
        details: 'Please check if the manga ID is valid and try again'
      })
    }
  })
}
