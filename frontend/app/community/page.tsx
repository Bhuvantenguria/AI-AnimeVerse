"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Users,
  MessageCircle,
  Heart,
  Share2,
  Search,
  Plus,
  TrendingUp,
  FlameIcon as Fire,
  Clock,
  UserPlus,
  Eye,
} from "lucide-react"
import { cn } from "@/lib/utils"

// Mock community data
const forumPosts = [
  {
    id: "1",
    title: "Attack on Titan Ending Discussion - What did you think?",
    author: "OtakuMaster",
    avatar: "/placeholder.svg?height=40&width=40",
    content:
      "Just finished the final episode and I'm still processing everything. The way they handled Eren's character development was incredible...",
    likes: 234,
    replies: 89,
    timeAgo: "2 hours ago",
    tags: ["Attack on Titan", "Discussion", "Spoilers"],
    isHot: true,
  },
  {
    id: "2",
    title: "Best Manga Reading Apps in 2024?",
    author: "MangaReader",
    avatar: "/placeholder.svg?height=40&width=40",
    content:
      "Looking for recommendations for manga reading apps. What are you all using? I need something with good offline support...",
    likes: 156,
    replies: 45,
    timeAgo: "4 hours ago",
    tags: ["Manga", "Apps", "Recommendation"],
    isHot: false,
  },
  {
    id: "3",
    title: "One Piece Chapter 1100 Theories",
    author: "PirateKing",
    avatar: "/placeholder.svg?height=40&width=40",
    content:
      "The latest chapter dropped some major hints about the final saga. Here's my theory about what's coming next...",
    likes: 312,
    replies: 127,
    timeAgo: "6 hours ago",
    tags: ["One Piece", "Theory", "Manga"],
    isHot: true,
  },
]

const trendingUsers = [
  {
    id: "1",
    name: "AnimeCritic",
    avatar: "/placeholder.svg?height=40&width=40",
    followers: 15420,
    posts: 234,
    badge: "Verified Reviewer",
    isFollowing: false,
  },
  {
    id: "2",
    name: "MangaExpert",
    avatar: "/placeholder.svg?height=40&width=40",
    followers: 12890,
    posts: 189,
    badge: "Top Contributor",
    isFollowing: true,
  },
  {
    id: "3",
    name: "OtakuNews",
    avatar: "/placeholder.svg?height=40&width=40",
    followers: 23450,
    posts: 567,
    badge: "News Source",
    isFollowing: false,
  },
]

const trendingTopics = [
  { name: "Attack on Titan", posts: 1234, trend: "+15%" },
  { name: "Demon Slayer", posts: 987, trend: "+8%" },
  { name: "One Piece", posts: 2341, trend: "+23%" },
  { name: "Jujutsu Kaisen", posts: 876, trend: "+12%" },
  { name: "Chainsaw Man", posts: 654, trend: "+5%" },
]

export default function CommunityPage() {
  const [activeTab, setActiveTab] = useState("forums")
  const [searchTerm, setSearchTerm] = useState("")
  const [followingUsers, setFollowingUsers] = useState<string[]>(["2"])

  const toggleFollow = (userId: string) => {
    setFollowingUsers((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]))
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <Users className="h-8 w-8 text-primary animate-bounce" />
          <h1 className="text-4xl md:text-5xl font-bold text-gradient">Community</h1>
        </div>
        <p className="text-muted-foreground text-xl">Connect with fellow otaku worldwide</p>
      </div>

      {/* Search Bar */}
      <div className="max-w-2xl mx-auto mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search discussions, users, or topics..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 py-3 text-lg animate-slide-in-up"
          />
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 animate-slide-in-up">
          <TabsTrigger value="forums" className="flex items-center space-x-2">
            <MessageCircle className="h-4 w-4" />
            <span>Forums</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Users</span>
          </TabsTrigger>
          <TabsTrigger value="trending" className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4" />
            <span>Trending</span>
          </TabsTrigger>
          <TabsTrigger value="following" className="flex items-center space-x-2">
            <Heart className="h-4 w-4" />
            <span>Following</span>
          </TabsTrigger>
        </TabsList>

        {/* Forums Tab */}
        <TabsContent value="forums" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Latest Discussions</h2>
            <Button className="animate-pulse-glow">
              <Plus className="mr-2 h-4 w-4" />
              New Post
            </Button>
          </div>

          <div className="space-y-4">
            {forumPosts.map((post, index) => (
              <Card
                key={post.id}
                className={cn(
                  "card-3d animate-slide-in-up cursor-pointer hover:shadow-lg transition-all duration-300",
                  post.isHot && "border-orange-500/50 bg-gradient-to-r from-orange-500/5 to-red-500/5",
                )}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={post.avatar || "/placeholder.svg"} alt={post.author} />
                        <AvatarFallback>{post.author[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{post.author}</p>
                        <p className="text-sm text-muted-foreground flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {post.timeAgo}
                        </p>
                      </div>
                    </div>
                    {post.isHot && (
                      <Badge variant="destructive" className="animate-pulse">
                        <Fire className="h-3 w-3 mr-1" />
                        Hot
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-xl hover:text-primary transition-colors">{post.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4 line-clamp-2">{post.content}</p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {post.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="hover:bg-primary hover:text-primary-foreground transition-colors"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Button variant="ghost" size="sm" className="interactive-hover">
                        <Heart className="h-4 w-4 mr-1" />
                        {post.likes}
                      </Button>
                      <Button variant="ghost" size="sm" className="interactive-hover">
                        <MessageCircle className="h-4 w-4 mr-1" />
                        {post.replies}
                      </Button>
                    </div>
                    <Button variant="ghost" size="sm" className="interactive-hover">
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          <h2 className="text-2xl font-bold">Trending Users</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trendingUsers.map((user, index) => (
              <Card key={user.id} className="card-3d animate-scale-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <CardContent className="p-6 text-center">
                  <Avatar className="w-20 h-20 mx-auto mb-4 ring-4 ring-primary/20">
                    <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                    <AvatarFallback className="text-lg">{user.name[0]}</AvatarFallback>
                  </Avatar>

                  <h3 className="font-bold text-xl mb-2">{user.name}</h3>
                  <Badge variant="secondary" className="mb-4">
                    {user.badge}
                  </Badge>

                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                    <div>
                      <p className="font-semibold text-lg">{user.followers.toLocaleString()}</p>
                      <p className="text-muted-foreground">Followers</p>
                    </div>
                    <div>
                      <p className="font-semibold text-lg">{user.posts}</p>
                      <p className="text-muted-foreground">Posts</p>
                    </div>
                  </div>

                  <Button
                    className={cn(
                      "w-full transition-all duration-300",
                      followingUsers.includes(user.id) ? "bg-green-500 hover:bg-green-600" : "animate-pulse-glow",
                    )}
                    onClick={() => toggleFollow(user.id)}
                  >
                    {followingUsers.includes(user.id) ? (
                      <>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Following
                      </>
                    ) : (
                      <>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Follow
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Trending Tab */}
        <TabsContent value="trending" className="space-y-6">
          <h2 className="text-2xl font-bold">Trending Topics</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="animate-slide-in-left">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <span>Hot Topics</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {trendingTopics.map((topic, index) => (
                  <div
                    key={topic.name}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer animate-slide-in-up"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div>
                      <p className="font-semibold">{topic.name}</p>
                      <p className="text-sm text-muted-foreground">{topic.posts} posts</p>
                    </div>
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      {topic.trend}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="animate-slide-in-right">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Eye className="h-5 w-5 text-primary" />
                  <span>Most Viewed</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {forumPosts.slice(0, 3).map((post, index) => (
                  <div
                    key={post.id}
                    className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer animate-slide-in-up"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={post.avatar || "/placeholder.svg"} alt={post.author} />
                      <AvatarFallback>{post.author[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm line-clamp-2">{post.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {post.author} • {post.timeAgo}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Following Tab */}
        <TabsContent value="following" className="space-y-6">
          <h2 className="text-2xl font-bold">Following Feed</h2>

          {followingUsers.length === 0 ? (
            <Card className="text-center p-12 animate-scale-in">
              <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No one followed yet</h3>
              <p className="text-muted-foreground mb-4">Start following users to see their posts here</p>
              <Button onClick={() => setActiveTab("users")}>Find Users to Follow</Button>
            </Card>
          ) : (
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Posts from {followingUsers.length} user{followingUsers.length !== 1 ? "s" : ""} you follow
              </p>
              {/* This would show posts from followed users */}
              <Card className="animate-slide-in-up">
                <CardContent className="p-6 text-center">
                  <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Your following feed will appear here</p>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
