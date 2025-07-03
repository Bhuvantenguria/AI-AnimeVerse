"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Star, Play, Plus, MessageCircle, Users, ChevronLeft, ChevronRight } from "lucide-react"
import { AnimeStreamingPlayer } from "@/components/anime-streaming-player"
import { CharacterChatPanel } from "@/components/character-chat-panel"
import { CharacterSwitcher } from "@/components/character-switcher"
import { useToast } from "@/hooks/use-toast"
import api from "@/lib/api"

interface Episode {
  id: string
  number: number
  title: string
  thumbnail: string
  duration: number
  streamUrl?: string
}

interface StreamingSource {
  url: string
  quality: string
  isM3U8?: boolean
  size?: string
}

interface StreamingResponse {
  sources: StreamingSource[]
  headers?: Record<string, string>
  subtitles?: Array<{
    lang: string
    language: string
    url: string
  }>
}

interface Character {
  name: string
  nameJp?: string
  description: string
  avatar: string
  personality: string
}

interface Anime {
  id: string
  title: string
  coverImage: string
  bannerImage?: string
  rating: number
  year: number
  status: string
  episodes: Episode[]
  genres: string[]
  synopsis: string
  characters: Character[]
}

const EPISODES_PER_PAGE = 12

export default function AnimeDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [anime, setAnime] = useState<Anime | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [showCharacterSwitcher, setShowCharacterSwitcher] = useState(false)
  const [currentCharacter, setCurrentCharacter] = useState<Character | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoadingEpisode, setIsLoadingEpisode] = useState(false)
  const [streamingData, setStreamingData] = useState<StreamingResponse | null>(null)
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null)

  useEffect(() => {
    const fetchAnime = async () => {
      try {
        setLoading(true)
        const response = await api.getAnimeById(params.id as string)
        
        // Ensure episodes is always an array with proper IDs
        const transformedResponse = {
          ...response,
          episodes: Array.isArray(response.episodes) 
            ? response.episodes.map((ep, index) => ({
                ...ep,
                id: ep.id || `${response.id}-ep-${ep.number || index + 1}`, // Generate proper episode IDs
                number: ep.number || index + 1,
                title: ep.title || `Episode ${ep.number || index + 1}`,
                thumbnail: ep.thumbnail || response.coverImage,
                duration: ep.duration || 24
              }))
            : Array.from({ length: response.episodes || 0 }, (_, i) => ({
                id: `${response.id}-ep-${i + 1}`,
                number: i + 1,
                title: `Episode ${i + 1}`,
                thumbnail: response.coverImage,
                duration: 24
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

  const handleSwitchCharacter = (character: Character | any) => {
    // Handle both Character types - from anime data and from character switcher
    if (anime && anime.characters && anime.characters.length > 0) {
      // Find matching character from anime data if it exists
      const matchingCharacter = anime.characters.find(c => c.name === character.name)
      if (matchingCharacter) {
        setCurrentCharacter(matchingCharacter)
      } else {
        // Create a compatible character object
        setCurrentCharacter({
          name: character.name,
          description: character.status || "Available for chat",
          avatar: character.avatar,
          personality: Array.isArray(character.personality) ? character.personality[0] : character.personality || "Friendly"
        })
      }
    }
    setIsChatOpen(true)
  }

  const handleEpisodeSelect = async (episode: Episode) => {
    try {
      setIsLoadingEpisode(true)
      setStreamingData(null)
      
      // Get streaming data using the proper episode ID
      const streamData = await api.getEpisodeStream(anime!.id, episode.id)
      
      // Handle different streaming data types
      if (streamData.type === "stream" && streamData.sources?.length > 0) {
        // Direct streaming available
        const sources = streamData.sources
          .filter(source => source.url && source.quality)
          .sort((a, b) => {
            const qualityA = parseInt(a.quality.replace(/[^\d]/g, '')) || 0
            const qualityB = parseInt(b.quality.replace(/[^\d]/g, '')) || 0
            return qualityB - qualityA
          })

        if (sources.length > 0) {
          const streamUrl = sources[0].url

          // Update current episode with stream info
          setCurrentEpisode({
            ...episode,
            streamUrl
          })

          // Store streaming data for quality selection
          setStreamingData(streamData)

          // Update URL without navigation
          window.history.pushState({}, '', `/anime/${anime!.id}?episode=${episode.number}`)
        } else {
          throw new Error("No valid streaming sources found")
        }
      } else if (streamData.type === "embed" && streamData.url) {
        // Embed streaming available
        setCurrentEpisode({
          ...episode,
          streamUrl: streamData.url
        })
        setStreamingData(streamData)
        window.history.pushState({}, '', `/anime/${anime!.id}?episode=${episode.number}`)
      } else if (streamData.type === "fallback" && streamData.links?.length > 0) {
        // Only fallback links available
        setCurrentEpisode({
          ...episode,
          streamUrl: undefined // No direct stream URL
        })
        setStreamingData(streamData)
        window.history.pushState({}, '', `/anime/${anime!.id}?episode=${episode.number}`)
      } else {
        throw new Error("No streaming sources available")
      }

    } catch (error) {
      console.error("Failed to get streaming URL:", error)
      toast({
        title: "Streaming Error",
        description: error instanceof Error ? error.message : "Failed to load episode stream. Please try again.",
        variant: "destructive",
      })
      setCurrentEpisode(null)
      setStreamingData(null)
    } finally {
      setIsLoadingEpisode(false)
    }
  }

  const handleRetryStreaming = async () => {
    if (currentEpisode) {
      await handleEpisodeSelect(currentEpisode)
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
          <p className="mt-4 text-muted-foreground">Loading anime details...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5">
      {/* Anime Streaming Player */}
      {currentEpisode && streamingData && (
        <AnimeStreamingPlayer
          videoUrl={currentEpisode.streamUrl}
          animeTitle={anime.title}
          episodeNumber={currentEpisode.number}
          episodeTitle={currentEpisode.title}
          sources={streamingData.sources}
          streamingData={streamingData}
          onClose={() => {
            setCurrentEpisode(null)
            setStreamingData(null)
            window.history.pushState({}, '', `/anime/${anime.id}`)
          }}
          onPreviousEpisode={handlePreviousEpisode}
          onNextEpisode={handleNextEpisode}
          hasPrevious={anime.episodes.findIndex(ep => ep.id === currentEpisode.id) > 0}
          hasNext={anime.episodes.findIndex(ep => ep.id === currentEpisode.id) < anime.episodes.length - 1}
          onRetry={handleRetryStreaming}
        />
      )}

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url(${anime.bannerImage || anime.coverImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-transparent" />

        <div className="relative container mx-auto px-4 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-1">
              <div className="card-3d animate-float">
              <img
                  src={anime.coverImage || "/placeholder.svg?height=600&width=400"}
                alt={anime.title}
                  className="w-full max-w-sm mx-auto rounded-xl shadow-2xl"
              />
              </div>
            </div>

            <div className="lg:col-span-2 space-y-6">
              <div className="space-y-4">
                <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-gradient">
                  {anime.title}
                </h1>

                <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span>{anime.rating.toFixed(1)}</span>
                </div>
                  <Badge variant="outline">{anime.status}</Badge>
                  <Badge variant="outline">{anime.year}</Badge>
                  <Badge variant="outline">{anime.episodes.length} Episodes</Badge>
              </div>

                <div className="flex flex-wrap gap-2">
                {anime.genres.map((genre) => (
                    <Badge key={genre} variant="secondary" className="genre-tag">
                    {genre}
                  </Badge>
                ))}
              </div>

                <p className="text-lg leading-relaxed text-muted-foreground max-w-3xl">
                  {anime.synopsis}
                </p>
              </div>

              <div className="flex flex-wrap gap-4">
                <Button 
                  size="lg" 
                  className="animate-pulse-glow"
                  onClick={() => anime.episodes[0] && handleEpisodeSelect(anime.episodes[0])}
                  disabled={isLoadingEpisode}
                >
                  <Play className="mr-2 h-5 w-5" />
                  {isLoadingEpisode ? "Loading..." : "Watch Now"}
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
                      key={character.name} 
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
                    <p className="text-sm text-muted-foreground">{currentCharacter.description}</p>
                  </div>

                  <div className="flex flex-wrap gap-2 justify-center">
                    {currentCharacter.personality && (
                      <Badge variant="outline" className="bg-primary/5">
                        {currentCharacter.personality}
                      </Badge>
                    )}
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
          character={{
            id: currentCharacter.name,
            name: currentCharacter.name,
            avatar: currentCharacter.avatar,
            source: {
              title: anime.title,
              coverImage: anime.coverImage
            }
          }}
      />
      )}

      {/* Character Switcher */}
      {showCharacterSwitcher && (
      <CharacterSwitcher
          currentCharacter={currentCharacter?.name || ""}
          onSwitch={handleSwitchCharacter}
          isVisible={showCharacterSwitcher}
        onClose={() => setShowCharacterSwitcher(false)}
      />
      )}
    </div>
  )
}
