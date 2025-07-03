"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { ArrowLeft, BookOpen, Plus, Check, Star, Calendar, User, Tag, Eye, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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

export default function MangaDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [manga, setManga] = useState<MangaDetails | null>(null)
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [loading, setLoading] = useState(true)
  const [chaptersLoading, setChaptersLoading] = useState(false)

  useEffect(() => {
    if (params.id) {
      loadMangaDetails()
    }
  }, [params.id])

  const loadMangaDetails = async () => {
    try {
      setLoading(true)
      const mangaData = await api.getMangaById(params.id as string)
      setManga(mangaData)
      
      // Load chapters
      setChaptersLoading(true)
      const chaptersData = await api.getMangaChapters(params.id as string, 1, 50)
      setChapters(chaptersData.data || [])
    } catch (error) {
      console.error("Failed to load manga details:", error)
      toast({
        title: "Error",
        description: "Failed to load manga details. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
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
              <div className="flex gap-4 mb-6">
                <Button
                  onClick={() => handleReadChapter("1")}
                  className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-3"
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

        {/* Chapters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Tabs defaultValue="chapters" className="w-full">
            <TabsList className="grid w-full grid-cols-1 max-w-[400px] bg-gray-800">
              <TabsTrigger value="chapters" className="data-[state=active]:bg-orange-600">
                Chapters ({chapters.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="chapters" className="mt-6">
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Chapters</CardTitle>
                </CardHeader>
                <CardContent>
                  {chaptersLoading ? (
                    <div className="space-y-2">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-12 bg-gray-700 rounded animate-pulse"></div>
                      ))}
                    </div>
                  ) : chapters.length > 0 ? (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {chapters.map((chapter) => (
                        <div
                          key={chapter.id}
                          className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer"
                          onClick={() => handleReadChapter(chapter.attributes.chapter)}
                        >
                          <div>
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
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  )
} 