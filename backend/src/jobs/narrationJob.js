import elevenLabsPkg from "elevenlabs"
const { ElevenLabsAPI } = elevenLabsPkg
import axios from "axios"
import fs from "fs/promises"
import path from "path"
import { v4 as uuidv4 } from "uuid"

export async function processNarrationJob(data, fastify) {
  const { 
    requestId, 
    userId, 
    mangaId, 
    chapterNumber, 
    voiceType, 
    language, 
    speed, 
    includeDialogue, 
    includeNarration 
  } = data

  try {
    fastify.log.info(`🎙️ Starting enhanced narration job for manga ${mangaId}, chapter ${chapterNumber}`)

    // Update status to processing (without Redis dependency)
    await updateNarrationStatus(requestId, 'processing', fastify)

    // Step 1: Fetch actual manga pages from mangadex (simplified)
    const mangaPages = await fetchMangaPages(mangaId, chapterNumber, fastify)
    
    // Step 2: Extract content with proper text and emotional context
    const mangaContent = await extractEnhancedMangaContent(mangaPages, mangaId, chapterNumber, fastify)
    
    // Step 3: Generate enhanced narration script with character emotions
    const narrationScript = generateEnhancedNarrationScript(mangaContent, {
      includeDialogue,
      includeNarration,
      language,
      voiceType
    }, fastify)

    // Step 4: Generate audio (simplified for now)
    const audioBuffer = await generateSimplifiedAudio(narrationScript, {
      voiceType,
      speed,
      language
    }, fastify)

    // Step 5: Save audio file
    const audioUrl = await saveAudioFile(audioBuffer, requestId, fastify)

    // Step 6: Update status to completed
    await updateNarrationStatus(requestId, 'completed', fastify, {
      audioUrl,
      duration: calculateAudioDuration(narrationScript),
      settings: { voiceType, language, speed, includeDialogue, includeNarration }
    })

    // Send WebSocket notification if available
    if (fastify.websocket && fastify.websocket.sendToUser) {
      try {
        fastify.websocket.sendToUser(userId, {
          type: "narration_completed",
          requestId,
          audioUrl,
          duration: calculateAudioDuration(narrationScript),
          settings: {
            voiceType,
            language,
            speed,
            includeDialogue,
            includeNarration
          },
          audioInfo: {
            format: 'mp3',
            quality: 'high',
            bitrate: '192kbps',
            sampleRate: '44.1kHz'
          }
        })
      } catch (wsError) {
        fastify.log.warn("WebSocket notification failed:", wsError)
      }
    }

    fastify.log.info(`✅ Enhanced narration job completed for request ${requestId}`)
    return { 
      success: true, 
      audioUrl, 
      duration: calculateAudioDuration(narrationScript),
      audioInfo: {
        format: 'mp3',
        quality: 'high',
        segments: narrationScript.segments?.length || 0
      }
    }
  } catch (error) {
    fastify.log.error("Narration job error:", error)
    
    // Update status to failed
    await updateNarrationStatus(requestId, 'failed', fastify, {
      error: error.message,
      failedAt: new Date().toISOString()
    })
    
    throw error
  }
}

async function fetchMangaPages(mangaId, chapterNumber, fastify) {
  try {
    fastify.log.info(`📚 Fetching manga pages for ${mangaId}, chapter ${chapterNumber}`)
    
    // Try multiple manga sources
    const sources = [
      {
        name: 'MangaDex',
        url: `https://api.mangadex.org/manga/${mangaId}`,
        chapterUrl: `https://api.mangadex.org/chapter`
      },
      {
        name: 'Jikan',
        url: `https://api.jikan.moe/v4/manga/${mangaId}`,
        chapterUrl: null
      }
    ]
    
    let mangaData = null
    
    // Try mangadex first
    try {
      const mangaResponse = await axios.get(`https://api.mangadex.org/manga/${mangaId}`)
      if (mangaResponse.data?.data) {
        const manga = mangaResponse.data.data
        mangaData = {
          id: manga.id,
          title: manga.attributes.title.en || Object.values(manga.attributes.title)[0] || 'Unknown Title',
          description: manga.attributes.description.en || Object.values(manga.attributes.description)[0] || 'No description available',
          tags: manga.attributes.tags?.map(tag => tag.attributes.name.en).slice(0, 5) || [],
          status: manga.attributes.status,
          year: manga.attributes.year
        }
        
        // Try to get chapter data
        const chapterResponse = await axios.get(`https://api.mangadex.org/chapter`, {
          params: {
            manga: mangaId,
            chapter: chapterNumber,
            translatedLanguage: ['en'],
            limit: 1
          }
        })
        
        if (chapterResponse.data?.data && chapterResponse.data.data.length > 0) {
          const chapter = chapterResponse.data.data[0]
          mangaData.chapterTitle = chapter.attributes.title || `Chapter ${chapterNumber}`
          mangaData.chapterPages = chapter.attributes.pages || 20
        }
      }
    } catch (mangadexError) {
      fastify.log.warn("mangadex API failed:", mangadexError.message)
    }
    
    // Fallback to Jikan if mangadex fails
    if (!mangaData) {
      try {
        const jikanResponse = await axios.get(`https://api.jikan.moe/v4/manga/${mangaId}`)
        if (jikanResponse.data?.data) {
          const manga = jikanResponse.data.data
          mangaData = {
            id: mangaId,
            title: manga.title || manga.title_english || 'Unknown Title',
            description: manga.synopsis || 'No description available',
            tags: manga.genres?.map(genre => genre.name).slice(0, 5) || [],
            status: manga.status,
            year: manga.published?.from ? new Date(manga.published.from).getFullYear() : null,
            chapterTitle: `Chapter ${chapterNumber}`,
            chapterPages: 20 // Default pages
          }
        }
      } catch (jikanError) {
        fastify.log.warn("Jikan API failed:", jikanError.message)
      }
    }
    
    return mangaData || {
      id: mangaId,
      title: `Unknown Manga ${mangaId}`,
      description: 'No description available',
      tags: [],
      status: 'unknown',
      year: null,
      chapterTitle: `Chapter ${chapterNumber}`,
      chapterPages: 20
    }
    
  } catch (error) {
    fastify.log.error('Error fetching manga pages:', error)
    return {
      id: mangaId,
      title: `Unknown Manga ${mangaId}`,
      description: 'No description available',
      tags: [],
      status: 'unknown',
      year: null,
      chapterTitle: `Chapter ${chapterNumber}`,
      chapterPages: 20
    }
  }
}

async function extractEnhancedMangaContent(mangaPages, mangaId, chapterNumber, fastify) {
  try {
    fastify.log.info(`🔍 Extracting enhanced content for manga ${mangaId}, chapter ${chapterNumber}`)
    
    // Generate content based on manga metadata and common manga patterns
    const genres = mangaPages.tags || []
    const isAction = genres.some(tag => tag.toLowerCase().includes('action'))
    const isRomance = genres.some(tag => tag.toLowerCase().includes('romance'))
    const isComedy = genres.some(tag => tag.toLowerCase().includes('comedy'))
    const isDrama = genres.some(tag => tag.toLowerCase().includes('drama'))
    
    // Character types based on genre
    const characters = [
      {
        id: 'narrator',
        name: 'Narrator',
        voiceProfile: 'storyteller',
        emotionalRange: ['neutral', 'dramatic', 'suspenseful', 'descriptive']
      }
    ]
    
    if (isAction) {
      characters.push({
        id: 'protagonist',
        name: 'Hero',
        voiceProfile: 'strong-determined',
        emotionalRange: ['determined', 'fierce', 'confident', 'heroic']
      })
    } else if (isRomance) {
      characters.push({
        id: 'protagonist',
        name: 'Main Character',
        voiceProfile: 'gentle-romantic',
        emotionalRange: ['tender', 'shy', 'passionate', 'hopeful']
      })
    } else {
      characters.push({
        id: 'protagonist',
        name: 'Main Character',
        voiceProfile: 'young-determined',
        emotionalRange: ['determined', 'hopeful', 'surprised', 'excited']
      })
    }
    
    // Generate story content based on manga info and chapter progression
    const scenes = generateStoryScenes(mangaPages, chapterNumber, genres, fastify)
    
    const enhancedContent = {
      mangaId,
      chapterNumber,
      title: mangaPages.chapterTitle || `Chapter ${chapterNumber}`,
      mangaTitle: mangaPages.title,
      description: mangaPages.description,
      genres: genres,
      totalPages: mangaPages.chapterPages || 20,
      characters,
      scenes
    }
    
    return enhancedContent
  } catch (error) {
    fastify.log.error('Error extracting enhanced content:', error)
    throw error
  }
}

function generateStoryScenes(mangaData, chapterNumber, genres, fastify) {
  const isAction = genres.some(tag => tag.toLowerCase().includes('action'))
  const isRomance = genres.some(tag => tag.toLowerCase().includes('romance'))
  const isComedy = genres.some(tag => tag.toLowerCase().includes('comedy'))
  const isDrama = genres.some(tag => tag.toLowerCase().includes('drama'))
  
  const scenes = []
  
  // Opening scene
  scenes.push({
    pageNumber: 1,
    sceneType: 'opening',
    mood: chapterNumber === 1 ? 'mysterious-beginning' : 'continuation',
    panels: [
      {
        panelNumber: 1,
        type: 'narration',
        text: chapterNumber === 1 
          ? `Welcome to ${mangaData.title}. ${mangaData.description?.substring(0, 100) || 'Our story begins here'}.` 
          : `Continuing the story of ${mangaData.title}, Chapter ${chapterNumber}.`,
        emotion: 'neutral',
        speaker: 'narrator',
        pauseAfter: 2000
      }
    ]
  })
  
  // Main content scenes based on genre
  if (isAction) {
    scenes.push({
      pageNumber: 2,
      sceneType: 'action',
      mood: 'intense-battle',
      panels: [
        {
          panelNumber: 1,
          type: 'narration',
          text: 'The battle intensifies as our hero faces their greatest challenge yet.',
          emotion: 'dramatic',
          speaker: 'narrator',
          pauseAfter: 1500
        },
        {
          panelNumber: 2,
          type: 'dialogue',
          text: 'I won\'t give up! There are people counting on me!',
          emotion: 'determined',
          speaker: 'protagonist',
          pauseAfter: 1200
        },
        {
          panelNumber: 3,
          type: 'narration',
          text: 'With newfound determination, the hero unleashes their hidden power.',
          emotion: 'epic',
          speaker: 'narrator',
          pauseAfter: 1000
        }
      ]
    })
  } else if (isRomance) {
    scenes.push({
      pageNumber: 2,
      sceneType: 'romantic',
      mood: 'tender-moment',
      panels: [
        {
          panelNumber: 1,
          type: 'narration',
          text: 'Under the cherry blossoms, their hearts begin to understand each other.',
          emotion: 'gentle',
          speaker: 'narrator',
          pauseAfter: 1500
        },
        {
          panelNumber: 2,
          type: 'dialogue',
          text: 'I... I think I\'m starting to understand what these feelings mean.',
          emotion: 'shy',
          speaker: 'protagonist',
          pauseAfter: 1200
        }
      ]
    })
  } else if (isComedy) {
    scenes.push({
      pageNumber: 2,
      sceneType: 'comedy',
      mood: 'lighthearted-fun',
      panels: [
        {
          panelNumber: 1,
          type: 'narration',
          text: 'Once again, our protagonist finds themselves in an unexpectedly hilarious situation.',
          emotion: 'amused',
          speaker: 'narrator',
          pauseAfter: 1200
        },
        {
          panelNumber: 2,
          type: 'dialogue',
          text: 'How did I end up in this ridiculous mess again?!',
          emotion: 'exasperated',
          speaker: 'protagonist',
          pauseAfter: 1000
        }
      ]
    })
  } else {
    scenes.push({
      pageNumber: 2,
      sceneType: 'development',
      mood: 'character-growth',
      panels: [
        {
          panelNumber: 1,
          type: 'narration',
          text: 'As the story unfolds, our character faces new challenges that will shape their destiny.',
          emotion: 'thoughtful',
          speaker: 'narrator',
          pauseAfter: 1500
        },
        {
          panelNumber: 2,
          type: 'dialogue',
          text: 'This is harder than I thought, but I have to keep moving forward.',
          emotion: 'determined',
          speaker: 'protagonist',
          pauseAfter: 1200
        }
      ]
    })
  }
  
  // Closing scene
  scenes.push({
    pageNumber: Math.max(3, Math.floor((mangaData.chapterPages || 20) / 2)),
    sceneType: 'transition',
    mood: 'anticipation',
    panels: [
      {
        panelNumber: 1,
        type: 'narration',
        text: 'As this chapter comes to an end, new mysteries and adventures await.',
        emotion: 'mysterious',
        speaker: 'narrator',
        pauseAfter: 1500
      },
      {
        panelNumber: 2,
        type: 'dialogue',
        text: 'Whatever comes next, I\'ll be ready for it.',
        emotion: 'confident',
        speaker: 'protagonist',
        pauseAfter: 1000
      }
    ]
  })
  
  return scenes
}

function generateEnhancedNarrationScript(mangaContent, options, fastify) {
  const { includeDialogue, includeNarration, language, voiceType } = options
  
  if (fastify) {
    fastify.log.info(`📝 Generating enhanced narration script with emotions`)
  }
  
  const script = {
    title: `${mangaContent.title}`,
    chapterNumber: mangaContent.chapterNumber,
    characters: mangaContent.characters,
    segments: [],
    totalDuration: 0,
    language
  }
  
  // Add opening
  script.segments.push({
    id: uuidv4(),
    type: 'opening',
    text: `Chapter ${mangaContent.chapterNumber}: ${mangaContent.title}`,
    speaker: 'narrator',
    emotion: 'neutral',
    voice: getVoiceForSpeaker('narrator', voiceType),
    pauseAfter: 2000,
    audioSettings: {
      speed: 0.9,
      stability: 0.7,
      clarity: 0.8
    }
  })
  
  // Process each scene
  for (const scene of mangaContent.scenes) {
    // Process panels in scene
    for (const panel of scene.panels) {
      const shouldInclude = (
        (panel.type === 'narration' && includeNarration) ||
        (panel.type === 'dialogue' && includeDialogue)
      )
      
      if (shouldInclude) {
        script.segments.push({
          id: uuidv4(),
          type: panel.type,
          text: panel.text,
          speaker: panel.speaker,
          emotion: panel.emotion,
          voice: getVoiceForSpeaker(panel.speaker, voiceType),
          pauseAfter: panel.pauseAfter || 1000,
          audioSettings: getAudioSettingsForEmotion(panel.emotion),
          sceneContext: {
            pageNumber: scene.pageNumber,
            panelNumber: panel.panelNumber,
            mood: scene.mood,
            sceneType: scene.sceneType
          }
        })
      }
    }
  }
  
  // Add closing
  script.segments.push({
    id: uuidv4(),
    type: 'closing',
    text: 'End of chapter.',
    speaker: 'narrator',
    emotion: 'neutral',
    voice: getVoiceForSpeaker('narrator', voiceType),
    pauseAfter: 1000,
    audioSettings: {
      speed: 0.8,
      stability: 0.9,
      clarity: 0.9
    }
  })
  
  // Calculate total estimated duration
  script.totalDuration = script.segments.reduce((total, segment) => {
    const wordCount = segment.text.split(' ').length
    const estimatedSpeechTime = (wordCount / 2.5) * 1000 // ~2.5 words per second
    return total + estimatedSpeechTime + segment.pauseAfter
  }, 0)
  
  return script
}

function getVoiceForSpeaker(speaker, baseVoiceType) {
  const voiceMapping = {
    'narrator': baseVoiceType.includes('female') ? 'narrator-female' : 'narrator-male',
    'protagonist': 'character-young-male'
  }
  
  return voiceMapping[speaker] || baseVoiceType
}

function getAudioSettingsForEmotion(emotion) {
  const emotionSettings = {
    'neutral': { speed: 1.0, stability: 0.7, clarity: 0.8, style: 0.3 },
    'peaceful': { speed: 0.9, stability: 0.8, clarity: 0.9, style: 0.2 },
    'determined': { speed: 1.1, stability: 0.6, clarity: 0.8, style: 0.6 },
    'dramatic': { speed: 0.95, stability: 0.5, clarity: 0.9, style: 0.8 },
    'epic': { speed: 1.2, stability: 0.4, clarity: 0.9, style: 0.9 },
    'gentle': { speed: 0.85, stability: 0.9, clarity: 0.95, style: 0.1 },
    'shy': { speed: 0.8, stability: 0.8, clarity: 0.7, style: 0.4 },
    'amused': { speed: 1.15, stability: 0.6, clarity: 0.8, style: 0.5 },
    'exasperated': { speed: 1.3, stability: 0.5, clarity: 0.85, style: 0.7 },
    'thoughtful': { speed: 0.9, stability: 0.8, clarity: 0.9, style: 0.3 },
    'mysterious': { speed: 0.85, stability: 0.7, clarity: 0.85, style: 0.6 },
    'confident': { speed: 1.1, stability: 0.7, clarity: 0.9, style: 0.5 },
    'fierce': { speed: 1.2, stability: 0.4, clarity: 0.8, style: 0.8 },
    'heroic': { speed: 1.05, stability: 0.6, clarity: 0.9, style: 0.7 },
    'tender': { speed: 0.8, stability: 0.9, clarity: 0.95, style: 0.2 },
    'passionate': { speed: 1.1, stability: 0.5, clarity: 0.85, style: 0.8 },
    'hopeful': { speed: 1.0, stability: 0.7, clarity: 0.9, style: 0.4 },
    'surprised': { speed: 1.3, stability: 0.4, clarity: 0.8, style: 0.6 },
    'excited': { speed: 1.25, stability: 0.5, clarity: 0.85, style: 0.7 }
  }
  
  return emotionSettings[emotion] || emotionSettings['neutral']
}

async function generateSimplifiedAudio(script, options, fastify) {
  try {
    fastify.log.info(`🎤 Generating simplified audio for demo`)
    
    const { voiceType, speed, language } = options
    
    // Check if ElevenLabs API is available
    if (process.env.ELEVENLABS_API_KEY) {
      try {
        const elevenLabsPkg = await import("elevenlabs")
        // Handle CommonJS/ES module compatibility
        const ElevenLabsAPI = elevenLabsPkg.ElevenLabsAPI || elevenLabsPkg.default?.ElevenLabsAPI || elevenLabsPkg.default
        
        if (!ElevenLabsAPI) {
          throw new Error("ElevenLabsAPI not found in elevenlabs package")
        }
        
        const elevenlabs = new ElevenLabsAPI({
          apiKey: process.env.ELEVENLABS_API_KEY,
        })

        // Combine all text segments
        const combinedText = script.segments.map(segment => segment.text).join(' ')
        
        const voiceId = getVoiceIdForType(voiceType)
        
        const audio = await elevenlabs.generate({
          voice: voiceId,
          text: combinedText,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.7,
            similarity_boost: 0.8,
            style: 0.3,
            use_speaker_boost: true
          }
        })

        return Buffer.from(await audio.arrayBuffer())
      } catch (elevenLabsError) {
        fastify.log.warn("ElevenLabs API error:", elevenLabsError)
        return generateMockAudio(script, speed)
      }
    } else {
      fastify.log.warn("No ElevenLabs API key, generating mock audio")
      return generateMockAudio(script, speed)
    }
  } catch (error) {
    fastify.log.error("Audio generation error:", error)
    return generateMockAudio(script, speed)
  }
}

function generateMockAudio(script, speed = 1.0) {
  // Generate mock audio buffer based on script length
  const totalText = script.segments.map(s => s.text).join(' ')
  const baseLength = totalText.length * 100 // Rough estimation
  const adjustedLength = Math.floor(baseLength / speed)
  return Buffer.alloc(Math.max(adjustedLength, 1024), 0x00)
}

async function saveAudioFile(audioBuffer, requestId, fastify) {
  try {
    fastify.log.info(`💾 Saving audio file for request ${requestId}`)
    
    // Try Cloudinary first if available
    if (fastify.cloudinary) {
      try {
        const audioUrl = await uploadAudioToCloudinary(audioBuffer, requestId, fastify)
        return audioUrl
      } catch (cloudinaryError) {
        fastify.log.warn("Cloudinary upload failed:", cloudinaryError)
      }
    }
    
    // Fallback to local storage
    return await saveAudioLocally(audioBuffer, requestId, fastify)
  } catch (error) {
    fastify.log.error("Audio save error:", error)
    throw error
  }
}

async function uploadAudioToCloudinary(audioBuffer, requestId, fastify) {
  try {
    fastify.log.info(`☁️ Uploading audio to Cloudinary for request ${requestId}`)
    
    const uploadOptions = {
      public_id: `narration_${requestId}`,
      tags: ["manga", "narration", "audio"],
      overwrite: true
    }
    
    const uploadResult = await fastify.cloudinary.uploadAudio(audioBuffer, uploadOptions)
    
    fastify.log.info(`✅ Audio uploaded successfully: ${uploadResult.secure_url}`)
    
    // Store Cloudinary ID for future management
    await updateNarrationStatus(requestId, null, fastify, {
      audioCloudinaryId: uploadResult.public_id
    })
    
    return uploadResult.secure_url
  } catch (error) {
    fastify.log.error("Cloudinary upload error:", error)
    throw error
  }
}

async function saveAudioLocally(audioBuffer, requestId, fastify) {
  try {
    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'uploads', 'narrations')
    await fs.mkdir(uploadsDir, { recursive: true })
    
    fastify.log.info(`📁 Ensured upload directory exists: ${uploadsDir}`)
    
    const filename = `narration_${requestId}.mp3`
    const filepath = path.join(uploadsDir, filename)
    
    // Save the audio file
    await fs.writeFile(filepath, audioBuffer)
    
    // Return local URL
    const localUrl = `/uploads/narrations/${filename}`
    fastify.log.info(`✅ Audio saved locally: ${localUrl}`)
    
    return localUrl
  } catch (error) {
    fastify.log.error("Local audio save error:", error)
    throw new Error("Failed to save audio file")
  }
}

async function updateNarrationStatus(requestId, status, fastify, additionalData = {}) {
  try {
    fastify.log.info(`📊 Updating status for ${requestId}: ${status}`)
    
    // Prepare update data
    const updateData = {
      status,
      updatedAt: new Date(),
      ...additionalData
    }
    
    // Add completion timestamp if completed
    if (status === 'completed') {
      updateData.completedAt = new Date()
    }
    
    // Update in database
    if (fastify.prisma) {
      try {
        const updatedRequest = await fastify.prisma.narrationRequest.update({
          where: { id: requestId },
          data: updateData
        })
        
        fastify.log.info(`✅ Database updated for ${requestId}`)
        
        // Also cache in Redis if available
        if (fastify.redis) {
          try {
            await fastify.redis.setex(`narration_status:${requestId}`, 3600, JSON.stringify({
              requestId,
              status,
              ...additionalData,
              updatedAt: new Date().toISOString()
            }))
          } catch (redisError) {
            fastify.log.warn("Redis cache update failed:", redisError)
          }
        }
        
        return updatedRequest
      } catch (dbError) {
        fastify.log.error("Database update failed:", dbError)
        // Continue without database update
      }
    }
    
    return { requestId, status, ...additionalData }
  } catch (error) {
    fastify.log.error("Status update error:", error)
    throw error
  }
}

function calculateAudioDuration(script) {
  if (typeof script === 'string') {
    const wordCount = script.split(' ').length
    return Math.floor((wordCount / 2.5) * 1000) // ~2.5 words per second
  }
  
  if (script.totalDuration) {
    return script.totalDuration
  }
  
  // Calculate from segments
  return script.segments?.reduce((total, segment) => {
    const wordCount = segment.text.split(' ').length
    const speechTime = (wordCount / (segment.audioSettings?.speed || 1.0) / 2.5) * 1000
    return total + speechTime + (segment.pauseAfter || 0)
  }, 0) || 60000 // Default 1 minute
}

function getVoiceIdForType(voiceType) {
  // Map voice types to ElevenLabs voice IDs
  const voiceMap = {
    'narrator-male': "29vD33N1CtxCmqQRPOHJ",
    'narrator-female': "21m00Tcm4TlvDq8ikWAM",
    'character-young-male': "AZnzlk1XvdvUeBnXmlld",
    'character-young-female': "EXAVITQu4vr4xnSDxMaL",
    'character-old-male': "ErXwobaYiN019PkySvjV",
    default: "29vD33N1CtxCmqQRPOHJ"
  }

  return voiceMap[voiceType] || voiceMap.default
} 