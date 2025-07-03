"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Play, Pause, Volume2, VolumeX, SkipBack, SkipForward, X, Maximize, Settings, RotateCcw, ExternalLink, Globe } from "lucide-react"
import { cn } from "@/lib/utils"

interface StreamingSource {
  url: string
  quality: string
  isM3U8?: boolean
  size?: string
}

interface FallbackLink {
  name: string
  url: string
  type: string
}

interface StreamingData {
  type: "stream" | "embed" | "fallback"
  sources?: StreamingSource[]
  url?: string
  links?: FallbackLink[]
  provider?: string
  headers?: Record<string, string>
  subtitles?: any[]
}

interface AnimeStreamingPlayerProps {
  videoUrl?: string
  animeTitle: string
  episodeNumber: number
  episodeTitle?: string
  sources?: StreamingSource[]
  streamingData?: StreamingData
  onClose?: () => void
  onPreviousEpisode?: () => void
  onNextEpisode?: () => void
  hasPrevious?: boolean
  hasNext?: boolean
  onRetry?: () => void
}

export function AnimeStreamingPlayer({
  videoUrl,
  animeTitle,
  episodeNumber,
  episodeTitle,
  sources = [],
  streamingData,
  onClose,
  onPreviousEpisode,
  onNextEpisode,
  hasPrevious = false,
  hasNext = false,
  onRetry
}: AnimeStreamingPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [volume, setVolume] = useState(80)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedSource, setSelectedSource] = useState<string>(videoUrl || "")
  const [showSettings, setShowSettings] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showFallbackOptions, setShowFallbackOptions] = useState(false)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Determine streaming type and available sources
  const streamingType = streamingData?.type || (videoUrl ? "stream" : "fallback")
  const availableSources = streamingData?.sources || sources
  const fallbackLinks = streamingData?.links || []

  // Find embed source if present
  const embedSource = availableSources.find(src => src.type === 'embed') || (streamingData?.type === 'embed' ? { url: streamingData.url } : null)

  // Auto-hide controls after 3 seconds
  useEffect(() => {
    if (showControls) {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current)
      }
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false)
      }, 3000)
    }
    
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current)
      }
    }
  }, [showControls])

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  // Video event handlers
  const handleLoadedData = () => {
    setIsLoading(false)
    setError(null)
    if (videoRef.current) {
      setDuration(videoRef.current.duration)
      videoRef.current.volume = volume / 100
    }
  }

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime)
    }
  }

  const handleError = () => {
    setError("Failed to load episode. Please try external sources.")
    setIsLoading(false)
    setShowFallbackOptions(true)
  }

  const togglePlay = () => {
    if (videoRef.current && streamingType === "stream") {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play().catch(err => {
          console.error("Failed to play video:", err)
          setError("Failed to play episode. Please try external sources.")
          setShowFallbackOptions(true)
        })
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = Number.parseInt(e.target.value)
    setVolume(newVolume)
    if (videoRef.current) {
      videoRef.current.volume = newVolume / 100
    }
  }

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (videoRef.current && streamingType === "stream") {
      const rect = e.currentTarget.getBoundingClientRect()
      const pos = (e.clientX - rect.left) / rect.width
      videoRef.current.currentTime = pos * duration
    }
  }

  const handleSourceChange = (sourceUrl: string) => {
    setSelectedSource(sourceUrl)
    setIsLoading(true)
    setError(null)
    if (videoRef.current) {
      videoRef.current.src = sourceUrl
      videoRef.current.load()
    }
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      videoRef.current?.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }

  const handleRetry = () => {
    if (onRetry) {
      onRetry()
    } else {
      setIsLoading(true)
      setError(null)
      setShowFallbackOptions(false)
      if (videoRef.current) {
        videoRef.current.load()
      }
    }
  }

  const handleExternalLink = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Get available sources (including the main videoUrl)
  const allSources = [
    ...(videoUrl ? [{ url: videoUrl, quality: 'Default', isM3U8: videoUrl.includes('.m3u8') }] : []),
    ...availableSources
  ]

  // Render different content based on streaming type
  const renderContent = () => {
    if (embedSource && embedSource.url) {
      return (
        <iframe
          ref={iframeRef}
          src={embedSource.url}
          className="w-full h-full border-0"
          allowFullScreen
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        />
      )
    }
    if (streamingType === "stream") {
      return (
        <video
          ref={videoRef}
          src={selectedSource}
          className="w-full h-full object-contain"
          onLoadedData={handleLoadedData}
          onTimeUpdate={handleTimeUpdate}
          onError={handleError}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onMouseMove={() => setShowControls(true)}
          onClick={togglePlay}
          crossOrigin="anonymous"
          controls
        />
      )
    }

    // Fallback: Show external links
    if (fallbackLinks.length > 0) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-black">
          <div className="text-center text-white max-w-md mx-auto p-8">
            <h3 className="text-2xl font-bold mb-4">{animeTitle}</h3>
            <p className="text-lg mb-6">Episode {episodeNumber}</p>
            <p className="text-gray-300 mb-8">
              Direct streaming is not available. Please open the episode in one of these external sites:
            </p>
            <div className="space-y-3">
              {fallbackLinks.map((link, index) => (
                <button
                  key={index}
                  onClick={() => window.open(link.url, '_blank', 'noopener,noreferrer')}
                  className="w-full flex items-center justify-between bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg text-lg font-semibold shadow"
                >
                  <span>{link.name}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5 ml-2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75V6A2.25 2.25 0 0015 3.75h-6A2.25 2.25 0 006.75 6v12A2.25 2.25 0 009 20.25h6A2.25 2.25 0 0017.25 18v-.75M15.75 8.25h5.25m0 0v5.25m0-5.25L12 17.25" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
        <div className="text-center text-white max-w-md mx-auto p-8">
          <Globe className="h-16 w-16 mx-auto mb-6 text-blue-400" />
          <h3 className="text-2xl font-bold mb-4">{animeTitle}</h3>
          <p className="text-lg mb-6">Episode {episodeNumber}</p>
          <p className="text-gray-300 mb-8">
            Direct streaming is not available. Please use one of these external sources:
          </p>
          <div className="space-y-3">
            {fallbackLinks.map((link, index) => (
              <Button
                key={index}
                onClick={() => handleExternalLink(link.url)}
                className="w-full justify-between bg-blue-600 hover:bg-blue-700 text-white"
                size="lg"
              >
                <span>{link.name}</span>
                <ExternalLink className="h-4 w-4" />
              </Button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
      {/* Main Content */}
      {renderContent()}

      {/* Loading Overlay */}
      {isLoading && streamingType !== "fallback" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <div className="text-center text-white">
            <div className="w-16 h-16 border-4 border-t-primary animate-spin rounded-full mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">{animeTitle}</h3>
            <p className="text-lg">Loading Episode {episodeNumber}...</p>
            {availableSources.length > 0 && (
              <p className="text-sm opacity-70 mt-2">Multiple quality options available</p>
            )}
          </div>
        </div>
      )}

      {/* Error Overlay */}
      {error && streamingType !== "fallback" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <div className="text-center text-white">
            <p className="text-red-500 mb-4 text-lg">{error}</p>
            <div className="flex space-x-2">
              <Button onClick={handleRetry} variant="outline">
                <RotateCcw className="h-4 w-4 mr-2" />
                Retry
              </Button>
              <Button onClick={() => setShowFallbackOptions(true)}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Try External Sources
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Fallback Options Overlay */}
      {showFallbackOptions && fallbackLinks.length > 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/90">
          <div className="bg-gray-800 rounded-lg p-8 max-w-md mx-4">
            <h3 className="text-xl font-bold text-white mb-4">Watch on External Sites</h3>
            <p className="text-gray-300 mb-6">
              Direct streaming is not available. Choose an external source:
            </p>
            <div className="space-y-3">
              {fallbackLinks.map((link, index) => (
                <Button
                  key={index}
                  onClick={() => handleExternalLink(link.url)}
                  className="w-full justify-between bg-blue-600 hover:bg-blue-700 text-white"
                  size="lg"
                >
                  <span>{link.name}</span>
                  <ExternalLink className="h-4 w-4" />
                </Button>
              ))}
            </div>
            <div className="flex justify-center mt-6">
              <Button
                variant="outline"
                onClick={() => setShowFallbackOptions(false)}
                className="text-white border-white/20 hover:bg-white/10"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Controls - Only show for video streams */}
      {showControls && !isLoading && !error && streamingType === "stream" && (
        <div 
          className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/60 transition-opacity duration-300"
          onMouseMove={() => setShowControls(true)}
        >
          {/* Top Bar */}
          <div className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-white hover:bg-white/20 h-10 w-10"
              >
                <X className="h-6 w-6" />
              </Button>
              <div className="text-white">
                <h3 className="text-xl font-bold">{animeTitle}</h3>
                <p className="text-sm opacity-80">
                  Episode {episodeNumber}{episodeTitle && ` - ${episodeTitle}`}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="bg-primary/20 text-primary">
                {streamingData?.provider || "Anime Player"}
              </Badge>
              {allSources.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowSettings(!showSettings)}
                  className="text-white hover:bg-white/20 h-10 w-10"
                >
                  <Settings className="h-6 w-6" />
                </Button>
              )}
            </div>
          </div>

          {/* Settings Panel */}
          {showSettings && allSources.length > 1 && (
            <div className="absolute top-20 right-6 bg-black/90 backdrop-blur-sm rounded-lg p-4 min-w-48">
              <h4 className="text-white font-semibold mb-3">Quality Settings</h4>
              <Select value={selectedSource} onValueChange={handleSourceChange}>
                <SelectTrigger className="w-full bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Select quality" />
                </SelectTrigger>
                <SelectContent className="bg-black/90 border-white/20">
                  {allSources.map((source, index) => (
                    <SelectItem 
                      key={source.url} 
                      value={source.url}
                      className="text-white hover:bg-white/20"
                    >
                      {source.quality} {source.isM3U8 && '(HLS)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Center Play Button */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex items-center space-x-8">
              {hasPrevious && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onPreviousEpisode}
                  className="text-white hover:bg-white/20 h-12 w-12 rounded-full bg-black/30 backdrop-blur-sm"
                >
                  <SkipBack className="h-6 w-6" />
                </Button>
              )}
              
              <Button
                variant="ghost"
                size="icon"
                onClick={togglePlay}
                className="text-white hover:bg-white/20 h-16 w-16 rounded-full bg-black/30 backdrop-blur-sm"
              >
                {isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8" />}
              </Button>
              
              {hasNext && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onNextEpisode}
                  className="text-white hover:bg-white/20 h-12 w-12 rounded-full bg-black/30 backdrop-blur-sm"
                >
                  <SkipForward className="h-6 w-6" />
                </Button>
              )}
            </div>
          </div>

          {/* Bottom Controls */}
          <div className="absolute bottom-0 left-0 right-0 p-6 space-y-4">
            {/* Progress Bar */}
            <div 
              className="w-full h-2 bg-white/20 rounded-full cursor-pointer group"
              onClick={handleProgressClick}
            >
              <div 
                className="h-full bg-primary rounded-full transition-all duration-200 group-hover:bg-primary/80"
                style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
              />
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={togglePlay}
                  className="text-white hover:bg-white/20"
                >
                  {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                </Button>
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setVolume(volume > 0 ? 0 : 80)}
                    className="text-white hover:bg-white/20"
                  >
                    {volume > 0 ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
                  </Button>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={volume}
                    onChange={handleVolumeChange}
                    className="w-20 h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>

                <span className="text-white text-sm font-mono">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-white/60 text-sm">
                  Episode {episodeNumber}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleFullscreen}
                  className="text-white hover:bg-white/20"
                >
                  <Maximize className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Close button for non-video content */}
      {streamingType !== "stream" && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute top-4 right-4 text-white hover:bg-white/20 h-10 w-10 z-10"
        >
          <X className="h-6 w-6" />
        </Button>
      )}

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #fff;
          cursor: pointer;
        }
        .slider::-moz-range-thumb {
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #fff;
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  )
} 