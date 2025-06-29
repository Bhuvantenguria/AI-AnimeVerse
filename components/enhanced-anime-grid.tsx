"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Star, Play, Plus, Check, Eye, Calendar, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import api from "@/lib/api"

interface Anime {
  id: string
  title: string
  coverImage: string
  bannerImage?: string
  rating: number
  episodes: number
  status: string
  year: number
  genres: string[]
  synopsis: string
  studios: string[]
  isInWatchlist?: boolean
  watchlistStatus?: string
}

interface EnhancedAnimeGridProps {
  searchQuery?: string
  selectedGenre?: string
  selectedStatus?: string
  selectedYear?: number
}

export function EnhancedAnimeGrid({
  searchQuery,
  selectedGenre,
  selectedStatus,
  selectedYear,
}: EnhancedAnimeGridProps) {
  const [anime, setAnime] = useState<Anime[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadAnime(true)
  }, [searchQuery, selectedGenre, selectedStatus, selectedYear])

  const loadAnime = async (reset = false) => {
    try {
      setLoading(true)
      const currentPage = reset ? 1 : page

      const response = await api.getAnime({
        page: currentPage,
        limit: 20,
        search: searchQuery,
        genre: selectedGenre,
        status: selectedStatus,
        year: selectedYear,
      })

      if (reset) {
        setAnime(response.anime)
        setPage(2)
      } else {
        setAnime((prev) => [...prev, ...response.anime])
        setPage((prev) => prev + 1)
      }

      setHasMore(response.pagination.page < response.pagination.pages)
    } catch (error) {
      console.error("Failed to load anime:", error)
      toast({
        title: "Error",
        description: "Failed to load anime. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const toggleWatchlist = async (animeItem: Anime) => {
    try {
      if (animeItem.isInWatchlist) {
        await api.removeFromWatchlist(animeItem.id)
        setAnime((prev) =>
          prev.map((item) =>
            item.id === animeItem.id ? { ...item, isInWatchlist: false, watchlistStatus: undefined } : item,
          ),
        )
        toast({
          title: "Removed from Watchlist",
          description: `${animeItem.title} has been removed from your watchlist.`,
        })
      } else {
        await api.addToWatchlist(animeItem.id, "plan_to_watch")
        setAnime((prev) =>
          prev.map((item) =>
            item.id === animeItem.id ? { ...item, isInWatchlist: true, watchlistStatus: "plan_to_watch" } : item,
          ),
        )
        toast({
          title: "Added to Watchlist",
          description: `${animeItem.title} has been added to your watchlist.`,
        })
      }
    } catch (error) {
      console.error("Failed to update watchlist:", error)
      toast({
        title: "Error",
        description: "Failed to update watchlist. Please try again.",
        variant: "destructive",
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "airing":
      case "ongoing":
        return "bg-green-500"
      case "completed":
        return "bg-blue-500"
      case "upcoming":
        return "bg-purple-500"
      default:
        return "bg-gray-500"
    }
  }

  const getWatchlistStatusColor = (status?: string) => {
    switch (status) {
      case "watching":
        return "bg-green-500"
      case "completed":
        return "bg-blue-500"
      case "on_hold":
        return "bg-yellow-500"
      case "dropped":
        return "bg-red-500"
      case "plan_to_watch":
        return "bg-purple-500"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <div className="space-y-6">
      {/* Anime Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {anime.map((animeItem, index) => (
          <motion.div
            key={animeItem.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="group overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700 hover:border-purple-500/50 transition-all duration-300">
              <div className="relative">
                {/* Cover Image */}
                <div className="aspect-[3/4] overflow-hidden">
                  <img
                    src={animeItem.coverImage || "/placeholder.svg?height=400&width=300"}
                    alt={animeItem.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />

                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  {/* Action Buttons */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="flex space-x-2">
                      <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                        <Play className="w-4 h-4 mr-1" />
                        Watch
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleWatchlist(animeItem)}
                        className={`${
                          animeItem.isInWatchlist
                            ? "bg-green-600 hover:bg-green-700 text-white"
                            : "bg-white/10 hover:bg-white/20"
                        }`}
                      >
                        {animeItem.isInWatchlist ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Status Badge */}
                <Badge className={`absolute top-2 left-2 ${getStatusColor(animeItem.status)} text-white`}>
                  {animeItem.status}
                </Badge>

                {/* Rating */}
                {animeItem.rating && (
                  <div className="absolute top-2 right-2 bg-black/70 rounded-full px-2 py-1 flex items-center space-x-1">
                    <Star className="w-3 h-3 text-yellow-400 fill-current" />
                    <span className="text-xs text-white font-medium">{animeItem.rating.toFixed(1)}</span>
                  </div>
                )}

                {/* Watchlist Status */}
                {animeItem.isInWatchlist && animeItem.watchlistStatus && (
                  <Badge
                    className={`absolute bottom-2 left-2 ${getWatchlistStatusColor(animeItem.watchlistStatus)} text-white text-xs`}
                  >
                    {animeItem.watchlistStatus.replace("_", " ")}
                  </Badge>
                )}
              </div>

              <CardContent className="p-4">
                <h3 className="font-semibold text-white mb-2 line-clamp-2 group-hover:text-purple-300 transition-colors">
                  {animeItem.title}
                </h3>

                <div className="flex items-center space-x-4 text-sm text-gray-400 mb-3">
                  <div className="flex items-center space-x-1">
                    <Eye className="w-3 h-3" />
                    <span>{animeItem.episodes} eps</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3" />
                    <span>{animeItem.year}</span>
                  </div>
                  {animeItem.studios.length > 0 && (
                    <div className="flex items-center space-x-1">
                      <Users className="w-3 h-3" />
                      <span className="truncate">{animeItem.studios[0]}</span>
                    </div>
                  )}
                </div>

                {/* Genres */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {animeItem.genres.slice(0, 3).map((genre) => (
                    <Badge
                      key={genre}
                      variant="secondary"
                      className="text-xs bg-purple-500/20 text-purple-300 hover:bg-purple-500/30"
                    >
                      {genre}
                    </Badge>
                  ))}
                  {animeItem.genres.length > 3 && (
                    <Badge variant="secondary" className="text-xs bg-gray-500/20 text-gray-400">
                      +{animeItem.genres.length - 3}
                    </Badge>
                  )}
                </div>

                {/* Synopsis */}
                <p className="text-sm text-gray-400 line-clamp-3">{animeItem.synopsis}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
        </div>
      )}

      {/* Load More */}
      {!loading && hasMore && (
        <div className="flex justify-center py-8">
          <Button onClick={() => loadAnime()} className="bg-purple-600 hover:bg-purple-700">
            Load More Anime
          </Button>
        </div>
      )}

      {/* No Results */}
      {!loading && anime.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Eye className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No anime found matching your criteria.</p>
          </div>
          <Button
            onClick={() => loadAnime(true)}
            variant="outline"
            className="border-purple-500 text-purple-400 hover:bg-purple-500/10"
          >
            Reset Filters
          </Button>
        </div>
      )}
    </div>
  )
}
