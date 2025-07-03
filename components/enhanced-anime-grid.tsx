"use client"

import { useRef, useCallback, useState } from "react"
import { motion } from "framer-motion"
import { Star, Play, Plus, Check, Eye, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import api from "@/lib/api"

interface Anime {
  id: string
  title: string
  coverImage: string
  bannerImage?: string
  rating: number | null
  episodes: number | null
  status: string
  year: number | null
  genres: string[]
  synopsis: string | null
  studios?: string[]
  isInWatchlist?: boolean
  watchlistStatus?: string
}

interface EnhancedAnimeGridProps {
  anime: Anime[]
  loading: boolean
  hasMore: boolean
  onLoadMore: () => void
  onAnimeUpdate?: (animeId: string, updates: Partial<Anime>) => void
}

export function EnhancedAnimeGrid({ 
  anime, 
  loading, 
  hasMore, 
  onLoadMore, 
  onAnimeUpdate 
}: EnhancedAnimeGridProps) {
  const { toast } = useToast()
  const router = useRouter()
  const observer = useRef<IntersectionObserver>()
  const [updatingWatchlist, setUpdatingWatchlist] = useState<string | null>(null)

  const lastAnimeElementRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (loading) return
      if (observer.current) observer.current.disconnect()
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          onLoadMore()
        }
      })
      if (node) observer.current.observe(node)
    },
    [loading, hasMore, onLoadMore]
  )

  const handleWatch = (animeId: string) => {
    router.push(`/anime/${animeId}`)
  }

  const toggleWatchlist = async (animeItem: Anime) => {
    try {
      setUpdatingWatchlist(animeItem.id)
      
      if (animeItem.isInWatchlist) {
        await api.removeFromWatchlist(animeItem.id)
        toast({
          title: "Removed from Watchlist",
          description: `${animeItem.title} has been removed from your watchlist.`,
        })
        
        // Update the local state
        onAnimeUpdate?.(animeItem.id, { 
          isInWatchlist: false, 
          watchlistStatus: undefined 
        })
      } else {
        await api.addToWatchlist(animeItem.id, "plan_to_watch")
        toast({
          title: "Added to Watchlist",
          description: `${animeItem.title} has been added to your watchlist.`,
        })
        
        // Update the local state
        onAnimeUpdate?.(animeItem.id, { 
          isInWatchlist: true, 
          watchlistStatus: "plan_to_watch" 
        })
      }
    } catch (error) {
      console.error("Failed to update watchlist:", error)
      toast({
        title: "Error",
        description: "Failed to update watchlist. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUpdatingWatchlist(null)
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

  return (
    <div className="space-y-6">
      {/* Anime Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {anime.map((animeItem, index) => (
          <motion.div
            key={animeItem.id}
            ref={index === anime.length - 1 ? lastAnimeElementRef : null}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="group overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700 hover:border-purple-500/50 transition-all duration-300">
              <div className="relative">
                {/* Cover Image */}
                <div 
                  className="aspect-[3/4] overflow-hidden cursor-pointer" 
                  onClick={() => handleWatch(animeItem.id)}
                >
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
                      <Button 
                        size="sm" 
                        className="bg-purple-600 hover:bg-purple-700"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleWatch(animeItem.id)
                        }}
                      >
                        <Play className="w-4 h-4 mr-1" />
                        Watch
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={updatingWatchlist === animeItem.id}
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleWatchlist(animeItem)
                        }}
                        className={`${
                          animeItem.isInWatchlist
                            ? "bg-green-600 hover:bg-green-700 text-white"
                            : "bg-white/10 hover:bg-white/20"
                        }`}
                      >
                        {updatingWatchlist === animeItem.id ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : animeItem.isInWatchlist ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Plus className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Status Badge */}
                <Badge className={`absolute top-2 left-2 ${getStatusColor(animeItem.status)} text-white`}>
                  {animeItem.status}
                </Badge>

                {/* Rating Badge */}
                {animeItem.rating && (
                  <Badge className="absolute top-2 right-2 bg-yellow-500 text-white">
                    <Star className="w-3 h-3 mr-1" />
                    {animeItem.rating.toFixed(1)}
                  </Badge>
                )}

                {/* Watchlist Status Badge */}
                {animeItem.isInWatchlist && (
                  <Badge className="absolute bottom-2 right-2 bg-green-600 text-white">
                    <Check className="w-3 h-3 mr-1" />
                    In Watchlist
                  </Badge>
                )}
              </div>

              <CardContent 
                className="p-4 cursor-pointer" 
                onClick={() => handleWatch(animeItem.id)}
              >
                {/* Title */}
                <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2">{animeItem.title}</h3>

                {/* Metadata */}
                <div className="flex items-center space-x-4 text-sm text-gray-400 mb-2">
                  {animeItem.episodes && (
                    <div className="flex items-center">
                      <Eye className="w-4 h-4 mr-1" />
                      {animeItem.episodes} eps
                  </div>
                  )}
                  {animeItem.year && (
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {animeItem.year}
                    </div>
                  )}
                </div>

                {/* Genres */}
                <div className="flex flex-wrap gap-1">
                  {animeItem.genres?.slice(0, 3).map((genre) => (
                    <Badge key={genre} variant="outline" className="text-xs">
                      {genre}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}

        {/* Loading Skeletons */}
        {loading &&
          Array.from({ length: 8 }).map((_, index) => (
            <div key={`skeleton-${index}`} className="animate-pulse">
              <div className="bg-gray-800 rounded-lg overflow-hidden">
                <div className="aspect-[3/4] bg-gray-700" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-700 rounded w-3/4" />
                  <div className="h-3 bg-gray-700 rounded w-1/2" />
                  <div className="flex gap-1">
                    <div className="h-3 bg-gray-700 rounded w-16" />
                    <div className="h-3 bg-gray-700 rounded w-16" />
      </div>
        </div>
        </div>
          </div>
          ))}
        </div>
    </div>
  )
}
