"use client"

import { useEffect, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { AnimeCard } from "@/components/anime-card"
import { MangaCard } from "@/components/manga-card"
import { CharacterChatLauncher } from "@/components/character-chat-launcher"
import { ThreeScene } from "@/components/three-scene"
import { dashboardAPI, animeAPI, mangaAPI } from "@/lib/api"
import { useAuth } from "@/components/auth-provider"
import { Play, BookOpen, MessageCircle, Trophy, Users, Sparkles, TrendingUp, Star, ArrowRight } from "lucide-react"

export default function HomePage() {
  const { user } = useAuth()
  const [currentQuote, setCurrentQuote] = useState<any>(null)

  // Fetch trending content
  const { data: trendingData, isLoading: trendingLoading } = useQuery({
    queryKey: ["trending"],
    queryFn: () => dashboardAPI.getTrending(),
  })

  // Fetch user dashboard if logged in
  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ["dashboard", user?.id],
    queryFn: () => dashboardAPI.getStats(),
    enabled: !!user,
  })

  // Fetch seasonal anime
  const { data: seasonalAnime, isLoading: seasonalLoading } = useQuery({
    queryKey: ["seasonal-anime"],
    queryFn: () => animeAPI.getSeasonal(),
  })

  // Fetch top manga
  const { data: topManga, isLoading: mangaLoading } = useQuery({
    queryKey: ["top-manga"],
    queryFn: () => mangaAPI.getTop(),
  })

  useEffect(() => {
    if (trendingData?.data?.quote) {
      setCurrentQuote(trendingData.data.quote)
    }
  }, [trendingData])

  const features = [
    {
      icon: Play,
      title: "Watch Anime",
      description: "Discover and track your favorite anime series",
      href: "/anime",
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: BookOpen,
      title: "Read Manga",
      description: "Explore vast manga collections with AI narration",
      href: "/manga",
      color: "from-green-500 to-emerald-500",
    },
    {
      icon: MessageCircle,
      title: "Chat with Characters",
      description: "AI-powered conversations with anime characters",
      href: "/chat",
      color: "from-purple-500 to-pink-500",
    },
    {
      icon: Trophy,
      title: "Take Quizzes",
      description: "Test your anime and manga knowledge",
      href: "/quiz",
      color: "from-orange-500 to-red-500",
    },
    {
      icon: Users,
      title: "Join Community",
      description: "Connect with fellow otaku worldwide",
      href: "/community",
      color: "from-indigo-500 to-purple-500",
    },
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="absolute inset-0">
          <ThreeScene />
        </div>
        <div className="relative z-10 container mx-auto px-4 py-20">
          <div className="text-center space-y-8">
            <div className="space-y-4">
              <Badge variant="secondary" className="px-4 py-2">
                <Sparkles className="w-4 h-4 mr-2" />
                Ultimate Anime & Manga Experience
              </Badge>
              <h1 className="text-4xl md:text-6xl font-bold text-white">
                Welcome to{" "}
                <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  MangaVerse
                </span>
              </h1>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Discover, read, watch, and chat with your favorite anime and manga characters. Experience the ultimate
                otaku platform with AI-powered features.
              </p>
            </div>

            {/* Quote of the Day */}
            {currentQuote && (
              <Card className="max-w-2xl mx-auto bg-black/20 backdrop-blur border-white/10">
                <CardContent className="p-6">
                  <blockquote className="text-lg italic text-white">"{currentQuote.quote}"</blockquote>
                  <cite className="text-sm text-gray-300 mt-2 block">
                    — {currentQuote.character} from {currentQuote.anime}
                  </cite>
                </CardContent>
              </Card>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {user ? (
                <Button size="lg" asChild>
                  <Link href="/dashboard">
                    <Sparkles className="w-5 h-5 mr-2" />
                    Go to Dashboard
                  </Link>
                </Button>
              ) : (
                <>
                  <Button size="lg" asChild>
                    <Link href="/register">
                      Get Started Free
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <Link href="/login">Sign In</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">Everything You Need in One Platform</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              From watching anime to chatting with AI characters, MangaVerse has it all
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="group hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <div
                    className={`w-12 h-12 rounded-lg bg-gradient-to-r ${feature.color} flex items-center justify-center mb-4`}
                  >
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="group-hover:text-primary transition-colors">{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="ghost" asChild className="w-full">
                    <Link href={feature.href}>
                      Explore
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* User Dashboard Section */}
      {user && (
        <section className="py-20 bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold">Your Dashboard</h2>
              <Button asChild>
                <Link href="/dashboard">View Full Dashboard</Link>
              </Button>
            </div>

            {dashboardLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-8 w-16" />
                    </CardHeader>
                  </Card>
                ))}
              </div>
            ) : (
              dashboardData?.data && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Anime Watched</CardTitle>
                      <Play className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{dashboardData.data.stats.anime.totalWatched}</div>
                      <p className="text-xs text-muted-foreground">
                        Avg Rating: {dashboardData.data.stats.anime.averageRating.toFixed(1)}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Manga Read</CardTitle>
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{dashboardData.data.stats.manga.totalRead}</div>
                      <p className="text-xs text-muted-foreground">
                        Avg Rating: {dashboardData.data.stats.manga.averageRating.toFixed(1)}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Achievements</CardTitle>
                      <Trophy className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{dashboardData.data.stats.achievements.totalUnlocked}</div>
                      <p className="text-xs text-muted-foreground">
                        Level {dashboardData.data.user.level} • {dashboardData.data.user.xp} XP
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )
            )}
          </div>
        </section>
      )}

      {/* Trending Content */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="space-y-12">
            {/* Trending Anime */}
            <div>
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-6 h-6 text-primary" />
                  <h2 className="text-3xl font-bold">Trending Anime</h2>
                </div>
                <Button variant="outline" asChild>
                  <Link href="/anime">View All</Link>
                </Button>
              </div>

              {trendingLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="aspect-[3/4] w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-2/3" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {trendingData?.data?.anime?.slice(0, 6).map((anime: any) => (
                    <AnimeCard key={anime.id} anime={anime} />
                  ))}
                </div>
              )}
            </div>

            {/* Trending Manga */}
            <div>
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-2">
                  <Star className="w-6 h-6 text-primary" />
                  <h2 className="text-3xl font-bold">Trending Manga</h2>
                </div>
                <Button variant="outline" asChild>
                  <Link href="/manga">View All</Link>
                </Button>
              </div>

              {trendingLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="aspect-[3/4] w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-2/3" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {trendingData?.data?.manga?.slice(0, 6).map((manga: any) => (
                    <MangaCard key={manga.id} manga={manga} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Chat with Characters CTA */}
      <section className="py-20 bg-gradient-to-r from-purple-600 to-pink-600">
        <div className="container mx-auto px-4 text-center">
          <div className="space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold text-white">Chat with Your Favorite Characters</h2>
            <p className="text-xl text-purple-100 max-w-2xl mx-auto">
              Experience AI-powered conversations with anime and manga characters. They know their stories,
              personalities, and can answer your questions!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" asChild>
                <Link href="/chat">
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Start Chatting
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-white border-white hover:bg-white hover:text-purple-600 bg-transparent"
                asChild
              >
                <Link href="/chat/characters">Browse Characters</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Character Chat Launcher */}
      <CharacterChatLauncher />
    </div>
  )
}
