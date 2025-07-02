"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Play, Pause, Volume2, Download, Share2, RotateCcw, Maximize, X, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface HolographicVideoPlayerProps {
  videoUrl: string
  title: string
  headers?: Record<string, string>
  onClose?: () => void
  onRegenerate?: () => void
  onDownload?: () => void
  onShare?: () => void
  onPrevious?: () => void
  onNext?: () => void
}

export function HolographicVideoPlayer({
  videoUrl,
  title,
  headers,
  onClose,
  onRegenerate,
  onDownload,
  onShare,
  onPrevious,
  onNext,
}: HolographicVideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [volume, setVolume] = useState(80)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load()
      setIsLoading(true)
      setError(null)
      setProgress(0)
      setDuration(0)
      
      if (headers && Object.keys(headers).length > 0) {
        const mediaSource = new MediaSource()
        videoRef.current.src = URL.createObjectURL(mediaSource)
        
        mediaSource.addEventListener('sourceopen', async () => {
          try {
            const response = await fetch(videoUrl, { headers })
            if (!response.ok) throw new Error('Failed to fetch video')
            
            const sourceBuffer = mediaSource.addSourceBuffer('video/mp4; codecs="avc1.42E01E, mp4a.40.2"')
            const data = await response.arrayBuffer()
            sourceBuffer.addEventListener('updateend', () => {
              if (!sourceBuffer.updating && mediaSource.readyState === 'open') {
                mediaSource.endOfStream()
              }
            })
            sourceBuffer.appendBuffer(data)
          } catch (err) {
            console.error('Error loading video:', err)
            setError('Failed to load video with custom headers')
            setIsLoading(false)
          }
        })
      }
    }
  }, [videoUrl, headers])

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play().catch(err => {
          console.error("Failed to play video:", err)
          setError("Failed to play video. Please try again.")
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

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setProgress((videoRef.current.currentTime / videoRef.current.duration) * 100)
    }
  }

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (videoRef.current) {
      const rect = e.currentTarget.getBoundingClientRect()
      const pos = (e.clientX - rect.left) / rect.width
      videoRef.current.currentTime = pos * videoRef.current.duration
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleVideoError = () => {
    setError("Failed to load video. Please try again.")
    setIsLoading(false)
  }

  const handleVideoLoadedData = () => {
    setIsLoading(false)
    setError(null)
    if (videoRef.current) {
      setDuration(videoRef.current.duration)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="max-w-4xl w-full animate-scale-in">
        {/* Close Button */}
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:bg-white/20 z-50"
          >
            <X className="h-6 w-6" />
          </Button>
        )}

        {/* Holographic Frame */}
        <div className="relative">
          {/* Outer Glow */}
          <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 rounded-2xl blur-xl animate-pulse-glow" />

          {/* Main Container */}
          <div className="relative bg-gradient-to-br from-background/10 to-background/5 backdrop-blur-md rounded-2xl border border-primary/30 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-primary/20">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-interactive">{title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {isLoading ? "Loading..." : error ? "Error" : "Ready to Play"}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <div 
                    className={cn(
                      "w-3 h-3 rounded-full",
                      isLoading ? "bg-yellow-500" : error ? "bg-red-500" : "bg-green-500",
                      "animate-pulse"
                    )} 
                  />
                  <span className={cn(
                    "text-sm",
                    isLoading ? "text-yellow-500" : error ? "text-red-500" : "text-green-500"
                  )}>
                    {isLoading ? "Loading" : error ? "Error" : "Ready"}
                  </span>
                </div>
              </div>
            </div>

            {/* Video Container */}
            <div
              className="relative aspect-video bg-black group"
              onMouseEnter={() => setShowControls(true)}
              onMouseLeave={() => setShowControls(false)}
            >
              {/* Loading Overlay */}
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <div className="w-16 h-16 border-4 border-t-primary animate-spin rounded-full" />
                </div>
              )}

              {/* Error Overlay */}
              {error && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <div className="text-center text-red-500">
                    <p className="mb-4">{error}</p>
                    <Button onClick={() => {
                      if (videoRef.current) {
                        videoRef.current.load()
                        setIsLoading(true)
                        setError(null)
                      }
                    }}>
                      Retry
                    </Button>
                  </div>
                </div>
              )}

              {/* Video Element */}
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                poster="/placeholder.svg"
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onLoadedData={handleVideoLoadedData}
                onTimeUpdate={handleTimeUpdate}
                onError={handleVideoError}
                controls={false}
              >
                {!headers && <source src={videoUrl} type="video/mp4" />}
                Your browser does not support the video tag.
              </video>

              {/* Play Button Overlay */}
              {!isPlaying && !isLoading && !error && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Button 
                    size="lg" 
                    className="w-20 h-20 rounded-full animate-pulse-glow" 
                    onClick={togglePlay}
                  >
                    <Play className="h-8 w-8 ml-1" />
                  </Button>
                </div>
              )}

              {/* Controls Overlay */}
              <div
                className={cn(
                  "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300",
                  showControls ? "opacity-100" : "opacity-0",
                )}
              >
                <div className="flex items-center space-x-4">
                  {/* Play/Pause */}
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={togglePlay} 
                    className="text-white hover:bg-white/20"
                    disabled={isLoading || !!error}
                  >
                    {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                  </Button>

                  {/* Progress Bar */}
                  <div 
                    className="flex-1 h-2 bg-white/20 rounded-full overflow-hidden cursor-pointer"
                    onClick={handleProgressClick}
                  >
                    <div 
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  {/* Volume */}
                  <div className="flex items-center space-x-2">
                    <Volume2 className="h-4 w-4 text-white" />
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={volume}
                      onChange={handleVolumeChange}
                      className="w-20 accent-primary"
                    />
                  </div>

                  {/* Time */}
                  <div className="text-white text-sm">
                    {videoRef.current && (
                      <>
                        {formatTime(videoRef.current.currentTime)} / {formatTime(duration)}
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {/* Previous/Next Episode */}
                  {onPrevious && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={onPrevious}
                      className="text-white hover:bg-white/20"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </Button>
                  )}
                  {onNext && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={onNext}
                      className="text-white hover:bg-white/20"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  )}

                  {/* Fullscreen */}
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-white hover:bg-white/20"
                    onClick={() => videoRef.current?.requestFullscreen()}
                    disabled={isLoading || !!error}
                  >
                    <Maximize className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Corner Effects */}
              <div className="absolute top-2 left-2 w-8 h-8 border-l-2 border-t-2 border-primary/50" />
              <div className="absolute top-2 right-2 w-8 h-8 border-r-2 border-t-2 border-primary/50" />
              <div className="absolute bottom-2 left-2 w-8 h-8 border-l-2 border-b-2 border-primary/50" />
              <div className="absolute bottom-2 right-2 w-8 h-8 border-r-2 border-b-2 border-primary/50" />
            </div>

            {/* Action Buttons */}
            <div className="p-6 space-y-4">
              {/* Primary Actions */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="flex-1 animate-pulse-glow" onClick={onDownload}>
                  <Download className="mr-2 h-5 w-5" />
                  Download Preview
                </Button>
                <Button size="lg" variant="outline" className="flex-1 glass-morphism bg-transparent" onClick={onShare}>
                  <Share2 className="mr-2 h-5 w-5" />
                  Share
                </Button>
              </div>

              {/* Secondary Actions */}
              <div className="flex justify-center space-x-4">
                <Button variant="ghost" onClick={onRegenerate} className="interactive-hover">
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Try Different Voice
                </Button>
              </div>

              {/* Share Options */}
              <div className="flex justify-center space-x-4 animate-slide-in-up" style={{ animationDelay: "0.5s" }}>
                {["Twitter", "Discord", "Reddit", "Copy Link"].map((platform, index) => (
                  <Button
                    key={platform}
                    variant="ghost"
                    size="sm"
                    className="animate-bounce-in interactive-hover"
                    style={{ animationDelay: `${0.6 + index * 0.1}s` }}
                  >
                    {platform}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Success Confetti */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-primary rounded-full animate-bounce-in"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${1 + Math.random()}s`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
