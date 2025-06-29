"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

interface Character {
  id: string
  name: string
  avatar: string
  anime: string
  theme: string
  status: string
  personality: string[]
}

const availableCharacters: Character[] = [
  {
    id: "luffy",
    name: "Monkey D. Luffy",
    avatar: "/placeholder.svg?height=60&width=60",
    anime: "One Piece",
    theme: "pirate",
    status: "Ready for Adventure!",
    personality: ["Cheerful", "Brave", "Loyal", "Hungry"],
  },
  {
    id: "tanjiro",
    name: "Tanjiro Kamado",
    avatar: "/placeholder.svg?height=60&width=60",
    anime: "Demon Slayer",
    theme: "demon-slayer",
    status: "Protecting Everyone!",
    personality: ["Kind", "Determined", "Strong", "Caring"],
  },
  {
    id: "naruto",
    name: "Naruto Uzumaki",
    avatar: "/placeholder.svg?height=60&width=60",
    anime: "Naruto",
    theme: "ninja",
    status: "Believe it!",
    personality: ["Energetic", "Never Give Up", "Friendly", "Ramen Lover"],
  },
  {
    id: "goku",
    name: "Son Goku",
    avatar: "/placeholder.svg?height=60&width=60",
    anime: "Dragon Ball",
    theme: "saiyan",
    status: "Always Training!",
    personality: ["Pure-hearted", "Strong", "Food Lover", "Protector"],
  },
]

interface CharacterSwitcherProps {
  currentCharacter: string
  onSwitch: (character: Character) => void
  isVisible: boolean
  onClose: () => void
}

export function CharacterSwitcher({ currentCharacter, onSwitch, isVisible, onClose }: CharacterSwitcherProps) {
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null)

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in" onClick={onClose} />

      {/* Switcher Panel */}
      <Card className="relative max-w-4xl w-full mx-4 glass-morphism border-primary/30 animate-scale-in">
        <CardContent className="p-6">
          <div className="text-center mb-6">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Sparkles className="h-6 w-6 text-primary animate-pulse" />
              <h2 className="text-2xl font-bold text-interactive">Switch Character</h2>
            </div>
            <p className="text-muted-foreground">Choose which anime character you'd like to chat with!</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {availableCharacters.map((character, index) => (
              <Card
                key={character.id}
                className={cn(
                  "cursor-pointer transition-all duration-300 card-3d animate-bounce-in interactive-hover",
                  selectedCharacter === character.id && "ring-2 ring-primary animate-pulse-glow",
                  currentCharacter === character.id && "opacity-50 cursor-not-allowed",
                )}
                style={{ animationDelay: `${index * 0.1}s` }}
                onClick={() => {
                  if (currentCharacter !== character.id) {
                    setSelectedCharacter(character.id)
                    setTimeout(() => {
                      onSwitch(character)
                      onClose()
                    }, 300)
                  }
                }}
              >
                <CardContent className="p-4 text-center">
                  {/* Character Avatar */}
                  <div className="relative mb-4">
                    <div className="w-16 h-16 mx-auto rounded-full overflow-hidden border-2 border-primary/30 animate-float">
                      <img
                        src={character.avatar || "/placeholder.svg"}
                        alt={character.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {currentCharacter === character.id && (
                      <Badge className="absolute -top-2 -right-2 animate-bounce-in">Current</Badge>
                    )}

                    {selectedCharacter === character.id && (
                      <div className="absolute inset-0 bg-primary/20 rounded-full animate-pulse" />
                    )}
                  </div>

                  {/* Character Info */}
                  <h3 className="font-bold text-lg mb-1">{character.name}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{character.anime}</p>
                  <p className="text-xs text-accent mb-3">{character.status}</p>

                  {/* Personality Tags */}
                  <div className="flex flex-wrap gap-1 justify-center mb-3">
                    {character.personality.slice(0, 2).map((trait, i) => (
                      <Badge key={trait} variant="outline" className="text-xs">
                        {trait}
                      </Badge>
                    ))}
                  </div>

                  {/* Action */}
                  {currentCharacter === character.id ? (
                    <Badge variant="secondary" className="w-full">
                      Currently Active
                    </Badge>
                  ) : (
                    <Button
                      size="sm"
                      className="w-full animate-pulse-glow"
                      disabled={selectedCharacter === character.id}
                    >
                      {selectedCharacter === character.id ? (
                        "Switching..."
                      ) : (
                        <>
                          Chat Now
                          <ArrowRight className="ml-1 h-3 w-3" />
                        </>
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Close Button */}
          <div className="text-center mt-6">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
