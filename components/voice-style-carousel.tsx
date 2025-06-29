"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Play, Pause, Volume2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface VoiceStyle {
  id: string
  name: string
  description: string
  avatar: string
  sampleText: string
  color: string
}

const voiceStyles: VoiceStyle[] = [
  {
    id: "energetic",
    name: "Energetic",
    description: "High-energy, enthusiastic narrator",
    avatar: "⚡",
    sampleText: "Get ready for an amazing adventure!",
    color: "from-orange-500 to-red-500",
  },
  {
    id: "calm",
    name: "Calm",
    description: "Soothing, peaceful storytelling",
    avatar: "🌸",
    sampleText: "In a peaceful world, our story begins...",
    color: "from-blue-500 to-cyan-500",
  },
  {
    id: "dramatic",
    name: "Dramatic",
    description: "Intense, emotional delivery",
    avatar: "🎭",
    sampleText: "The fate of the world hangs in the balance!",
    color: "from-purple-500 to-pink-500",
  },
  {
    id: "narrator",
    name: "Narrator",
    description: "Classic storyteller voice",
    avatar: "📖",
    sampleText: "Once upon a time, in a land far away...",
    color: "from-green-500 to-emerald-500",
  },
  {
    id: "heroic",
    name: "Heroic",
    description: "Bold, courageous tone",
    avatar: "⚔️",
    sampleText: "Stand up and fight for what's right!",
    color: "from-yellow-500 to-orange-500",
  },
]

interface VoiceStyleCarouselProps {
  selectedStyle: string
  onStyleSelect: (styleId: string) => void
}

export function VoiceStyleCarousel({ selectedStyle, onStyleSelect }: VoiceStyleCarouselProps) {
  const [playingStyle, setPlayingStyle] = useState<string | null>(null)

  const handlePlaySample = (styleId: string) => {
    if (playingStyle === styleId) {
      setPlayingStyle(null)
      // Stop audio
    } else {
      setPlayingStyle(styleId)
      // Play audio sample
      setTimeout(() => setPlayingStyle(null), 2000) // Simulate 2s sample
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-interactive mb-2">Choose Your Voice Style</h3>
        <p className="text-muted-foreground">Select the perfect narrator for your anime preview</p>
      </div>

      <div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide">
        {voiceStyles.map((style, index) => (
          <Card
            key={style.id}
            className={cn(
              "min-w-[280px] cursor-pointer transition-all duration-300 card-3d animate-scale-in",
              selectedStyle === style.id
                ? "ring-2 ring-primary shadow-lg scale-105 animate-pulse-glow"
                : "hover:scale-105 hover:shadow-md",
            )}
            style={{ animationDelay: `${index * 0.1}s` }}
            onClick={() => onStyleSelect(style.id)}
          >
            <CardContent className="p-6">
              {/* Avatar */}
              <div
                className={cn(
                  "w-16 h-16 rounded-full bg-gradient-to-br flex items-center justify-center mx-auto mb-4 text-2xl animate-float",
                  style.color,
                )}
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                {style.avatar}
              </div>

              {/* Style Info */}
              <h4 className="font-bold text-lg text-center mb-2">{style.name}</h4>
              <p className="text-sm text-muted-foreground text-center mb-4">{style.description}</p>

              {/* Sample Text */}
              <div className="bg-muted/50 rounded-lg p-3 mb-4">
                <p className="text-sm italic text-center">"{style.sampleText}"</p>
              </div>

              {/* Play Sample Button */}
              <Button
                variant="outline"
                size="sm"
                className="w-full interactive-hover bg-transparent"
                onClick={(e) => {
                  e.stopPropagation()
                  handlePlaySample(style.id)
                }}
              >
                {playingStyle === style.id ? (
                  <>
                    <Pause className="mr-2 h-4 w-4" />
                    Playing...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Preview
                  </>
                )}
              </Button>

              {/* Audio Waveform Animation */}
              {playingStyle === style.id && (
                <div className="flex items-center justify-center space-x-1 mt-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className="w-1 bg-primary rounded-full animate-pulse"
                      style={{
                        height: `${Math.random() * 20 + 10}px`,
                        animationDelay: `${i * 0.1}s`,
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Selection Indicator */}
              {selectedStyle === style.id && (
                <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center animate-bounce-in">
                  <span className="text-primary-foreground text-xs">✓</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Voice Controls */}
      <div className="flex items-center justify-center space-x-4">
        <Volume2 className="h-5 w-5 text-muted-foreground" />
        <input type="range" min="0" max="100" defaultValue="80" className="w-32 accent-primary" />
        <span className="text-sm text-muted-foreground">Volume</span>
      </div>
    </div>
  )
}
