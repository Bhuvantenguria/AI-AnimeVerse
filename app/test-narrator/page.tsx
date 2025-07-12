'use client'

import { useState, useEffect } from 'react'
import MangaNarrator from '../../components/manga-narrator'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { Badge } from '../../components/ui/badge'
import { Loader2, Book, Headphones, Eye } from 'lucide-react'

// Sample manga data for testing
const SAMPLE_MANGA = [
  {
    id: 'a96676e5-8ae2-425e-b549-7f15dd34a6d8',
    title: 'One Piece',
    chapters: [
      { number: '1', title: 'Romance Dawn', pages: 53 },
      { number: '2', title: 'Versus! Buggy the Clown', pages: 22 },
      { number: '3', title: 'Introduction', pages: 19 }
    ]
  },
  {
    id: 'b0ca6a-1234-5678-9abc-def012345678',
    title: 'Naruto',
    chapters: [
      { number: '1', title: 'Uzumaki Naruto', pages: 45 },
      { number: '2', title: 'Konohamaru', pages: 20 },
      { number: '3', title: 'Sasuke Uchiha', pages: 19 }
    ]
  }
]

export default function TestNarratorPage() {
  const [selectedManga, setSelectedManga] = useState(SAMPLE_MANGA[0])
  const [selectedChapter, setSelectedChapter] = useState(selectedManga.chapters[0])
  const [chapterPages, setChapterPages] = useState<Array<{page: number, image: string, width?: number, height?: number}>>([])
  const [isLoadingPages, setIsLoadingPages] = useState(false)
  const [showNarrator, setShowNarrator] = useState(false)

  // Load chapter pages when selection changes
  useEffect(() => {
    loadChapterPages()
  }, [selectedManga, selectedChapter])

  const loadChapterPages = async () => {
    setIsLoadingPages(true)
    try {
      // Simulate API call to get chapter pages
      const response = await fetch(`/api/manga/${selectedManga.id}/chapters/${selectedChapter.number}`)
      
      if (response.ok) {
        const data = await response.json()
        setChapterPages(data.pages || [])
      } else {
        // Fallback: Generate sample pages for testing
        const samplePages = Array.from({ length: selectedChapter.pages }, (_, i) => ({
          page: i + 1,
          image: `https://via.placeholder.com/800x1200/cccccc/000000?text=Page+${i + 1}`,
          width: 800,
          height: 1200
        }))
        setChapterPages(samplePages)
      }
    } catch (error) {
      console.error('Failed to load chapter pages:', error)
      // Fallback: Generate sample pages for testing
      const samplePages = Array.from({ length: selectedChapter.pages }, (_, i) => ({
        page: i + 1,
        image: `https://via.placeholder.com/800x1200/cccccc/000000?text=Page+${i + 1}`,
        width: 800,
        height: 1200
      }))
      setChapterPages(samplePages)
    } finally {
      setIsLoadingPages(false)
    }
  }

  const handleMangaChange = (mangaId: string) => {
    const manga = SAMPLE_MANGA.find(m => m.id === mangaId)
    if (manga) {
      setSelectedManga(manga)
      setSelectedChapter(manga.chapters[0])
      setShowNarrator(false)
    }
  }

  const handleChapterChange = (chapterNumber: string) => {
    const chapter = selectedManga.chapters.find(c => c.number === chapterNumber)
    if (chapter) {
      setSelectedChapter(chapter)
      setShowNarrator(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
            <Book className="h-8 w-8" />
            Manga Narrator Test
          </h1>
          <p className="text-muted-foreground">
            Test the OCR + TTS narration system with sample manga chapters
          </p>
        </div>

        {/* Manga Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Select Manga & Chapter
            </CardTitle>
            <CardDescription>
              Choose a manga and chapter to test the narration system
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Manga Selector */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Manga</label>
                <Select value={selectedManga.id} onValueChange={handleMangaChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select manga" />
                  </SelectTrigger>
                  <SelectContent>
                    {SAMPLE_MANGA.map(manga => (
                      <SelectItem key={manga.id} value={manga.id}>
                        {manga.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Chapter Selector */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Chapter</label>
                <Select value={selectedChapter.number} onValueChange={handleChapterChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select chapter" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedManga.chapters.map(chapter => (
                      <SelectItem key={chapter.number} value={chapter.number}>
                        Ch. {chapter.number} - {chapter.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Chapter Info */}
            <div className="flex gap-2">
              <Badge variant="secondary">{selectedManga.title}</Badge>
              <Badge variant="outline">Chapter {selectedChapter.number}</Badge>
              <Badge variant="outline">{selectedChapter.pages} pages</Badge>
              <Badge variant="outline">{chapterPages.length} loaded</Badge>
            </div>

            {/* Load Pages Status */}
            {isLoadingPages && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading chapter pages...
              </div>
            )}

            {/* Show Narrator Button */}
            {chapterPages.length > 0 && !isLoadingPages && (
              <Button
                onClick={() => setShowNarrator(true)}
                disabled={showNarrator}
                className="w-full"
              >
                <Headphones className="mr-2 h-4 w-4" />
                {showNarrator ? 'Narrator Loaded' : 'Load Narrator'}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Sample Pages Preview */}
        {chapterPages.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Chapter Preview</CardTitle>
              <CardDescription>
                First few pages of the selected chapter
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {chapterPages.slice(0, 4).map(page => (
                  <div key={page.page} className="space-y-2">
                    <img
                      src={page.image}
                      alt={`Page ${page.page}`}
                      className="w-full h-32 object-cover rounded border"
                    />
                    <p className="text-xs text-center text-muted-foreground">
                      Page {page.page}
                    </p>
                  </div>
                ))}
              </div>
              {chapterPages.length > 4 && (
                <p className="text-sm text-muted-foreground text-center mt-4">
                  ...and {chapterPages.length - 4} more pages
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Narrator Component */}
        {showNarrator && (
          <MangaNarrator
            mangaId={selectedManga.id}
            chapterNumber={selectedChapter.number}
            mangaTitle={selectedManga.title}
            chapterTitle={selectedChapter.title}
            pages={chapterPages}
          />
        )}

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>How to Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-semibold">1. Select Content</h4>
              <p className="text-sm text-muted-foreground">
                Choose a manga and chapter from the dropdowns above
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">2. Load Narrator</h4>
              <p className="text-sm text-muted-foreground">
                Click "Load Narrator" to show the narration interface
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">3. Configure Settings</h4>
              <p className="text-sm text-muted-foreground">
                Adjust voice type, speed, and other narration settings
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">4. Generate Narration</h4>
              <p className="text-sm text-muted-foreground">
                Click "Generate Narration" to start the OCR + TTS process
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">5. Listen & Download</h4>
              <p className="text-sm text-muted-foreground">
                Play the generated audio and download if needed
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Technical Info */}
        <Card>
          <CardHeader>
            <CardTitle>Technical Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-semibold mb-2">OCR Engine</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Tesseract.js for text extraction</li>
                  <li>• Multi-language support (English + Japanese)</li>
                  <li>• Image preprocessing for better accuracy</li>
                  <li>• Confidence scoring for each page</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">TTS Engine</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• ElevenLabs API for realistic voices</li>
                  <li>• Emotion detection and adjustment</li>
                  <li>• Multiple voice types and speeds</li>
                  <li>• Cloudinary for audio storage</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Features</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Page-by-page text extraction</li>
                  <li>• Narrative script generation</li>
                  <li>• Optional page numbers & transitions</li>
                  <li>• Audio player with controls</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">API Endpoints</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• POST /api/manga/narrate-chapter/:id/chapters/:num</li>
                  <li>• POST /api/narrator/narrate-chapter</li>
                  <li>• POST /api/narrator/extract-text</li>
                  <li>• GET /api/narrator/health</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 