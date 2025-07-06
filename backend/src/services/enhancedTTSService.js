import axios from 'axios'
import FormData from 'form-data'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { uploadToCloudinary } from '../plugins/cloudinary.js'
import { v4 as uuidv4 } from 'uuid'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Enhanced TTS service with emotion support
export class EnhancedTTSService {
  
  constructor() {
    this.elevenLabsApiKey = process.env.ELEVENLABS_API_KEY
    this.elevenLabsApiUrl = 'https://api.elevenlabs.io/v1'
    
    // Voice configurations for different emotions and character types
    this.voiceConfigs = {
      'narrator-male': {
        voiceId: 'pNInz6obpgDQGcFmaJgB', // Adam voice
        stability: 0.75,
        similarityBoost: 0.8,
        style: 0.2,
        speakerBoost: true
      },
      'narrator-female': {
        voiceId: 'EXAVITQu4vr4xnSDxMaL', // Bella voice
        stability: 0.7,
        similarityBoost: 0.85,
        style: 0.3,
        speakerBoost: true
      },
      'character-young': {
        voiceId: 'pqHfZKP75CvOlQylNhV4', // Bill voice
        stability: 0.6,
        similarityBoost: 0.9,
        style: 0.4,
        speakerBoost: true
      },
      'character-serious': {
        voiceId: 'nPczCjzI2devNBz1zQrb', // Brian voice
        stability: 0.8,
        similarityBoost: 0.7,
        style: 0.1,
        speakerBoost: true
      }
    }
    
    // Emotion-based voice adjustments
    this.emotionSettings = {
      'neutral': { stability: 0.75, similarityBoost: 0.8, style: 0.2 },
      'excited': { stability: 0.6, similarityBoost: 0.9, style: 0.6 },
      'sad': { stability: 0.8, similarityBoost: 0.7, style: 0.1 },
      'angry': { stability: 0.5, similarityBoost: 0.95, style: 0.8 },
      'fearful': { stability: 0.7, similarityBoost: 0.85, style: 0.4 },
      'joyful': { stability: 0.65, similarityBoost: 0.9, style: 0.7 }
    }
  }

  // Generate TTS from OCR narrative script
  async generateFromOCRScript(script, options = {}) {
    const {
      voiceType = 'narrator-male',
      speed = 1.0,
      outputFormat = 'mp3_44100_128',
      chapterTitle = 'Chapter',
      mangaTitle = 'Manga'
    } = options

    console.log(`🎙️ Starting TTS generation for ${script.totalSegments} segments...`)
    
    try {
      // Generate audio segments
      const audioSegments = []
      
      for (let i = 0; i < script.script.length; i++) {
        const segment = script.script[i]
        
        if (segment.text && segment.text.trim()) {
          console.log(`🎤 Processing segment ${i + 1}: ${segment.type}`)
          
          const audioBuffer = await this.generateSegmentAudio(
            segment.text,
            segment.emotion || 'neutral',
            voiceType,
            speed
          )
          
          audioSegments.push({
            audio: audioBuffer,
            segment: segment,
            index: i
          })
        }
      }
      
      // Combine audio segments
      const finalAudio = await this.combineAudioSegments(audioSegments)
      
      // Save to file
      const filename = `ocr-narration-${mangaTitle.replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}.mp3`
      const filepath = await this.saveAudioFile(finalAudio, filename)
      
      // Upload to Cloudinary if configured
      let cloudinaryUrl = null
      if (process.env.CLOUDINARY_CLOUD_NAME) {
        try {
          const uploadResult = await uploadToCloudinary(filepath, {
            resource_type: 'auto',
            folder: 'manga-narrations',
            public_id: `ocr-${uuidv4()}`
          })
          cloudinaryUrl = uploadResult.secure_url
          console.log('✅ Audio uploaded to Cloudinary')
        } catch (error) {
          console.error('❌ Cloudinary upload failed:', error)
        }
      }
      
      const result = {
        audioUrl: cloudinaryUrl || `/uploads/narrations/${filename}`,
        localPath: filepath,
        filename: filename,
        metadata: {
          mangaTitle,
          chapterTitle,
          voiceType,
          speed,
          totalSegments: script.totalSegments,
          estimatedDuration: script.estimatedDuration,
          actualDuration: this.calculateAudioDuration(finalAudio),
          generatedAt: new Date().toISOString(),
          segmentDetails: script.script.map(s => ({
            type: s.type,
            emotion: s.emotion,
            wordCount: s.text.split(' ').length,
            pageNumber: s.pageNumber
          }))
        }
      }
      
      console.log(`✅ TTS generation completed: ${result.audioUrl}`)
      return result
      
    } catch (error) {
      console.error('❌ TTS generation failed:', error)
      throw new Error(`TTS generation failed: ${error.message}`)
    }
  }

  // Generate audio for a single segment
  async generateSegmentAudio(text, emotion, voiceType, speed) {
    if (!this.elevenLabsApiKey) {
      console.log('⚠️ ElevenLabs API key not found, generating placeholder audio')
      return this.generatePlaceholderAudio(text)
    }

    try {
      const voiceConfig = this.voiceConfigs[voiceType] || this.voiceConfigs['narrator-male']
      const emotionConfig = this.emotionSettings[emotion] || this.emotionSettings['neutral']
      
      // Combine voice and emotion settings
      const voiceSettings = {
        stability: emotionConfig.stability,
        similarity_boost: emotionConfig.similarityBoost,
        style: emotionConfig.style,
        use_speaker_boost: voiceConfig.speakerBoost
      }
      
      const response = await axios.post(
        `${this.elevenLabsApiUrl}/text-to-speech/${voiceConfig.voiceId}`,
        {
          text: text,
          voice_settings: voiceSettings,
          model_id: 'eleven_multilingual_v2'
        },
        {
          headers: {
            'xi-api-key': this.elevenLabsApiKey,
            'Content-Type': 'application/json'
          },
          responseType: 'arraybuffer',
          timeout: 30000
        }
      )
      
      return Buffer.from(response.data)
      
    } catch (error) {
      console.error(`❌ ElevenLabs API error for segment:`, error.message)
      return this.generatePlaceholderAudio(text)
    }
  }

  // Generate placeholder audio when API fails
  generatePlaceholderAudio(text) {
    console.log('🔊 Generating placeholder audio for:', text.substring(0, 50) + '...')
    
    // Create a proper MP3 placeholder audio file
    // This is a minimal MP3 header + silent audio data
    const mp3Header = Buffer.from([
      0xFF, 0xFB, 0x90, 0x64, 0x00, 0x0F, 0xF0, 0x00,
      0x00, 0x69, 0x00, 0x00, 0x00, 0x08, 0x00, 0x00,
      0x0D, 0x20, 0x00, 0x00, 0x01, 0x00, 0x00, 0x01,
      0xA4, 0x00, 0x00, 0x00, 0x20, 0x00, 0x00, 0x34,
      0x80, 0x00, 0x00, 0x04
    ])
    
    // Calculate approximate duration (50ms per character, minimum 3 seconds)
    const duration = Math.max(text.length * 50, 3000)
    const frameCount = Math.floor(duration / 26) // ~26ms per MP3 frame
    
    // Create silent MP3 frames
    const silentFrame = Buffer.alloc(417, 0x00) // Standard MP3 frame size
    const frames = []
    
    for (let i = 0; i < frameCount; i++) {
      frames.push(silentFrame)
    }
    
    // Combine header + frames
    const audioBuffer = Buffer.concat([mp3Header, ...frames])
    
    console.log(`✅ Generated placeholder MP3: ${audioBuffer.length} bytes, ~${duration}ms duration`)
    return audioBuffer
  }

  // Combine multiple audio segments
  async combineAudioSegments(segments) {
    if (segments.length === 0) {
      throw new Error('No audio segments to combine')
    }
    
    if (segments.length === 1) {
      return segments[0].audio
    }
    
    console.log(`🔗 Combining ${segments.length} audio segments...`)
    
    // Simple concatenation for now
    // In production, you might want to use ffmpeg or similar for better audio processing
    const totalLength = segments.reduce((sum, seg) => sum + seg.audio.length, 0)
    const combined = Buffer.alloc(totalLength)
    
    let offset = 0
    segments.forEach(segment => {
      segment.audio.copy(combined, offset)
      offset += segment.audio.length
    })
    
    return combined
  }

  // Save audio file to disk
  async saveAudioFile(audioBuffer, filename) {
    const uploadsDir = path.join(__dirname, '../../uploads/narrations')
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true })
    }
    
    const filepath = path.join(uploadsDir, filename)
    fs.writeFileSync(filepath, audioBuffer)
    
    console.log(`💾 Audio saved to: ${filepath}`)
    return filepath
  }

  // Calculate approximate audio duration from buffer
  calculateAudioDuration(audioBuffer) {
    // This is a rough estimate - in production you'd use a proper audio library
    const averageBitrate = 128000 // 128 kbps
    const durationSeconds = (audioBuffer.length * 8) / averageBitrate
    return Math.round(durationSeconds)
  }

  // Generate TTS from simple text (fallback method)
  async generateFromText(text, options = {}) {
    const {
      voiceType = 'narrator-male',
      emotion = 'neutral',
      speed = 1.0,
      title = 'Audio'
    } = options

    console.log(`🎙️ Generating TTS from text: ${text.length} characters`)
    
    try {
      const audioBuffer = await this.generateSegmentAudio(text, emotion, voiceType, speed)
      
      const filename = `text-narration-${title.replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}.mp3`
      const filepath = await this.saveAudioFile(audioBuffer, filename)
      
      // Upload to Cloudinary if configured
      let cloudinaryUrl = null
      if (process.env.CLOUDINARY_CLOUD_NAME) {
        try {
          const uploadResult = await uploadToCloudinary(filepath, {
            resource_type: 'auto',
            folder: 'manga-narrations',
            public_id: `text-${uuidv4()}`
          })
          cloudinaryUrl = uploadResult.secure_url
        } catch (error) {
          console.error('❌ Cloudinary upload failed:', error)
        }
      }
      
      return {
        audioUrl: cloudinaryUrl || `/uploads/narrations/${filename}`,
        localPath: filepath,
        filename: filename,
        metadata: {
          title,
          voiceType,
          emotion,
          speed,
          textLength: text.length,
          wordCount: text.split(' ').length,
          generatedAt: new Date().toISOString()
        }
      }
      
    } catch (error) {
      console.error('❌ Text TTS generation failed:', error)
      throw new Error(`Text TTS generation failed: ${error.message}`)
    }
  }

  // Get available voices
  async getAvailableVoices() {
    if (!this.elevenLabsApiKey) {
      return Object.keys(this.voiceConfigs).map(key => ({
        id: key,
        name: key.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        preview_url: null
      }))
    }

    try {
      const response = await axios.get(`${this.elevenLabsApiUrl}/voices`, {
        headers: {
          'xi-api-key': this.elevenLabsApiKey
        }
      })
      
      return response.data.voices.map(voice => ({
        id: voice.voice_id,
        name: voice.name,
        preview_url: voice.preview_url,
        category: voice.category
      }))
    } catch (error) {
      console.error('❌ Failed to fetch voices:', error)
      return []
    }
  }
}

// Export singleton instance
export const enhancedTTSService = new EnhancedTTSService()