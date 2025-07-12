# Test API endpoints for narrator functionality
Write-Host "🧪 Testing Narrator API Endpoints..." -ForegroundColor Green

$apiBase = "http://localhost:3001"

# Test 1: Health Check
Write-Host "`n1️⃣ Testing API Health..." -ForegroundColor Yellow
try {
    $healthResponse = Invoke-RestMethod -Uri "$apiBase/health" -Method GET
    Write-Host "  ✅ API Health: $($healthResponse.status)" -ForegroundColor Green
} catch {
    Write-Host "  ❌ API Health failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Manga Service Health
Write-Host "`n2️⃣ Testing Manga Service Health..." -ForegroundColor Yellow
try {
    $mangaHealthResponse = Invoke-RestMethod -Uri "$apiBase/api/manga/health" -Method GET
    Write-Host "  ✅ Manga Service: $($mangaHealthResponse.status)" -ForegroundColor Green
    Write-Host "  ✅ Features: $($mangaHealthResponse.features -join ', ')" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Manga Service Health failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Narrator Service Health
Write-Host "`n3️⃣ Testing Narrator Service Health..." -ForegroundColor Yellow
try {
    $narratorHealthResponse = Invoke-RestMethod -Uri "$apiBase/api/narrator/health" -Method GET
    Write-Host "  ✅ Narrator Service: $($narratorHealthResponse.status)" -ForegroundColor Green
    Write-Host "  ✅ OCR Status: $($narratorHealthResponse.services.ocr.status)" -ForegroundColor Green
    Write-Host "  ✅ TTS Status: $($narratorHealthResponse.services.tts.status)" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Narrator Service Health failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Test OCR Service
Write-Host "`n4️⃣ Testing OCR Service..." -ForegroundColor Yellow
try {
    $ocrData = @{
        pages = @(
            @{
                page = 1
                image = "https://via.placeholder.com/800x1200/cccccc/000000?text=Welcome+to+AI+AnimeVerse!+This+is+a+test+for+OCR."
            }
        )
    } | ConvertTo-Json -Depth 3

    $ocrResponse = Invoke-RestMethod -Uri "$apiBase/api/narrator/extract-text" -Method POST -Body $ocrData -ContentType "application/json"
    Write-Host "  ✅ OCR Results:" -ForegroundColor Green
    Write-Host "     - Total pages: $($ocrResponse.totalPages)" -ForegroundColor Green
    Write-Host "     - Total words: $($ocrResponse.totalWords)" -ForegroundColor Green
    Write-Host "     - Combined text: '$($ocrResponse.combinedText.Substring(0, [Math]::Min(50, $ocrResponse.combinedText.Length)))...'" -ForegroundColor Green
} catch {
    Write-Host "  ❌ OCR Service failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 5: Test TTS Service
Write-Host "`n5️⃣ Testing TTS Service..." -ForegroundColor Yellow
try {
    $ttsData = @{
        text = "Welcome to AI AnimeVerse! This is a test of our text-to-speech system."
        voiceType = "narrator-male"
        emotion = "neutral"
        speed = 1.0
        title = "Test Audio"
    } | ConvertTo-Json

    $ttsResponse = Invoke-RestMethod -Uri "$apiBase/api/narrator/generate-audio" -Method POST -Body $ttsData -ContentType "application/json"
    Write-Host "  ✅ TTS Results:" -ForegroundColor Green
    Write-Host "     - Audio URL: $($ttsResponse.audioUrl)" -ForegroundColor Green
    Write-Host "     - Filename: $($ttsResponse.filename)" -ForegroundColor Green
    Write-Host "     - Voice Type: $($ttsResponse.metadata.voiceType)" -ForegroundColor Green
} catch {
    Write-Host "  ❌ TTS Service failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 6: Test Manga Chapter Narration
Write-Host "`n6️⃣ Testing Manga Chapter Narration..." -ForegroundColor Yellow
try {
    $narrationData = @{
        chapterNumber = "1"
        voiceType = "narrator-male"
        speed = 1.0
        includePageNumbers = $true
        addTransitions = $true
        userId = "test-user"
    } | ConvertTo-Json

    $narrationResponse = Invoke-RestMethod -Uri "$apiBase/api/manga/a96676e5-8ae2-425e-b549-7f15dd34a6d8/narrate" -Method POST -Body $narrationData -ContentType "application/json"
    Write-Host "  ✅ Manga Narration Results:" -ForegroundColor Green
    Write-Host "     - Success: $($narrationResponse.success)" -ForegroundColor Green
    Write-Host "     - Audio URL: $($narrationResponse.audioUrl)" -ForegroundColor Green
    Write-Host "     - Duration: $($narrationResponse.metadata.duration)s" -ForegroundColor Green
    Write-Host "     - Total Pages: $($narrationResponse.metadata.totalPages)" -ForegroundColor Green
    Write-Host "     - OCR Words: $($narrationResponse.metadata.ocrStats.totalWords)" -ForegroundColor Green
} catch {
    Write-Host "  ⚠️ Manga narration test failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $responseContent = $_.Exception.Response.Content.ReadAsStringAsync().Result
        Write-Host "     Response: $responseContent" -ForegroundColor Red
    }
}

# Test 7: Test Available Voices
Write-Host "`n7️⃣ Testing Available Voices..." -ForegroundColor Yellow
try {
    $voicesResponse = Invoke-RestMethod -Uri "$apiBase/api/narrator/voices" -Method GET
    Write-Host "  ✅ Available Voices:" -ForegroundColor Green
    foreach ($voice in $voicesResponse.voices) {
        Write-Host "     - $($voice.name) ($($voice.id))" -ForegroundColor Green
    }
} catch {
    Write-Host "  ❌ Voices Service failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🎉 API testing completed!" -ForegroundColor Green
Write-Host "📊 Check the results above to see which services are working." -ForegroundColor Cyan 