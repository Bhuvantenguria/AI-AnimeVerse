import { processNarrationJob } from "./src/jobs/narrationJob.js"

// Mock fastify object for testing
const mockFastify = {
  log: {
    info: (msg) => console.log(`[INFO] ${msg}`),
    error: (msg) => console.error(`[ERROR] ${msg}`),
    warn: (msg) => console.warn(`[WARN] ${msg}`)
  },
  redis: null,
  cloudinary: null,
  websocket: null
}

// Test with multiple scenarios
const testCases = [
  {
    name: "Real Manga Test (One Piece)",
    data: {
      requestId: "test-one-piece-123",
      userId: "test-user",
      mangaId: "a1c7c817-4e59-43b7-9365-09675a149a6f", // One Piece on MangaDex
      chapterNumber: 1,
      voiceType: "narrator-male",
      language: "en",
      speed: 1.0,
      includeDialogue: true,
      includeNarration: true
    }
  },
  {
    name: "Anime Test (Naruto)",
    data: {
      requestId: "test-naruto-456",
      userId: "test-user", 
      mangaId: "1", // Naruto on Jikan
      chapterNumber: 5,
      voiceType: "narrator-female",
      language: "en",
      speed: 1.2,
      includeDialogue: true,
      includeNarration: true
    }
  },
  {
    name: "Fallback Test (Unknown ID)",
    data: {
      requestId: "test-fallback-789",
      userId: "test-user",
      mangaId: "unknown-manga-id",
      chapterNumber: 3,
      voiceType: "narrator-male",
      language: "en",
      speed: 0.9,
      includeDialogue: true,
      includeNarration: true
    }
  }
]

console.log("🧪 Testing enhanced narration system...")

for (const testCase of testCases) {
  console.log(`\n📋 ${testCase.name}`)
  console.log("Data:", testCase.data)
  
  try {
    const result = await processNarrationJob(testCase.data, mockFastify)
    console.log("✅ Success!")
    console.log("📊 Result:", {
      audioUrl: result.audioUrl,
      duration: `${Math.round(result.duration/1000)}s`,
      segments: result.audioInfo.segments
    })
  } catch (error) {
    console.error("❌ Failed:", error.message)
  }
  
  console.log("─".repeat(50))
}

console.log("\n�� Test complete!") 