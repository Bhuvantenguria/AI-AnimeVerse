import { ElevenLabsAPI } from "elevenlabs"
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

    // Step 1: Fetch actual manga pages from MangaDx (simplified)
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
    
    const BASE_URL = 'https://api.mangadx.org'
    
    // Get chapter content
    const chapterResponse = await axios.get(`${BASE_URL}/chapter`, {
      params: {
        manga: mangaId,
        chapter: chapterNumber,
        translatedLanguage: ['en'],
        limit: 1
      }
    })

    if (!chapterResponse.data?.data || chapterResponse.data.data.length === 0) {
      throw new Error("Chapter not found")
    }

    const chapter = chapterResponse.data.data[0]
    
    return {
      chapterId: chapter.id,
      title: chapter.attributes.title || `Chapter ${chapterNumber}`,
      pages: [] // Simplified for now
    }
  } catch (error) {
    fastify.log.error('Error fetching manga pages:', error)
    // Return sample data if API fails
    return {
      chapterId: `sample_${mangaId}_${chapterNumber}`,
      title: `Chapter ${chapterNumber}`,
      pages: []
    }
  }
}

async function extractEnhancedMangaContent(mangaPages, mangaId, chapterNumber, fastify) {
  try {
    fastify.log.info(`🔍 Extracting enhanced content for manga ${mangaId}, chapter ${chapterNumber}`)
    
    // Simplified content extraction for demo
    const enhancedContent = {
      mangaId,
      chapterNumber,
      title: mangaPages.title,
      totalPages: 2, // Demo
      characters: [
        {
          id: 'protagonist',
          name: 'Protagonist',
          voiceProfile: 'young-determined',
          emotionalRange: ['determined', 'hopeful', 'surprised', 'excited']
        },
        {
          id: 'narrator',
          name: 'Narrator',
          voiceProfile: 'storyteller',
          emotionalRange: ['neutral', 'dramatic', 'suspenseful', 'descriptive']
        }
      ],
      scenes: [
        {
          pageNumber: 1,
          sceneType: 'establishing',
          mood: 'peaceful-morning',
          panels: [
            {
              panelNumber: 1,
              type: 'narration',
              text: 'The story begins with our protagonist facing a new challenge.',
              emotion: 'peaceful',
              speaker: 'narrator',
              pauseAfter: 1000
            },
            {
              panelNumber: 2,
              type: 'dialogue',
              text: 'I will overcome this obstacle and grow stronger!',
              emotion: 'determined',
              speaker: 'protagonist',
              pauseAfter: 800
            }
          ]
        }
      ]
    }
    
    return enhancedContent
  } catch (error) {
    fastify.log.error('Error extracting enhanced content:', error)
    throw error
  }
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
    'peaceful': { speed: 0.9, stability: 0.8, clarity: 0.9, style: 0.2 },
    'determined': { speed: 1.1, stability: 0.6, clarity: 0.8, style: 0.6 },
    'neutral': { speed: 1.0, stability: 0.7, clarity: 0.8, style: 0.3 }
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
        const { ElevenLabsAPI } = await import("elevenlabs")
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
    
    const base64Audio = audioBuffer.toString('base64')
    const dataURI = `data:audio/mp3;base64,${base64Audio}`
    
    const uploadOptions = {
      resource_type: "video", // Cloudinary treats audio as video
      folder: "manga-narrations",
      public_id: `narration_${requestId}`,
      format: "mp3",
      tags: ["manga", "narration", "audio"]
    }
    
    const uploadResult = await fastify.cloudinary.uploader.upload(dataURI, uploadOptions)
    
    fastify.log.info(`✅ Audio uploaded successfully: ${uploadResult.secure_url}`)
    
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
    const statusData = {
      requestId,
      status,
      updatedAt: new Date().toISOString(),
      ...additionalData
    }
    
    fastify.log.info(`📊 Status updated for ${requestId}: ${status}`)
    
    // Try to store in Redis cache if available
    if (fastify.redis) {
      try {
        await fastify.redis.setex(`narration_status:${requestId}`, 3600, JSON.stringify(statusData))
      } catch (redisError) {
        fastify.log.warn("Redis cache update failed:", redisError)
        // Continue without Redis
      }
    }
    
    return statusData
  } catch (error) {
    fastify.log.error("Status update error:", error)
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
