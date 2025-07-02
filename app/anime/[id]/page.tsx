"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CharacterChatLauncher } from "@/components/character-chat-launcher"
import { CharacterChatPanel } from "@/components/character-chat-panel"
import { CharacterSwitcher } from "@/components/character-switcher"
import { HolographicVideoPlayer } from "@/components/holographic-video-player"
import { Play, Plus, Star, Users, MessageCircle, BookOpen, Share2, Heart, ChevronLeft, ChevronRight } from "lucide-react"
import api from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface Episode {
  id: string
  number: number
  title: string
  thumbnail: string
  duration: number
  streamUrl: string
}

interface Anime {
  id: string
  title: string
  image: string
  banner: string
  rating: number
  year: number
  status: string
  episodes: Episode[]
  genres: string[]
  synopsis: string
  characters: Array<{
    id: string
    name: string
    avatar: string
    anime: string
    theme: string
    status: string
    personality: string[]
  }>
}

const EPISODES_PER_PAGE = 20

export default function AnimeDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [anime, setAnime] = useState<Anime | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [showCharacterSwitcher, setShowCharacterSwitcher] = useState(false)
  const [currentCharacter, setCurrentCharacter] = useState<Anime["characters"][0] | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoadingEpisode, setIsLoadingEpisode] = useState(false)

  useEffect(() => {
    const fetchAnime = async () => {
      try {
        setLoading(true)
        const response = await api.getAnimeById(params.id as string)
        
        // Transform episodes data if it's just a number
        const transformedResponse = {
          ...response,
          episodes: Array.isArray(response.episodes) 
            ? response.episodes 
            : Array.from({ length: response.episodes || 0 }, (_, i) => ({
                id: `${i + 1}`,
                number: i + 1,
                title: `Episode ${i + 1}`,
                thumbnail: response.image, // Use anime cover as fallback
                duration: 24, // Default duration
                streamUrl: `/api/anime/${response.id}/episodes/${i + 1}/stream`
              }))
        }
        
        setAnime(transformedResponse)
        if (transformedResponse.characters?.length > 0) {
          setCurrentCharacter(transformedResponse.characters[0])
        }
      } catch (error) {
        console.error("Failed to fetch anime:", error)
        toast({
          title: "Error",
          description: "Failed to load anime details. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchAnime()
  }, [params.id])

  const handleSwitchCharacter = (character: Anime["characters"][0]) => {
    setCurrentCharacter(character)
    setIsChatOpen(true)
  }

  const handleEpisodeSelect = async (episode: Episode) => {
    try {
      setIsLoadingEpisode(true)
      
      // Get streaming URL
      const streamData = await api.getEpisodeStream(anime!.id, episode.number.toString())
      
      if (!streamData?.sources?.length) {
        throw new Error("No streaming sources available")
      }

      // Get highest quality source with fallback
      const sources = streamData.sources
        .filter(source => source.url && source.quality) // Filter out invalid sources
        .sort((a, b) => {
          const qualityA = parseInt(a.quality.replace(/[^\d]/g, '')) || 0
          const qualityB = parseInt(b.quality.replace(/[^\d]/g, '')) || 0
          return qualityB - qualityA
        })

      if (!sources.length) {
        throw new Error("No valid streaming sources found")
      }

      const streamUrl = sources[0].url
      
      // Add headers if provided
      const headers = streamData.headers || {}

      // Update current episode with stream info
      setCurrentEpisode({
        ...episode,
        streamUrl,
        headers // Pass headers to video player
      })

      // Update URL without navigation
      window.history.pushState({}, '', `/anime/${anime!.id}?episode=${episode.number}`)

    } catch (error) {
      console.error("Failed to get streaming URL:", error)
      toast({
        title: "Streaming Error",
        description: error instanceof Error ? error.message : "Failed to load episode stream. Please try again.",
        variant: "destructive",
      })
      setCurrentEpisode(null)
    } finally {
      setIsLoadingEpisode(false)
    }
  }

  const handleNextPage = () => {
    if (anime && currentPage < Math.ceil(anime.episodes.length / EPISODES_PER_PAGE)) {
      setCurrentPage(prev => prev + 1)
    }
  }

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1)
    }
  }

  const getCurrentPageEpisodes = () => {
    if (!anime) return []
    const start = (currentPage - 1) * EPISODES_PER_PAGE
    const end = start + EPISODES_PER_PAGE
    return anime.episodes.slice(start, end)
  }

  const handleNextEpisode = () => {
    if (anime && currentEpisode) {
      const currentIndex = anime.episodes.findIndex(ep => ep.id === currentEpisode.id)
      if (currentIndex < anime.episodes.length - 1) {
        handleEpisodeSelect(anime.episodes[currentIndex + 1])
      }
    }
  }

  const handlePreviousEpisode = () => {
    if (anime && currentEpisode) {
      const currentIndex = anime.episodes.findIndex(ep => ep.id === currentEpisode.id)
      if (currentIndex > 0) {
        handleEpisodeSelect(anime.episodes[currentIndex - 1])
      }
    }
  }

  if (loading || !anime) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-primary animate-spin rounded-full" />
          <p className="mt-4">Loading anime details...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Video Player */}
      {currentEpisode && (
        <div className="fixed inset-0 z-50 bg-black">
          <div className="relative w-full h-full">
            {isLoadingEpisode ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 border-4 border-t-primary animate-spin rounded-full" />
                  <p className="mt-4">Loading episode...</p>
                </div>
              </div>
            ) : (
              <HolographicVideoPlayer
                videoUrl={currentEpisode.streamUrl}
                title={`${anime.title} - Episode ${currentEpisode.number}`}
                onClose={() => {
                  setCurrentEpisode(null)
                  window.history.pushState({}, '', `/anime/${anime.id}`)
                }}
                onPrevious={
                  anime.episodes.findIndex(ep => ep.number === currentEpisode.number) > 0
                    ? handlePreviousEpisode
                    : undefined
                }
                onNext={
                  anime.episodes.findIndex(ep => ep.number === currentEpisode.number) < anime.episodes.length - 1
                    ? handleNextEpisode
                    : undefined
                }
              />
            )}
          </div>
        </div>
      )}

      {/* Hero Banner */}
      <div className="relative h-96 overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center" 
          style={{ backgroundImage: `url(${anime.banner})` }} 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />

        <div className="relative container mx-auto px-4 h-full flex items-end pb-8">
          <div className="flex items-end space-x-6">
            {/* Poster */}
            <div className="relative animate-scale-in">
              <img
                src={anime.image || "/placeholder.svg"}
                alt={anime.title}
                className="w-48 h-72 object-cover rounded-xl border-2 border-primary/30 shadow-2xl"
              />
            </div>

            {/* Info */}
            <div className="flex-1 text-white animate-slide-in-up" style={{ animationDelay: "0.2s" }}>
              <h1 className="text-4xl md:text-6xl font-bold mb-4 text-interactive">{anime.title}</h1>

              <div className="flex items-center space-x-4 mb-4">
                <div className="flex items-center space-x-1">
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold">{anime.rating}</span>
                </div>
                <Badge variant="outline" className="text-white border-white/30">
                  {anime.status}
                </Badge>
                <span>{anime.year}</span>
                <span>{anime.episodes.length} episodes</span>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {anime.genres.map((genre) => (
                  <Badge key={genre} variant="secondary">
                    {genre}
                  </Badge>
                ))}
              </div>

              <p className="text-lg text-gray-200 mb-6 max-w-3xl leading-relaxed">{anime.synopsis}</p>

              <div className="flex flex-wrap gap-4">
                <Button 
                  size="lg" 
                  className="animate-pulse-glow"
                  onClick={() => anime.episodes[0] && handleEpisodeSelect(anime.episodes[0])}
                >
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
                {currentCharacter && (
                <Button
                  size="lg"
                  variant="outline"
                  className="glass-morphism bg-transparent text-white border-white/30"
                    onClick={() => setIsChatOpen(true)}
                >
                  <MessageCircle className="mr-2 h-5 w-5" />
                  Chat with {currentCharacter.name}
                </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Episodes Section with Pagination */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card className="animate-slide-in-up">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Play className="h-5 w-5 text-primary" />
                    <span>Episodes</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePrevPage}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm">
                      Page {currentPage} of {Math.ceil(anime.episodes.length / EPISODES_PER_PAGE)}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNextPage}
                      disabled={currentPage >= Math.ceil(anime.episodes.length / EPISODES_PER_PAGE)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {getCurrentPageEpisodes().map((episode) => (
                    <Card 
                      key={episode.id} 
                      className={`card-3d cursor-pointer interactive-hover ${
                        isLoadingEpisode && currentEpisode?.id === episode.id ? 'opacity-50' : ''
                      } ${currentEpisode?.id === episode.id ? 'border-primary' : ''}`}
                      onClick={() => !isLoadingEpisode && handleEpisodeSelect(episode)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-16 h-12 bg-muted rounded overflow-hidden">
                            <img
                              src={episode.thumbnail || "/placeholder.svg?height=48&width=64"}
                              alt={`Episode ${episode.number}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold">Episode {episode.number}</h4>
                            <p className="text-sm text-muted-foreground">{episode.duration} min</p>
                          </div>
                          {currentEpisode?.id === episode.id && (
                            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                          )}
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
                  {anime.characters.map((character, i) => (
                    <div 
                      key={character.id} 
                      className="text-center animate-bounce-in cursor-pointer"
                      style={{ animationDelay: `${i * 0.1}s` }}
                      onClick={() => handleSwitchCharacter(character)}
                    >
                      <div className="w-20 h-20 mx-auto rounded-full overflow-hidden border-2 border-primary/30 mb-2 card-3d">
                        <img
                          src={character.avatar || "/placeholder.svg?height=80&width=80"}
                          alt={character.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <h4 className="font-semibold text-sm">{character.name}</h4>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Chat with Character */}
            {currentCharacter && (
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
                    <h3 className="font-semibold">{currentCharacter.name}</h3>
                    <p className="text-sm text-muted-foreground">{currentCharacter.status}</p>
                  </div>

                  <div className="flex flex-wrap gap-2 justify-center">
                    {currentCharacter.personality.map((trait) => (
                      <Badge key={trait} variant="outline" className="bg-primary/5">
                        {trait}
                      </Badge>
                    ))}
                </div>

                  <Button className="w-full" onClick={() => setIsChatOpen(true)}>
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Start Chat
                  </Button>
              </CardContent>
            </Card>
            )}
          </div>
        </div>
      </div>

      {/* Character Chat */}
      {currentCharacter && (
      <CharacterChatPanel
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
          character={currentCharacter}
          onSwitchCharacter={() => setShowCharacterSwitcher(true)}
      />
      )}

      {/* Character Switcher */}
      {showCharacterSwitcher && (
      <CharacterSwitcher
          characters={anime.characters}
          onSelect={handleSwitchCharacter}
        onClose={() => setShowCharacterSwitcher(false)}
      />
      )}
    </div>
  )
}
