'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Slider } from './ui/slider'
import { Switch } from './ui/switch'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Progress } from './ui/progress'
import { Separator } from './ui/separator'
import { ScrollArea } from './ui/scroll-area'
import { 
  Play, 
  Pause, 
  Square, 
  Volume2, 
  VolumeX, 
  Download, 
  Eye,
  EyeOff,
  BookOpen,
  Mic,
  Wand2,
  Loader2,
  CheckCircle,
  XCircle,
  FileText,
  Headphones
} from 'lucide-react'

interface MangaNarratorProps {
  mangaId: string
  chapterNumber: string
  mangaTitle: string
  chapterTitle: string
  pages?: Array<{
    page: number
    image: string
    width?: number
    height?: number
  }>
}

interface OCRResult {
  combinedText: string
  pages: Array<{
    pageNumber: number
    text: string
    confidence: number
    wordCount: number
  }>
}

interface NarrationMetadata {
  mangaTitle: string
  chapterTitle: string
  chapterNumber: string
  totalPages: number
  voiceType: string
  speed: number
  duration: number
  generatedAt: string
  ocrStats: {
    totalWords: number
    averageConfidence: number
    pagesWithText: number
  }
}

export default function MangaNarrator({ 
  mangaId, 
  chapterNumber, 
  mangaTitle, 
  chapterTitle, 
  pages = [] 
}: MangaNarratorProps) {
  // State management
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState<'settings' | 'processing' | 'complete'>('settings')
  const [progress, setProgress] = useState(0)
  const [currentOperation, setCurrentOperation] = useState('')
  
  // Audio state
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioVolume, setAudioVolume] = useState(0.8)
  const [audioCurrentTime, setAudioCurrentTime] = useState(0)
  const [audioDuration, setAudioDuration] = useState(0)
  
  // Settings
  const [voiceType, setVoiceType] = useState('narrator-male')
  const [speed, setSpeed] = useState(1.0)
  const [includePageNumbers, setIncludePageNumbers] = useState(true)
  const [addTransitions, setAddTransitions] = useState(true)
  
  // Results
  const [ocrResults, setOcrResults] = useState<OCRResult | null>(null)
  const [metadata, setMetadata] = useState<NarrationMetadata | null>(null)
  const [showOcrText, setShowOcrText] = useState(false)
  
  // Audio element ref
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Initialize audio element
  useEffect(() => {
    if (audioUrl && !audioRef.current) {
      console.log('🎵 Initializing audio player with URL:', audioUrl)
      audioRef.current = new Audio(audioUrl)
      audioRef.current.volume = audioVolume
      
      // Audio event listeners
      audioRef.current.addEventListener('loadedmetadata', () => {
        console.log('✅ Audio metadata loaded, duration:', audioRef.current?.duration)
        setAudioDuration(audioRef.current?.duration || 0)
      })
      
      audioRef.current.addEventListener('timeupdate', () => {
        setAudioCurrentTime(audioRef.current?.currentTime || 0)
      })
      
      audioRef.current.addEventListener('ended', () => {
        console.log('🏁 Audio playback ended')
        setIsPlaying(false)
      })
      
      audioRef.current.addEventListener('error', (e) => {
        console.error('❌ Audio error:', e)
        console.error('Audio URL that failed:', audioUrl)
        console.error('Audio error details:', {
          error: e.target?.error,
          networkState: e.target?.networkState,
          readyState: e.target?.readyState
        })
        setIsPlaying(false)
        
        // Try reloading the audio after a short delay
        setTimeout(() => {
          if (audioRef.current) {
            console.log('🔄 Retrying audio load...')
            audioRef.current.load()
          }
        }, 2000)
      })
      
      audioRef.current.addEventListener('canplay', () => {
        console.log('✅ Audio ready to play')
      })
    }
    
    return () => {
      if (audioRef.current) {
        console.log('🧹 Cleaning up audio player')
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [audioUrl, audioVolume])

  // Handle audio volume changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = audioVolume
    }
  }, [audioVolume])

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Handle narration generation
  const handleGenerateNarration = async () => {
    if (!pages || pages.length === 0) {
      alert('No pages available for narration')
      return
    }

    setIsLoading(true)
    setStep('processing')
    setProgress(0)
    setCurrentOperation('Initializing...')

    try {
      // Step 1: Send narration request
      setCurrentOperation('Starting OCR text extraction...')
      setProgress(10)

      const response = await fetch(`/api/manga/${mangaId}/narrate-chapter`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chapterNumber,
          voiceType,
          speed,
          includePageNumbers,
          addTransitions,
          userId: 'anonymous' // In production, get from auth context
        }),
      })

      console.log('📡 API Response status:', response.status)
      console.log('📡 API Response ok:', response.ok)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ API Error:', errorText)
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`)
      }

      setCurrentOperation('Processing OCR results...')
      setProgress(50)

      const result = await response.json()
      
      console.log('📦 API Response:', result)
      
      // Validate response structure - Fixed validation logic
      if (!result || typeof result !== 'object') {
        console.error('❌ Invalid response format:', result)
        throw new Error('Invalid response format')
      }
      
      if (result.success !== true) {
        console.error('❌ API call failed:', result)
        throw new Error('API call failed: ' + (result.message || result.error || 'Unknown error'))
      }
      
      if (!result.audioUrl || typeof result.audioUrl !== 'string') {
        console.error('❌ Missing or invalid audioUrl in response:', result)
        throw new Error('Invalid response: missing or invalid audioUrl')
      }
      
      console.log('✅ Valid response received:', {
        success: result.success,
        audioUrl: result.audioUrl,
        hasMetadata: !!result.metadata,
        hasOcrResults: !!result.ocrResults
      })

      setCurrentOperation('Generating audio with TTS...')
      setProgress(80)

      // Simulate processing time for better UX
      await new Promise(resolve => setTimeout(resolve, 1000))

      setCurrentOperation('Finalizing audio...')
      setProgress(95)

      // Set results - Fixed absolute URL generation
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      const absoluteAudioUrl = result.audioUrl.startsWith('http') 
        ? result.audioUrl 
        : `${backendUrl}${result.audioUrl}`
      
      console.log('🎵 Setting audio URL:', absoluteAudioUrl)
      console.log('📊 Setting OCR results:', result.ocrResults)
      console.log('📝 Setting metadata:', result.metadata)
      
      // Set all state at once to ensure consistency
      setAudioUrl(absoluteAudioUrl)
      setOcrResults(result.ocrResults || null)
      setMetadata(result.metadata || null)
      
      setProgress(100)
      setCurrentOperation('Complete!')
      
      console.log('✅ Setting step to complete')
      setStep('complete')
      
      // Log state after a brief delay to see if it updated
      setTimeout(() => {
        console.log('🔄 State check after update:', {
          step: 'complete', // This should be complete now
          audioUrl: absoluteAudioUrl,
          hasMetadata: !!result.metadata,
          hasOcrResults: !!result.ocrResults
        })
      }, 100)

    } catch (error) {
      console.error('Narration generation failed:', error)
      alert(`Narration failed: ${error.message}`)
      setStep('settings')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle audio playback
  const handlePlayPause = () => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.play()
      setIsPlaying(true)
    }
  }

  // Handle audio stop
  const handleStop = () => {
    if (!audioRef.current) return
    
    audioRef.current.pause()
    audioRef.current.currentTime = 0
    setIsPlaying(false)
  }

  // Handle audio seek
  const handleSeek = (value: number[]) => {
    if (!audioRef.current) return
    
    const newTime = (value[0] / 100) * audioDuration
    audioRef.current.currentTime = newTime
  }

  // Handle audio download
  const handleDownload = () => {
    if (!audioUrl) return
    
    const link = document.createElement('a')
    link.href = audioUrl
    link.download = `${mangaTitle}-${chapterTitle}-narration.mp3`
    link.click()
  }

  // Reset to settings
  const handleReset = () => {
    setStep('settings')
    setAudioUrl(null)
    setOcrResults(null)
    setMetadata(null)
    setIsPlaying(false)
    setProgress(0)
    setCurrentOperation('')
  }

  // Mock test function with the user's valid response
  const handleMockTest = () => {
    console.log('🧪 Testing with mock response...')
    
    const mockResponse = {
      "success": true,
      "audioUrl": "/uploads/narrations/ocr-narration-One-Piece--Official-Colored--1751787443191.mp3",
      "filename": "ocr-narration-One-Piece--Official-Colored--1751787443191.mp3",
      "metadata": {
        "mangaTitle": "One Piece (Official Colored)",
        "chapterTitle": "Village",
        "chapterNumber": "21",
        "totalPages": 20,
        "voiceType": "narrator-male",
        "speed": 1,
        "duration": 203,
        "generatedAt": "2025-07-06T07:37:38.051Z",
        "ocrStats": {
          "totalWords": 573,
          "averageConfidence": 80.1,
          "pagesWithText": 17
        }
      },
      "ocrResults": {
        "combinedText": "Page 1: CREDITS tabibito, Sewil, Galaxy 9000...",
        "pages": [
          {
            "pageNumber": 1,
            "text": "CREDITS tabibito, Sewil, Galaxy 9000...",
            "confidence": 84
          }
        ]
      }
    }

    // Set the mock data
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    const absoluteAudioUrl = `${backendUrl}${mockResponse.audioUrl}`
    
    console.log('🎵 Mock Audio URL:', absoluteAudioUrl)
    setAudioUrl(absoluteAudioUrl)
    setOcrResults(mockResponse.ocrResults)
    setMetadata(mockResponse.metadata)
    setStep('complete')
    setProgress(100)
    setCurrentOperation('Mock Test Complete!')
    
    console.log('✅ Mock test completed - play button should now be visible!')
  }

  return (
    <Card className="w-full max-w-4xl mx-auto" data-step={step}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Manga Narrator
        </CardTitle>
        <CardDescription>
          AI-powered OCR + TTS narration for manga chapters
        </CardDescription>
        <div className="flex gap-2">
          <Badge variant="secondary">{mangaTitle}</Badge>
          <Badge variant="outline">{chapterTitle}</Badge>
          <Badge variant="outline">{pages.length} pages</Badge>
        </div>
        
        {/* Debug info */}
        <div className="text-xs text-muted-foreground flex gap-2">
          <Badge variant="outline">Step: {step}</Badge>
          <Badge variant="outline">Audio: {audioUrl ? 'Ready' : 'None'}</Badge>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => {
              console.log('🔍 Debug State:', { step, audioUrl, metadata })
              setStep('complete') // Force complete for testing
            }}
          >
            🔍 Debug
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleMockTest}
          >
            🧪 Mock Test
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Settings Step */}
        {step === 'settings' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Voice Type */}
              <div className="space-y-2">
                <Label htmlFor="voice-type">Voice Type</Label>
                <Select value={voiceType} onValueChange={setVoiceType}>
                  <SelectTrigger id="voice-type">
                    <SelectValue placeholder="Select voice type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="narrator-male">Narrator (Male)</SelectItem>
                    <SelectItem value="narrator-female">Narrator (Female)</SelectItem>
                    <SelectItem value="character-young">Character (Young)</SelectItem>
                    <SelectItem value="character-serious">Character (Serious)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Speed */}
              <div className="space-y-2">
                <Label htmlFor="speed">Speed: {speed}x</Label>
                <Slider
                  id="speed"
                  min={0.5}
                  max={2.0}
                  step={0.1}
                  value={[speed]}
                  onValueChange={(value) => setSpeed(value[0])}
                />
              </div>
            </div>

            {/* Options */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="page-numbers">Include Page Numbers</Label>
                <Switch
                  id="page-numbers"
                  checked={includePageNumbers}
                  onCheckedChange={setIncludePageNumbers}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="transitions">Add Transitions</Label>
                <Switch
                  id="transitions"
                  checked={addTransitions}
                  onCheckedChange={setAddTransitions}
                />
              </div>
            </div>

            {/* Generate Button */}
            <Button 
              onClick={handleGenerateNarration}
              disabled={isLoading || pages.length === 0}
              className="w-full"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-4 w-4" />
                  Generate Narration
                </>
              )}
            </Button>
          </div>
        )}

        {/* Processing Step */}
        {step === 'processing' && (
          <div className="space-y-4">
            <div className="text-center space-y-2">
              <Loader2 className="h-8 w-8 animate-spin mx-auto" />
              <p className="text-sm text-muted-foreground">{currentOperation}</p>
            </div>
            <Progress value={progress} className="w-full" />
            <div className="text-xs text-center text-muted-foreground">
              {progress}% complete
            </div>
          </div>
        )}

        {/* Complete Step */}
        {step === 'complete' && (
          <div className="space-y-6">
            {/* Success Message */}
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span>Narration generated successfully!</span>
            </div>

            {/* Audio Player */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Headphones className="h-5 w-5" />
                  Audio Player
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Controls */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePlayPause}
                    disabled={!audioUrl}
                  >
                    {isPlaying ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleStop}
                    disabled={!audioUrl}
                  >
                    <Square className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownload}
                    disabled={!audioUrl}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  
                  {/* Debug test button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      console.log('🧪 Manual audio test')
                      console.log('Audio URL:', audioUrl)
                      console.log('Audio element:', audioRef.current)
                      if (audioRef.current) {
                        console.log('Audio ready state:', audioRef.current.readyState)
                        console.log('Audio duration:', audioRef.current.duration)
                        console.log('Audio current time:', audioRef.current.currentTime)
                      }
                      // Try creating a new audio element
                      const testAudio = new Audio(audioUrl)
                      testAudio.addEventListener('canplay', () => {
                        console.log('✅ Test audio can play')
                      })
                      testAudio.addEventListener('error', (e) => {
                        console.error('❌ Test audio error:', e)
                      })
                    }}
                    disabled={!audioUrl}
                  >
                    🧪 Test
                  </Button>
                  
                  {/* Direct play button for testing */}
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => {
                      console.log('🚀 Direct play attempt')
                      const directAudio = new Audio(audioUrl)
                      directAudio.play().then(() => {
                        console.log('✅ Direct audio playing')
                      }).catch(error => {
                        console.error('❌ Direct play failed:', error)
                      })
                    }}
                    disabled={!audioUrl}
                  >
                    🚀 Direct Play
                  </Button>
                </div>

                {/* Progress */}
                <div className="space-y-2">
                  <Slider
                    value={[audioDuration > 0 ? (audioCurrentTime / audioDuration) * 100 : 0]}
                    onValueChange={handleSeek}
                    max={100}
                    step={1}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{formatTime(audioCurrentTime)}</span>
                    <span>{formatTime(audioDuration)}</span>
                  </div>
                </div>

                {/* Volume */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setAudioVolume(audioVolume > 0 ? 0 : 0.8)}
                  >
                    {audioVolume > 0 ? (
                      <Volume2 className="h-4 w-4" />
                    ) : (
                      <VolumeX className="h-4 w-4" />
                    )}
                  </Button>
                  <Slider
                    value={[audioVolume * 100]}
                    onValueChange={(value) => setAudioVolume(value[0] / 100)}
                    max={100}
                    step={1}
                    className="flex-1"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Metadata */}
            {metadata && (
              <Card>
                <CardHeader>
                  <CardTitle>Narration Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Duration:</span> {formatTime(metadata.duration)}
                    </div>
                    <div>
                      <span className="font-medium">Voice:</span> {metadata.voiceType}
                    </div>
                    <div>
                      <span className="font-medium">Speed:</span> {metadata.speed}x
                    </div>
                    <div>
                      <span className="font-medium">Pages:</span> {metadata.totalPages}
                    </div>
                    <div>
                      <span className="font-medium">Words:</span> {metadata.ocrStats.totalWords}
                    </div>
                    <div>
                      <span className="font-medium">Confidence:</span> {Math.round(metadata.ocrStats.averageConfidence)}%
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* OCR Results */}
            {ocrResults && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Extracted Text
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowOcrText(!showOcrText)}
                    >
                      {showOcrText ? (
                        <>
                          <EyeOff className="h-4 w-4 mr-2" />
                          Hide
                        </>
                      ) : (
                        <>
                          <Eye className="h-4 w-4 mr-2" />
                          Show
                        </>
                      )}
                    </Button>
                  </CardTitle>
                </CardHeader>
                {showOcrText && (
                  <CardContent>
                    <ScrollArea className="h-40">
                      <Textarea
                        value={ocrResults.combinedText}
                        readOnly
                        className="resize-none"
                        rows={10}
                      />
                    </ScrollArea>
                  </CardContent>
                )}
              </Card>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <Button onClick={handleReset} variant="outline">
                Generate New
              </Button>
              <Button onClick={handleMockTest} variant="outline">
                Mock Test
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 