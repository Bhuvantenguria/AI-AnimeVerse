"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { VoiceStyleCarousel } from "@/components/voice-style-carousel"
import { MangaToAnimeLoader } from "@/components/manga-to-anime-loader"
import { HolographicVideoPlayer } from "@/components/holographic-video-player"
import { Sparkles, ArrowRight, ArrowLeft, CheckCircle, Zap, Crown } from "lucide-react"
import { cn } from "@/lib/utils"

// Mock manga data
const availableManga = [
  {
    id: "1",
    title: "One Piece",
    chapter: 1100,
    pages: 17,
    image: "/placeholder.svg?height=300&width=200",
    description: "The epic adventure continues as Luffy faces new challenges in the Grand Line.",
  },
  {
    id: "2",
    title: "Attack on Titan",
    chapter: 139,
    pages: 45,
    image: "/placeholder.svg?height=300&width=200",
    description: "The final chapter that reveals the truth behind the titans and Eren's plan.",
  },
  {
    id: "3",
    title: "Demon Slayer",
    chapter: 205,
    pages: 19,
    image: "/placeholder.svg?height=300&width=200",
    description: "Tanjiro's final battle against Muzan reaches its climactic conclusion.",
  },
  {
    id: "4",
    title: "Jujutsu Kaisen",
    chapter: 250,
    pages: 20,
    image: "/placeholder.svg?height=300&width=200",
    description: "The Shibuya Incident continues with devastating consequences for all.",
  },
  {
    id: "5",
    title: "My Hero Academia",
    chapter: 400,
    pages: 15,
    image: "/placeholder.svg?height=300&width=200",
    description: "Deku faces his greatest challenge yet in the war against All For One.",
  },
  {
    id: "6",
    title: "Chainsaw Man",
    chapter: 180,
    pages: 18,
    image: "/placeholder.svg?height=300&width=200",
    description: "Denji's world turns upside down as new devils emerge from the shadows.",
  },
]

type Step = "selection" | "voice" | "generate" | "loading" | "result"

export default function MangaToAnimePage() {
  const [currentStep, setCurrentStep] = useState<Step>("selection")
  const [selectedManga, setSelectedManga] = useState<string | null>(null)
  const [selectedVoice, setSelectedVoice] = useState<string>("energetic")
  const [progress, setProgress] = useState(0)
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null)

  const handleMangaSelect = (mangaId: string) => {
    setSelectedManga(mangaId)
  }

  const handleContinueToVoice = () => {
    if (selectedManga) {
      setCurrentStep("voice")
    }
  }

  const handleGenerate = () => {
    setCurrentStep("loading")
    setProgress(0)

    // Simulate AI processing
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setGeneratedVideo("/placeholder-video.mp4")
          setCurrentStep("result")
          return 100
        }
        return prev + Math.random() * 10
      })
    }, 300)
  }

  const handleRegenerate = () => {
    setCurrentStep("voice")
    setGeneratedVideo(null)
    setProgress(0)
  }

  const handleDownload = () => {
    // Simulate download with confetti effect
    console.log("Downloading video...")
  }

  const handleShare = () => {
    console.log("Sharing video...")
  }

  const selectedMangaData = availableManga.find((m) => m.id === selectedManga)

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Sparkles className="h-8 w-8 text-primary animate-pulse" />
            <h1 className="text-4xl md:text-5xl font-bold text-interactive">Manga to Anime AI</h1>
          </div>
          <p className="text-muted-foreground text-xl">Transform manga chapters into anime previews with AI magic</p>
        </div>

        {/* Progress Steps */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="flex items-center justify-between">
            {[
              { step: "selection", label: "Select Manga", icon: "📚" },
              { step: "voice", label: "Choose Voice", icon: "🎤" },
              { step: "generate", label: "Generate", icon: "⚡" },
              { step: "result", label: "Preview", icon: "🎬" },
            ].map((item, index) => (
              <div key={item.step} className="flex items-center">
                <div
                  className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center text-lg transition-all duration-300",
                    currentStep === item.step ||
                      (currentStep === "loading" && item.step === "generate") ||
                      (["voice", "generate", "loading", "result"].includes(currentStep) && item.step === "selection") ||
                      (["generate", "loading", "result"].includes(currentStep) && item.step === "voice") ||
                      (["result"].includes(currentStep) && item.step === "generate")
                      ? "bg-primary text-primary-foreground animate-pulse-glow"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {["voice", "generate", "loading", "result"].includes(currentStep) && item.step === "selection" ? (
                    <CheckCircle className="h-6 w-6" />
                  ) : ["generate", "loading", "result"].includes(currentStep) && item.step === "voice" ? (
                    <CheckCircle className="h-6 w-6" />
                  ) : ["result"].includes(currentStep) && item.step === "generate" ? (
                    <CheckCircle className="h-6 w-6" />
                  ) : (
                    item.icon
                  )}
                </div>
                {index < 3 && (
                  <div
                    className={cn(
                      "w-16 h-1 mx-2 transition-all duration-300",
                      (["voice", "generate", "loading", "result"].includes(currentStep) && index === 0) ||
                        (["generate", "loading", "result"].includes(currentStep) && index === 1) ||
                        (["result"].includes(currentStep) && index === 2)
                        ? "bg-primary"
                        : "bg-muted",
                    )}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-sm text-muted-foreground">
            <span>Select</span>
            <span>Voice</span>
            <span>Generate</span>
            <span>Preview</span>
          </div>
        </div>

        {/* Step Content */}
        {currentStep === "selection" && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-interactive mb-4">Choose Your Manga Chapter</h2>
              <p className="text-muted-foreground text-lg">Select a chapter from our premium collection</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableManga.map((manga, index) => (
                <Card
                  key={manga.id}
                  className={cn(
                    "cursor-pointer transition-all duration-300 card-3d animate-scale-in",
                    selectedManga === manga.id
                      ? "ring-2 ring-primary shadow-lg scale-105 animate-pulse-glow"
                      : "hover:scale-105 hover:shadow-md",
                  )}
                  style={{ animationDelay: `${index * 0.1}s` }}
                  onClick={() => handleMangaSelect(manga.id)}
                >
                  <div className="relative">
                    <div className="aspect-[3/4] overflow-hidden rounded-t-lg">
                      <img
                        src={manga.image || "/placeholder.svg"}
                        alt={manga.title}
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                      />
                    </div>

                    {selectedManga === manga.id && (
                      <div className="absolute top-2 right-2 w-8 h-8 bg-primary rounded-full flex items-center justify-center animate-bounce-in">
                        <CheckCircle className="h-5 w-5 text-primary-foreground" />
                      </div>
                    )}
                  </div>

                  <CardContent className="p-4">
                    <h3 className="font-bold text-lg mb-2">{manga.title}</h3>
                    <div className="flex items-center space-x-2 mb-2">
                      <Badge variant="outline">Chapter {manga.chapter}</Badge>
                      <Badge variant="outline">{manga.pages} pages</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{manga.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {selectedManga && (
              <div className="text-center animate-slide-in-up">
                <Button size="lg" onClick={handleContinueToVoice} className="animate-pulse-glow">
                  Continue to Voice Selection
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            )}
          </div>
        )}

        {currentStep === "voice" && (
          <div className="space-y-8">
            {/* Selected Manga Preview */}
            {selectedMangaData && (
              <Card className="max-w-2xl mx-auto animate-slide-in-up">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <img
                      src={selectedMangaData.image || "/placeholder.svg"}
                      alt={selectedMangaData.title}
                      className="w-16 h-20 object-cover rounded"
                    />
                    <div>
                      <h3 className="font-bold text-lg">{selectedMangaData.title}</h3>
                      <p className="text-muted-foreground">Chapter {selectedMangaData.chapter}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <VoiceStyleCarousel selectedStyle={selectedVoice} onStyleSelect={setSelectedVoice} />

            <div className="flex justify-center space-x-4">
              <Button variant="outline" onClick={() => setCurrentStep("selection")} className="interactive-hover">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button size="lg" onClick={handleGenerate} className="animate-pulse-glow">
                <Zap className="mr-2 h-5 w-5" />
                Generate AI Preview
              </Button>
            </div>
          </div>
        )}

        {/* Premium Upsell during loading */}
        {currentStep === "loading" && (
          <>
            <MangaToAnimeLoader progress={progress} isVisible={true} />

            {progress > 30 && progress < 80 && (
              <div className="fixed bottom-8 right-8 z-40 animate-slide-in-right">
                <Card className="glass-morphism border-primary/30">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <Crown className="h-6 w-6 text-yellow-500" />
                      <div>
                        <p className="font-semibold">Upgrade to Premium</p>
                        <p className="text-sm text-muted-foreground">Get HD previews & longer videos!</p>
                      </div>
                      <Button size="sm" className="animate-pulse-glow">
                        Upgrade
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        )}

        {currentStep === "result" && generatedVideo && selectedMangaData && (
          <HolographicVideoPlayer
            videoUrl={generatedVideo}
            title={`${selectedMangaData.title} - Chapter ${selectedMangaData.chapter}`}
            onRegenerate={handleRegenerate}
            onDownload={handleDownload}
            onShare={handleShare}
          />
        )}
      </div>
    </div>
  )
}
