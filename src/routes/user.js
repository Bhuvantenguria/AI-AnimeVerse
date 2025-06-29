import pkg from '@clerk/fastify';
const { getAuth } = pkg;

export default async function userRoutes(fastify, options) {
  // Get current user profile
  fastify.get("/me", async (request, reply) => {
    const { userId } = getAuth(request)
    if (!userId) {
      return reply.code(401).send({ error: "Unauthorized" })
    }

    try {
      let user = await fastify.prisma.user.findUnique({
        where: { clerkId: userId },
        include: {
          subscription: true,
          achievements: {
            include: {
              achievement: true,
            },
          },
          _count: {
            select: {
              watchlist: true,
              readingList: true,
              posts: true,
              comments: true,
            },
          },
        },
      })

      // Create user if doesn't exist
      if (!user) {
        const { clerkClient } = fastify
        const clerkUser = await clerkClient.users.getUser(userId)

        user = await fastify.prisma.user.create({
          data: {
            clerkId: userId,
            email: clerkUser.emailAddresses[0]?.emailAddress,
            firstName: clerkUser.firstName,
            lastName: clerkUser.lastName,
            avatar: clerkUser.imageUrl,
          },
          include: {
            subscription: true,
            achievements: {
              include: {
                achievement: true,
              },
            },
            _count: {
              select: {
                watchlist: true,
                readingList: true,
                posts: true,
                comments: true,
              },
            },
          },
        })
      }

      return user
    } catch (error) {
      fastify.log.error("Error fetching user:", error)
      return reply.code(500).send({ error: "Failed to fetch user" })
    }
  })

  // Update user profile
  fastify.patch("/me", async (request, reply) => {
    const { userId } = getAuth(request)
    if (!userId) {
      return reply.code(401).send({ error: "Unauthorized" })
    }

    const { username, bio, avatar } = request.body

    try {
      const user = await fastify.prisma.user.update({
        where: { clerkId: userId },
        data: {
          username,
          bio,
          avatar,
        },
      })

      return user
    } catch (error) {
      fastify.log.error("Error updating user:", error)
      return reply.code(500).send({ error: "Failed to update user" })
    }
  })

  // Get user watchlist
  fastify.get("/me/watchlist", async (request, reply) => {
    const { userId } = getAuth(request)
    if (!userId) {
      return reply.code(401).send({ error: "Unauthorized" })
    }

    const { status, page = 1, limit = 20 } = request.query

    try {
      const skip = (page - 1) * limit
      const where = { userId }

      if (status) {
        where.status = status
      }

      const [watchlist, total] = await Promise.all([
        fastify.prisma.watchlist.findMany({
          where,
          skip,
          take: Number.parseInt(limit),
          include: {
            anime: {
              include: {
                _count: {
                  select: {
                    episodes_: true,
                  },
                },
              },
            },
          },
          orderBy: { updatedAt: "desc" },
        }),
        fastify.prisma.watchlist.count({ where }),
      ])

      return {
        watchlist,
        pagination: {
          page: Number.parseInt(page),
          limit: Number.parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      }
    } catch (error) {
      fastify.log.error("Error fetching watchlist:", error)
      return reply.code(500).send({ error: "Failed to fetch watchlist" })
    }
  })

  // Get user reading list
  fastify.get("/me/reading-list", async (request, reply) => {
    const { userId } = getAuth(request)
    if (!userId) {
      return reply.code(401).send({ error: "Unauthorized" })
    }

    const { status, page = 1, limit = 20 } = request.query

    try {
      const skip = (page - 1) * limit
      const where = { userId }

      if (status) {
        where.status = status
      }

      const [readingList, total] = await Promise.all([
        fastify.prisma.readingList.findMany({
          where,
          skip,
          take: Number.parseInt(limit),
          include: {
            manga: {
              include: {
                _count: {
                  select: {
                    chapters_: true,
                  },
                },
              },
            },
          },
          orderBy: { updatedAt: "desc" },
        }),
        fastify.prisma.readingList.count({ where }),
      ])

      return {
        readingList,
        pagination: {
          page: Number.parseInt(page),
          limit: Number.parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      }
    } catch (error) {
      fastify.log.error("Error fetching reading list:", error)
      return reply.code(500).send({ error: "Failed to fetch reading list" })
    }
  })

  // Get user progress
  fastify.get("/me/progress", async (request, reply) => {
    const { userId } = getAuth(request)
    if (!userId) {
      return reply.code(401).send({ error: "Unauthorized" })
    }

    try {
      const progress = await fastify.prisma.progress.findMany({
        where: { userId },
        include: {
          anime: {
            select: {
              id: true,
              title: true,
              coverImage: true,
              episodes: true,
            },
          },
          manga: {
            select: {
              id: true,
              title: true,
              coverImage: true,
              chapters: true,
            },
          },
        },
        orderBy: { lastWatched: "desc" },
        take: 20,
      })

      return progress
    } catch (error) {
      fastify.log.error("Error fetching progress:", error)
      return reply.code(500).send({ error: "Failed to fetch progress" })
    }
  })

  // Get user achievements
  fastify.get("/me/achievements", async (request, reply) => {
    const { userId } = getAuth(request)
    if (!userId) {
      return reply.code(401).send({ error: "Unauthorized" })
    }

    try {
      const achievements = await fastify.prisma.userAchievement.findMany({
        where: { userId },
        include: {
          achievement: true,
        },
        orderBy: { unlockedAt: "desc" },
      })

      return achievements
    } catch (error) {
      fastify.log.error("Error fetching achievements:", error)
      return reply.code(500).send({ error: "Failed to fetch achievements" })
    }
  })

  // Get user stats
  fastify.get("/me/stats", async (request, reply) => {
    const { userId } = getAuth(request)
    if (!userId) {
      return reply.code(401).send({ error: "Unauthorized" })
    }

    try {
      const [animeWatched, mangaRead, totalWatchTime, achievementsCount, postsCount, commentsCount, user] =
        await Promise.all([
          fastify.prisma.progress.count({
            where: {
              userId,
              animeId: { not: null },
              progressPercent: 100,
            },
          }),
          fastify.prisma.progress.count({
            where: {
              userId,
              mangaId: { not: null },
              progressPercent: 100,
            },
          }),
          // Calculate total watch time (approximate)
          fastify.prisma.progress.aggregate({
            where: {
              userId,
              animeId: { not: null },
            },
            _sum: {
              currentEpisode: true,
            },
          }),
          fastify.prisma.userAchievement.count({
            where: { userId },
          }),
          fastify.prisma.post.count({
            where: { userId },
          }),
          fastify.prisma.comment.count({
            where: { userId },
          }),
          fastify.prisma.user.findUnique({
            where: { clerkId: userId },
            select: { level: true, xp: true, rank: true },
          }),
        ])

      const estimatedWatchTime = (totalWatchTime._sum.currentEpisode || 0) * 24 // 24 minutes per episode average

      return {
        animeWatched,
        mangaRead,
        estimatedWatchTime,
        achievementsCount,
        postsCount,
        commentsCount,
        level: user?.level || 1,
        xp: user?.xp || 0,
        rank: user?.rank,
      }
    } catch (error) {
      fastify.log.error("Error fetching user stats:", error)
      return reply.code(500).send({ error: "Failed to fetch user stats" })
    }
  })
}
