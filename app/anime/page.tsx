"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Search, Filter, TrendingUp, Calendar, Star } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { EnhancedAnimeGrid } from "@/components/enhanced-anime-grid"
import api from "@/lib/api"

const genres = [
  "Action",
  "Adventure",
  "Comedy",
  "Drama",
  "Fantasy",
  "Horror",
  "Mystery",
  "Romance",
  "Sci-Fi",
  "Slice of Life",
  "Sports",
  "Supernatural",
  "Thriller",
]

const statuses = ["airing", "completed", "upcoming"]
const years = Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - i)

export default function AnimePage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedGenre, setSelectedGenre] = useState<string>("any")
  const [selectedStatus, setSelectedStatus] = useState<string>("any")
  const [selectedYear, setSelectedYear] = useState<number | "any">("any")
  const [showFilters, setShowFilters] = useState(false)
  const [animeList, setAnimeList] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  const fetchAnime = async (resetList = false) => {
    try {
      setLoading(true)
      setError(null)
      const currentPage = resetList ? 1 : page
      const response = await api.searchAnime(searchQuery, currentPage)
      
      if (resetList) {
        setAnimeList(response.data)
      } else {
        setAnimeList(prev => [...prev, ...response.data])
      }
      
      setHasMore(response.pagination.has_next_page)
      if (!resetList) {
        setPage(prev => prev + 1)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch anime")
    } finally {
      setLoading(false)
    }
  }

  const handleAnimeUpdate = (animeId: string, updates: Partial<any>) => {
    setAnimeList(prev => 
      prev.map(anime => 
        anime.id === animeId 
          ? { ...anime, ...updates }
          : anime
      )
    )
  }

  useEffect(() => {
    fetchAnime(true)
  }, [searchQuery])

  const clearFilters = () => {
    setSearchQuery("")
    setSelectedGenre("any")
    setSelectedStatus("any")
    setSelectedYear("any")
  }

  const hasActiveFilters = searchQuery || selectedGenre !== "any" || selectedStatus !== "any" || selectedYear !== "any"

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
            Discover Anime
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Explore thousands of anime series and movies. Find your next favorite story.
          </p>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          {/* Search Bar */}
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search anime titles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
              />
            </div>
            <Button
              onClick={() => setShowFilters(!showFilters)}
              variant="outline"
              className="border-purple-500 text-purple-400 hover:bg-purple-500/10"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
              {hasActiveFilters && (
                <Badge className="ml-2 bg-purple-500 text-white">
                  {
                    [searchQuery, selectedGenre !== "any", selectedStatus !== "any", selectedYear !== "any"].filter(
                      Boolean,
                    ).length
                  }
                </Badge>
              )}
            </Button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10"
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Genre</label>
                  <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue placeholder="Any genre" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any genre</SelectItem>
                      {genres.map((genre) => (
                        <SelectItem key={genre} value={genre.toLowerCase()}>
                          {genre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue placeholder="Any status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any status</SelectItem>
                      {statuses.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Year</label>
                  <Select
                    value={selectedYear?.toString()}
                    onValueChange={(value) => setSelectedYear(value ? Number.parseInt(value) : "any")}
                  >
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue placeholder="Any year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any year</SelectItem>
                      {years.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button
                    onClick={clearFilters}
                    variant="outline"
                    className="w-full border-gray-500 text-gray-400 hover:bg-gray-500/10 bg-transparent"
                    disabled={!hasActiveFilters}
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Quick Filter Badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-wrap gap-2 mb-8"
        >
          <Badge
            variant="outline"
            className="cursor-pointer border-purple-500 text-purple-400 hover:bg-purple-500/10"
            onClick={() => setSelectedStatus("airing")}
          >
            <TrendingUp className="w-3 h-3 mr-1" />
            Currently Airing
          </Badge>
          <Badge
            variant="outline"
            className="cursor-pointer border-blue-500 text-blue-400 hover:bg-blue-500/10"
            onClick={() => setSelectedStatus("completed")}
          >
            <Star className="w-3 h-3 mr-1" />
            Completed Series
          </Badge>
        </motion.div>

        {/* Error Message */}
        {error && (
          <div className="text-red-400 text-center mb-8">
            {error}
          </div>
        )}

        {/* Anime Grid */}
          <EnhancedAnimeGrid
          anime={animeList}
          loading={loading}
          hasMore={hasMore}
          onLoadMore={() => fetchAnime()}
          onAnimeUpdate={handleAnimeUpdate}
        />

        {/* No Results */}
        {!loading && animeList.length === 0 && (
          <div className="text-center text-gray-400 mt-8">
            <div className="text-6xl mb-4">👀</div>
            <p>No anime found matching your criteria.</p>
            {hasActiveFilters && (
              <Button
                onClick={clearFilters}
                variant="link"
                className="text-purple-400 hover:text-purple-300 mt-2"
              >
                Clear all filters
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
