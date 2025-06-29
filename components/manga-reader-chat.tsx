"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { MessageCircle, BookOpen, Volume2 } from "lucide-react"
import { CharacterChatPanel } from "./character-chat-panel"
import { cn } from "@/lib/utils"

interface MangaReaderChatProps {
  currentPage: number
  totalPages: number
  character: {
    id: string
    name: string
    avatar: string
    anime: string
    theme: string
    status: string
    personality: string[]
  }
}

export function MangaReaderChat({ currentPage, totalPages, character }: MangaReaderChatProps) {
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [showQuickActions, setShowQuickActions] = useState(false)

  const quickActions = [
    {
      label: "Explain this panel",
      icon: BookOpen,
      action: () => console.log("Explain panel"),
    },
    {
      label: "Narrate from here",
      icon: Volume2,
      action: () => console.log("Start narration"),
    },
    {
      label: "What happens next?",
      icon: MessageCircle,
      action: () => console.log("Ask about next"),
    },
  ]

  return (
    <>
      {/* Floating Chat Button */}
      <div className="fixed bottom-20 right-6 z-40">
        <div className="relative">
          {/* Quick Actions */}
          {showQuickActions && (
            <div className="absolute bottom-full right-0 mb-4 space-y-2 animate-slide-in-up">
              {quickActions.map((action, index) => (
                <Card
                  key={action.label}
                  className="glass-morphism border-primary/30 cursor-pointer animate-bounce-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                  onClick={action.action}
                >
                  <CardContent className="p-3 flex items-center space-x-2 whitespace-nowrap">
                    <action.icon className="h-4 w-4 text-primary" />
                    <span className="text-sm">{action.label}</span>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Main Button */}
          <Button
            size="lg"
            className={cn(
              "w-14 h-14 rounded-full p-0 animate-float shadow-lg transition-all duration-300",
              "bg-gradient-to-br from-primary to-accent hover:scale-110 animate-pulse-glow",
            )}
            onClick={() => setShowQuickActions(!showQuickActions)}
            onDoubleClick={() => setIsChatOpen(true)}
          >
            <div className="relative">
              <img
                src={character.avatar || "/placeholder.svg"}
                alt={character.name}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse" />
            </div>
          </Button>

          {/* Page Context */}
          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-2 py-1 rounded text-xs whitespace-nowrap">
            Page {currentPage}/{totalPages}
          </div>
        </div>
      </div>

      {/* Chat Panel */}
      <CharacterChatPanel
        character={character}
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        onSwitchCharacter={() => {}}
      />
    </>
  )
}
