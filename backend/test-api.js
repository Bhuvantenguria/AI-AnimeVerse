import axios from "axios"

const BASE_URL = "http://localhost:3001/api/manga"

async function testNarrationAPI() {
  console.log("🧪 Testing Narration API with Type Validation...")

  const testCases = [
    {
      name: "✅ Valid Request",
      mangaId: "6b1eb93e-473a-4ab3-9922-1a66d2a29a4a",
      data: {
        chapterNumber: 1, // Integer
        voiceType: "narrator-male",
        language: "en",
        speed: 1.0, // Float
        includeDialogue: true, // Boolean
        includeNarration: true // Boolean
      },
      expectSuccess: true
    },
    {
      name: "✅ Valid Request with String Numbers (should convert)",
      mangaId: "6b1eb93e-473a-4ab3-9922-1a66d2a29a4a",
      data: {
        chapterNumber: "2", // String but should convert to int
        voiceType: "narrator-female",
        language: "en",
        speed: "1.5", // String but should convert to float
        includeDialogue: "true", // String but should convert to boolean
        includeNarration: "false" // String but should convert to boolean
      },
      expectSuccess: true
    },
    {
      name: "❌ Invalid Chapter Number",
      mangaId: "6b1eb93e-473a-4ab3-9922-1a66d2a29a4a",
      data: {
        chapterNumber: "invalid",
        voiceType: "narrator-male",
        language: "en",
        speed: 1.0,
        includeDialogue: true,
        includeNarration: true
      },
      expectSuccess: false,
      expectedError: "Invalid chapter number"
    },
    {
      name: "❌ Invalid Speed (too high)",
      mangaId: "6b1eb93e-473a-4ab3-9922-1a66d2a29a4a",
      data: {
        chapterNumber: 1,
        voiceType: "narrator-male",
        language: "en",
        speed: 3.0, // Too high
        includeDialogue: true,
        includeNarration: true
      },
      expectSuccess: false,
      expectedError: "Invalid speed value"
    },
    {
      name: "❌ Invalid Speed (too low)",
      mangaId: "6b1eb93e-473a-4ab3-9922-1a66d2a29a4a",
      data: {
        chapterNumber: 1,
        voiceType: "narrator-male",
        language: "en",
        speed: 0.3, // Too low
        includeDialogue: true,
        includeNarration: true
      },
      expectSuccess: false,
      expectedError: "Invalid speed value"
    }
  ]

  for (const testCase of testCases) {
    console.log(`\n📋 ${testCase.name}`)
    
    try {
      const response = await axios.post(
        `${BASE_URL}/${testCase.mangaId}/narrate`,
        testCase.data,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )

      if (testCase.expectSuccess) {
        console.log("✅ Success!")
        console.log("📊 Response:", {
          requestId: response.data.requestId,
          status: response.data.status,
          manga: response.data.manga,
          settings: response.data.settings
        })
      } else {
        console.log("❌ Expected failure but got success")
        console.log("Response:", response.data)
      }

    } catch (error) {
      if (!testCase.expectSuccess) {
        console.log("✅ Expected failure!")
        console.log("📊 Error:", error.response?.data?.error)
        
        if (testCase.expectedError && error.response?.data?.error?.includes(testCase.expectedError)) {
          console.log("✅ Got expected error message")
        } else {
          console.log("❌ Unexpected error message")
        }
      } else {
        console.log("❌ Unexpected failure!")
        console.log("Error:", error.response?.data || error.message)
      }
    }

    console.log("─".repeat(50))
  }

  console.log("\n🎉 API Testing Complete!")
}

// Check if server is running
async function checkServer() {
  try {
    const response = await axios.get("http://localhost:3001/health")
    console.log("✅ Server is running!")
    return true
  } catch (error) {
    console.log("❌ Server is not running. Please start it with: npm run dev")
    return false
  }
}

// Run tests
console.log("🚀 Starting API Tests...")
const serverRunning = await checkServer()

if (serverRunning) {
  await testNarrationAPI()
} else {
  console.log("\n📝 To start the server:")
  console.log("cd backend")
  console.log("npm run dev")
} 