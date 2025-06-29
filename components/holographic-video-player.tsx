"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Play, Pause, Volume2, Download, Share2, RotateCcw, Maximize } from "lucide-react"
import { cn } from "@/lib/utils"

interface HolographicVideoPlayerProps {
  videoUrl: string
  title: string
  onRegenerate: () => void
  onDownload: () => void
  onShare: () => void
}

export function HolographicVideoPlayer({
  videoUrl,
  title,
  onRegenerate,
  onDownload,
  onShare,
}: HolographicVideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [volume, setVolume] = useState(80)
  const videoRef = useRef<HTMLVideoElement>(null)

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
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

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="max-w-4xl w-full animate-scale-in">
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
                  <p className="text-sm text-muted-foreground">AI-Generated Anime Preview</p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-sm text-green-500">Ready</span>
                </div>
              </div>
            </div>

            {/* Video Container */}
            <div
              className="relative aspect-video bg-black group"
              onMouseEnter={() => setShowControls(true)}
              onMouseLeave={() => setShowControls(false)}
            >
              {/* Video Element */}
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                poster="/placeholder.svg?height=400&width=600"
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              >
                <source src={videoUrl} type="video/mp4" />
              </video>

              {/* Play Button Overlay */}
              {!isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Button size="lg" className="w-20 h-20 rounded-full animate-pulse-glow" onClick={togglePlay}>
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
                  <Button variant="ghost" size="icon" onClick={togglePlay} className="text-white hover:bg-white/20">
                    {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                  </Button>

                  {/* Progress Bar */}
                  <div className="flex-1 h-2 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full w-1/3 transition-all duration-300" />
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

                  {/* Fullscreen */}
                  <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
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
