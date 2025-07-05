"use client"

import { useState, useEffect } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { MangaReaderChat } from "@/components/manga-reader-chat"
import { MangaChatPanel } from "@/components/manga-chat-panel"
import { ArrowLeft, ArrowRight, MessageCircle, Volume2, VolumeX, Play, Pause, RotateCw } from "lucide-react"
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
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set())
  const [showNavigation, setShowNavigation] = useState(true)
  const [readingMode, setReadingMode] = useState<'single' | 'scroll'>('scroll') // Default to scroll mode
  const [theme, setTheme] = useState<'dark' | 'sepia' | 'light' | 'midnight'>('dark')
  const [showChatPanel, setShowChatPanel] = useState(false)
  const [isNarrationPlaying, setIsNarrationPlaying] = useState(false)
  const [narrationAudio, setNarrationAudio] = useState<HTMLAudioElement | null>(null)
  const [mangaTitle, setMangaTitle] = useState<string>('')
  
  // Theme configurations
  const themes = {
    dark: {
      bg: 'bg-gradient-to-br from-gray-900 via-black to-gray-900',
      navBg: 'bg-black/95',
      cardBg: 'bg-gradient-to-br from-gray-800/50 to-gray-900/50',
      text: 'text-white',
      textSecondary: 'text-gray-400',
      accent: 'from-orange-400 to-purple-400',
      accentHover: 'hover:from-orange-500 hover:to-purple-500',
      border: 'border-gray-700/50',
      borderHover: 'hover:border-orange-500/30'
    },
    sepia: {
      bg: 'bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50',
      navBg: 'bg-amber-100/95',
      cardBg: 'bg-gradient-to-br from-amber-100/50 to-orange-100/50',
      text: 'text-amber-900',
      textSecondary: 'text-amber-700',
      accent: 'from-amber-600 to-orange-600',
      accentHover: 'hover:from-amber-700 hover:to-orange-700',
      border: 'border-amber-200/50',
      borderHover: 'hover:border-amber-400/30'
    },
    light: {
      bg: 'bg-gradient-to-br from-gray-50 via-white to-gray-100',
      navBg: 'bg-white/95',
      cardBg: 'bg-gradient-to-br from-white/50 to-gray-50/50',
      text: 'text-gray-900',
      textSecondary: 'text-gray-600',
      accent: 'from-blue-600 to-purple-600',
      accentHover: 'hover:from-blue-700 hover:to-purple-700',
      border: 'border-gray-200/50',
      borderHover: 'hover:border-blue-400/30'
    },
    midnight: {
      bg: 'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900',
      navBg: 'bg-slate-900/95',
      cardBg: 'bg-gradient-to-br from-slate-800/50 to-purple-900/50',
      text: 'text-white',
      textSecondary: 'text-slate-300',
      accent: 'from-purple-400 to-pink-400',
      accentHover: 'hover:from-purple-500 hover:to-pink-500',
      border: 'border-slate-700/50',
      borderHover: 'hover:border-purple-500/30'
    }
  }

  const currentTheme = themes[theme]

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
    }
  }

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const handleImageLoad = (pageNumber: number) => {
    setLoadedImages(prev => new Set([...prev, pageNumber]))
  }

  const handleKeyPress = (e: KeyboardEvent) => {
    if (readingMode === 'single') {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault()
        nextPage()
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        prevPage()
      }
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      setShowNavigation(!showNavigation)
    }
  }

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [currentPage, chapterData, readingMode])



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
    <div className={`min-h-screen ${currentTheme.bg} relative overflow-hidden transition-all duration-500`}>
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-10">
        <div className={`absolute top-0 left-0 w-full h-full bg-gradient-to-r ${currentTheme.accent}/20 via-transparent ${currentTheme.accent}/20 animate-pulse`}></div>
      </div>

      {/* Mobile-Responsive Navigation Header */}
      {showNavigation && (
        <div className={`fixed top-0 left-0 right-0 z-50 ${currentTheme.navBg} backdrop-blur-md border-b ${currentTheme.border} transition-all duration-300`}>
          <div className="flex items-center justify-between px-3 md:px-6 py-3 md:py-4">
            <Link 
              href={`/manga/${mangaId}`}
              className={`flex items-center ${currentTheme.text} hover:bg-gradient-to-r ${currentTheme.accent} hover:bg-clip-text hover:text-transparent transition-all duration-300 group`}
            >
              <ArrowLeft className="w-4 h-4 md:w-5 md:h-5 mr-1 md:mr-2 group-hover:translate-x-[-2px] transition-transform" />
              <span className="font-medium text-sm md:text-base">
                <span className="hidden sm:inline">Back to Manga</span>
                <span className="sm:hidden">Back</span>
              </span>
            </Link>
            
            <div className="flex items-center space-x-2 md:space-x-6">
              {/* Chapter Title - Responsive */}
              <div className="text-center hidden sm:block">
                <h2 className={`text-lg md:text-xl font-bold bg-gradient-to-r ${currentTheme.accent} bg-clip-text text-transparent`}>
                  {chapterData.title || `Chapter ${chapterData.chapter}`}
                </h2>
                <div className={`${currentTheme.textSecondary} text-xs md:text-sm`}>
                  {chapterData.source === 'external' ? 
                    'External Chapter' : 
                    `${chapterData.pages?.length || 0} pages`
                  } • {chapterData.source || 'MangaDx'}
                </div>
              </div>

              {/* Mobile Chapter Info */}
              <div className="text-center sm:hidden">
                <h2 className={`text-sm font-bold bg-gradient-to-r ${currentTheme.accent} bg-clip-text text-transparent`}>
                  Ch. {chapterData.chapter}
                </h2>
                <div className={`${currentTheme.textSecondary} text-xs`}>
                  {chapterData.source === 'external' ? 'External' : `${chapterData.pages?.length || 0}p`}
                </div>
              </div>

              {/* Theme Toggle - Mobile Dropdown */}
              <div className="flex items-center space-x-1 md:space-x-2">
                <span className={`${currentTheme.textSecondary} text-xs md:text-sm hidden md:inline`}>Theme:</span>
                <select
                  value={theme}
                  onChange={(e) => setTheme(e.target.value as typeof theme)}
                  className={`${currentTheme.cardBg} ${currentTheme.text} ${currentTheme.border} px-2 md:px-3 py-1 rounded-lg backdrop-blur-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-orange-500 text-xs md:text-sm`}
                >
                  <option value="dark">🌙 Dark</option>
                  <option value="sepia">📜 Sepia</option>
                  <option value="light">☀️ Light</option>
                  <option value="midnight">🌌 Midnight</option>
                </select>
              </div>
              
              {/* Reading Mode Toggle - Only for non-external, hidden on mobile for external */}
              {chapterData.source !== 'external' && (
                <div className="hidden md:flex items-center space-x-3">
                  <button
                    onClick={() => setReadingMode(readingMode === 'single' ? 'scroll' : 'single')}
                    className={`relative px-3 md:px-4 py-1 md:py-2 bg-gradient-to-r ${currentTheme.accent} text-white rounded-lg ${currentTheme.accentHover} transition-all duration-300 shadow-lg hover:shadow-orange-500/25 group text-xs md:text-sm`}
                  >
                    <span className="relative z-10 font-medium">
                      <span className="hidden lg:inline">
                        {readingMode === 'single' ? '📜 Scroll Mode' : '📄 Single Page'}
                      </span>
                      <span className="lg:hidden">
                        {readingMode === 'single' ? '📜' : '📄'}
                      </span>
                    </span>
                    <div className="absolute inset-0 bg-white/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </button>
                  {readingMode === 'single' && (
                    <div className="text-center hidden lg:block">
                      <div className={`${currentTheme.text} text-sm font-medium`}>
                        Page {currentPage} of {chapterData.total}
                      </div>
                      <div className={`w-16 h-1 ${currentTheme.border} rounded-full mt-1`}>
                        <div 
                          className={`h-full bg-gradient-to-r ${currentTheme.accent} rounded-full transition-all duration-300`}
                          style={{ width: `${(currentPage / chapterData.total) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setShowNavigation(false)}
                className={`${currentTheme.text} md:hidden p-1`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile-Responsive Floating Controls */}
      <div className="fixed right-2 md:right-4 top-1/2 transform -translate-y-1/2 z-40 space-y-2 md:space-y-3">
        {/* Theme Quick Switch - Mobile Optimized */}
        <div className={`${currentTheme.cardBg} backdrop-blur-sm p-1 md:p-2 rounded-xl md:rounded-2xl ${currentTheme.border} shadow-lg`}>
          <div className="grid grid-cols-2 gap-1">
            {Object.entries(themes).map(([themeKey, themeConfig]) => (
              <button
                key={themeKey}
                onClick={() => setTheme(themeKey as typeof theme)}
                className={`w-6 h-6 md:w-8 md:h-8 rounded-md md:rounded-lg transition-all duration-300 ${
                  theme === themeKey 
                    ? `bg-gradient-to-r ${themeConfig.accent} scale-105 md:scale-110 shadow-lg` 
                    : `${themeConfig.cardBg} hover:scale-105`
                }`}
                title={`${themeKey.charAt(0).toUpperCase()}${themeKey.slice(1)} Theme`}
              >
                <span className="text-xs">
                  {themeKey === 'dark' ? '🌙' : 
                   themeKey === 'sepia' ? '📜' : 
                   themeKey === 'light' ? '☀️' : '🌌'}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Navigation Toggle - Mobile Friendly */}
        <button
          onClick={() => setShowNavigation(!showNavigation)}
          className={`${currentTheme.cardBg} backdrop-blur-sm ${currentTheme.text} p-2 md:p-3 rounded-full ${currentTheme.borderHover} transition-all duration-300 shadow-lg hover:scale-110`}
          title="Toggle Navigation"
        >
          {showNavigation ? (
            <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
            </svg>
          ) : (
            <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          )}
        </button>

        {/* Reading Mode Toggle - Hide on Small Screens for External */}
        {chapterData.source !== 'external' && (
          <button
            onClick={() => setReadingMode(readingMode === 'single' ? 'scroll' : 'single')}
            className={`${currentTheme.cardBg} backdrop-blur-sm ${currentTheme.text} p-2 md:p-3 rounded-full ${currentTheme.borderHover} transition-all duration-300 shadow-lg hover:scale-110`}
            title={`Switch to ${readingMode === 'single' ? 'Scroll' : 'Single Page'} Mode`}
          >
            {readingMode === 'single' ? (
              <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            ) : (
              <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            )}
          </button>
        )}

        {/* Keyboard Shortcuts Help - Collapsible on Mobile */}
        <div className={`${currentTheme.cardBg} backdrop-blur-sm ${currentTheme.text} p-2 md:p-3 rounded-xl md:rounded-2xl text-xs ${currentTheme.border} shadow-lg max-w-28 md:max-w-32 transition-all duration-300`}>
          <div className={`font-medium bg-gradient-to-r ${currentTheme.accent} bg-clip-text text-transparent mb-1 md:mb-2 text-center`}>
            <span className="md:hidden">⌨️</span>
            <span className="hidden md:inline">Shortcuts:</span>
          </div>
          <div className="space-y-1 text-xs">
            <div className={`flex justify-between ${currentTheme.textSecondary}`}>
              <span className="hidden md:inline">←/→</span>
              <span className="md:hidden">↔</span>
              <span className="hidden md:inline">Navigate</span>
              <span className="md:hidden">Nav</span>
            </div>
            <div className={`flex justify-between ${currentTheme.textSecondary}`}>
              <span>Esc</span>
              <span className="hidden md:inline">Toggle UI</span>
              <span className="md:hidden">UI</span>
            </div>
            <div className={`flex justify-between ${currentTheme.textSecondary}`}>
              <span className="hidden md:inline">Space</span>
              <span className="md:hidden">⎵</span>
              <span className="hidden md:inline">Next Page</span>
              <span className="md:hidden">Next</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      {chapterData.source === 'external' && chapterData.externalUrl ? (
        /* External Chapter - Professional Layout */
        <div className={`min-h-screen pt-24 pb-20 ${currentTheme.bg}`}>
          <div className="max-w-7xl mx-auto px-4">
            {/* Main Iframe Container */}
            <div className={`${currentTheme.cardBg} rounded-3xl p-6 backdrop-blur-sm ${currentTheme.border} shadow-2xl animate-fade-in`}>
              <div className="relative overflow-hidden rounded-2xl" style={{ height: '80vh' }}>
                {/* Loading Overlay */}
                <div className="absolute inset-0 bg-gray-800/50 flex items-center justify-center z-10 transition-opacity duration-1000" id="iframe-loader">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent mx-auto mb-4"></div>
                    <p className={`${currentTheme.text} text-lg font-medium`}>Loading external chapter...</p>
                    <div className="w-32 h-2 bg-gray-600 rounded-full mt-3 mx-auto">
                      <div className="h-full bg-gradient-to-r from-orange-400 to-purple-500 rounded-full animate-pulse w-3/4"></div>
                    </div>
                  </div>
                </div>

                {/* Iframe */}
                <iframe
                  src={chapterData.externalUrl}
                  className="w-full h-full border-0 rounded-2xl"
                  title={`Chapter ${chapterData.chapter}`}
                  allowFullScreen
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                  onLoad={() => {
                    const loader = document.getElementById('iframe-loader');
                    if (loader) loader.style.opacity = '0';
                    setTimeout(() => {
                      if (loader) loader.style.display = 'none';
                    }, 1000);
                  }}
                />

                {/* Professional Iframe Controls */}
                <div className="absolute top-4 right-4 z-20 flex space-x-2">
                  <button
                    onClick={() => {
                      const iframe = document.querySelector('iframe') as HTMLIFrameElement;
                      if (iframe.requestFullscreen) iframe.requestFullscreen();
                    }}
                    className={`${currentTheme.cardBg} backdrop-blur-sm ${currentTheme.text} p-3 rounded-xl ${currentTheme.borderHover} transition-all duration-300 hover:scale-110 shadow-lg`}
                    title="Fullscreen"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                  </button>
                  
                  <button
                    onClick={() => window.location.reload()}
                    className={`${currentTheme.cardBg} backdrop-blur-sm ${currentTheme.text} p-3 rounded-xl ${currentTheme.borderHover} transition-all duration-300 hover:scale-110 shadow-lg`}
                    title="Refresh"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>

                  <button
                    onClick={() => window.open(chapterData.externalUrl, '_blank')}
                    className={`${currentTheme.cardBg} backdrop-blur-sm ${currentTheme.text} p-3 rounded-xl ${currentTheme.borderHover} transition-all duration-300 hover:scale-110 shadow-lg`}
                    title="Open in New Tab"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </button>
                </div>

                {/* Chapter Status Indicator */}
                <div className="absolute top-4 left-4 z-20">
                  <div className={`${currentTheme.cardBg} backdrop-blur-sm px-4 py-2 rounded-xl ${currentTheme.border} shadow-lg`}>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className={`${currentTheme.text} text-sm font-medium`}>Live External Content</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Professional Chapter Info - Below Iframe */}
            <div className="mt-8 animate-fade-in-up">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Chapter Details */}
                <div className={`lg:col-span-2 ${currentTheme.cardBg} rounded-2xl p-6 backdrop-blur-sm ${currentTheme.border} shadow-lg`}>
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className={`text-2xl font-bold ${currentTheme.text} mb-2`}>
                        {chapterData.title || `Chapter ${chapterData.chapter}`}
                      </h3>
                      <p className={`${currentTheme.textSecondary} text-lg mb-4`}>
                        Reading from external source
                      </p>
                      <div className="flex flex-wrap gap-3">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${currentTheme.cardBg} ${currentTheme.text} ${currentTheme.border}`}>
                          📖 Chapter {chapterData.chapter}
                        </span>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${currentTheme.cardBg} ${currentTheme.text} ${currentTheme.border}`}>
                          🌐 External Platform
                        </span>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-500/20 text-green-400 border border-green-500/30`}>
                          ✓ Live Content
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className={`${currentTheme.cardBg} rounded-2xl p-6 backdrop-blur-sm ${currentTheme.border} shadow-lg`}>
                  <h4 className={`${currentTheme.text} font-semibold mb-4`}>Quick Actions</h4>
                  <div className="space-y-3">
                    <button
                      onClick={() => window.open(chapterData.externalUrl, '_blank')}
                      className={`w-full px-4 py-3 bg-gradient-to-r ${currentTheme.accent} text-white rounded-xl ${currentTheme.accentHover} transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 font-medium flex items-center justify-center space-x-2`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      <span>Open in New Tab</span>
                    </button>
                    
                    <button
                      onClick={() => window.location.reload()}
                      className={`w-full px-4 py-3 ${currentTheme.cardBg} ${currentTheme.text} rounded-xl ${currentTheme.borderHover} transition-all duration-300 font-medium flex items-center justify-center space-x-2 ${currentTheme.border}`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>Refresh Content</span>
                    </button>

                    <Link
                      href={`/manga/${mangaId}`}
                      className={`w-full px-4 py-3 ${currentTheme.cardBg} ${currentTheme.text} rounded-xl ${currentTheme.borderHover} transition-all duration-300 font-medium flex items-center justify-center space-x-2 ${currentTheme.border}`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                      </svg>
                      <span>Back to Manga</span>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Technical Info */}
              <div className={`mt-6 ${currentTheme.cardBg} rounded-2xl p-4 backdrop-blur-sm ${currentTheme.border} shadow-lg`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm">
                    <span className={`${currentTheme.textSecondary} flex items-center space-x-1`}>
                      <span>📱</span>
                      <span>Responsive Reader</span>
                    </span>
                    <span className={`${currentTheme.textSecondary} flex items-center space-x-1`}>
                      <span>🔒</span>
                      <span>Secure Sandbox</span>
                    </span>
                    <span className={`${currentTheme.textSecondary} flex items-center space-x-1`}>
                      <span>⚡</span>
                      <span>Optimized Loading</span>
                    </span>
                  </div>
                  <div className={`${currentTheme.textSecondary} text-sm`}>
                    External content by {chapterData.source || 'Third Party'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Regular Chapter - Pages */
        <div className="pt-24 pb-20 relative">
          {readingMode === 'scroll' ? (
            /* Scroll Mode - Vertical scroll for better reading */
            <div className="max-h-screen mx-auto px-4">
              {/* Chapter Header */}
              <div className="text-center mb-8 animate-fade-in">
                <div className={`inline-block ${currentTheme.cardBg} rounded-3xl p-8 backdrop-blur-sm ${currentTheme.border} shadow-2xl`}>
                  <h2 className={`text-3xl font-bold bg-gradient-to-r ${currentTheme.accent} bg-clip-text text-transparent mb-3`}>
                    {chapterData.title || `Chapter ${chapterData.chapter}`}
                  </h2>
                  <div className={`flex items-center justify-center space-x-6 ${currentTheme.textSecondary} text-lg`}>
                    <span className="flex items-center space-x-2">
                      <span>📄</span>
                      <span>{chapterData.pages?.length || 0} pages</span>
                    </span>
                    <span className="flex items-center space-x-2">
                      <span>🌟</span>
                      <span>{chapterData.source || 'MangaDx'}</span>
                    </span>
                    <span className="flex items-center space-x-2">
                      <span>📖</span>
                      <span>Vertical Scroll</span>
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Reading Progress Bar */}
              <div className="fixed top-[88px] left-0 right-0 z-40 pointer-events-none">
                <div className={`h-1 ${currentTheme.border}`}>
                  <div 
                    className={`h-full bg-gradient-to-r ${currentTheme.accent} transition-all duration-300`}
                    style={{ width: `${((chapterData.pages?.length || 0) > 0) ? (loadedImages.size / chapterData.pages.length) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
              
              {/* Pages Container - Vertical Layout */}
              <div className="space-y-12">
                {chapterData.pages?.map((page, index) => (
                  <div 
                    key={index} 
                    className={`group relative animate-fade-in-up ${currentTheme.cardBg} rounded-3xl p-4 backdrop-blur-sm ${currentTheme.border} ${currentTheme.borderHover} transition-all duration-500 hover:shadow-2xl hover:scale-[1.02]`}
                    style={{ 
                      animationDelay: `${index * 0.1}s`,
                      transform: 'translateZ(0)' // Hardware acceleration
                    }}
                  >
                    {/* Page Number Badge */}
                    <div className={`absolute -top-4 left-6 z-10 bg-gradient-to-r ${currentTheme.accent} text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg`}>
                      Page {page.number}
                    </div>
                    
                    {/* Loading State */}
                    {!loadedImages.has(page.number) && (
                      <div className="absolute inset-4 flex items-center justify-center bg-gray-800/90 rounded-2xl z-20 backdrop-blur-sm">
                        <div className="text-center">
                          <div className={`w-full h-96 ${currentTheme.border} rounded-xl shimmer mb-6`}></div>
                          <div className={`animate-spin rounded-full h-10 w-10 border-4 ${currentTheme.accent.includes('orange') ? 'border-orange-500' : currentTheme.accent.includes('purple') ? 'border-purple-500' : 'border-blue-500'} border-t-transparent mx-auto mb-3`}></div>
                          <p className={`${currentTheme.text} text-lg font-medium mb-2`}>Loading page {page.number}...</p>
                          <div className={`w-24 h-2 ${currentTheme.border} rounded-full mx-auto shimmer`}></div>
                        </div>
                      </div>
                    )}
                    
                    {/* Page Image Container */}
                    <div className="relative overflow-hidden rounded-2xl">
                      <Image
                        src={page.url}
                        alt={`Page ${page.number}`}
                        width={1000}
                        height={1400}
                        className={`w-full h-auto transition-all duration-700 ${
                          loadedImages.has(page.number) 
                            ? 'opacity-100 scale-100 blur-0' 
                            : 'opacity-0 scale-95 blur-sm'
                        }`}
                        onLoad={() => handleImageLoad(page.number)}
                        onError={() => handleImageLoad(page.number)}
                        priority={index < 2}
                        quality={95}
                      />
                      
                      {/* Page Overlay Effects */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      
                      {/* Page Info Overlay */}
                      <div className="absolute bottom-4 right-4 bg-black/70 backdrop-blur-sm text-white px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 text-sm">
                        {page.filename}
                      </div>
                    </div>

                    {/* Page Navigation Hints */}
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                      <div className="bg-black/50 backdrop-blur-sm text-white p-2 rounded-full">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      </div>
                    </div>
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                      <div className="bg-black/50 backdrop-blur-sm text-white p-2 rounded-full">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* End of Chapter */}
              <div className="text-center mt-16 py-12 animate-fade-in">
                <div className={`inline-block ${currentTheme.cardBg} rounded-3xl p-8 backdrop-blur-sm ${currentTheme.border} shadow-2xl`}>
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                  </div>
                  <h3 className={`text-2xl font-bold ${currentTheme.text} mb-2`}>🎉 Chapter Complete!</h3>
                  <p className={`${currentTheme.textSecondary} text-lg mb-4`}>You've reached the end of this chapter</p>
                  <div className="flex items-center justify-center space-x-4 text-sm">
                    <span className={`${currentTheme.textSecondary} flex items-center`}>
                      ✅ {chapterData.pages?.length} pages read
                    </span>
                    <span className={`${currentTheme.textSecondary} flex items-center`}>
                      ⭐ Great job!
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Single Page Mode */
            <div className="flex items-center justify-center min-h-screen px-2 md:px-4">
              <div className="relative max-w-5xl w-full">
                {currentPageData && (
                  <div className={`${currentTheme.cardBg} backdrop-blur-sm rounded-2xl p-2 md:p-4 ${currentTheme.border} shadow-2xl`}>
                    <div className="relative overflow-hidden rounded-xl">
                      {!loadedImages.has(currentPage) && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-800/80 z-20">
                          <div className="text-center">
                            <div className="animate-spin rounded-full h-10 w-10 md:h-12 md:w-12 border-4 border-orange-500 border-t-transparent mx-auto mb-4"></div>
                            <p className={`${currentTheme.text} text-sm md:text-base`}>Loading page {currentPage}...</p>
                          </div>
                        </div>
                      )}
                      
                      <Image
                        src={currentPageData.url}
                        alt={`Page ${currentPage}`}
                        width={800}
                        height={1200}
                        className={`w-full h-auto transition-all duration-500 ${
                          loadedImages.has(currentPage) 
                            ? 'opacity-100 scale-100' 
                            : 'opacity-0 scale-95'
                        }`}
                        onLoad={() => handleImageLoad(currentPage)}
                        onError={() => handleImageLoad(currentPage)}
                        priority
                        quality={95}
                      />
                    </div>

                    {/* Mobile-Responsive Bottom Navigation */}
                    <div className="flex items-center justify-between mt-4 p-2 md:p-4 bg-black/20 backdrop-blur-sm rounded-xl">
                      <button
                        onClick={prevPage}
                        disabled={currentPage === 1}
                        className={`flex items-center space-x-2 px-3 py-2 md:px-4 md:py-2 rounded-xl transition-all duration-300 ${
                          currentPage === 1
                            ? `${currentTheme.textSecondary} opacity-50 cursor-not-allowed`
                            : `${currentTheme.accent} text-white hover:scale-105 shadow-lg`
                        }`}
                      >
                        <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        <span className="text-sm md:text-base font-medium">
                          <span className="hidden sm:inline">Previous</span>
                          <span className="sm:hidden">Prev</span>
                        </span>
                      </button>

                      <div className="text-center">
                        <div className={`${currentTheme.text} text-sm md:text-base font-medium`}>
                          <span className="hidden sm:inline">Page {currentPage} of {chapterData.total}</span>
                          <span className="sm:hidden">{currentPage}/{chapterData.total}</span>
                        </div>
                        <div className={`w-20 md:w-24 h-1 ${currentTheme.border} rounded-full mt-2`}>
                          <div 
                            className={`h-full bg-gradient-to-r ${currentTheme.accent} rounded-full transition-all duration-300`}
                            style={{ width: `${(currentPage / chapterData.total) * 100}%` }}
                          ></div>
                        </div>
                      </div>

                      <button
                        onClick={nextPage}
                        disabled={currentPage === chapterData.total}
                        className={`flex items-center space-x-2 px-3 py-2 md:px-4 md:py-2 rounded-xl transition-all duration-300 ${
                          currentPage === chapterData.total
                            ? `${currentTheme.textSecondary} opacity-50 cursor-not-allowed`
                            : `${currentTheme.accent} text-white hover:scale-105 shadow-lg`
                        }`}
                      >
                        <span className="text-sm md:text-base font-medium">
                          <span className="hidden sm:inline">Next</span>
                          <span className="sm:hidden">Next</span>
                        </span>
                        <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col space-y-3">
        {/* Chat Button */}
        <button
          onClick={() => setShowChatPanel(true)}
          className={`w-14 h-14 rounded-full bg-gradient-to-r ${currentTheme.accent} text-white shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300 flex items-center justify-center group`}
        >
          <MessageCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
        </button>

        {/* Audio Button */}
        <button
          onClick={() => {
            // TODO: Implement audio narration toggle
            console.log('Audio narration toggle')
          }}
          className={`w-14 h-14 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300 flex items-center justify-center group`}
        >
          {isNarrationPlaying ? (
            <Pause className="w-6 h-6 group-hover:scale-110 transition-transform" />
          ) : (
            <Volume2 className="w-6 h-6 group-hover:scale-110 transition-transform" />
          )}
        </button>
      </div>

      {/* Chat Panel */}
      {showChatPanel && (
        <MangaChatPanel
          isOpen={showChatPanel}
          onClose={() => setShowChatPanel(false)}
          mangaId={mangaId}
          mangaTitle={mangaTitle || `Manga ${mangaId}`}
          chapterNumber={chapter}
          currentPage={readingMode === 'single' ? currentPage : undefined}
          totalPages={chapterData?.total}
        />
      )}
    </div>
  );
}