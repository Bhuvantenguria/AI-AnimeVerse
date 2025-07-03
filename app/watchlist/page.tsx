"use client"

import { useState, useEffect } from "react"
import { AnimeCard } from "@/components/anime-card"
import { MangaCard } from "@/components/manga-card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { BarChart3, Play, BookOpen, CheckCircle, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import api from "@/lib/api"

interface WatchlistItem {
  id: string
  status: string
  rating?: number
  createdAt: string
  updatedAt: string
  anime: {
    id: string
    title: string
    coverImage: string
    episodes: Array<{
      id: string
      number: number
      title: string
      thumbnail: string
      duration: number
    }> | number
    status: string
    rating: number
  }
}

interface ReadingListItem {
  id: string
  status: string
  rating?: number
  createdAt: string
  updatedAt: string
  manga: {
    id: string
    title: string
    coverImage: string
    chapters: number
    status: string
    rating: number
  }
}

export default function WatchlistPage() {
  const [activeTab, setActiveTab] = useState<"watching" | "reading" | "completed">("watching")
  const [watchlistData, setWatchlistData] = useState<WatchlistItem[]>([])
  const [readingListData, setReadingListData] = useState<ReadingListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchWatchlistData()
    fetchReadingListData()
  }, [])

  const fetchWatchlistData = async () => {
    try {
      setLoading(true)
      const response = await api.getWatchlist() as any
      setWatchlistData(response.items || [])
    } catch (err) {
      setError("Failed to fetch watchlist")
      console.error("Failed to fetch watchlist:", err)
    } finally {
      setLoading(false)
    }
  }

  const fetchReadingListData = async () => {
    try {
      const response = await api.getReadingList() as any
      setReadingListData(response.items || [])
    } catch (err) {
      console.error("Failed to fetch reading list:", err)
    }
  }

  const handleRemoveFromWatchlist = async (animeId: string) => {
    try {
      await api.removeFromWatchlist(animeId)
      toast({
        title: "Removed from Watchlist",
        description: "Anime has been removed from your watchlist.",
      })
      fetchWatchlistData() // Refresh data
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to remove anime from watchlist.",
        variant: "destructive",
      })
    }
  }

  const getFilteredWatchlist = () => {
    return watchlistData.filter(item => {
      if (activeTab === "watching") return item.status === "watching"
      if (activeTab === "completed") return item.status === "completed"
      return false
    })
  }

  const getFilteredReadingList = () => {
    return readingListData.filter(item => {
      if (activeTab === "reading") return item.status === "reading"
      if (activeTab === "completed") return item.status === "completed"
      return false
    })
  }

  const getProgress = (item: WatchlistItem) => {
    // This would need to be fetched from anime progress data
    // For now, returning a placeholder
    return 0
  }

  const getStats = () => {
    const watchingCount = watchlistData.filter(item => item.status === "watching").length
    const readingCount = readingListData.filter(item => item.status === "reading").length
    const completedCount = [...watchlistData, ...readingListData].filter(item => item.status === "completed").length

    return { watchingCount, readingCount, completedCount }
  }

  const stats = getStats()

  const renderWatchlistItem = (item: WatchlistItem) => {
    const progress = getProgress(item)
    const episodeCount = Array.isArray(item.anime.episodes) ? item.anime.episodes.length : item.anime.episodes

    return (
      <div key={item.id} className="relative group">
        <AnimeCard 
          id={item.anime.id}
          title={item.anime.title}
          image={item.anime.coverImage}
          rating={item.anime.rating}
          genre={[]} // Would need to be fetched from anime data
          episodes={item.anime.episodes}
          status={item.anime.status as any}
          year={new Date().getFullYear()} // Would need to be fetched from anime data
        />

        {/* Progress Overlay */}
        {activeTab !== "completed" && (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-white">
                <span>Episode 0/{episodeCount}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-1" />
            </div>
          </div>
        )}

        {/* Remove Button */}
        <Button
          size="sm"
          variant="destructive"
          className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => handleRemoveFromWatchlist(item.anime.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  const renderReadingListItem = (item: ReadingListItem) => {
    return (
      <div key={item.id} className="relative group">
        <MangaCard 
          id={item.manga.id}
          title={item.manga.title}
          image={item.manga.coverImage}
          rating={item.manga.rating}
          genre={[]} // Would need to be fetched from manga data
          chapters={item.manga.chapters}
          status={item.manga.status as any}
          year={new Date().getFullYear()} // Would need to be fetched from manga data
        />

        {/* Progress Overlay */}
        {activeTab !== "completed" && (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-white">
                <span>Chapter 0/{item.manga.chapters}</span>
                <span>0%</span>
              </div>
              <Progress value={0} className="h-1" />
            </div>
          </div>
        )}

        {/* Remove Button */}
        <Button
          size="sm"
          variant="destructive"
          className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-gray-400">Loading watchlist...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-400">
          <p>{error}</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-8">
        <BarChart3 className="h-8 w-8 text-primary" />
        <h1 className="text-4xl font-bold">My Watchlist</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-card border rounded-xl p-6 text-center">
          <Play className="h-8 w-8 text-primary mx-auto mb-2" />
          <h3 className="text-2xl font-bold">{stats.watchingCount}</h3>
          <p className="text-muted-foreground">Currently Watching</p>
        </div>
        <div className="bg-card border rounded-xl p-6 text-center">
          <BookOpen className="h-8 w-8 text-primary mx-auto mb-2" />
          <h3 className="text-2xl font-bold">{stats.readingCount}</h3>
          <p className="text-muted-foreground">Currently Reading</p>
        </div>
        <div className="bg-card border rounded-xl p-6 text-center">
          <CheckCircle className="h-8 w-8 text-primary mx-auto mb-2" />
          <h3 className="text-2xl font-bold">{stats.completedCount}</h3>
          <p className="text-muted-foreground">Completed</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-8 bg-muted p-1 rounded-lg w-fit">
        <Button
          variant={activeTab === "watching" ? "default" : "ghost"}
          onClick={() => setActiveTab("watching")}
          className="flex items-center space-x-2"
        >
          <Play className="h-4 w-4" />
          <span>Watching ({stats.watchingCount})</span>
        </Button>
        <Button
          variant={activeTab === "reading" ? "default" : "ghost"}
          onClick={() => setActiveTab("reading")}
          className="flex items-center space-x-2"
        >
          <BookOpen className="h-4 w-4" />
          <span>Reading ({stats.readingCount})</span>
        </Button>
        <Button
          variant={activeTab === "completed" ? "default" : "ghost"}
          onClick={() => setActiveTab("completed")}
          className="flex items-center space-x-2"
        >
          <CheckCircle className="h-4 w-4" />
          <span>Completed ({stats.completedCount})</span>
        </Button>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {activeTab === "watching" && getFilteredWatchlist().map(renderWatchlistItem)}
        {activeTab === "reading" && getFilteredReadingList().map(renderReadingListItem)}
        {activeTab === "completed" && (
          <>
            {getFilteredWatchlist().map(renderWatchlistItem)}
            {getFilteredReadingList().map(renderReadingListItem)}
          </>
        )}
      </div>

      {/* Empty State */}
      {((activeTab === "watching" && getFilteredWatchlist().length === 0) ||
        (activeTab === "reading" && getFilteredReadingList().length === 0) ||
        (activeTab === "completed" && getFilteredWatchlist().length === 0 && getFilteredReadingList().length === 0)) && (
        <div className="text-center py-12">
          {activeTab === "watching" && <Play className="h-16 w-16 text-muted-foreground mx-auto mb-4" />}
          {activeTab === "reading" && <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />}
          {activeTab === "completed" && <CheckCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />}
          <h3 className="text-xl font-semibold mb-2">
            {activeTab === "watching" && "No anime in your watchlist"}
            {activeTab === "reading" && "No manga in your reading list"}
            {activeTab === "completed" && "No completed series yet"}
          </h3>
          <p className="text-muted-foreground mb-4">
            {activeTab === "watching" && "Start watching some anime to see them here"}
            {activeTab === "reading" && "Start reading some manga to see them here"}
            {activeTab === "completed" && "Complete some series to see them here"}
          </p>
          <Button>
            {activeTab === "watching" && "Browse Anime"}
            {activeTab === "reading" && "Browse Manga"}
            {activeTab === "completed" && "Browse Library"}
          </Button>
        </div>
      )}
    </div>
  )
}
