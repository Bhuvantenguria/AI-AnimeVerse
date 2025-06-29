"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Trophy, Medal, Crown, Star, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"

// Mock leaderboard data
const leaderboardData = [
  {
    rank: 1,
    name: "OtakuMaster",
    avatar: "/placeholder.svg?height=40&width=40",
    score: 15420,
    watchTime: 2840,
    chaptersRead: 1250,
    quizScore: 98,
    badges: ["Quiz Master", "Binge Watcher", "Manga Expert"],
    country: "JP",
  },
  {
    rank: 2,
    name: "AnimeFan2024",
    avatar: "/placeholder.svg?height=40&width=40",
    score: 14890,
    watchTime: 2650,
    chaptersRead: 980,
    quizScore: 95,
    badges: ["Speed Reader", "Community Hero"],
    country: "US",
  },
  {
    rank: 3,
    name: "MangaReader",
    avatar: "/placeholder.svg?height=40&width=40",
    score: 13750,
    watchTime: 1980,
    chaptersRead: 1800,
    quizScore: 92,
    badges: ["Manga Expert", "Early Bird"],
    country: "KR",
  },
  {
    rank: 4,
    name: "NarutoFan",
    avatar: "/placeholder.svg?height=40&width=40",
    score: 12340,
    watchTime: 2100,
    chaptersRead: 750,
    quizScore: 89,
    badges: ["Loyal Fan"],
    country: "BR",
  },
  {
    rank: 5,
    name: "OnePieceLover",
    avatar: "/placeholder.svg?height=40&width=40",
    score: 11890,
    watchTime: 1950,
    chaptersRead: 890,
    quizScore: 87,
    badges: ["Adventure Seeker"],
    country: "FR",
  },
]

const categories = [
  { id: "overall", label: "Overall", icon: Trophy },
  { id: "watchTime", label: "Watch Time", icon: TrendingUp },
  { id: "reading", label: "Reading", icon: Star },
  { id: "quiz", label: "Quiz Master", icon: Medal },
]

export default function LeaderboardPage() {
  const [activeCategory, setActiveCategory] = useState("overall")
  const [timeFilter, setTimeFilter] = useState("all-time")
  const [regionFilter, setRegionFilter] = useState("global")

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-6 w-6 text-yellow-500" />
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />
      case 3:
        return <Medal className="h-6 w-6 text-orange-600" />
      default:
        return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>
    }
  }

  const getRankBg = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/50"
      case 2:
        return "bg-gradient-to-r from-gray-400/20 to-gray-600/20 border-gray-400/50"
      case 3:
        return "bg-gradient-to-r from-orange-600/20 to-red-600/20 border-orange-600/50"
      default:
        return "bg-card border"
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <Trophy className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold">Leaderboard</h1>
        </div>
        <p className="text-muted-foreground text-lg">Compete with otaku worldwide and climb the ranks!</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => {
            const Icon = category.icon
            return (
              <Button
                key={category.id}
                variant={activeCategory === category.id ? "default" : "outline"}
                onClick={() => setActiveCategory(category.id)}
                className="flex items-center space-x-2"
              >
                <Icon className="h-4 w-4" />
                <span>{category.label}</span>
              </Button>
            )
          })}
        </div>

        {/* Time and Region Filters */}
        <div className="flex gap-2 ml-auto">
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            className="bg-background border border-border rounded px-3 py-2 text-sm"
          >
            <option value="all-time">All Time</option>
            <option value="monthly">This Month</option>
            <option value="weekly">This Week</option>
          </select>

          <select
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            className="bg-background border border-border rounded px-3 py-2 text-sm"
          >
            <option value="global">Global</option>
            <option value="friends">Friends Only</option>
            <option value="country">My Country</option>
          </select>
        </div>
      </div>

      {/* Top 3 Podium */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {leaderboardData.slice(0, 3).map((user, index) => (
          <div
            key={user.rank}
            className={cn(
              "relative p-6 rounded-xl text-center transition-all duration-300 card-hover",
              getRankBg(user.rank),
              index === 0 && "md:order-2 md:scale-105",
              index === 1 && "md:order-1",
              index === 2 && "md:order-3",
            )}
          >
            {/* Rank Icon */}
            <div className="flex justify-center mb-4">{getRankIcon(user.rank)}</div>

            {/* Avatar */}
            <Avatar className="w-16 h-16 mx-auto mb-4 ring-4 ring-primary/20">
              <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
              <AvatarFallback>{user.name[0]}</AvatarFallback>
            </Avatar>

            {/* User Info */}
            <h3 className="font-bold text-lg mb-2">{user.name}</h3>
            <p className="text-2xl font-bold text-primary mb-2">{user.score.toLocaleString()} XP</p>

            {/* Stats */}
            <div className="text-sm text-muted-foreground space-y-1">
              <p>{user.watchTime}h watched</p>
              <p>{user.chaptersRead} chapters read</p>
              <p>{user.quizScore}% quiz score</p>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-1 justify-center mt-4">
              {user.badges.slice(0, 2).map((badge) => (
                <Badge key={badge} variant="secondary" className="text-xs">
                  {badge}
                </Badge>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Full Leaderboard */}
      <div className="bg-card border rounded-xl overflow-hidden">
        <div className="p-4 border-b bg-muted/50">
          <h2 className="text-xl font-semibold">Full Rankings</h2>
        </div>

        <div className="divide-y">
          {leaderboardData.map((user, index) => (
            <div
              key={user.rank}
              className="p-4 hover:bg-muted/50 transition-colors animate-slide-in-up"
              style={{ animationDelay: `${index * 0.05}s` } as any}
            >
              <div className="flex items-center space-x-4">
                {/* Rank */}
                <div className="w-12 flex justify-center">{getRankIcon(user.rank)}</div>

                {/* Avatar */}
                <Avatar className="w-12 h-12">
                  <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                  <AvatarFallback>{user.name[0]}</AvatarFallback>
                </Avatar>

                {/* User Info */}
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold">{user.name}</h3>
                    <span className="text-xs text-muted-foreground">{user.country}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {user.badges.slice(0, 3).map((badge) => (
                      <Badge key={badge} variant="outline" className="text-xs">
                        {badge}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Stats */}
                <div className="hidden md:flex space-x-6 text-sm text-muted-foreground">
                  <div className="text-center">
                    <p className="font-semibold text-foreground">{user.watchTime}h</p>
                    <p>Watched</p>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-foreground">{user.chaptersRead}</p>
                    <p>Chapters</p>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-foreground">{user.quizScore}%</p>
                    <p>Quiz</p>
                  </div>
                </div>

                {/* Score */}
                <div className="text-right">
                  <p className="text-xl font-bold text-primary">{user.score.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">XP</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Your Rank */}
      <div className="mt-8 p-4 bg-primary/10 border border-primary/20 rounded-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
              <span className="font-bold">#42</span>
            </div>
            <div>
              <h3 className="font-semibold">Your Rank</h3>
              <p className="text-sm text-muted-foreground">8,450 XP • Keep going!</p>
            </div>
          </div>
          <Button>View Profile</Button>
        </div>
      </div>
    </div>
  )
}
