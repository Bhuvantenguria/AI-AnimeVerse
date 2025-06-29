"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Star, BookOpen, Plus, Check, Eye, Calendar, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import api from "@/lib/api"

interface Manga {
  id: string
  title: string
  coverImage: string
  rating: number
  chapters: number
  volumes?: number
  status: string
  year: number
  genres: string[]
  synopsis: string
  authors: string[]
  isInReadingList?: boolean
  readingStatus?: string
}

interface EnhancedMangaGridProps {
  searchQuery?: string
  selectedGenre?: string
  selectedStatus?: string
  selectedYear?: number
}

export function EnhancedMangaGrid({
  searchQuery,
  selectedGenre,
  selectedStatus,
  selectedYear,
}: EnhancedMangaGridProps) {
  const [manga, setManga] = useState<Manga[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadManga(true)
  }, [searchQuery, selectedGenre, selectedStatus, selectedYear])

  const loadManga = async (reset = false) => {
    try {
      setLoading(true)
      const currentPage = reset ? 1 : page

      const response = await api.getManga({
        page: currentPage,
        limit: 20,
        search: searchQuery,
        genre: selectedGenre,
        status: selectedStatus,
        year: selectedYear,
      })

      if (reset) {
        setManga(response.manga)
        setPage(2)
      } else {
        setManga((prev) => [...prev, ...response.manga])
        setPage((prev) => prev + 1)
      }

      setHasMore(response.pagination.page < response.pagination.pages)
    } catch (error) {
      console.error("Failed to load manga:", error)
      toast({
        title: "Error",
        description: "Failed to load manga. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const toggleReadingList = async (mangaItem: Manga) => {
    try {
      if (mangaItem.isInReadingList) {
        await api.removeFromReadingList(mangaItem.id)
        setManga((prev) =>
          prev.map((item) =>
            item.id === mangaItem.id ? { ...item, isInReadingList: false, readingStatus: undefined } : item,
          ),
        )
        toast({
          title: "Removed from Reading List",
          description: `${mangaItem.title} has been removed from your reading list.`,
        })
      } else {
        await api.addToReadingList(mangaItem.id, "plan_to_read")
        setManga((prev) =>
          prev.map((item) =>
            item.id === mangaItem.id ? { ...item, isInReadingList: true, readingStatus: "plan_to_read" } : item,
          ),
        )
        toast({
          title: "Added to Reading List",
          description: `${mangaItem.title} has been added to your reading list.`,
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

  const getReadingStatusColor = (status?: string) => {
    switch (status) {
      case "reading":
        return "bg-green-500"
      case "completed":
        return "bg-blue-500"
      case "on_hold":
        return "bg-yellow-500"
      case "dropped":
        return "bg-red-500"
      case "plan_to_read":
        return "bg-purple-500"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <div className="space-y-6">
      {/* Manga Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {manga.map((mangaItem, index) => (
          <motion.div
            key={mangaItem.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="group overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700 hover:border-orange-500/50 transition-all duration-300">
              <div className="relative">
                {/* Cover Image */}
                <div className="aspect-[3/4] overflow-hidden">
                  <img
                    src={mangaItem.coverImage || "/placeholder.svg?height=400&width=300"}
                    alt={mangaItem.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />

                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  {/* Action Buttons */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="flex space-x-2">
                      <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
                        <BookOpen className="w-4 h-4 mr-1" />
                        Read
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleReadingList(mangaItem)}
                        className={`${
                          mangaItem.isInReadingList
                            ? "bg-green-600 hover:bg-green-700 text-white"
                            : "bg-white/10 hover:bg-white/20"
                        }`}
                      >
                        {mangaItem.isInReadingList ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Status Badge */}
                <Badge className={`absolute top-2 left-2 ${getStatusColor(mangaItem.status)} text-white`}>
                  {mangaItem.status}
                </Badge>

                {/* Rating */}
                {mangaItem.rating && (
                  <div className="absolute top-2 right-2 bg-black/70 rounded-full px-2 py-1 flex items-center space-x-1">
                    <Star className="w-3 h-3 text-yellow-400 fill-current" />
                    <span className="text-xs text-white font-medium">{mangaItem.rating.toFixed(1)}</span>
                  </div>
                )}

                {/* Reading Status */}
                {mangaItem.isInReadingList && mangaItem.readingStatus && (
                  <Badge
                    className={`absolute bottom-2 left-2 ${getReadingStatusColor(mangaItem.readingStatus)} text-white text-xs`}
                  >
                    {mangaItem.readingStatus.replace("_", " ")}
                  </Badge>
                )}
              </div>

              <CardContent className="p-4">
                <h3 className="font-semibold text-white mb-2 line-clamp-2 group-hover:text-orange-300 transition-colors">
                  {mangaItem.title}
                </h3>

                <div className="flex items-center space-x-4 text-sm text-gray-400 mb-3">
                  <div className="flex items-center space-x-1">
                    <Eye className="w-3 h-3" />
                    <span>{mangaItem.chapters} ch</span>
                  </div>
                  {mangaItem.volumes && (
                    <div className="flex items-center space-x-1">
                      <BookOpen className="w-3 h-3" />
                      <span>{mangaItem.volumes} vol</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3" />
                    <span>{mangaItem.year}</span>
                  </div>
                </div>

                {/* Authors */}
                {mangaItem.authors.length > 0 && (
                  <div className="flex items-center space-x-1 text-sm text-gray-400 mb-3">
                    <User className="w-3 h-3" />
                    <span className="truncate">{mangaItem.authors[0]}</span>
                    {mangaItem.authors.length > 1 && <span>+{mangaItem.authors.length - 1}</span>}
                  </div>
                )}

                {/* Genres */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {mangaItem.genres.slice(0, 3).map((genre) => (
                    <Badge
                      key={genre}
                      variant="secondary"
                      className="text-xs bg-orange-500/20 text-orange-300 hover:bg-orange-500/30"
                    >
                      {genre}
                    </Badge>
                  ))}
                  {mangaItem.genres.length > 3 && (
                    <Badge variant="secondary" className="text-xs bg-gray-500/20 text-gray-400">
                      +{mangaItem.genres.length - 3}
                    </Badge>
                  )}
                </div>

                {/* Synopsis */}
                <p className="text-sm text-gray-400 line-clamp-3">{mangaItem.synopsis}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
        </div>
      )}

      {/* Load More */}
      {!loading && hasMore && (
        <div className="flex justify-center py-8">
          <Button onClick={() => loadManga()} className="bg-orange-600 hover:bg-orange-700">
            Load More Manga
          </Button>
        </div>
      )}

      {/* No Results */}
      {!loading && manga.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No manga found matching your criteria.</p>
          </div>
          <Button
            onClick={() => loadManga(true)}
            variant="outline"
            className="border-orange-500 text-orange-400 hover:bg-orange-500/10"
          >
            Reset Filters
          </Button>
        </div>
      )}
    </div>
  )
}
