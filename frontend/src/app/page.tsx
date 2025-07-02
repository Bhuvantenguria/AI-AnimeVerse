"use client"

import { useQuery } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { Play, BookOpen, MessageCircle, TrendingUp, Star, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { animeAPI, mangaAPI, dashboardAPI } from "@/lib/api"
import Link from "next/link"

export default function HomePage() {
  const { data: trendingAnime } = useQuery({
    queryKey: ["trending-anime"],
    queryFn: () => animeAPI.getTrending(),
  })

  const { data: trendingManga } = useQuery({
    queryKey: ["trending-manga"],
    queryFn: () => mangaAPI.getTrending(),
  })

  const { data: dashboardData } = useQuery({
    queryKey: ["dashboard-trending"],
    queryFn: () => dashboardAPI.getTrending(),
  })

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-pink-900/20" />
        <div className="absolute inset-0 bg-[url('/hero-bg.jpg')] bg-cover bg-center opacity-10" />

        <div className="relative z-10 text-center max-w-4xl mx-auto px-4">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-6xl md:text-8xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent mb-6"
          >
            MangaVerse
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto"
          >
            Your ultimate destination for anime and manga discovery, powered by AI
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button size="lg" className="text-lg px-8 py-6" asChild>
              <Link href="/anime">
                <Play className="mr-2 h-5 w-5" />
                Explore Anime
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-6 bg-transparent" asChild>
              <Link href="/manga">
                <BookOpen className="mr-2 h-5 w-5" />
                Read Manga
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Everything You Need</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Discover, track, and engage with your favorite anime and manga like never before
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Play,
                title: "Anime Discovery",
                description: "Explore thousands of anime with advanced search and filtering",
                color: "text-purple-400",
              },
              {
                icon: BookOpen,
                title: "Manga Reading",
                description: "Read manga with our beautiful reader and progress tracking",
                color: "text-blue-400",
              },
              {
                icon: MessageCircle,
                title: "AI Chat",
                description: "Chat with your favorite anime characters using AI",
                color: "text-pink-400",
              },
              {
                icon: TrendingUp,
                title: "Progress Tracking",
                description: "Keep track of your watching and reading progress",
                color: "text-green-400",
              },
              {
                icon: Users,
                title: "Community",
                description: "Connect with other fans and share your thoughts",
                color: "text-orange-400",
              },
              {
                icon: Star,
                title: "Recommendations",
                description: "Get personalized recommendations based on your taste",
                color: "text-yellow-400",
              },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <feature.icon className={`h-12 w-12 ${feature.color} mb-4`} />
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trending Section */}
      <section className="py-20 px-4 bg-muted/50">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Trending Now</h2>
            <p className="text-xl text-muted-foreground">See what's popular in the anime and manga community</p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Trending Anime */}
            <div>
              <h3 className="text-2xl font-bold mb-6 flex items-center">
                <Play className="mr-2 h-6 w-6 text-purple-400" />
                Trending Anime
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {trendingAnime?.data?.data?.slice(0, 6).map((anime: any, index: number) => (
                  <motion.div
                    key={anime.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                      <div className="aspect-[3/4] relative">
                        <img
                          src={anime.coverImage || "/placeholder.svg?height=300&width=225"}
                          alt={anime.title}
                          className="w-full h-full object-cover"
                        />
                        {anime.rating && (
                          <Badge className="absolute top-2 right-2">
                            <Star className="w-3 h-3 mr-1" />
                            {anime.rating}
                          </Badge>
                        )}
                      </div>
                      <CardContent className="p-3">
                        <h4 className="font-semibold text-sm line-clamp-2">{anime.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1">{anime.year}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
              <div className="mt-6 text-center">
                <Button variant="outline" asChild>
                  <Link href="/anime">View All Anime</Link>
                </Button>
              </div>
            </div>

            {/* Trending Manga */}
            <div>
              <h3 className="text-2xl font-bold mb-6 flex items-center">
                <BookOpen className="mr-2 h-6 w-6 text-blue-400" />
                Trending Manga
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {trendingManga?.data?.data?.slice(0, 6).map((manga: any, index: number) => (
                  <motion.div
                    key={manga.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                      <div className="aspect-[3/4] relative">
                        <img
                          src={manga.coverImage || "/placeholder.svg?height=300&width=225"}
                          alt={manga.title}
                          className="w-full h-full object-cover"
                        />
                        {manga.rating && (
                          <Badge className="absolute top-2 right-2">
                            <Star className="w-3 h-3 mr-1" />
                            {manga.rating}
                          </Badge>
                        )}
                      </div>
                      <CardContent className="p-3">
                        <h4 className="font-semibold text-sm line-clamp-2">{manga.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1">{manga.year}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
              <div className="mt-6 text-center">
                <Button variant="outline" asChild>
                  <Link href="/manga">View All Manga</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to Start Your Journey?</h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands of anime and manga fans in the ultimate community platform
            </p>
            <Button size="lg" className="text-lg px-8 py-6" asChild>
              <Link href="/register">Get Started Free</Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
