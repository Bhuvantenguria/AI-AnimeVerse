"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { MangaReaderChat } from "@/components/manga-reader-chat"
import { ChevronLeft, ChevronRight, Settings, Bookmark } from "lucide-react"

const character = {
  id: "luffy",
  name: "Monkey D. Luffy",
  avatar: "/placeholder.svg?height=60&width=60",
  anime: "One Piece",
  theme: "pirate",
  status: "Ready to explain the story! 🏴‍☠️",
  personality: ["Cheerful", "Brave", "Loyal", "Hungry"],
}

export default function MangaReaderPage() {
  const [currentPage, setCurrentPage] = useState(1)
  const totalPages = 20

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1)
    }
  }

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-30 bg-black/80 backdrop-blur-sm border-b border-white/10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="font-bold">One Piece - Chapter 1100</h1>
              <p className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="icon">
              <Bookmark className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Reader */}
      <div className="pt-16 min-h-screen flex items-center justify-center">
        <div className="relative max-w-4xl w-full mx-auto">
          {/* Manga Page */}
          <div className="relative aspect-[3/4] bg-white rounded-lg overflow-hidden shadow-2xl animate-scale-in">
            <img
              src={`/placeholder.svg?height=800&width=600&text=Page ${currentPage}`}
              alt={`Page ${currentPage}`}
              className="w-full h-full object-cover"
            />

            {/* Navigation Overlays */}
            <button
              className="absolute left-0 top-0 w-1/3 h-full bg-transparent hover:bg-black/10 transition-colors"
              onClick={prevPage}
              disabled={currentPage === 1}
            />
            <button
              className="absolute right-0 top-0 w-1/3 h-full bg-transparent hover:bg-black/10 transition-colors"
              onClick={nextPage}
              disabled={currentPage === totalPages}
            />
          </div>

          {/* Navigation Buttons */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
            onClick={prevPage}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
            onClick={nextPage}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-black/80 backdrop-blur-sm border-t border-white/10 p-4">
        <div className="container mx-auto">
          <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-300"
              style={{ width: `${(currentPage / totalPages) * 100}%` }}
            />
          </div>
          <div className="flex justify-between text-sm text-muted-foreground mt-2">
            <span>Chapter 1100</span>
            <span>
              {currentPage} / {totalPages}
            </span>
          </div>
        </div>
      </div>

      {/* Character Chat Integration */}
      <MangaReaderChat currentPage={currentPage} totalPages={totalPages} character={character} />
    </div>
  )
}
