"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { MangaReaderChat } from "@/components/manga-reader-chat"
import { ChevronLeft, ChevronRight, Settings, Bookmark, ArrowLeft } from "lucide-react"
import api from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface ChapterPage {
  page: number
  url: string
}

interface Chapter {
  id: string
  title: string
  chapter: string
  pages: ChapterPage[]
  totalPages: number
}

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
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [currentPage, setCurrentPage] = useState(1)
  const [chapter, setChapter] = useState<Chapter | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchChapter = async () => {
      try {
        setLoading(true)
        const mangaId = params.id as string
        const chapterNumber = params.chapter as string
        const response = await api.getChapterContent(mangaId, chapterNumber)
        setChapter(response)
      } catch (error) {
        console.error("Failed to fetch chapter:", error)
        toast({
          title: "Error",
          description: "Failed to load chapter. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchChapter()
  }, [params.id, params.chapter])

  const nextPage = () => {
    if (chapter && currentPage < chapter.totalPages) {
      setCurrentPage((prev) => prev + 1)
    }
  }

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1)
    }
  }

  const goBack = () => {
    router.push(`/manga/${params.id}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-primary animate-spin rounded-full" />
          <p className="mt-4">Loading chapter...</p>
        </div>
      </div>
    )
  }

  if (!chapter) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl mb-4">Failed to load chapter</p>
          <Button onClick={goBack}>Go Back</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-30 bg-black/80 backdrop-blur-sm border-b border-white/10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" onClick={goBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="font-bold">{chapter.title}</h1>
              <p className="text-sm text-muted-foreground">
                Page {currentPage} of {chapter.totalPages}
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
              src={chapter.pages[currentPage - 1]?.url || "/placeholder.svg?height=800&width=600&text=Loading..."}
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
              disabled={currentPage === chapter.totalPages}
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
            disabled={currentPage === chapter.totalPages}
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
              style={{ width: `${(currentPage / chapter.totalPages) * 100}%` }}
            />
          </div>
          <div className="flex justify-between text-sm text-muted-foreground mt-2">
            <span>Chapter {chapter.chapter}</span>
            <span>
              {currentPage} / {chapter.totalPages}
            </span>
          </div>
        </div>
      </div>

      {/* Character Chat Integration */}
      <MangaReaderChat currentPage={currentPage} totalPages={chapter.totalPages} character={character} />
    </div>
  )
}
