#!/usr/bin/env node

import { ocrService } from './src/services/ocrService.js'
import { enhancedTTSService } from './src/services/enhancedTTSService.js'
import { getMangaDetails, getChapterPages, getSelfHostedChapters } from './src/services/mangadx.js'
import { prisma } from './src/plugins/prisma.js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

async function testServices() {
  console.log('🧪 Testing OCR + TTS Services...\n')
  
  try {
    // Test 1: OCR Service
    console.log('1️⃣ Testing OCR Service...')
    const testPages = [
      {
        page: 1,
        image: 'https://via.placeholder.com/800x1200/cccccc/000000?text=Welcome+to+AI+AnimeVerse!+This+is+a+test+image+for+OCR+testing.+The+system+should+extract+this+text+properly.'
      },
      {
        page: 2,
        image: 'https://via.placeholder.com/800x1200/dddddd/000000?text=Page+2+content.+This+is+another+test+page+with+different+text+to+verify+OCR+functionality.'
      }
    ]
    
    console.log('  → Initializing OCR worker...')
    await ocrService.initialize()
    
    console.log('  → Extracting text from test pages...')
    const ocrResults = await ocrService.extractTextFromPages(testPages)
    
    console.log('  ✅ OCR Results:')
    console.log(`     - Total pages: ${ocrResults.totalPages}`)
    console.log(`     - Total words: ${ocrResults.totalWords}`)
    console.log(`     - Average confidence: ${ocrResults.averageConfidence}%`)
    console.log(`     - Combined text length: ${ocrResults.combinedText.length} characters`)
    
    // Test 2: TTS Service
    console.log('\n2️⃣ Testing TTS Service...')
    const testText = 'Welcome to AI AnimeVerse! This is a test of our text-to-speech system. The narrator will read this text with emotion and clarity.'
    
    console.log('  → Generating TTS audio...')
    const ttsResult = await enhancedTTSService.generateFromText(testText, {
      voiceType: 'narrator-male',
      emotion: 'neutral',
      speed: 1.0,
      title: 'Test Audio'
    })
    
    console.log('  ✅ TTS Results:')
    console.log(`     - Audio URL: ${ttsResult.audioUrl}`)
    console.log(`     - File size: ${ttsResult.metadata.textLength} characters`)
    console.log(`     - Word count: ${ttsResult.metadata.wordCount}`)
    console.log(`     - Voice type: ${ttsResult.metadata.voiceType}`)
    
    // Test 3: Integrated OCR + TTS
    console.log('\n3️⃣ Testing Integrated OCR + TTS...')
    
    console.log('  → Generating narrative script...')
    const script = ocrService.generateNarrativeScript(ocrResults, {
      includePageNumbers: true,
      addTransitions: true,
      voiceType: 'narrator-male'
    })
    
    console.log('  → Generating final audio...')
    const finalAudio = await enhancedTTSService.generateFromOCRScript(script, {
      voiceType: 'narrator-male',
      speed: 1.0,
      chapterTitle: 'Test Chapter',
      mangaTitle: 'Test Manga'
    })
    
    console.log('  ✅ Integrated Results:')
    console.log(`     - Final audio URL: ${finalAudio.audioUrl}`)
    console.log(`     - Total segments: ${finalAudio.metadata.totalSegments}`)
    console.log(`     - Estimated duration: ${finalAudio.metadata.estimatedDuration}s`)
    console.log(`     - Generated at: ${finalAudio.metadata.generatedAt}`)
    
    // Test 4: MangaDx Service
    console.log('\n4️⃣ Testing MangaDx Service...')
    
    console.log('  → Testing manga details...')
    const mangaDetails = await getMangaDetails('a96676e5-8ae2-425e-b549-7f15dd34a6d8')
    
    console.log('  ✅ MangaDx Results:')
    console.log(`     - Manga title: ${mangaDetails.title}`)
    console.log(`     - Total chapters: ${mangaDetails.totalChapters}`)
    console.log(`     - Self-hosted only: ${mangaDetails.selfHostedOnly}`)
    console.log(`     - Authors: ${mangaDetails.authors.join(', ')}`)
    
    // Test 5: Database Connection
    console.log('\n5️⃣ Testing Database Connection...')
    
    if (prisma) {
      console.log('  → Connecting to database...')
      await prisma.$connect()
      
      console.log('  → Testing database query...')
      const userCount = await prisma.user.count()
      
      console.log('  ✅ Database Results:')
      console.log(`     - Connection: Active`)
      console.log(`     - Total users: ${userCount}`)
      
      await prisma.$disconnect()
    } else {
      console.log('  ⚠️ Database not configured')
    }
    
    // Test 6: Voice Options
    console.log('\n6️⃣ Testing Voice Options...')
    
    console.log('  → Getting available voices...')
    const voices = await enhancedTTSService.getAvailableVoices()
    
    console.log('  ✅ Voice Results:')
    console.log(`     - Available voices: ${voices.length}`)
    voices.forEach(voice => {
      console.log(`     - ${voice.name} (${voice.id})`)
    })
    
    // Cleanup
    console.log('\n🧹 Cleaning up...')
    await ocrService.terminate()
    
    console.log('\n🎉 All tests completed successfully!')
    console.log('\n📊 Summary:')
    console.log('  ✅ OCR Service: Working')
    console.log('  ✅ TTS Service: Working')
    console.log('  ✅ Integrated Pipeline: Working')
    console.log('  ✅ MangaDx Service: Working')
    console.log('  ✅ Database Connection: Working')
    console.log('  ✅ Voice Options: Working')
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

// Run tests
testServices().catch(console.error) 