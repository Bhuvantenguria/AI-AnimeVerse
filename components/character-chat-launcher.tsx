"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { MessageCircle, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

interface CharacterChatLauncherProps {
  character: {
    id: string
    name: string
    avatar: string
    anime: string
    theme: string
  }
  onOpen: () => void
  className?: string
}

export function CharacterChatLauncher({ character, onOpen, className }: CharacterChatLauncherProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div className={cn("fixed bottom-6 right-6 z-40", className)}>
      {/* Sparkle Trail */}
      {isHovered && (
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-primary rounded-full animate-bounce-in"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${i * 0.1}s`,
                animationDuration: "1s",
              }}
            />
          ))}
        </div>
      )}

      {/* Main Chat Button */}
      <Button
        size="lg"
        className={cn(
          "relative w-16 h-16 rounded-full p-0 animate-float shadow-lg transition-all duration-300",
          "bg-gradient-to-br from-primary to-accent hover:scale-110",
          isHovered && "animate-pulse-glow",
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={onOpen}
      >
        {/* Character Avatar */}
        <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-white/30">
          <img
            src={character.avatar || "/placeholder.svg"}
            alt={character.name}
            className="w-full h-full object-cover animate-neon-glow"
          />

          {/* Idle Animation Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/10 animate-pulse" />
        </div>

        {/* Chat Bubble Indicator */}
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center animate-bounce">
          <MessageCircle className="h-3 w-3 text-primary" />
        </div>

        {/* Floating Particles */}
        <div className="absolute inset-0 pointer-events-none">
          <Sparkles className="absolute -top-1 -left-1 h-4 w-4 text-yellow-400 animate-pulse" />
          <Sparkles
            className="absolute -bottom-1 -right-1 h-3 w-3 text-blue-400 animate-pulse"
            style={{ animationDelay: "0.5s" }}
          />
        </div>
      </Button>

      {/* Tooltip */}
      {isHovered && (
        <div className="absolute bottom-full right-0 mb-2 animate-slide-in-up">
          <div className="bg-black/80 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap backdrop-blur-sm">
            Chat with {character.name}!
            <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black/80" />
          </div>
        </div>
      )}
    </div>
  )
}
