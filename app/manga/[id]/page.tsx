"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { ArrowLeft, BookOpen, Plus, Check, Star, Calendar, User, Tag, Eye, Heart, MessageCircle, Users, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CharacterChatPanel } from "@/components/character-chat-panel"
import { CharacterSwitcher } from "@/components/character-switcher"
import { useToast } from "@/hooks/use-toast"
import api from "@/lib/api"

interface MangaDetails {
  malId: string
  title: string
  titleEnglish?: string
  titleJapanese?: string
  coverImage: string
  rating: number | null
  chapters: number | null
  volumes: number | null
  status: string
  year: number | null
  genres: Array<{ id: number, name: string }>
  synopsis: string | null
  authors: Array<{ id: number, name: string }>
  isInReadingList?: boolean
  readingStatus?: string
  source?: string
}

interface Chapter {
  id: string
  attributes: {
    chapter: string
    title: string
    pages: number
    publishAt: string
  }
}

interface Character {
  name: string
  nameJp?: string
  description: string
  avatar: string
  personality: string
}

const CHAPTERS_PER_PAGE = 12

export default function MangaDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  
  // Main state
  const [manga, setManga] = useState<MangaDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [chaptersLoading, setChaptersLoading] = useState(false)
  
  // Character and Chat state
  const [currentCharacter, setCurrentCharacter] = useState<Character | null>(null)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [showCharacterSwitcher, setShowCharacterSwitcher] = useState(false)
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  
  // Generate characters based on manga data
  const generateMangaCharacters = (manga: MangaDetails | null): Character[] => {
    if (!manga) return []
    
    // Get genre-based character archetypes
    const genres = manga.genres?.map(g => g.name.toLowerCase()) || []
    const isAction = genres.some(g => g.includes('action') || g.includes('adventure') || g.includes('shounen'))
    const isRomance = genres.some(g => g.includes('romance') || g.includes('shoujo'))
    const isFantasy = genres.some(g => g.includes('fantasy') || g.includes('supernatural') || g.includes('magic'))
    const isSliceOfLife = genres.some(g => g.includes('slice') || g.includes('comedy') || g.includes('school'))
    
    // Create characters based on manga theme
    const characters: Character[] = []
    
    if (isAction) {
      characters.push(
        {
          name: "Hero",
          nameJp: "主人公",
          description: `The main protagonist of ${manga.title}. Brave and determined to achieve their goals!`,
          avatar: "/placeholder.svg?height=80&width=80&text=Hero",
          personality: "Brave and determined"
        },
        {
          name: "Rival",
          nameJp: "ライバル",
          description: `A skilled rival who pushes the hero to become stronger in ${manga.title}.`,
          avatar: "/placeholder.svg?height=80&width=80&text=Rival",
          personality: "Competitive and strong"
        }
      )
    }
    
    if (isRomance) {
      characters.push(
        {
          name: "Love Interest",
          nameJp: "恋人",
          description: `The romantic interest in ${manga.title}. Kind and caring with hidden depths.`,
          avatar: "/placeholder.svg?height=80&width=80&text=Love",
          personality: "Kind and romantic"
        }
      )
    }
    
    if (isFantasy) {
      characters.push(
        {
          name: "Mage",
          nameJp: "魔法使い",
          description: `A wise magic user from ${manga.title} who helps guide the journey.`,
          avatar: "/placeholder.svg?height=80&width=80&text=Mage",
          personality: "Wise and mysterious"
        }
      )
    }
    
    if (isSliceOfLife) {
      characters.push(
        {
          name: "Best Friend",
          nameJp: "親友",
          description: `The loyal best friend from ${manga.title}. Always there for support and laughs!`,
          avatar: "/placeholder.svg?height=80&width=80&text=Friend",
          personality: "Loyal and funny"
        }
      )
    }
    
    // Always add a mentor figure
    characters.push({
      name: "Mentor",
      nameJp: "先生",
      description: `A wise mentor figure from ${manga.title} who provides guidance and wisdom.`,
      avatar: "/placeholder.svg?height=80&width=80&text=Mentor",
      personality: "Wise and experienced"
    })
    
    // Add author-inspired character
    if (manga.authors && manga.authors.length > 0) {
      characters.push({
        name: "Author",
        nameJp: "作者",
        description: `Chat with ${manga.authors[0].name}, the creator of ${manga.title}!`,
        avatar: "/placeholder.svg?height=80&width=80&text=Author",
        personality: "Creative and insightful"
      })
    }
    
    return characters.slice(0, 4) // Limit to 4 characters
  }

  // Get characters for current manga
  const mangaCharacters = generateMangaCharacters(manga)

  useEffect(() => {
    const loadMangaDetails = async () => {
      try {
        setLoading(true)
        const response = await api.getMangaById(params.id as string)
        setManga(response)
        
        // Set default character after manga is loaded
        // Character will be set after mangaCharacters is generated
        
        // Load initial chapters
        await loadChapters(1)
      } catch (error) {
        console.error("Failed to fetch manga:", error)
        toast({
          title: "Error",
          description: "Failed to load manga details. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadMangaDetails()
  }, [params.id])

  // Set default character when manga and characters are available
  useEffect(() => {
    if (manga && mangaCharacters.length > 0 && !currentCharacter) {
      setCurrentCharacter(mangaCharacters[0])
    }
  }, [manga, mangaCharacters, currentCharacter])

  const loadChapters = async (page: number) => {
    try {
      setChaptersLoading(true)
      const response = await api.getMangaChapters(params.id as string, page, CHAPTERS_PER_PAGE)
      setChapters(response.data || [])
      setTotalPages(Math.ceil((response.pagination?.total || 0) / CHAPTERS_PER_PAGE))
      setCurrentPage(page)
    } catch (error) {
      console.error("Failed to fetch chapters:", error)
      toast({
        title: "Error",
        description: "Failed to load chapters. Please try again.",
        variant: "destructive",
      })
    } finally {
      setChaptersLoading(false)
    }
  }

  const toggleReadingList = async () => {
    if (!manga) return

    try {
      if (manga.isInReadingList) {
        await api.removeFromReadingList(manga.malId)
        setManga({ ...manga, isInReadingList: false, readingStatus: undefined })
        toast({
          title: "Removed from Reading List",
          description: `${manga.title} has been removed from your reading list.`,
        })
      } else {
        await api.addToReadingList(manga.malId, "plan_to_read")
        setManga({ ...manga, isInReadingList: true, readingStatus: "plan_to_read" })
        toast({
          title: "Added to Reading List",
          description: `${manga.title} has been added to your reading list.`,
        })
      }
    } catch (error) {
      console.error("Failed to update reading list:", error)
      toast({
        title: "Error",
        description: "Failed to update reading list. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleReadChapter = (chapterNumber: string) => {
    router.push(`/manga/${params.id}/reader?chapter=${chapterNumber}`)
  }

  const handleSwitchCharacter = (character: Character | any) => {
    // Handle both Character types
    const compatibleCharacter = mangaCharacters.find(c => c.name === character.name) || {
      name: character.name,
      description: character.status || "Available for chat",
      avatar: character.avatar,
      personality: Array.isArray(character.personality) ? character.personality[0] : character.personality || "Friendly"
    }
    setCurrentCharacter(compatibleCharacter)
    setIsChatOpen(true)
  }

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      loadChapters(currentPage + 1)
    }
  }

  const handlePrevPage = () => {
    if (currentPage > 1) {
      loadChapters(currentPage - 1)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "ongoing":
      case "publishing":
        return "bg-green-500"
      case "completed":
        return "bg-blue-500"
      case "hiatus":
        return "bg-yellow-500"
      case "cancelled":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-700 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1">
                <div className="aspect-[3/4] bg-gray-700 rounded-lg"></div>
              </div>
              <div className="lg:col-span-2 space-y-4">
                <div className="h-8 bg-gray-700 rounded w-3/4"></div>
                <div className="h-4 bg-gray-700 rounded w-1/2"></div>
                <div className="h-4 bg-gray-700 rounded w-1/4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-700 rounded"></div>
                  <div className="h-4 bg-gray-700 rounded"></div>
                  <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!manga) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Manga Not Found</h1>
          <Button onClick={() => router.push("/manga")} className="bg-orange-600 hover:bg-orange-700">
            Back to Manga
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button
          onClick={() => router.back()}
          variant="ghost"
          className="mb-6 text-gray-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        {/* Manga Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Cover Image */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="relative"
            >
              <img
                src={manga.coverImage || "/placeholder.svg?height=600&width=400"}
                alt={manga.title}
                className="w-full rounded-lg shadow-2xl"
              />
              <Badge className={`absolute top-4 left-4 ${getStatusColor(manga.status)} text-white`}>
                {manga.status}
              </Badge>
            </motion.div>
          </div>

          {/* Info */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <h1 className="text-4xl font-bold text-white mb-2">{manga.title}</h1>
              
              {manga.titleEnglish && manga.titleEnglish !== manga.title && (
                <p className="text-xl text-gray-300 mb-2">{manga.titleEnglish}</p>
              )}
              
              {manga.titleJapanese && (
                <p className="text-lg text-gray-400 mb-4">{manga.titleJapanese}</p>
              )}

              {/* Stats */}
              <div className="flex flex-wrap gap-4 mb-6">
                {manga.rating && (
                  <div className="flex items-center bg-yellow-500/20 px-3 py-1 rounded-full">
                    <Star className="w-4 h-4 text-yellow-500 mr-1" />
                    <span className="text-yellow-500 font-semibold">{manga.rating.toFixed(1)}</span>
                  </div>
                )}
                {manga.year && (
                  <div className="flex items-center bg-blue-500/20 px-3 py-1 rounded-full">
                    <Calendar className="w-4 h-4 text-blue-500 mr-1" />
                    <span className="text-blue-500">{manga.year}</span>
                  </div>
                )}
                {manga.chapters && (
                  <div className="flex items-center bg-green-500/20 px-3 py-1 rounded-full">
                    <BookOpen className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-green-500">{manga.chapters} chapters</span>
                  </div>
                )}
              </div>

              {/* Genres */}
              <div className="flex flex-wrap gap-2 mb-6">
                {manga.genres?.map((genre) => (
                  <Badge key={genre.id} variant="secondary" className="bg-orange-500/20 text-orange-400">
                    {genre.name}
                  </Badge>
                ))}
              </div>

              {/* Authors */}
              {manga.authors && manga.authors.length > 0 && (
                <div className="flex items-center mb-6">
                  <User className="w-5 h-5 text-gray-400 mr-2" />
                  <span className="text-gray-300">
                    {manga.authors.map(author => author.name).join(", ")}
                  </span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4 mb-6">
                <Button
                  onClick={() => handleReadChapter("1")}
                  className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 animate-pulse-glow"
                  size="lg"
                >
                  <BookOpen className="w-5 h-5 mr-2" />
                  Start Reading
                </Button>
                <Button
                  onClick={toggleReadingList}
                  variant="outline"
                  className={`px-8 py-3 ${
                    manga.isInReadingList
                      ? "bg-green-600 hover:bg-green-700 text-white border-green-600"
                      : "border-orange-500 text-orange-400 hover:bg-orange-500/10"
                  }`}
                  size="lg"
                >
                  {manga.isInReadingList ? <Check className="w-5 h-5 mr-2" /> : <Plus className="w-5 h-5 mr-2" />}
                  {manga.isInReadingList ? "In Reading List" : "Add to Reading List"}
                </Button>
                {currentCharacter && (
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-orange-500 text-orange-400 hover:bg-orange-500/10"
                    onClick={() => setIsChatOpen(true)}
                  >
                    <MessageCircle className="mr-2 h-5 w-5" />
                    Chat with {currentCharacter.name}
                  </Button>
                )}
              </div>

              {/* Synopsis */}
              {manga.synopsis && (
                <div className="bg-gray-800/50 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold text-white mb-3">Synopsis</h3>
                  <p className="text-gray-300 leading-relaxed">{manga.synopsis}</p>
                </div>
              )}
            </motion.div>
          </div>
        </div>

        {/* Chapters and Characters Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Chapters Section with Pagination */}
            <Card className="animate-slide-in-up bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <BookOpen className="h-5 w-5 text-orange-500 animate-bounce" />
                    <span className="text-white">Chapters</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePrevPage}
                      disabled={currentPage === 1}
                      className="rounded-full border-orange-500/40 text-orange-400"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-gray-300">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNextPage}
                      disabled={currentPage >= totalPages}
                      className="rounded-full border-orange-500/40 text-orange-400"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {chaptersLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="h-20 bg-gray-700 rounded-lg animate-pulse"></div>
                    ))}
                  </div>
                ) : chapters.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {chapters.map((chapter) => (
                      <Card 
                        key={chapter.id} 
                        className="cursor-pointer bg-gradient-to-br from-orange-500/10 to-yellow-500/10 hover:from-orange-500/20 hover:to-yellow-500/20 border-orange-500/20 hover:border-orange-500/40 transition-all duration-300 hover:scale-105"
                        onClick={() => handleReadChapter(chapter.attributes.chapter)}
                      >
                        <div className="flex items-center justify-between p-4">
                          <div className="flex-1">
                            <h4 className="text-white font-medium">
                              Chapter {chapter.attributes.chapter}
                              {chapter.attributes.title && `: ${chapter.attributes.title}`}
                            </h4>
                            <p className="text-gray-400 text-sm">
                              {chapter.attributes.pages} pages • {new Date(chapter.attributes.publishAt).toLocaleDateString()}
                            </p>
                          </div>
                          <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
                            <BookOpen className="w-4 h-4" />
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No chapters available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Characters Section */}
            <Card className="animate-slide-in-up bg-gray-800/50 border-gray-700" style={{ animationDelay: "0.2s" }}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-orange-500" />
                  <span className="text-white">Characters</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {mangaCharacters.map((character, i) => (
                    <div 
                      key={character.name} 
                      className="text-center animate-bounce-in cursor-pointer group"
                      style={{ animationDelay: `${i * 0.1}s` }}
                      onClick={() => handleSwitchCharacter(character)}
                    >
                      <div className="w-20 h-20 mx-auto rounded-full overflow-hidden border-2 border-orange-500/30 group-hover:border-orange-500/60 mb-2 transition-all duration-300">
                        <img
                          src={character.avatar}
                          alt={character.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <h4 className="font-semibold text-sm text-white group-hover:text-orange-400 transition-colors">
                        {character.name}
                      </h4>
                      <p className="text-xs text-gray-400 mt-1">{character.personality}</p>
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
              <Card className="animate-slide-in-right border-orange-500/30 bg-gradient-to-br from-orange-500/10 to-yellow-500/10">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MessageCircle className="h-5 w-5 text-orange-500 animate-pulse" />
                    <span className="text-white">Chat with Characters</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="w-20 h-20 mx-auto rounded-full overflow-hidden border-2 border-orange-500/50 mb-3 animate-pulse-glow">
                      <img
                        src={currentCharacter.avatar}
                        alt={currentCharacter.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <h3 className="font-semibold text-white">{currentCharacter.name}</h3>
                    <p className="text-sm text-gray-300">{currentCharacter.description}</p>
                  </div>

                  <div className="flex flex-wrap gap-2 justify-center">
                    <Badge variant="outline" className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                      {currentCharacter.personality}
                    </Badge>
                  </div>

                  <Button className="w-full bg-orange-600 hover:bg-orange-700" onClick={() => setIsChatOpen(true)}>
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
              title: manga.title,
              coverImage: manga.coverImage
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