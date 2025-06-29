"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CharacterChatLauncher } from "@/components/character-chat-launcher"
import { CharacterChatPanel } from "@/components/character-chat-panel"
import { CharacterSwitcher } from "@/components/character-switcher"
import { Play, Plus, Star, Users, MessageCircle, BookOpen, Share2, Heart } from "lucide-react"

// Mock anime data
const animeData = {
  id: "one-piece",
  title: "One Piece",
  image: "/placeholder.svg?height=600&width=400",
  banner: "/placeholder.svg?height=300&width=800",
  rating: 9.3,
  year: 1999,
  status: "Ongoing",
  episodes: 1000,
  genre: ["Adventure", "Comedy", "Drama", "Shounen"],
  description:
    "Follow Monkey D. Luffy's epic journey to become the Pirate King in this legendary adventure spanning over 25 years. Join the Straw Hat Pirates as they explore the Grand Line in search of the ultimate treasure - the One Piece!",
  characters: [
    {
      id: "luffy",
      name: "Monkey D. Luffy",
      avatar: "/placeholder.svg?height=60&width=60",
      anime: "One Piece",
      theme: "pirate",
      status: "Ready for Adventure! 🏴‍☠️",
      personality: ["Cheerful", "Brave", "Loyal", "Hungry"],
    },
  ],
}

export default function AnimeDetailPage() {
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [showCharacterSwitcher, setShowCharacterSwitcher] = useState(false)
  const [currentCharacter, setCurrentCharacter] = useState(animeData.characters[0])

  const handleSwitchCharacter = (character: any) => {
    setCurrentCharacter(character)
    setIsChatOpen(true)
  }

  return (
    <div className="min-h-screen">
      {/* Hero Banner */}
      <div className="relative h-96 overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${animeData.banner})` }} />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />

        <div className="relative container mx-auto px-4 h-full flex items-end pb-8">
          <div className="flex items-end space-x-6">
            {/* Poster */}
            <div className="relative animate-scale-in">
              <img
                src={animeData.image || "/placeholder.svg"}
                alt={animeData.title}
                className="w-48 h-72 object-cover rounded-xl border-2 border-primary/30 shadow-2xl"
              />
            </div>

            {/* Info */}
            <div className="flex-1 text-white animate-slide-in-up" style={{ animationDelay: "0.2s" }}>
              <h1 className="text-4xl md:text-6xl font-bold mb-4 text-interactive">{animeData.title}</h1>

              <div className="flex items-center space-x-4 mb-4">
                <div className="flex items-center space-x-1">
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold">{animeData.rating}</span>
                </div>
                <Badge variant="outline" className="text-white border-white/30">
                  {animeData.status}
                </Badge>
                <span>{animeData.year}</span>
                <span>{animeData.episodes} episodes</span>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {animeData.genre.map((g) => (
                  <Badge key={g} variant="secondary">
                    {g}
                  </Badge>
                ))}
              </div>

              <p className="text-lg text-gray-200 mb-6 max-w-3xl leading-relaxed">{animeData.description}</p>

              <div className="flex flex-wrap gap-4">
                <Button size="lg" className="animate-pulse-glow">
                  <Play className="mr-2 h-5 w-5" />
                  Watch Now
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="glass-morphism bg-transparent text-white border-white/30"
                >
                  <Plus className="mr-2 h-5 w-5" />
                  Add to List
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="glass-morphism bg-transparent text-white border-white/30"
                >
                  <MessageCircle className="mr-2 h-5 w-5" />
                  Chat with {currentCharacter.name}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Sections */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Episodes */}
            <Card className="animate-slide-in-up">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Play className="h-5 w-5 text-primary" />
                  <span>Episodes</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Card key={i} className="card-3d cursor-pointer interactive-hover">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-16 h-12 bg-muted rounded overflow-hidden">
                            <img
                              src="/placeholder.svg?height=48&width=64"
                              alt={`Episode ${i + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold">Episode {i + 1}</h4>
                            <p className="text-sm text-muted-foreground">24 min</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Characters */}
            <Card className="animate-slide-in-up" style={{ animationDelay: "0.2s" }}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-primary" />
                  <span>Characters</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="text-center animate-bounce-in" style={{ animationDelay: `${i * 0.1}s` }}>
                      <div className="w-20 h-20 mx-auto rounded-full overflow-hidden border-2 border-primary/30 mb-2 card-3d">
                        <img
                          src="/placeholder.svg?height=80&width=80"
                          alt={`Character ${i + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <h4 className="font-semibold text-sm">Character {i + 1}</h4>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Chat with Character */}
            <Card className="animate-slide-in-right border-primary/30 bg-gradient-to-br from-primary/10 to-accent/10">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageCircle className="h-5 w-5 text-primary animate-pulse" />
                  <span>Chat with Characters</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto rounded-full overflow-hidden border-2 border-primary/50 mb-3 animate-pulse-glow">
                    <img
                      src={currentCharacter.avatar || "/placeholder.svg"}
                      alt={currentCharacter.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="font-bold text-lg text-interactive">{currentCharacter.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{currentCharacter.status}</p>

                  <div className="flex flex-wrap gap-1 justify-center mb-4">
                    {currentCharacter.personality.map((trait) => (
                      <Badge key={trait} variant="outline" className="text-xs">
                        {trait}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Button className="w-full animate-pulse-glow" onClick={() => setIsChatOpen(true)}>
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Start Chatting
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full bg-transparent"
                    onClick={() => setShowCharacterSwitcher(true)}
                  >
                    Switch Character
                  </Button>
                </div>

                <div className="text-xs text-muted-foreground text-center">
                  💡 Ask about storylines, get chapter narrations, or just chat!
                </div>
              </CardContent>
            </Card>

            {/* Stats */}
            <Card className="animate-slide-in-right" style={{ animationDelay: "0.2s" }}>
              <CardHeader>
                <CardTitle>Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Rating</span>
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold">{animeData.rating}</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span>Episodes</span>
                  <span className="font-semibold">{animeData.episodes}</span>
                </div>
                <div className="flex justify-between">
                  <span>Year</span>
                  <span className="font-semibold">{animeData.year}</span>
                </div>
                <div className="flex justify-between">
                  <span>Status</span>
                  <Badge variant="outline">{animeData.status}</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card className="animate-slide-in-right" style={{ animationDelay: "0.4s" }}>
              <CardContent className="p-4 space-y-3">
                <Button variant="outline" className="w-full interactive-hover bg-transparent">
                  <BookOpen className="mr-2 h-4 w-4" />
                  Read Manga
                </Button>
                <Button variant="outline" className="w-full interactive-hover bg-transparent">
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </Button>
                <Button variant="outline" className="w-full interactive-hover bg-transparent">
                  <Heart className="mr-2 h-4 w-4" />
                  Add to Favorites
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Character Chat Components */}
      <CharacterChatLauncher character={currentCharacter} onOpen={() => setIsChatOpen(true)} />

      <CharacterChatPanel
        character={currentCharacter}
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        onSwitchCharacter={handleSwitchCharacter}
      />

      <CharacterSwitcher
        currentCharacter={currentCharacter.id}
        onSwitch={handleSwitchCharacter}
        isVisible={showCharacterSwitcher}
        onClose={() => setShowCharacterSwitcher(false)}
      />
    </div>
  )
}
