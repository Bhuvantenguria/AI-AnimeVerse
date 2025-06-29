"use client"

import { useState, useEffect } from "react"
import { AnimeCard } from "@/components/anime-card"
import { MangaCard } from "@/components/manga-card"
import { MangaFlipCard } from "@/components/manga-flip-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Grid3X3, List, SortAsc, Filter, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface GridItem {
  id: string
  title: string
  image: string
  rating: number
  genre: string[]
  year: number
  status: "ongoing" | "completed"
  description: string
  type: "anime" | "manga"
  episodes?: number
  chapters?: number
}

interface InteractiveGridProps {
  items: GridItem[]
  type: "anime" | "manga"
  enableFlipCards?: boolean
}

export function InteractiveGrid({ items, type, enableFlipCards = false }: InteractiveGridProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedGenres, setSelectedGenres] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [sortBy, setSortBy] = useState("popularity")
  const [filteredItems, setFilteredItems] = useState(items)
  const [isLoading, setIsLoading] = useState(false)

  const allGenres = Array.from(new Set(items.flatMap((item) => item.genre)))

  useEffect(() => {
    setIsLoading(true)
    const timer = setTimeout(() => {
      const filtered = items.filter((item) => {
        const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesGenre = selectedGenres.length === 0 || selectedGenres.some((genre) => item.genre.includes(genre))
        return matchesSearch && matchesGenre
      })

      // Sort items
      const sorted = [...filtered].sort((a, b) => {
        switch (sortBy) {
          case "rating":
            return b.rating - a.rating
          case "year":
            return b.year - a.year
          case "title":
            return a.title.localeCompare(b.title)
          default:
            return 0
        }
      })

      setFilteredItems(sorted)
      setIsLoading(false)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm, selectedGenres, sortBy, items])

  const toggleGenre = (genre: string) => {
    setSelectedGenres((prev) => (prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]))
  }

  const clearFilters = () => {
    setSearchTerm("")
    setSelectedGenres([])
  }

  const renderItem = (item: GridItem, index: number) => {
    const baseProps = {
      key: item.id,
      className: cn("animate-scale-in", viewMode === "list" && "flex-row max-w-none"),
      style: { animationDelay: `${index * 0.05}s` } as any,
    }

    if (type === "manga" && enableFlipCards) {
      return (
        <MangaFlipCard
          {...baseProps}
          id={item.id}
          title={item.title}
          image={item.image}
          rating={item.rating}
          genre={item.genre}
          chapters={item.chapters || 0}
          status={item.status}
          year={item.year}
          description={item.description}
        />
      )
    }

    if (type === "anime") {
      return (
        <AnimeCard
          {...baseProps}
          id={item.id}
          title={item.title}
          image={item.image}
          rating={item.rating}
          genre={item.genre}
          episodes={item.episodes || 0}
          status={item.status}
          year={item.year}
        />
      )
    }

    return (
      <MangaCard
        {...baseProps}
        id={item.id}
        title={item.title}
        image={item.image}
        rating={item.rating}
        genre={item.genre}
        chapters={item.chapters || 0}
        status={item.status}
        year={item.year}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={`Search ${type}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 animate-slide-in-left"
          />
        </div>

        {/* Genre Filters */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Genres</span>
            </div>
            {selectedGenres.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {allGenres.map((genre, index) => (
              <Badge
                key={genre}
                variant={selectedGenres.includes(genre) ? "default" : "outline"}
                className={cn(
                  "cursor-pointer hover:bg-primary hover:text-primary-foreground transition-all duration-200 animate-bounce-in",
                  selectedGenres.includes(genre) && "animate-pulse-glow",
                )}
                style={{ animationDelay: `${index * 0.05}s` }}
                onClick={() => toggleGenre(genre)}
              >
                {genre}
              </Badge>
            ))}
          </div>
        </div>

        {/* View Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="animate-slide-in-left"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="animate-slide-in-left"
              style={{ animationDelay: "0.1s" }}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center space-x-2 animate-slide-in-right">
            <SortAsc className="h-4 w-4 text-muted-foreground" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-background border border-border rounded px-3 py-1 text-sm focus:ring-2 focus:ring-primary"
            >
              <option value="popularity">Popularity</option>
              <option value="rating">Rating</option>
              <option value="year">Year</option>
              <option value="title">Title</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="animate-slide-in-up">
        <p className="text-muted-foreground">
          Showing {filteredItems.length} {type}
          {selectedGenres.length > 0 && <span> in {selectedGenres.join(", ")}</span>}
        </p>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {Array.from({ length: 10 }).map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="aspect-[3/4] bg-muted rounded-xl mb-4 skeleton" />
              <div className="h-4 bg-muted rounded mb-2 skeleton" />
              <div className="h-3 bg-muted rounded w-2/3 skeleton" />
            </div>
          ))}
        </div>
      )}

      {/* Grid/List */}
      {!isLoading && (
        <div
          className={cn(
            "transition-all duration-500",
            viewMode === "grid"
              ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6"
              : "space-y-4",
          )}
        >
          {filteredItems.map(renderItem)}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredItems.length === 0 && (
        <div className="text-center py-12 animate-scale-in">
          <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No {type} found</h3>
          <p className="text-muted-foreground mb-4">Try adjusting your search or filters</p>
          <Button onClick={clearFilters}>Clear Filters</Button>
        </div>
      )}
    </div>
  )
}
