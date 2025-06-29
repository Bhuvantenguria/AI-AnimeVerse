"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ThreeScene } from "@/components/three-scene"
import { AnimatedCarousel } from "@/components/animated-carousel"
import { MangaFlipCard } from "@/components/manga-flip-card"
import {
  Play,
  BookOpen,
  Sparkles,
  Trophy,
  Users,
  ArrowRight,
  TrendingUp,
  Volume2,
  Zap,
  Crown,
  Medal,
} from "lucide-react"
import { cn } from "@/lib/utils"

// Enhanced mock data
const trendingAnime = [
  {
    id: "1",
    title: "Attack on Titan: Final Season",
    image: "/placeholder.svg?height=600&width=400",
    rating: 9.2,
    genre: ["Action", "Drama", "Fantasy"],
    year: 2023,
    description:
      "The epic conclusion to humanity's fight against the Titans reaches its climactic finale with unprecedented revelations.",
  },
  {
    id: "2",
    title: "Demon Slayer: Hashira Training",
    image: "/placeholder.svg?height=600&width=400",
    rating: 8.9,
    genre: ["Action", "Supernatural", "Historical"],
    year: 2024,
    description:
      "Tanjiro and his friends undergo intense training with the Hashira to prepare for the ultimate battle against Muzan.",
  },
  {
    id: "3",
    title: "Jujutsu Kaisen Season 2",
    image: "/placeholder.svg?height=600&width=400",
    rating: 8.7,
    genre: ["Action", "School", "Supernatural"],
    year: 2023,
    description:
      "The Shibuya Incident arc brings devastating consequences as sorcerers face their greatest challenge yet.",
  },
]

const popularManga = [
  {
    id: "1",
    title: "One Piece",
    image: "/placeholder.svg?height=600&width=400",
    rating: 9.3,
    genre: ["Adventure", "Comedy", "Drama"],
    chapters: 1100,
    status: "ongoing" as const,
    year: 1997,
    description:
      "Follow Monkey D. Luffy's epic journey to become the Pirate King in this legendary adventure spanning over 25 years.",
  },
  {
    id: "2",
    title: "Jujutsu Kaisen",
    image: "/placeholder.svg?height=600&width=400",
    rating: 8.8,
    genre: ["Action", "Supernatural", "School"],
    chapters: 250,
    status: "ongoing" as const,
    year: 2018,
    description:
      "Yuji Itadori's life changes forever when he swallows a cursed finger and becomes host to a powerful demon.",
  },
  {
    id: "3",
    title: "Chainsaw Man",
    image: "/placeholder.svg?height=600&width=400",
    rating: 8.9,
    genre: ["Action", "Horror", "Supernatural"],
    chapters: 180,
    status: "ongoing" as const,
    year: 2018,
    description:
      "Denji's simple dream of living a normal life becomes complicated when he merges with his devil dog Pochita.",
  },
  {
    id: "4",
    title: "My Hero Academia",
    image: "/placeholder.svg?height=600&width=400",
    rating: 8.5,
    genre: ["Action", "School", "Superhero"],
    chapters: 400,
    status: "ongoing" as const,
    year: 2014,
    description:
      "In a world where superpowers are common, Izuku Midoriya dreams of becoming a hero despite being born without a Quirk.",
  },
]

const leaderboardPreview = [
  { rank: 1, name: "OtakuMaster", score: 15420, avatar: "/placeholder.svg?height=40&width=40", badge: "crown" },
  { rank: 2, name: "AnimeFan2024", score: 14890, avatar: "/placeholder.svg?height=40&width=40", badge: "medal" },
  { rank: 3, name: "MangaReader", score: 13750, avatar: "/placeholder.svg?height=40&width=40", badge: "medal" },
]

const aiFeatures = [
  {
    icon: Volume2,
    title: "AI Voice Reading",
    description: "Listen to your favorite manga with AI-generated voice narration in multiple languages and styles",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: Sparkles,
    title: "Manga to Anime",
    description: "Convert manga pages into short anime-style video previews with AI animation technology",
    color: "from-purple-500 to-pink-500",
  },
  {
    icon: Zap,
    title: "Smart Recommendations",
    description: "Get personalized anime and manga recommendations powered by advanced AI algorithms",
    color: "from-orange-500 to-red-500",
  },
]

export default function HomePage() {
  const [scrollY, setScrollY] = useState(0)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener("scroll", handleScroll)
    setIsVisible(true)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* Hero Section with 3D Background */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* 3D Background */}
        <ThreeScene />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background/50 to-accent/10" />

        {/* Animated Particles */}
        <div className="particles absolute inset-0">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="particle"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 20}s`,
                width: `${Math.random() * 4 + 2}px`,
                height: `${Math.random() * 4 + 2}px`,
              }}
            />
          ))}
        </div>

        {/* Hero Content */}
        <div
          className="relative z-10 text-center max-w-6xl mx-auto px-4"
          style={{ transform: `translateY(${scrollY * 0.5}px)` }}
        >
          <div
            className={cn(
              "transition-all duration-1000",
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10",
            )}
          >
            <Badge className="mb-6 animate-bounce-in text-lg px-6 py-2">✨ The Future of Manga & Anime</Badge>

            <h1 className="text-6xl md:text-8xl lg:text-9xl font-bold mb-6 animate-neon-glow">
              <span className="text-gradient">Manga</span>
              <span className="text-interactive">Verse</span>
            </h1>

            <p
              className="text-xl md:text-3xl text-muted-foreground mb-8 animate-slide-in-up max-w-4xl mx-auto"
              style={{ animationDelay: "0.3s" }}
            >
              Read, Watch, Listen & Experience Anime and Manga like never before with AI-powered features
            </p>

            <div
              className="flex flex-col sm:flex-row gap-6 justify-center animate-slide-in-up"
              style={{ animationDelay: "0.6s" }}
            >
              <Button size="lg" className="text-xl px-12 py-8 animate-pulse-glow neon-border">
                <Play className="mr-3 h-6 w-6" />
                Start Watching
              </Button>
              <Button size="lg" variant="outline" className="text-xl px-12 py-8 glass-morphism bg-transparent">
                <BookOpen className="mr-3 h-6 w-6" />
                Read Manga
              </Button>
              <Button size="lg" variant="outline" className="text-xl px-12 py-8 glass-morphism bg-transparent">
                <Volume2 className="mr-3 h-6 w-6" />
                Listen Mode
              </Button>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-primary rounded-full flex justify-center">
            <div className="w-1 h-3 bg-primary rounded-full mt-2 animate-pulse" />
          </div>
        </div>
      </section>

      {/* Trending Anime Carousel */}
      <section className="py-20 px-4 relative">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <TrendingUp className="h-8 w-8 text-primary animate-bounce" />
              <h2 className="text-4xl md:text-5xl font-bold text-gradient text-interactive">Trending Anime</h2>
            </div>
            <p className="text-muted-foreground text-xl">The hottest anime everyone's talking about</p>
          </div>

          <AnimatedCarousel items={trendingAnime} />
        </div>
      </section>

      {/* Popular Manga with Flip Cards */}
      <section className="py-20 px-4 bg-muted/30 relative">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <BookOpen className="h-8 w-8 text-primary animate-float" />
              <h2 className="text-4xl md:text-5xl font-bold text-gradient text-interactive">Popular Manga</h2>
            </div>
            <p className="text-muted-foreground text-xl">Discover amazing stories with interactive previews</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {popularManga.map((manga, index) => (
              <MangaFlipCard
                key={manga.id}
                {...manga}
                className="animate-scale-in"
                style={{ animationDelay: `${index * 0.1}s` } as any}
              />
            ))}
          </div>

          <div className="text-center mt-12">
            <Button size="lg" variant="outline" className="animate-pulse-glow bg-transparent">
              Explore All Manga <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* AI Features Showcase */}
      <section className="py-20 px-4 relative overflow-hidden">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <Sparkles className="h-8 w-8 text-primary animate-pulse" />
              <h2 className="text-4xl md:text-5xl font-bold text-gradient text-interactive">AI-Powered Features</h2>
            </div>
            <p className="text-muted-foreground text-xl max-w-3xl mx-auto">
              Experience the future of entertainment with cutting-edge AI technology
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {aiFeatures.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div
                  key={feature.title}
                  className="relative group animate-slide-in-up card-3d"
                  style={{ animationDelay: `${index * 0.2}s` }}
                >
                  <div
                    className="absolute inset-0 bg-gradient-to-br opacity-20 rounded-2xl blur-xl group-hover:opacity-40 transition-opacity duration-300"
                    style={{
                      background: `linear-gradient(135deg, ${feature.color.split(" ")[1]}, ${feature.color.split(" ")[3]})`,
                    }}
                  />

                  <div className="relative p-8 rounded-2xl bg-card border glass-morphism h-full">
                    <div
                      className={`w-16 h-16 rounded-full bg-gradient-to-br ${feature.color} flex items-center justify-center mx-auto mb-6 animate-float`}
                    >
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold mb-4 text-center">{feature.title}</h3>
                    <p className="text-muted-foreground text-center leading-relaxed">{feature.description}</p>

                    <Button className="w-full mt-6 animate-pulse-glow">Try Now</Button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Manga-to-Anime Preview Demo */}
      <section className="py-20 px-4 bg-gradient-to-br from-primary/5 to-accent/5">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto text-center">
            <div className="animate-scale-in">
              <Badge className="mb-6 text-lg px-6 py-2 animate-bounce-in">🎬 Revolutionary Technology</Badge>
              <h2 className="text-4xl md:text-6xl font-bold mb-6 text-gradient text-interactive">Manga to Anime AI</h2>
              <p className="text-xl text-muted-foreground mb-8">
                Watch your favorite manga pages come to life with AI-generated anime previews
              </p>
            </div>

            <div className="relative animate-slide-in-up" style={{ animationDelay: "0.3s" }}>
              <div className="aspect-video bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl border-2 border-primary/30 flex items-center justify-center glass-morphism">
                <div className="text-center">
                  <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse-glow">
                    <Play className="h-12 w-12 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Demo Video</h3>
                  <p className="text-muted-foreground">See manga transform into anime</p>
                </div>
              </div>

              <Button size="lg" className="mt-8 animate-pulse-glow">
                <Sparkles className="mr-2 h-5 w-5" />
                Try AI Converter
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Leaderboard Preview */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <Trophy className="h-8 w-8 text-primary animate-bounce" />
              <h2 className="text-4xl md:text-5xl font-bold text-gradient text-interactive">Top Otaku Leaderboard</h2>
            </div>
            <p className="text-muted-foreground text-xl">Compete with anime fans worldwide</p>
          </div>

          <div className="max-w-2xl mx-auto">
            <div className="space-y-4">
              {leaderboardPreview.map((user, index) => (
                <div
                  key={user.rank}
                  className={cn(
                    "flex items-center space-x-6 p-6 rounded-2xl border transition-all duration-300 card-3d animate-slide-in-up",
                    index === 0 &&
                      "bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/50 neon-border",
                    index === 1 && "bg-gradient-to-r from-gray-400/20 to-gray-600/20 border-gray-400/50",
                    index === 2 && "bg-gradient-to-r from-orange-600/20 to-red-600/20 border-orange-600/50",
                  )}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground font-bold text-lg">
                    {index === 0 && <Crown className="h-6 w-6 text-yellow-500" />}
                    {index > 0 && <Medal className="h-6 w-6 text-gray-400" />}
                  </div>
                  <img
                    src={user.avatar || "/placeholder.svg"}
                    alt={user.name}
                    className="w-12 h-12 rounded-full border-2 border-primary/30"
                  />
                  <div className="flex-1">
                    <p className="font-bold text-lg">{user.name}</p>
                    <p className="text-sm text-muted-foreground">{user.score.toLocaleString()} XP</p>
                  </div>
                  <Badge variant="outline" className="text-lg px-4 py-2">
                    #{user.rank}
                  </Badge>
                </div>
              ))}
            </div>

            <div className="text-center mt-8">
              <Button size="lg" variant="outline" className="animate-pulse-glow bg-transparent">
                View Full Leaderboard <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Community CTA */}
      <section className="py-20 px-4 bg-gradient-to-br from-primary/10 to-accent/10">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto animate-scale-in">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <Users className="h-8 w-8 text-primary animate-float" />
              <h2 className="text-4xl md:text-5xl font-bold text-gradient text-interactive">Join the Community</h2>
            </div>
            <p className="text-muted-foreground text-xl mb-8 max-w-3xl mx-auto">
              Connect with fellow otaku, share theories, discuss episodes, and make new friends who share your passion
              for anime and manga.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Button size="lg" className="text-xl px-12 py-6 animate-pulse-glow">
                <Users className="mr-3 h-6 w-6" />
                Join Community
              </Button>
              <Button size="lg" variant="outline" className="text-xl px-12 py-6 glass-morphism bg-transparent">
                <Trophy className="mr-3 h-6 w-6" />
                Take Quiz Challenge
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Floating Action Button */}
      <Button className="fab animate-pulse-glow">
        <Sparkles className="h-6 w-6" />
      </Button>
    </div>
  )
}
