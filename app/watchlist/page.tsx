"use client"

import { useState } from "react"
import { AnimeCard } from "@/components/anime-card"
import { MangaCard } from "@/components/manga-card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { BarChart3, Play, BookOpen, CheckCircle, Trash2 } from "lucide-react"

// Mock watchlist data
const watchlistData = {
  watching: [
    {
      id: "1",
      title: "One Piece: Wano Arc",
      image: "/placeholder.svg?height=400&width=300",
      rating: 9.1,
      genre: ["Adventure", "Comedy"],
      episodes: 150,
      currentEpisode: 45,
      status: "ongoing" as const,
      year: 2024,
      type: "anime" as const,
    },
    {
      id: "2",
      title: "Demon Slayer: Hashira Training",
      image: "/placeholder.svg?height=400&width=300",
      rating: 8.9,
      genre: ["Action", "Supernatural"],
      episodes: 12,
      currentEpisode: 8,
      status: "ongoing" as const,
      year: 2024,
      type: "anime" as const,
    },
  ],
  reading: [
    {
      id: "3",
      title: "Jujutsu Kaisen",
      image: "/placeholder.svg?height=400&width=300",
      rating: 8.8,
      genre: ["Action", "Supernatural"],
      chapters: 250,
      currentChapter: 180,
      status: "ongoing" as const,
      year: 2018,
      type: "manga" as const,
    },
  ],
  completed: [
    {
      id: "4",
      title: "Attack on Titan",
      image: "/placeholder.svg?height=400&width=300",
      rating: 9.2,
      genre: ["Action", "Drama"],
      episodes: 87,
      status: "completed" as const,
      year: 2013,
      type: "anime" as const,
    },
  ],
}

export default function WatchlistPage() {
  const [activeTab, setActiveTab] = useState<"watching" | "reading" | "completed">("watching")

  const getProgress = (item: any) => {
    if (item.type === "anime" && item.currentEpisode) {
      return (item.currentEpisode / item.episodes) * 100
    }
    if (item.type === "manga" && item.currentChapter) {
      return (item.currentChapter / item.chapters) * 100
    }
    return 100
  }

  const renderItem = (item: any) => {
    const progress = getProgress(item)

    return (
      <div key={item.id} className="relative group">
        {item.type === "anime" ? <AnimeCard {...item} /> : <MangaCard {...item} />}

        {/* Progress Overlay */}
        {activeTab !== "completed" && (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-white">
                <span>
                  {item.type === "anime"
                    ? `Episode ${item.currentEpisode}/${item.episodes}`
                    : `Chapter ${item.currentChapter}/${item.chapters}`}
                </span>
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
        >
          <Trash2 className="h-4 w-4" />
        </Button>
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
          <h3 className="text-2xl font-bold">{watchlistData.watching.length}</h3>
          <p className="text-muted-foreground">Currently Watching</p>
        </div>
        <div className="bg-card border rounded-xl p-6 text-center">
          <BookOpen className="h-8 w-8 text-primary mx-auto mb-2" />
          <h3 className="text-2xl font-bold">{watchlistData.reading.length}</h3>
          <p className="text-muted-foreground">Currently Reading</p>
        </div>
        <div className="bg-card border rounded-xl p-6 text-center">
          <CheckCircle className="h-8 w-8 text-primary mx-auto mb-2" />
          <h3 className="text-2xl font-bold">{watchlistData.completed.length}</h3>
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
          <span>Watching ({watchlistData.watching.length})</span>
        </Button>
        <Button
          variant={activeTab === "reading" ? "default" : "ghost"}
          onClick={() => setActiveTab("reading")}
          className="flex items-center space-x-2"
        >
          <BookOpen className="h-4 w-4" />
          <span>Reading ({watchlistData.reading.length})</span>
        </Button>
        <Button
          variant={activeTab === "completed" ? "default" : "ghost"}
          onClick={() => setActiveTab("completed")}
          className="flex items-center space-x-2"
        >
          <CheckCircle className="h-4 w-4" />
          <span>Completed ({watchlistData.completed.length})</span>
        </Button>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {activeTab === "watching" && watchlistData.watching.map(renderItem)}
        {activeTab === "reading" && watchlistData.reading.map(renderItem)}
        {activeTab === "completed" && watchlistData.completed.map(renderItem)}
      </div>

      {/* Empty State */}
      {((activeTab === "watching" && watchlistData.watching.length === 0) ||
        (activeTab === "reading" && watchlistData.reading.length === 0) ||
        (activeTab === "completed" && watchlistData.completed.length === 0)) && (
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
