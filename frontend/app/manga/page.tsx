"use client"

import { useState } from "react"
import { MangaCard } from "@/components/manga-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Grid3X3, List, SortAsc, BookOpen } from "lucide-react"

// Mock manga data
const mangaList = [
  {
    id: "1",
    title: "One Piece",
    image: "/placeholder.svg?height=400&width=300",
    rating: 9.3,
    genre: ["Adventure", "Comedy", "Drama"],
    chapters: 1100,
    status: "ongoing" as const,
    year: 1997,
  },
  {
    id: "2",
    title: "Attack on Titan",
    image: "/placeholder.svg?height=400&width=300",
    rating: 9.1,
    genre: ["Action", "Drama", "Fantasy"],
    chapters: 139,
    status: "completed" as const,
    year: 2009,
  },
  {
    id: "3",
    title: "Demon Slayer",
    image: "/placeholder.svg?height=400&width=300",
    rating: 8.9,
    genre: ["Action", "Supernatural", "Historical"],
    chapters: 205,
    status: "completed" as const,
    year: 2016,
  },
  {
    id: "4",
    title: "Jujutsu Kaisen",
    image: "/placeholder.svg?height=400&width=300",
    rating: 8.8,
    genre: ["Action", "Supernatural", "School"],
    chapters: 250,
    status: "ongoing" as const,
    year: 2018,
  },
  {
    id: "5",
    title: "My Hero Academia",
    image: "/placeholder.svg?height=400&width=300",
    rating: 8.5,
    genre: ["Action", "School", "Superhero"],
    chapters: 400,
    status: "ongoing" as const,
    year: 2014,
  },
  {
    id: "6",
    title: "Chainsaw Man",
    image: "/placeholder.svg?height=400&width=300",
    rating: 8.9,
    genre: ["Action", "Horror", "Supernatural"],
    chapters: 180,
    status: "ongoing" as const,
    year: 2018,
  },
]

const genres = ["Action", "Adventure", "Comedy", "Drama", "Fantasy", "Horror", "Romance", "School", "Supernatural"]

export default function MangaPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedGenres, setSelectedGenres] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [sortBy, setSortBy] = useState("popularity")

  const toggleGenre = (genre: string) => {
    setSelectedGenres((prev) => (prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]))
  }

  const filteredManga = mangaList.filter((manga) => {
    const matchesSearch = manga.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesGenre = selectedGenres.length === 0 || selectedGenres.some((genre) => manga.genre.includes(genre))
    return matchesSearch && matchesGenre
  })

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-8">
        <BookOpen className="h-8 w-8 text-primary" />
        <h1 className="text-4xl font-bold">Manga Library</h1>
      </div>

      {/* Search and Filters */}
      <div className="mb-8 space-y-4">
        {/* Search Bar */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search manga..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Genre Filters */}
        <div className="flex flex-wrap gap-2">
          {genres.map((genre) => (
            <Badge
              key={genre}
              variant={selectedGenres.includes(genre) ? "default" : "outline"}
              className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
              onClick={() => toggleGenre(genre)}
            >
              {genre}
            </Badge>
          ))}
        </div>

        {/* View Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button variant={viewMode === "grid" ? "default" : "outline"} size="sm" onClick={() => setViewMode("grid")}>
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button variant={viewMode === "list" ? "default" : "outline"} size="sm" onClick={() => setViewMode("list")}>
              <List className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center space-x-2">
            <SortAsc className="h-4 w-4 text-muted-foreground" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-background border border-border rounded px-3 py-1 text-sm"
            >
              <option value="popularity">Popularity</option>
              <option value="rating">Rating</option>
              <option value="year">Year</option>
              <option value="title">Title</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="mb-4">
        <p className="text-muted-foreground">
          Showing {filteredManga.length} manga
          {selectedGenres.length > 0 && <span> in {selectedGenres.join(", ")}</span>}
        </p>
      </div>

      {/* Manga Grid/List */}
      <div
        className={
          viewMode === "grid"
            ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6"
            : "space-y-4"
        }
      >
        {filteredManga.map((manga, index) => (
          <MangaCard
            key={manga.id}
            {...manga}
            className={`animate-slide-in-up ${viewMode === "list" ? "flex-row max-w-none" : ""}`}
            style={{ animationDelay: `${index * 0.05}s` } as any}
          />
        ))}
      </div>

      {filteredManga.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No manga found</h3>
          <p className="text-muted-foreground">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  )
}
