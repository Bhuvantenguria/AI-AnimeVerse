import { ocrService } from '../services/ocrService.js'
import { enhancedTTSService } from '../services/enhancedTTSService.js'
import { prisma } from '../plugins/prisma.js'
import { getMangaDetails, getChapterPages } from '../services/mangadx.js'

export default async function narratorRoutes(fastify, options) {
  
  // OCR + TTS Pipeline: Full chapter narration
  fastify.post('/api/narrate-chapter', async (request, reply) => {
    try {
      const { 
        mangaId, 
        chapterId, 
        voiceType = 'narrator-male',
        speed = 1.0,
        includePageNumbers = true,
        addTransitions = true,
        userId 
      } = request.body

      if (!mangaId || !chapterId) {
        return reply.code(400).send({ 
          error: 'Manga ID and Chapter ID are required' 
        })
      }

      console.log(`🎬 Starting chapter narration: ${mangaId}/${chapterId}`)
      
      // 1️⃣ Get manga and chapter details
      const [mangaDetails, chapterData] = await Promise.all([
        getMangaDetails(mangaId),
        getChapterPages(chapterId)
      ])

      if (!chapterData || !chapterData.pages) {
        return reply.code(404).send({ 
          error: 'Chapter not found or no pages available' 
        })
      }

      // 2️⃣ Extract text from all pages using OCR
      console.log(`📖 Starting OCR for ${chapterData.pages.length} pages...`)
      const ocrResults = await ocrService.extractTextFromPages(chapterData.pages)
      
      if (!ocrResults.combinedText || ocrResults.combinedText.trim().length === 0) {
        return reply.code(400).send({ 
          error: 'No text found in the chapter pages' 
        })
      }

      // 3️⃣ Generate narrative script
      const script = ocrService.generateNarrativeScript(ocrResults, {
        includePageNumbers,
        addTransitions,
        voiceType
      })

      // 4️⃣ Generate TTS audio
      console.log(`🎙️ Generating TTS audio...`)
      const ttsResult = await enhancedTTSService.generateFromOCRScript(script, {
        voiceType,
        speed,
        chapterTitle: chapterData.chapter?.title || `Chapter ${chapterData.chapter?.number}`,
        mangaTitle: mangaDetails?.title || 'Unknown Manga'
      })

      // 5️⃣ Save to database if user provided
      let narrationRecord = null
      if (userId && prisma) {
        try {
          narrationRecord = await prisma.narrationRequest.create({
            data: {
              userId: userId,
              mangaId: mangaId,
              mangaTitle: mangaDetails?.title || 'Unknown Manga',
              chapterNumber: parseInt(chapterData.chapter?.number) || 1,
              chapterTitle: chapterData.chapter?.title || `Chapter ${chapterData.chapter?.number}`,
              voiceType: voiceType,
              language: 'english',
              speed: speed,
              includeDialogue: true,
              includeNarration: true,
              status: 'completed',
              audioUrl: ttsResult.audioUrl,
              audioCloudinaryId: ttsResult.audioUrl.includes('cloudinary') ? ttsResult.audioUrl.split('/').pop().split('.')[0] : null,
              duration: ttsResult.metadata.actualDuration,
              progress: 100,
              jobId: `ocr-${Date.now()}`
            }
          })
          console.log('✅ Narration saved to database')
        } catch (dbError) {
          console.error('❌ Database save failed:', dbError)
        }
      }

      // 6️⃣ Return results
      const response = {
        status: 'success',
        audioUrl: ttsResult.audioUrl,
        metadata: {
          mangaTitle: mangaDetails?.title || 'Unknown Manga',
          chapterTitle: chapterData.chapter?.title || `Chapter ${chapterData.chapter?.number}`,
          chapterNumber: chapterData.chapter?.number,
          totalPages: chapterData.pages?.length || 0,
          voiceType,
          speed,
          duration: ttsResult.metadata.actualDuration,
          generatedAt: ttsResult.metadata.generatedAt,
          ocrStats: {
            totalWords: ocrResults.totalWords,
            averageConfidence: ocrResults.averageConfidence,
            pagesWithText: ocrResults.pages.filter(p => p.cleanText.length > 0).length
          },
          ttsStats: {
            totalSegments: ttsResult.metadata.totalSegments,
            estimatedDuration: ttsResult.metadata.estimatedDuration,
            actualDuration: ttsResult.metadata.actualDuration
          }
        },
        ocrResults: {
          combinedText: ocrResults.combinedText,
          pages: ocrResults.pages.map(p => ({
            pageNumber: p.pageNumber,
            text: p.cleanText,
            confidence: p.confidence,
            wordCount: p.wordCount
          }))
        },
        script: script.script,
        narrationId: narrationRecord?.id || null
      }

      console.log(`✅ Chapter narration completed: ${response.audioUrl}`)
      return reply.send(response)

    } catch (error) {
      console.error('❌ Chapter narration failed:', error)
      return reply.code(500).send({ 
        error: 'Chapter narration failed', 
        details: error.message 
      })
    }
  })

  // OCR Only: Extract text from manga pages
  fastify.post('/api/extract-text', async (request, reply) => {
    try {
      const { pages } = request.body

      if (!pages || !Array.isArray(pages) || pages.length === 0) {
        return reply.code(400).send({ 
          error: 'Pages array is required' 
        })
      }

      console.log(`📖 Starting OCR for ${pages.length} pages...`)
      const ocrResults = await ocrService.extractTextFromPages(pages)

      const response = {
        status: 'success',
        totalPages: pages.length,
        totalWords: ocrResults.totalWords,
        averageConfidence: ocrResults.averageConfidence,
        combinedText: ocrResults.combinedText,
        pages: ocrResults.pages.map(p => ({
          pageNumber: p.pageNumber,
          imageUrl: p.imageUrl,
          text: p.cleanText,
          originalText: p.originalText,
          confidence: p.confidence,
          wordCount: p.wordCount,
          error: p.error
        }))
      }

      console.log(`✅ OCR completed for ${pages.length} pages`)
      return reply.send(response)

    } catch (error) {
      console.error('❌ OCR extraction failed:', error)
      return reply.code(500).send({ 
        error: 'OCR extraction failed', 
        details: error.message 
      })
    }
  })

  // TTS Only: Generate audio from provided text
  fastify.post('/api/generate-audio', async (request, reply) => {
    try {
      const { 
        text, 
        voiceType = 'narrator-male',
        emotion = 'neutral',
        speed = 1.0,
        title = 'Audio'
      } = request.body

      if (!text || text.trim().length === 0) {
        return reply.code(400).send({ 
          error: 'Text is required' 
        })
      }

      console.log(`🎙️ Generating TTS audio from text: ${text.length} characters`)
      
      const ttsResult = await enhancedTTSService.generateFromText(text, {
        voiceType,
        emotion,
        speed,
        title
      })

      const response = {
        status: 'success',
        audioUrl: ttsResult.audioUrl,
        filename: ttsResult.filename,
        metadata: ttsResult.metadata
      }

      console.log(`✅ TTS audio generated: ${response.audioUrl}`)
      return reply.send(response)

    } catch (error) {
      console.error('❌ TTS generation failed:', error)
      return reply.code(500).send({ 
        error: 'TTS generation failed', 
        details: error.message 
      })
    }
  })

  // Get available voices
  fastify.get('/api/voices', async (request, reply) => {
    try {
      const voices = await enhancedTTSService.getAvailableVoices()
      
      return reply.send({
        status: 'success',
        voices: voices
      })
    } catch (error) {
      console.error('❌ Failed to get voices:', error)
      return reply.code(500).send({ 
        error: 'Failed to get voices', 
        details: error.message 
      })
    }
  })

  // Get narration history for user
  fastify.get('/api/narrations/:userId', async (request, reply) => {
    try {
      const { userId } = request.params
      const { limit = 10, offset = 0 } = request.query

      if (!prisma) {
        return reply.code(503).send({ 
          error: 'Database not available' 
        })
      }

      const narrations = await prisma.narrationRequest.findMany({
        where: { userId: userId },
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit),
        skip: parseInt(offset)
      })

      const total = await prisma.narrationRequest.count({
        where: { userId: userId }
      })

      return reply.send({
        status: 'success',
        narrations: narrations,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: (parseInt(offset) + parseInt(limit)) < total
        }
      })

    } catch (error) {
      console.error('❌ Failed to get narrations:', error)
      return reply.code(500).send({ 
        error: 'Failed to get narrations', 
        details: error.message 
      })
    }
  })

  // Health check for narrator services
  fastify.get('/api/narrator/health', async (request, reply) => {
    try {
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          ocr: {
            status: ocrService.initialized ? 'ready' : 'initializing',
            initialized: ocrService.initialized
          },
          tts: {
            status: enhancedTTSService.elevenLabsApiKey ? 'ready' : 'limited',
            hasApiKey: !!enhancedTTSService.elevenLabsApiKey
          },
          database: {
            status: prisma ? 'connected' : 'disconnected',
            available: !!prisma
          }
        }
      }

      return reply.send(health)
    } catch (error) {
      console.error('❌ Health check failed:', error)
      return reply.code(500).send({ 
        error: 'Health check failed', 
        details: error.message 
      })
    }
  })

  // Quick test endpoint
  fastify.post('/api/narrator/test', async (request, reply) => {
    try {
      const testPages = [
        {
          page: 1,
          image: 'https://uploads.mangadex.org/covers/a96676e5-8ae2-425e-b549-7f15dd34a6d8/256e6e49-dd0e-4848-8f9c-4c8a10a37d7d.jpg'
        }
      ]

      const ocrResults = await ocrService.extractTextFromPages(testPages)
      
      return reply.send({
        status: 'success',
        message: 'Narrator services are working',
        testResults: {
          ocrWorking: ocrResults.pages.length > 0,
          textExtracted: ocrResults.combinedText.length > 0,
          pagesProcessed: ocrResults.pages.length
        }
      })

    } catch (error) {
      console.error('❌ Test failed:', error)
      return reply.code(500).send({ 
        error: 'Test failed', 
        details: error.message 
      })
    }
  })
} 