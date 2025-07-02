export default async function dashboardRoutes(fastify, options) {
  // Get user dashboard stats
  fastify.get("/stats", { preHandler: fastify.authenticate }, async (request, reply) => {
    const user = await fastify.getUser(request)
    if (!user) {
      return reply.code(404).send({ error: "User not found" })
    }

    try {
      const [animeStats, mangaStats, chatStats, quizStats, communityStats, achievementStats] = await Promise.all([
        // Anime statistics
        fastify.prisma.watchlist.aggregate({
          where: { userId: user.id },
          _count: { id: true },
          _avg: { rating: true },
        }),

        // Manga statistics
        fastify.prisma.readingList.aggregate({
          where: { userId: user.id },
          _count: { id: true },
          _avg: { rating: true },
        }),

        // Chat statistics
        fastify.prisma.chatSession.aggregate({
          where: { userId: user.id },
          _count: { id: true },
        }),

        // Quiz statistics
        fastify.prisma.quizAnswer.aggregate({
          where: { userId: user.id },
          _count: { id: true },
          _sum: { score: true },
          _avg: { score: true },
        }),

        // Community statistics
        Promise.all([
          fastify.prisma.post.count({ where: { userId: user.id } }),
          fastify.prisma.comment.count({ where: { userId: user.id } }),
          fastify.prisma.like.count({ where: { userId: user.id } }),
        ]),

        // Achievement statistics
        fastify.prisma.userAchievement.count({ where: { userId: user.id } }),
      ])

      const [postsCount, commentsCount, likesCount] = communityStats

      return {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
          level: user.level,
          xp: user.xp,
          isPremium: user.isPremium,
          joinedAt: user.createdAt,
        },
        stats: {
          anime: {
            totalWatched: animeStats._count.id,
            averageRating: animeStats._avg.rating || 0,
          },
          manga: {
            totalRead: mangaStats._count.id,
            averageRating: mangaStats._avg.rating || 0,
          },
          chat: {
            totalSessions: chatStats._count.id,
          },
          quiz: {
            totalQuizzes: quizStats._count.id,
            totalScore: quizStats._sum.score || 0,
            averageScore: quizStats._avg.score || 0,
          },
          community: {
            postsCreated: postsCount,
            commentsPosted: commentsCount,
            likesGiven: likesCount,
          },
          achievements: {
            totalUnlocked: achievementStats,
          },
        },
      }
    } catch (error) {
      fastify.log.error("Dashboard stats error:", error)
      return reply.code(500).send({ error: "Failed to fetch dashboard stats" })
    }
  })

  // Get recent activity
  fastify.get("/activity", { preHandler: fastify.authenticate }, async (request, reply) => {
    const user = await fastify.getUser(request)
    if (!user) {
      return reply.code(404).send({ error: "User not found" })
    }

    const { limit = 20 } = request.query

    try {
      const [recentWatchlist, recentReadingList, recentChatSessions, recentQuizzes, recentPosts, recentAchievements] =
        await Promise.all([
          // Recent anime activity
          fastify.prisma.watchlist.findMany({
            where: { userId: user.id },
            include: {
              anime: {
                select: { title: true, coverImage: true },
              },
            },
            orderBy: { updatedAt: "desc" },
            take: 5,
          }),

          // Recent manga activity
          fastify.prisma.readingList.findMany({
            where: { userId: user.id },
            include: {
              manga: {
                select: { title: true, coverImage: true },
              },
            },
            orderBy: { updatedAt: "desc" },
            take: 5,
          }),

          // Recent chat sessions
          fastify.prisma.chatSession.findMany({
            where: { userId: user.id },
            include: {
              character: {
                select: { name: true, avatar: true },
              },
            },
            orderBy: { lastMessage: "desc" },
            take: 5,
          }),

          // Recent quiz attempts
          fastify.prisma.quizAnswer.findMany({
            where: { userId: user.id },
            include: {
              quiz: {
                select: { title: true },
              },
            },
            orderBy: { completedAt: "desc" },
            take: 5,
          }),

          // Recent posts
          fastify.prisma.post.findMany({
            where: { userId: user.id },
            select: {
              id: true,
              title: true,
              createdAt: true,
              likes: true,
              views: true,
            },
            orderBy: { createdAt: "desc" },
            take: 5,
          }),

          // Recent achievements
          fastify.prisma.userAchievement.findMany({
            where: { userId: user.id },
            include: {
              achievement: {
                select: { name: true, description: true, icon: true },
              },
            },
            orderBy: { unlockedAt: "desc" },
            take: 5,
          }),
        ])

      const activity = [
        ...recentWatchlist.map((item) => ({
          type: "anime",
          action: "watched",
          title: item.anime.title,
          image: item.anime.coverImage,
          timestamp: item.updatedAt,
          status: item.status,
        })),
        ...recentReadingList.map((item) => ({
          type: "manga",
          action: "read",
          title: item.manga.title,
          image: item.manga.coverImage,
          timestamp: item.updatedAt,
          status: item.status,
        })),
        ...recentChatSessions.map((item) => ({
          type: "chat",
          action: "chatted with",
          title: item.character.name,
          image: item.character.avatar,
          timestamp: item.lastMessage,
        })),
        ...recentQuizzes.map((item) => ({
          type: "quiz",
          action: "completed",
          title: item.quiz.title,
          timestamp: item.completedAt,
          score: item.score,
        })),
        ...recentPosts.map((item) => ({
          type: "post",
          action: "posted",
          title: item.title,
          timestamp: item.createdAt,
          likes: item.likes,
          views: item.views,
        })),
        ...recentAchievements.map((item) => ({
          type: "achievement",
          action: "unlocked",
          title: item.achievement.name,
          description: item.achievement.description,
          icon: item.achievement.icon,
          timestamp: item.unlockedAt,
        })),
      ]

      // Sort by timestamp and limit
      activity.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

      return {
        activity: activity.slice(0, Number.parseInt(limit)),
      }
    } catch (error) {
      fastify.log.error("Dashboard activity error:", error)
      return reply.code(500).send({ error: "Failed to fetch recent activity" })
    }
  })

  // Get recommendations
  fastify.get("/recommendations", { preHandler: fastify.authenticate }, async (request, reply) => {
    const user = await fastify.getUser(request)
    if (!user) {
      return reply.code(404).send({ error: "User not found" })
    }

    try {
      // Get user's favorite genres from their watchlist/reading list
      const [animeGenres, mangaGenres] = await Promise.all([
        fastify.prisma.watchlist.findMany({
          where: {
            userId: user.id,
            rating: { gte: 8 },
          },
          include: {
            anime: {
              select: { genres: true },
            },
          },
        }),
        fastify.prisma.readingList.findMany({
          where: {
            userId: user.id,
            rating: { gte: 8 },
          },
          include: {
            manga: {
              select: { genres: true },
            },
          },
        }),
      ])

      // Extract favorite genres
      const favoriteAnimeGenres = [...new Set(animeGenres.flatMap((item) => item.anime.genres || []))].slice(0, 5)

      const favoriteMangaGenres = [...new Set(mangaGenres.flatMap((item) => item.manga.genres || []))].slice(0, 5)

      // Get recommendations from external APIs
      const [animeRecommendations, mangaRecommendations] = await Promise.all([
        getAnimeRecommendations(favoriteAnimeGenres, fastify),
        getMangaRecommendations(favoriteMangaGenres, fastify),
      ])

      return {
        anime: animeRecommendations,
        manga: mangaRecommendations,
        favoriteGenres: {
          anime: favoriteAnimeGenres,
          manga: favoriteMangaGenres,
        },
      }
    } catch (error) {
      fastify.log.error("Dashboard recommendations error:", error)
      return reply.code(500).send({ error: "Failed to fetch recommendations" })
    }
  })

  // Get trending content
  fastify.get("/trending", async (request, reply) => {
    try {
      const [trendingAnime, trendingManga, popularQuotes] = await Promise.all([
        fastify.apiServices.aniList.getTrendingAnime(1, 10),
        fastify.apiServices.aniList.getTrendingManga(1, 10),
        fastify.apiServices.animeChan.getRandomQuote().catch(() => null),
      ])

      return {
        anime: trendingAnime.data?.Page?.media || [],
        manga: trendingManga.data?.Page?.media || [],
        quote: popularQuotes,
      }
    } catch (error) {
      fastify.log.error("Dashboard trending error:", error)
      return reply.code(500).send({ error: "Failed to fetch trending content" })
    }
  })

  // Get platform analytics (admin only)
  fastify.get("/analytics", { preHandler: fastify.authenticate }, async (request, reply) => {
    const user = await fastify.getUser(request)
    if (!user || !user.isAdmin) {
      return reply.code(403).send({ error: "Admin access required" })
    }

    try {
      const [totalUsers, totalAnime, totalManga, totalChats, totalQuizzes, recentSignups, activeUsers] =
        await Promise.all([
          fastify.prisma.user.count(),
          fastify.prisma.anime.count(),
          fastify.prisma.manga.count(),
          fastify.prisma.chatSession.count(),
          fastify.prisma.quizAnswer.count(),
          fastify.prisma.user.count({
            where: {
              createdAt: {
                gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
              },
            },
          }),
          fastify.prisma.user.count({
            where: {
              lastActive: {
                gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
              },
            },
          }),
        ])

      return {
        platform: {
          totalUsers,
          totalAnime,
          totalManga,
          totalChats,
          totalQuizzes,
          recentSignups,
          activeUsers,
        },
        growth: {
          usersThisWeek: recentSignups,
          activeToday: activeUsers,
        },
      }
    } catch (error) {
      fastify.log.error("Dashboard analytics error:", error)
      return reply.code(500).send({ error: "Failed to fetch analytics" })
    }
  })
}

// Helper functions
async function getAnimeRecommendations(genres, fastify) {
  try {
    if (genres.length === 0) {
      // Get trending anime if no preferences
      const trending = await fastify.apiServices.aniList.getTrendingAnime(1, 10)
      return trending.data?.Page?.media || []
    }

    // Search for anime with favorite genres
    const genreQuery = genres.join(" ")
    const recommendations = await fastify.apiServices.aniList.searchAnime(genreQuery, 1, 10)
    return recommendations.data?.Page?.media || []
  } catch (error) {
    fastify.log.error("Anime recommendations error:", error)
    return []
  }
}

async function getMangaRecommendations(genres, fastify) {
  try {
    if (genres.length === 0) {
      // Get trending manga if no preferences
      const trending = await fastify.apiServices.aniList.getTrendingManga(1, 10)
      return trending.data?.Page?.media || []
    }

    // Search for manga with favorite genres
    const genreQuery = genres.join(" ")
    const recommendations = await fastify.apiServices.aniList.searchManga(genreQuery, 1, 10)
    return recommendations.data?.Page?.media || []
  } catch (error) {
    fastify.log.error("Manga recommendations error:", error)
    return []
  }
}
