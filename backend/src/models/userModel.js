// This file contains Prisma model definitions and database queries
// Since we're using Prisma, the actual models are defined in schema.prisma

export const UserModel = {
  // Find user by ID
  async findById(prisma, id) {
    return await prisma.user.findUnique({
      where: { id },
      include: {
        subscription: true,
        watchlist: {
          include: {
            anime: {
              select: { title: true, coverImage: true },
            },
          },
        },
        readingList: {
          include: {
            manga: {
              select: { title: true, coverImage: true },
            },
          },
        },
        achievements: {
          include: {
            achievement: true,
          },
        },
      },
    })
  },

  // Find user by email
  async findByEmail(prisma, email) {
    return await prisma.user.findUnique({
      where: { email },
    })
  },

  // Find user by username
  async findByUsername(prisma, username) {
    return await prisma.user.findUnique({
      where: { username },
    })
  },

  // Create new user
  async create(prisma, userData) {
    return await prisma.user.create({
      data: {
        ...userData,
        level: 1,
        xp: 0,
        isPremium: false,
      },
    })
  },

  // Update user
  async update(prisma, id, updateData) {
    return await prisma.user.update({
      where: { id },
      data: {
        ...updateData,
        lastActive: new Date(),
      },
    })
  },

  // Get user watchlist
  async getWatchlist(prisma, userId, options = {}) {
    const { status, page = 1, limit = 20 } = options

    const where = { userId }
    if (status) {
      where.status = status
    }

    const [items, total] = await Promise.all([
      prisma.watchlist.findMany({
        where,
        include: {
          anime: {
            select: {
              id: true,
              title: true,
              coverImage: true,
              episodes: true,
              status: true,
              rating: true,
            },
          },
        },
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.watchlist.count({ where }),
    ])

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    }
  },

  // Get user reading list
  async getReadingList(prisma, userId, options = {}) {
    const { status, page = 1, limit = 20 } = options

    const where = { userId }
    if (status) {
      where.status = status
    }

    const [items, total] = await Promise.all([
      prisma.readingList.findMany({
        where,
        include: {
          manga: {
            select: {
              id: true,
              title: true,
              coverImage: true,
              chapters: true,
              status: true,
              rating: true,
            },
          },
        },
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.readingList.count({ where }),
    ])

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    }
  },

  // Get user statistics
  async getStats(prisma, userId) {
    const [animeStats, mangaStats, chatStats, quizStats, communityStats] = await Promise.all([
      // Anime statistics
      prisma.watchlist.aggregate({
        where: { userId },
        _count: { id: true },
        _avg: { rating: true },
      }),

      // Manga statistics
      prisma.readingList.aggregate({
        where: { userId },
        _count: { id: true },
        _avg: { rating: true },
      }),

      // Chat statistics
      prisma.chatSession.aggregate({
        where: { userId },
        _count: { id: true },
      }),

      // Quiz statistics
      prisma.quizAnswer.aggregate({
        where: { userId },
        _count: { id: true },
        _sum: { score: true },
        _avg: { score: true },
      }),

      // Community statistics
      Promise.all([
        prisma.post.count({ where: { userId } }),
        prisma.comment.count({ where: { userId } }),
        prisma.like.count({ where: { userId } }),
      ]),
    ])

    const [postsCount, commentsCount, likesCount] = communityStats

    return {
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
    }
  },

  // Get user achievements
  async getAchievements(prisma, userId) {
    const achievements = await prisma.userAchievement.findMany({
      where: { userId },
      include: {
        achievement: {
          select: {
            id: true,
            name: true,
            description: true,
            icon: true,
            category: true,
            points: true,
          },
        },
      },
      orderBy: { unlockedAt: "desc" },
    })

    return {
      achievements: achievements.map((ua) => ({
        ...ua.achievement,
        unlockedAt: ua.unlockedAt,
      })),
      totalPoints: achievements.reduce((sum, ua) => sum + ua.achievement.points, 0),
      totalUnlocked: achievements.length,
    }
  },

  // Get user progress
  async getProgress(prisma, userId) {
    const [animeProgress, mangaProgress] = await Promise.all([
      prisma.animeProgress.findMany({
        where: { userId },
        include: {
          anime: {
            select: { title: true, coverImage: true, episodes: true },
          },
        },
        orderBy: { updatedAt: "desc" },
        take: 10,
      }),
      prisma.mangaProgress.findMany({
        where: { userId },
        include: {
          manga: {
            select: { title: true, coverImage: true, chapters: true },
          },
        },
        orderBy: { updatedAt: "desc" },
        take: 10,
      }),
    ])

    return {
      anime: animeProgress.map((progress) => ({
        id: progress.id,
        anime: progress.anime,
        currentEpisode: progress.currentEpisode,
        totalEpisodes: progress.anime.episodes,
        progress: progress.anime.episodes ? (progress.currentEpisode / progress.anime.episodes) * 100 : 0,
        updatedAt: progress.updatedAt,
      })),
      manga: mangaProgress.map((progress) => ({
        id: progress.id,
        manga: progress.manga,
        currentChapter: progress.currentChapter,
        currentPage: progress.currentPage,
        totalChapters: progress.manga.chapters,
        progress: progress.manga.chapters ? (progress.currentChapter / progress.manga.chapters) * 100 : 0,
        updatedAt: progress.updatedAt,
      })),
    }
  },
}
