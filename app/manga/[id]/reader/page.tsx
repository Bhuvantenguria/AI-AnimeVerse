"use client"

import { useState, useEffect } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { MangaReaderChat } from "@/components/manga-reader-chat"
import { ArrowLeft, ArrowRight, RotateCcw, ZoomIn, ZoomOut } from "lucide-react"
import api from '@/lib/api'
import Image from 'next/image'
import Link from 'next/link'

interface Page {
  number: number
  url: string
  filename: string
}

interface ChapterData {
  chapter: string
  title?: string
  pages: Page[]
  total: number
  source?: string
  externalUrl?: string
  message?: string
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
  const searchParams = useSearchParams()
  const mangaId = params.id as string
  const chapter = searchParams.get('chapter') || '1'
  
  const [chapterData, setChapterData] = useState<ChapterData | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [imageLoading, setImageLoading] = useState(true)
  const [zoom, setZoom] = useState(1)
  const [showNavigation, setShowNavigation] = useState(true)
  
  // Default character for chat
  const character = {
    id: "manga-reader-guide",
    name: "Manga Reader",
    avatar: "/placeholder.svg?height=40&width=40",
    anime: "Manga Guide",
    theme: "neutral",
    status: "active",
    personality: ["A friendly guide who loves discussing manga chapters and story developments."]
  }

  useEffect(() => {
    const fetchChapterData = async () => {
      try {
        setLoading(true)
        setError(null)
        console.log(`🔍 Fetching chapter data for manga: ${mangaId}, chapter: ${chapter}`)
        
        const response = await api.getChapterContent(mangaId, chapter) as any
        console.log('📊 Chapter response:', response)
        
        if (response) {
          // Set the chapter data regardless of type
          setChapterData(response)
          setCurrentPage(1)
          
          if (response.source === 'external' && response.externalUrl) {
            console.log(`📖 External chapter loaded: ${response.externalUrl}`)
          } else if (response.pages && response.pages.length > 0) {
            console.log(`✅ Successfully loaded ${response.pages.length} pages from ${response.source || 'API'}`)
          } else {
            console.error('❌ API returned empty or invalid response')
            setError(response.message || 'No chapter content available')
          }
        } else {
          console.error('❌ API returned empty or invalid response')
          setError('No chapter content available')
        }
      } catch (error) {
        console.error('❌ Error fetching chapter:', error)
        setError('Failed to load chapter content')
      } finally {
        setLoading(false)
      }
    }

    if (mangaId && chapter) {
      fetchChapterData()
    }
  }, [mangaId, chapter])

  const nextPage = () => {
    if (chapterData && currentPage < chapterData.total) {
      setCurrentPage(currentPage + 1)
      setImageLoading(true)
    }
  }

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
      setImageLoading(true)
    }
  }

  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight') nextPage()
    if (e.key === 'ArrowLeft') prevPage()
    if (e.key === 'Escape') setShowNavigation(!showNavigation)
  }

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [currentPage, chapterData])



  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading chapter {chapter}...</p>
        </div>
      </div>
    )
  }

  if (!chapterData) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-xl mb-4">Chapter not available</p>
          <Link 
            href={`/manga/${mangaId}`}
            className="text-blue-400 hover:text-blue-300"
          >
            ← Back to manga
          </Link>
        </div>
      </div>
    )
  }

  const currentPageData = chapterData.pages && chapterData.pages.length > 0 ? chapterData.pages[currentPage - 1] : null

  return (
    <div className="min-h-screen bg-black relative">
      {/* Navigation Header */}
      {showNavigation && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-sm p-4">
          <div className="flex items-center justify-between">
            <Link 
              href={`/manga/${mangaId}`}
              className="flex items-center text-white hover:text-gray-300 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Manga
            </Link>
            
            <div className="flex items-center space-x-4">
              <span className="text-white text-lg">
                {chapterData.title || `Chapter ${chapterData.chapter}`}
              </span>
              
              {/* Show zoom controls only for image chapters */}
              {chapterData.source !== 'external' && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
                    className="p-2 text-white hover:text-gray-300 transition-colors"
                  >
                    <ZoomOut className="w-5 h-5" />
                  </button>
                  <span className="text-white text-sm">{Math.round(zoom * 100)}%</span>
                  <button
                    onClick={() => setZoom(Math.min(3, zoom + 0.1))}
                    className="p-2 text-white hover:text-gray-300 transition-colors"
                  >
                    <ZoomIn className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setZoom(1)}
                    className="p-2 text-white hover:text-gray-300 transition-colors"
                  >
                    <RotateCcw className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Content Area */}
      {chapterData.source === 'external' && chapterData.externalUrl ? (
        /* External Chapter - Iframe */
        <div className="w-full h-screen pt-20">
          <div className="bg-gray-800 text-white p-4 text-center">
            <p className="text-sm opacity-75 mb-2">
              This chapter is hosted on an external site
            </p>
            <a 
              href={chapterData.externalUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline"
            >
              Open in new tab if iframe doesn't work →
            </a>
          </div>
          <iframe
            src={chapterData.externalUrl}
            className="w-full h-full border-0"
            title={`Chapter ${chapterData.chapter}`}
            allowFullScreen
            sandbox="allow-scripts allow-same-origin allow-forms"
          />
        </div>
      ) : (
        /* Regular Chapter - Image Pages */
        <div className="flex items-center justify-center min-h-screen pt-20">
          <div className="relative max-w-4xl">
            {imageLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              </div>
            )}
            
            {currentPageData && (
              <Image
                src={currentPageData.url}
                alt={`Page ${currentPage}`}
                width={800}
                height={1200}
                className="max-w-full h-auto"
                style={{ 
                  transform: `scale(${zoom})`,
                  transformOrigin: 'center'
                }}
                onLoad={() => setImageLoading(false)}
                onError={() => setImageLoading(false)}
                priority
              />
            )}
          </div>
        </div>
      )}

      {/* Navigation Controls - Only for image chapters */}
      {showNavigation && chapterData.source !== 'external' && chapterData.pages && chapterData.pages.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-sm p-4">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            <button
              onClick={prevPage}
              disabled={currentPage === 1}
              className="flex items-center px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Previous
            </button>
            
            <div className="flex items-center space-x-4">
              <span className="text-white text-lg font-medium">
                Page {currentPage} of {chapterData.total}
              </span>
              <div className="flex items-center space-x-2">
                <input
                  type="range"
                  min="1"
                  max={chapterData.total}
                  value={currentPage}
                  onChange={(e) => {
                    setCurrentPage(parseInt(e.target.value))
                    setImageLoading(true)
                  }}
                  className="w-32"
                />
              </div>
            </div>
            
            <button
              onClick={nextPage}
              disabled={currentPage === chapterData.total}
              className="flex items-center px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
              <ArrowRight className="w-5 h-5 ml-2" />
            </button>
          </div>
        </div>
      )}

      {/* Click areas for navigation - Only for image chapters */}
      {chapterData.source !== 'external' && chapterData.pages && chapterData.pages.length > 0 && (
        <div className="fixed inset-0 flex z-40">
          <div 
            className="flex-1 cursor-pointer"
            onClick={prevPage}
            title="Previous page"
          />
          <div 
            className="flex-1 cursor-pointer"
            onClick={nextPage}
            title="Next page"
          />
        </div>
      )}

      {/* Toggle navigation visibility */}
      <button
        onClick={() => setShowNavigation(!showNavigation)}
        className="fixed top-4 right-4 z-50 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
      >
        {showNavigation ? '×' : '☰'}
      </button>

      {/* Character Chat Integration */}
      <MangaReaderChat 
        currentPage={currentPage} 
        totalPages={chapterData.total} 
        character={character}
      />
    </div>
  )
}

