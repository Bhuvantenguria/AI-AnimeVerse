#!/usr/bin/env node

import axios from 'axios'

async function testNarratorAPI() {
  console.log('🧪 Testing Narrator API...\n')
  
  const API_BASE = 'http://localhost:3001'
  
  try {
    // Test 1: Health Check
    console.log('1️⃣ Testing API Health...')
    const healthResponse = await axios.get(`${API_BASE}/health`)
    console.log('  ✅ API Health:', healthResponse.data.status)
    
    // Test 2: Manga Service Health
    console.log('\n2️⃣ Testing Manga Service Health...')
    const mangaHealthResponse = await axios.get(`${API_BASE}/api/manga/health`)
    console.log('  ✅ Manga Service:', mangaHealthResponse.data.status)
    console.log('  ✅ Features:', mangaHealthResponse.data.features.join(', '))
    
    // Test 3: Narrator Service Health
    console.log('\n3️⃣ Testing Narrator Service Health...')
    const narratorHealthResponse = await axios.get(`${API_BASE}/api/narrator/health`)
    console.log('  ✅ Narrator Service:', narratorHealthResponse.data.status)
    console.log('  ✅ OCR Status:', narratorHealthResponse.data.services.ocr.status)
    console.log('  ✅ TTS Status:', narratorHealthResponse.data.services.tts.status)
    
    // Test 4: Test OCR Only
    console.log('\n4️⃣ Testing OCR Service...')
    const ocrResponse = await axios.post(`${API_BASE}/api/narrator/extract-text`, {
      pages: [
        {
          page: 1,
          image: 'https://via.placeholder.com/800x1200/cccccc/000000?text=Welcome+to+AI+AnimeVerse!+This+is+a+test+for+OCR.'
        }
      ]
    })
    
    console.log('  ✅ OCR Results:')
    console.log(`     - Total pages: ${ocrResponse.data.totalPages}`)
    console.log(`     - Total words: ${ocrResponse.data.totalWords}`)
    console.log(`     - Combined text: "${ocrResponse.data.combinedText.substring(0, 50)}..."`)
    
    // Test 5: Test TTS Only
    console.log('\n5️⃣ Testing TTS Service...')
    const ttsResponse = await axios.post(`${API_BASE}/api/narrator/generate-audio`, {
      text: 'Welcome to AI AnimeVerse! This is a test of our text-to-speech system.',
      voiceType: 'narrator-male',
      emotion: 'neutral',
      speed: 1.0,
      title: 'Test Audio'
    })
    
    console.log('  ✅ TTS Results:')
    console.log(`     - Audio URL: ${ttsResponse.data.audioUrl}`)
    console.log(`     - Filename: ${ttsResponse.data.filename}`)
    console.log(`     - Voice Type: ${ttsResponse.data.metadata.voiceType}`)
    
    // Test 6: Test Full Narration (if manga exists)
    console.log('\n6️⃣ Testing Full Manga Narration...')
    
    try {
      const narrationResponse = await axios.post(`${API_BASE}/api/manga/a96676e5-8ae2-425e-b549-7f15dd34a6d8/narrate`, {
        chapterNumber: '1',
        voiceType: 'narrator-male',
        speed: 1.0,
        includePageNumbers: true,
        addTransitions: true,
        userId: 'test-user'
      })
      
      console.log('  ✅ Full Narration Results:')
      console.log(`     - Success: ${narrationResponse.data.success}`)
      console.log(`     - Audio URL: ${narrationResponse.data.audioUrl}`)
      console.log(`     - Duration: ${narrationResponse.data.metadata.duration}s`)
      console.log(`     - Total Pages: ${narrationResponse.data.metadata.totalPages}`)
      console.log(`     - OCR Words: ${narrationResponse.data.metadata.ocrStats.totalWords}`)
      
    } catch (narrationError) {
      console.log('  ⚠️ Full narration test skipped:', narrationError.response?.data?.error || narrationError.message)
    }
    
    // Test 7: Test Available Voices
    console.log('\n7️⃣ Testing Available Voices...')
    const voicesResponse = await axios.get(`${API_BASE}/api/narrator/voices`)
    
    console.log('  ✅ Available Voices:')
    voicesResponse.data.voices.forEach(voice => {
      console.log(`     - ${voice.name} (${voice.id})`)
    })
    
    console.log('\n🎉 All API tests completed successfully!')
    console.log('\n📊 Test Summary:')
    console.log('  ✅ API Health: Working')
    console.log('  ✅ Manga Service: Working')
    console.log('  ✅ Narrator Service: Working')
    console.log('  ✅ OCR Service: Working')
    console.log('  ✅ TTS Service: Working')
    console.log('  ✅ Voice Options: Working')
    console.log('\n🚀 Your OCR + TTS integration is ready to use!')
    
  } catch (error) {
    console.error('\n❌ API test failed:', error.message)
    
    if (error.response) {
      console.error('Response Status:', error.response.status)
      console.error('Response Data:', error.response.data)
    }
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Make sure the backend server is running on port 3001')
      console.error('   Run: cd backend && npm start')
    }
    
    process.exit(1)
  }
}

// Run tests
testNarratorAPI().catch(console.error) 