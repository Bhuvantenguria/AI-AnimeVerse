"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  Settings,
  Trophy,
  Star,
  Clock,
  BookOpen,
  Play,
  MessageCircle,
  Heart,
  Users,
  Calendar,
  Zap,
  Edit,
  Camera,
  Share2,
  Crown,
} from "lucide-react"
import { cn } from "@/lib/utils"

// Mock user data
const userData = {
  name: "OtakuMaster",
  username: "@otakumaster",
  avatar: "/placeholder.svg?height=120&width=120",
  banner: "/placeholder.svg?height=200&width=800",
  bio: "Passionate anime and manga enthusiast. Love discussing theories and discovering hidden gems. Currently reading One Piece and watching seasonal anime.",
  joinDate: "March 2022",
  location: "Tokyo, Japan",
  website: "otakumaster.blog",
  stats: {
    followers: 15420,
    following: 892,
    posts: 234,
    watchTime: 2840, // hours
    chaptersRead: 1250,
    quizScore: 98,
    rank: 1,
    xp: 15420,
    level: 42,
    nextLevelXp: 16000,
  },
  badges: [
    { name: "Quiz Master", icon: Trophy, color: "text-yellow-500", description: "Scored 95%+ on 10 quizzes" },
    { name: "Binge Watcher", icon: Play, color: "text-blue-500", description: "Watched 100+ hours this month" },
    { name: "Manga Expert", icon: BookOpen, color: "text-green-500", description: "Read 500+ chapters" },
    { name: "Community Hero", icon: Users, color: "text-purple-500", description: "Helped 100+ users" },
    { name: "Early Bird", icon: Clock, color: "text-orange-500", description: "First to comment on 50 posts" },
    { name: "Loyal Fan", icon: Heart, color: "text-red-500", description: "Active for 2+ years" },
  ],
  favoriteAnime: [
    { title: "Attack on Titan", image: "/placeholder.svg?height=150&width=100", rating: 10 },
    { title: "One Piece", image: "/placeholder.svg?height=150&width=100", rating: 9.5 },
    { title: "Demon Slayer", image: "/placeholder.svg?height=150&width=100", rating: 9 },
    { title: "Jujutsu Kaisen", image: "/placeholder.svg?height=150&width=100", rating: 9 },
  ],
  recentActivity: [
    { type: "watched", content: "Completed Attack on Titan Final Season", time: "2 hours ago", icon: Play },
    { type: "read", content: "Read One Piece Chapter 1100", time: "5 hours ago", icon: BookOpen },
    { type: "quiz", content: "Scored 95% on Demon Slayer Quiz", time: "1 day ago", icon: Trophy },
    { type: "post", content: "Posted theory about One Piece ending", time: "2 days ago", icon: MessageCircle },
    { type: "follow", content: "Started following @mangaexpert", time: "3 days ago", icon: Users },
  ],
}

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("overview")
  const [isEditing, setIsEditing] = useState(false)

  const progressToNextLevel = ((userData.stats.xp - userData.stats.level * 350) / 350) * 100

  return (
    <div className="min-h-screen">
      {/* Banner Section */}
      <div className="relative h-48 md:h-64 overflow-hidden">
        <div
          className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20"
          style={{
            backgroundImage: `url(${userData.banner})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />

        {/* Edit Banner Button */}
        <Button variant="ghost" size="icon" className="absolute top-4 right-4 bg-black/20 hover:bg-black/40 text-white">
          <Camera className="h-4 w-4" />
        </Button>
      </div>

      {/* Profile Header */}
      <div className="container mx-auto px-4 -mt-16 relative z-10">
        <div className="flex flex-col md:flex-row items-start md:items-end space-y-4 md:space-y-0 md:space-x-6 mb-8">
          {/* Avatar */}
          <div className="relative animate-scale-in">
            <Avatar className="w-32 h-32 border-4 border-background shadow-xl">
              <AvatarImage src={userData.avatar || "/placeholder.svg"} alt={userData.name} />
              <AvatarFallback className="text-2xl">{userData.name[0]}</AvatarFallback>
            </Avatar>
            <Button
              variant="ghost"
              size="icon"
              className="absolute bottom-0 right-0 bg-primary hover:bg-primary/80 text-primary-foreground rounded-full"
            >
              <Camera className="h-4 w-4" />
            </Button>
          </div>

          {/* User Info */}
          <div className="flex-1 animate-slide-in-up" style={{ animationDelay: "0.1s" }}>
            <div className="flex items-center space-x-3 mb-2">
              <h1 className="text-3xl md:text-4xl font-bold">{userData.name}</h1>
              {userData.stats.rank <= 3 && <Crown className="h-8 w-8 text-yellow-500 animate-bounce" />}
            </div>
            <p className="text-muted-foreground text-lg mb-2">{userData.username}</p>
            <p className="text-muted-foreground mb-4 max-w-2xl">{userData.bio}</p>

            {/* Quick Stats */}
            <div className="flex flex-wrap gap-6 text-sm">
              <div className="flex items-center space-x-1">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Joined {userData.joinDate}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>{userData.stats.followers.toLocaleString()} followers</span>
              </div>
              <div className="flex items-center space-x-1">
                <Trophy className="h-4 w-4 text-muted-foreground" />
                <span>Rank #{userData.stats.rank}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 animate-slide-in-right">
            <Button onClick={() => setIsEditing(!isEditing)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Profile
            </Button>
            <Button variant="outline">
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
            <Button variant="outline" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Level Progress */}
        <Card className="mb-8 animate-slide-in-up" style={{ animationDelay: "0.2s" }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-xl">Level {userData.stats.level}</h3>
                  <p className="text-muted-foreground">Otaku Master</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-2xl text-primary">{userData.stats.xp.toLocaleString()} XP</p>
                <p className="text-sm text-muted-foreground">
                  {userData.stats.nextLevelXp - userData.stats.xp} to next level
                </p>
              </div>
            </div>
            <Progress value={progressToNextLevel} className="h-3 animate-pulse-glow" />
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 animate-slide-in-up" style={{ animationDelay: "0.3s" }}>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="stats">Stats</TabsTrigger>
            <TabsTrigger value="badges">Badges</TabsTrigger>
            <TabsTrigger value="favorites">Favorites</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="card-3d animate-scale-in">
                <CardContent className="p-6 text-center">
                  <Play className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                  <h3 className="text-2xl font-bold">{userData.stats.watchTime}h</h3>
                  <p className="text-muted-foreground">Watch Time</p>
                </CardContent>
              </Card>

              <Card className="card-3d animate-scale-in" style={{ animationDelay: "0.1s" }}>
                <CardContent className="p-6 text-center">
                  <BookOpen className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <h3 className="text-2xl font-bold">{userData.stats.chaptersRead}</h3>
                  <p className="text-muted-foreground">Chapters Read</p>
                </CardContent>
              </Card>

              <Card className="card-3d animate-scale-in" style={{ animationDelay: "0.2s" }}>
                <CardContent className="p-6 text-center">
                  <Trophy className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                  <h3 className="text-2xl font-bold">{userData.stats.quizScore}%</h3>
                  <p className="text-muted-foreground">Quiz Score</p>
                </CardContent>
              </Card>

              <Card className="card-3d animate-scale-in" style={{ animationDelay: "0.3s" }}>
                <CardContent className="p-6 text-center">
                  <Crown className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                  <h3 className="text-2xl font-bold">#{userData.stats.rank}</h3>
                  <p className="text-muted-foreground">Global Rank</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card className="animate-slide-in-up" style={{ animationDelay: "0.4s" }}>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {userData.recentActivity.slice(0, 5).map((activity, index) => {
                  const Icon = activity.icon
                  return (
                    <div
                      key={index}
                      className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors animate-slide-in-left"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{activity.content}</p>
                        <p className="text-sm text-muted-foreground">{activity.time}</p>
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Stats Tab */}
          <TabsContent value="stats" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="animate-slide-in-left">
                <CardHeader>
                  <CardTitle>Watching Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Total Watch Time</span>
                    <span className="font-bold">{userData.stats.watchTime} hours</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Average per Day</span>
                    <span className="font-bold">4.2 hours</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Completed Series</span>
                    <span className="font-bold">127</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Currently Watching</span>
                    <span className="font-bold">15</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="animate-slide-in-right">
                <CardHeader>
                  <CardTitle>Reading Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Chapters Read</span>
                    <span className="font-bold">{userData.stats.chaptersRead}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Completed Manga</span>
                    <span className="font-bold">89</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Currently Reading</span>
                    <span className="font-bold">23</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Reading Streak</span>
                    <span className="font-bold">45 days</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Badges Tab */}
          <TabsContent value="badges" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userData.badges.map((badge, index) => {
                const Icon = badge.icon
                return (
                  <Card
                    key={badge.name}
                    className="card-3d animate-bounce-in cursor-pointer hover:scale-105 transition-transform"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <CardContent className="p-6 text-center">
                      <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Icon className={cn("h-8 w-8", badge.color)} />
                      </div>
                      <h3 className="font-bold text-lg mb-2">{badge.name}</h3>
                      <p className="text-sm text-muted-foreground">{badge.description}</p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>

          {/* Favorites Tab */}
          <TabsContent value="favorites" className="space-y-6">
            <Card className="animate-slide-in-up">
              <CardHeader>
                <CardTitle>Favorite Anime</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {userData.favoriteAnime.map((anime, index) => (
                    <div
                      key={anime.title}
                      className="text-center animate-scale-in card-3d"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="aspect-[3/4] bg-muted rounded-lg mb-2 overflow-hidden">
                        <img
                          src={anime.image || "/placeholder.svg"}
                          alt={anime.title}
                          className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                        />
                      </div>
                      <h4 className="font-semibold text-sm mb-1">{anime.title}</h4>
                      <div className="flex items-center justify-center space-x-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm">{anime.rating}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-6">
            <Card className="animate-slide-in-up">
              <CardHeader>
                <CardTitle>All Activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {userData.recentActivity.map((activity, index) => {
                  const Icon = activity.icon
                  return (
                    <div
                      key={index}
                      className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors animate-slide-in-left"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{activity.content}</p>
                        <p className="text-sm text-muted-foreground">{activity.time}</p>
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
