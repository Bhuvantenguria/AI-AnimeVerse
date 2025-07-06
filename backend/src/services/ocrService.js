import Tesseract from 'tesseract.js'
import axios from 'axios'

// OCR service for extracting text from manga panels
export class OCRService {
  
  constructor() {
    this.initialized = false
    this.worker = null
  }

  // Initialize Tesseract worker
  async initialize() {
    if (this.initialized) return

    try {
      console.log('🔍 Initializing OCR worker...')
      this.worker = await Tesseract.createWorker('eng+jpn', 1, {
        logger: m => {
          if (m.status === 'recognizing text') {
            console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`)
          }
        }
      })

      // Configure for manga text detection
      await this.worker.setParameters({
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,!?-\'\" ',
        tessedit_pageseg_mode: Tesseract.PSM.AUTO_OSD,
      })

      this.initialized = true
      console.log('✅ OCR worker initialized successfully')
    } catch (error) {
      console.error('❌ OCR initialization failed:', error)
      throw new Error('Failed to initialize OCR service')
    }
  }

  // Extract text from a single manga panel
  async extractTextFromImage(imageUrl) {
    if (!this.initialized) {
      await this.initialize()
    }

    try {
      // Validate image URL
      if (!imageUrl || typeof imageUrl !== 'string') {
        throw new Error('Invalid image URL provided')
      }

      console.log(`🔍 Starting OCR for image: ${imageUrl}`)

      // Download and preprocess image
      const processedImage = await this.preprocessImage(imageUrl)
      
      // Run OCR
      const result = await this.worker.recognize(processedImage)
      const extractedText = result.data.text.trim()

      console.log(`✅ OCR completed. Text length: ${extractedText.length} characters`)
      
      // Clean and format the text
      const cleanText = this.cleanExtractedText(extractedText)
      
      return {
        originalText: extractedText,
        cleanText: cleanText,
        confidence: result.data.confidence,
        wordCount: cleanText.split(' ').length
      }
    } catch (error) {
      console.error(`❌ OCR extraction failed for ${imageUrl}:`, error.message)
      
      // Return placeholder text instead of empty to keep narration flowing
      const placeholder = `Unable to read text from this page. ${error.message.includes('network') ? 'Please check your internet connection.' : 'The image may be corrupted or inaccessible.'}`
      
      return {
        originalText: '',
        cleanText: placeholder,
        confidence: 0,
        wordCount: placeholder.split(' ').length,
        error: error.message
      }
    }
  }

  // Preprocess image for better OCR accuracy
  async preprocessImage(imageUrl) {
    try {
      console.log('🖼️ Preparing image for OCR...')
      
      // Since Sharp is not available on Windows, just return the URL
      // Tesseract.js can handle direct URLs and will do basic preprocessing
      console.log('✅ Using direct image URL for OCR')
      return imageUrl
    } catch (error) {
      console.error('❌ Image preparation failed:', error)
      // Fallback to original URL
      return imageUrl
    }
  }

  // Clean and format extracted text
  cleanExtractedText(text) {
    return text
      // Remove extra whitespace
      .replace(/\s+/g, ' ')
      // Remove special characters that don't belong in speech
      .replace(/[^\w\s.,!?'"()-]/g, '')
      // Fix common OCR mistakes
      .replace(/\b1\b/g, 'I')
      .replace(/\b0\b/g, 'O')
      .replace(/\|/g, 'I')
      // Clean up punctuation
      .replace(/\s+([.,!?])/g, '$1')
      .replace(/([.,!?])\s*([.,!?])/g, '$1 $2')
      // Trim and clean
      .trim()
  }

  // Extract text from multiple manga pages
  async extractTextFromPages(pages) {
    console.log(`🔍 Starting OCR for ${pages.length} pages...`)
    
    const results = []
    let totalText = ''
    
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i]
      
      // Handle different page structures
      const pageNumber = page.page || page.pageNumber || (i + 1)
      const imageUrl = page.image || page.url || page.imageUrl
      
      console.log(`📄 Processing page ${pageNumber}/${pages.length}...`)
      
      if (!imageUrl) {
        console.warn(`⚠️ No image URL found for page ${pageNumber}, skipping...`)
        results.push({
          pageNumber: pageNumber,
          imageUrl: null,
          originalText: '',
          cleanText: 'No image available for this page.',
          confidence: 0,
          wordCount: 0,
          error: 'No image URL provided'
        })
        continue
      }
      
      const ocrResult = await this.extractTextFromImage(imageUrl)
      
      results.push({
        pageNumber: pageNumber,
        imageUrl: imageUrl,
        ...ocrResult
      })
      
      if (ocrResult.cleanText) {
        totalText += `Page ${pageNumber}: ${ocrResult.cleanText}\n\n`
      }
    }
    
    console.log(`✅ OCR completed for ${results.length}/${pages.length} pages`)
    
    return {
      pages: results,
      combinedText: totalText.trim(),
      totalPages: pages.length,
      totalWords: totalText.split(' ').length,
      averageConfidence: results.reduce((sum, r) => sum + r.confidence, 0) / results.length
    }
  }

  // Generate narrative script from extracted text
  generateNarrativeScript(ocrResults, options = {}) {
    const {
      includePageNumbers = true,
      addTransitions = true,
      voiceType = 'narrator-male'
    } = options

    let script = []
    
    // Add opening
    script.push({
      type: 'intro',
      text: 'Chapter narration begins.',
      emotion: 'neutral',
      pause: 1000
    })

    // Process each page
    ocrResults.pages.forEach((page, index) => {
      if (page.cleanText) {
        // Add page transition
        if (includePageNumbers && addTransitions) {
          script.push({
            type: 'transition',
            text: `Page ${page.pageNumber}.`,
            emotion: 'neutral',
            pause: 500
          })
        }

        // Add main content with emotion detection
        const emotion = this.detectEmotion(page.cleanText)
        script.push({
          type: 'content',
          text: page.cleanText,
          emotion: emotion,
          pageNumber: page.pageNumber,
          pause: 800
        })
      }
    })

    // Add closing
    script.push({
      type: 'outro',
      text: 'Chapter narration complete.',
      emotion: 'neutral',
      pause: 1000
    })

    return {
      script: script,
      totalSegments: script.length,
      estimatedDuration: this.estimateDuration(script),
      voiceType: voiceType
    }
  }

  // Simple emotion detection based on text content
  detectEmotion(text) {
    const lowerText = text.toLowerCase()
    
    // Excitement/Action
    if (lowerText.match(/(!|attack|fight|battle|run|fast|quick|amazing|incredible)/)) {
      return 'excited'
    }
    
    // Sadness
    if (lowerText.match(/(sad|cry|tear|sorry|lost|death|goodbye)/)) {
      return 'sad'
    }
    
    // Anger
    if (lowerText.match(/(angry|mad|hate|damn|stupid|idiot|furious)/)) {
      return 'angry'
    }
    
    // Fear/Suspense
    if (lowerText.match(/(scared|afraid|fear|dark|danger|help|monster)/)) {
      return 'fearful'
    }
    
    // Joy/Happy
    if (lowerText.match(/(happy|joy|laugh|smile|love|great|wonderful|awesome)/)) {
      return 'joyful'
    }
    
    // Default neutral
    return 'neutral'
  }

  // Estimate total duration of script
  estimateDuration(script) {
    let totalDuration = 0
    
    script.forEach(segment => {
      // Average speaking rate: 150 words per minute
      const words = segment.text.split(' ').length
      const speakingTime = (words / 150) * 60 * 1000 // Convert to milliseconds
      const pauseTime = segment.pause || 0
      
      totalDuration += speakingTime + pauseTime
    })
    
    return Math.round(totalDuration / 1000) // Return in seconds
  }

  // Cleanup worker
  async terminate() {
    if (this.worker) {
      await this.worker.terminate()
      this.initialized = false
      console.log('🔍 OCR worker terminated')
    }
  }
}

// Export singleton instance
export const ocrService = new OCRService() 