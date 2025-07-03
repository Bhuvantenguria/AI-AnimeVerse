"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Filter, TrendingUp, Calendar, Star, Sparkles, Zap, Heart, Play, Eye } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { EnhancedAnimeGrid } from "@/components/enhanced-anime-grid"
import api from "@/lib/api"
import { ThemeToggle } from '@/components/theme-toggle'

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

// Floating particles component
const FloatingParticles = () => (
  <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
    {[...Array(30)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-2 h-2 bg-gradient-to-r from-primary/60 to-accent/60 rounded-full"
        animate={{
          x: [0, Math.random() * window.innerWidth],
          y: [0, Math.random() * window.innerHeight],
          scale: [0, 1, 0],
          opacity: [0, 0.8, 0],
        }}
        transition={{
          duration: Math.random() * 10 + 10,
          repeat: Infinity,
          ease: "linear",
        }}
        style={{
          left: Math.random() * 100 + "%",
          top: Math.random() * 100 + "%",
        }}
      />
    ))}
    {/* Anime-themed floating elements */}
    {[...Array(8)].map((_, i) => (
      <motion.div
        key={`anime-${i}`}
        className="absolute text-2xl opacity-20"
        animate={{
          y: [0, -100, 0],
          x: [0, Math.random() * 50 - 25, 0],
          rotate: [0, 360],
        }}
        transition={{
          duration: Math.random() * 15 + 20,
          repeat: Infinity,
          ease: "linear",
        }}
        style={{
          left: Math.random() * 100 + "%",
          top: Math.random() * 100 + "%",
        }}
      >
        {["⚡", "🌟", "💫", "🎌", "🌸", "🔥", "💎", "🎭"][i]}
      </motion.div>
    ))}
  </div>
)

// Animated background grid
const AnimatedGrid = () => (
  <div className="fixed inset-0 pointer-events-none z-0">
    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px] animate-pulse" />
  </div>
)

// Holographic search bar
const HolographicSearchBar = ({ searchQuery, setSearchQuery }: { searchQuery: string; setSearchQuery: (value: string) => void }) => (
  <motion.div 
    className="relative group"
    whileHover={{ scale: 1.02 }}
    transition={{ type: "spring", stiffness: 300 }}
  >
    <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300" />
    <div className="relative flex items-center bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-2 shadow-2xl">
      <Search className="ml-3 text-primary w-5 h-5" />
      <Input
        placeholder="🔍 Search for your next anime adventure..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="flex-1 bg-transparent border-none text-white placeholder:text-white/60 focus:ring-0 text-lg font-medium"
      />
      <motion.div
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="mr-3"
      >
        <Sparkles className="w-5 h-5 text-accent" />
      </motion.div>
    </div>
  </motion.div>
)

// Interactive filter badges
const InteractiveFilterBadges = ({ onFilterClick }: { onFilterClick: (status: string) => void }) => (
  <div className="flex flex-wrap gap-3 mb-8">
    {[
      { status: "airing", icon: TrendingUp, label: "🔥 Currently Airing", color: "from-red-500 to-orange-500" },
      { status: "completed", icon: Star, label: "⭐ Completed Series", color: "from-blue-500 to-purple-500" },
      { status: "upcoming", icon: Calendar, label: "📅 Upcoming", color: "from-green-500 to-teal-500" },
    ].map(({ status, icon: Icon, label, color }) => (
      <motion.div
        key={status}
        whileHover={{ scale: 1.05, y: -2 }}
        whileTap={{ scale: 0.95 }}
        className="cursor-pointer"
        onClick={() => onFilterClick(status)}
      >
        <div className={`bg-gradient-to-r ${color} p-0.5 rounded-full`}>
          <div className="bg-black/80 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-2">
            <Icon className="w-4 h-4" />
            <span className="text-white font-medium text-sm">{label}</span>
          </div>
        </div>
      </motion.div>
    ))}
  </div>
)

// Simple loader component
const SimpleLoader = () => (
  <div className="flex flex-col items-center justify-center min-h-[40vh] w-full">
    <svg className="w-12 h-12 animate-spin text-purple-500 dark:text-purple-300 mb-4" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
    <div className="text-base font-medium text-gray-700 dark:text-gray-200">Loading anime...</div>
  </div>
);

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
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

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

  const handleFilterClick = (status: string) => {
    setSelectedStatus(status)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 relative overflow-hidden">
      {/* Animated backgrounds */}
      <AnimatedGrid />
      <FloatingParticles />
      
      {/* Mouse follower effect */}
      <motion.div
        className="fixed w-96 h-96 bg-gradient-to-r from-primary/20 to-accent/20 rounded-full blur-3xl pointer-events-none z-10"
        animate={{
          x: mousePosition.x - 192,
          y: mousePosition.y - 192,
        }}
        transition={{ type: "spring", stiffness: 50, damping: 20 }}
      />
      
      {/* Scroll indicator */}
      <motion.div
        className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="flex flex-col items-center text-white/60">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-6 h-10 border-2 border-white/40 rounded-full flex justify-center"
          >
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-1 h-3 bg-white/60 rounded-full mt-2"
            />
          </motion.div>
          <span className="text-xs mt-2 font-mono">Scroll to explore</span>
        </div>
      </motion.div>

      {/* Theme Toggle */}
      <motion.div 
        className="fixed top-6 right-6 z-50"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <ThemeToggle />
      </motion.div>

      <div className="container mx-auto px-4 py-8 relative z-20">
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl md:text-7xl font-black bg-gradient-to-r from-white via-primary to-accent bg-clip-text text-transparent mb-6 animate-pulse">
            ANIME VERSE
          </h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-xl md:text-2xl text-white/80 max-w-3xl mx-auto font-light"
          >
            Embark on an epic journey through infinite anime worlds
          </motion.p>
        </motion.div>

        {/* Search Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <HolographicSearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
        </motion.div>

        {/* Interactive Filter Badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <InteractiveFilterBadges onFilterClick={handleFilterClick} />
        </motion.div>

        {/* Advanced Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-8"
        >
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="flex justify-center"
          >
            <Button
              onClick={() => setShowFilters(!showFilters)}
              variant="outline"
              className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 rounded-full px-8 py-3"
            >
              <Filter className="w-5 h-5 mr-2" />
              Advanced Filters
              {hasActiveFilters && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="ml-2 w-6 h-6 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center text-xs font-bold"
                >
                  {[searchQuery, selectedGenre !== "any", selectedStatus !== "any", selectedYear !== "any"].filter(Boolean).length}
                </motion.div>
              )}
            </Button>
          </motion.div>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0, scale: 0.9 }}
                animate={{ opacity: 1, height: "auto", scale: 1 }}
                exit={{ opacity: 0, height: 0, scale: 0.9 }}
                className="mt-6 bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/10 shadow-2xl"
              >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {[
                    { label: "Genre", value: selectedGenre, onChange: setSelectedGenre, options: genres },
                    { label: "Status", value: selectedStatus, onChange: setSelectedStatus, options: statuses },
                    { label: "Year", value: selectedYear?.toString(), onChange: (v: string) => setSelectedYear(v ? Number.parseInt(v) : "any"), options: years.map(y => y.toString()) },
                  ].map(({ label, value, onChange, options }) => (
                    <div key={label}>
                      <label className="block text-sm font-medium text-white/80 mb-3">{label}</label>
                      <Select value={value} onValueChange={onChange}>
                        <SelectTrigger className="bg-white/10 border-white/20 text-white rounded-xl">
                          <SelectValue placeholder={`Any ${label.toLowerCase()}`} />
                        </SelectTrigger>
                        <SelectContent className="bg-black/90 backdrop-blur-xl border-white/20">
                          <SelectItem value="any">Any {label.toLowerCase()}</SelectItem>
                          {options.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}

                  <div className="flex items-end">
                    <Button
                      onClick={clearFilters}
                      variant="outline"
                      className="w-full bg-gradient-to-r from-red-500/20 to-pink-500/20 border-red-500/40 text-red-400 hover:bg-red-500/20 rounded-xl"
                      disabled={!hasActiveFilters}
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      Clear All
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center mb-8 p-4 bg-red-500/20 backdrop-blur-sm rounded-2xl border border-red-500/40"
            >
              <div className="text-red-400 font-medium">{error}</div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Anime Grid or Loader */}
        <EnhancedAnimeGrid
          anime={animeList}
          loading={loading}
          hasMore={hasMore}
          onLoadMore={() => fetchAnime()}
          onAnimeUpdate={handleAnimeUpdate}
        />

        {/* No Results */}
        <AnimatePresence>
          {!loading && animeList.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center text-white/60 mt-12"
            >
              <motion.div 
                animate={{ 
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.1, 1],
                }}
                transition={{ duration: 3, repeat: Infinity }}
                className="text-8xl mb-6"
              >
                🎌
              </motion.div>
              
              <motion.div
                animate={{ 
                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                }}
                transition={{ duration: 10, repeat: Infinity }}
                className="inline-block"
              >
                <h3 className="text-2xl font-bold bg-gradient-to-r from-white via-primary to-accent bg-clip-text text-transparent mb-4">
                  No anime found in this dimension...
                </h3>
              </motion.div>
              
              <p className="text-lg mb-6 text-white/70">Try exploring different search parameters or dimensions</p>
              
              {hasActiveFilters && (
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    onClick={clearFilters}
                    className="bg-gradient-to-r from-primary to-accent text-white px-8 py-3 rounded-full font-bold shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <Zap className="w-5 h-5 mr-2" />
                    Reset Search Parameters
                  </Button>
                </motion.div>
              )}
              
              {/* Floating anime emojis */}
              <div className="flex justify-center gap-4 mt-8">
                {["🌸", "⚡", "🌟", "💫", "🔥", "💎"].map((emoji, i) => (
                  <motion.div
                    key={emoji}
                    animate={{ 
                      y: [0, -10, 0],
                      rotate: [0, 360],
                    }}
                    transition={{ 
                      duration: 2, 
                      repeat: Infinity, 
                      delay: i * 0.2,
                      ease: "easeInOut"
                    }}
                    className="text-2xl"
                  >
                    {emoji}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
