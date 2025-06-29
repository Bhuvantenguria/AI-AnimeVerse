import pkg from '@clerk/fastify';
const { getAuth } = pkg;

export default async function animeRoutes(fastify, options) {
  // Get all anime with pagination and filters
  fastify.get("/", async (request, reply) => {
    const { page = 1, limit = 20, genre, status, year, search } = request.query

    try {
      const skip = (page - 1) * limit
      const where = {}

      if (genre) {
        where.genres = { has: genre }
      }

      if (status) {
        where.status = status
      }

      if (year) {
        where.year = Number.parseInt(year)
      }

      if (search) {
        where.OR = [
          { title: { contains: search, mode: "insensitive" } },
          { synopsis: { contains: search, mode: "insensitive" } },
        ]
      }

      const [anime, total] = await Promise.all([
        fastify.prisma.anime.findMany({
          where,
          skip,
          take: Number.parseInt(limit),
          orderBy: { rating: "desc" },
          include: {
            characters: {
              take: 5,
            },
            _count: {
              select: {
                watchlist: true,
                episodes_: true,
              },
            },
          },
        }),
        fastify.prisma.anime.count({ where }),
      ])

      return {
        anime,
        pagination: {
          page: Number.parseInt(page),
          limit: Number.parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      }
    } catch (error) {
      fastify.log.error("Error fetching anime:", error)
      return reply.code(500).send({ error: "Failed to fetch anime" })
    }
  })

  // Get single anime by ID
  fastify.get("/:id", async (request, reply) => {
    const { id } = request.params

    try {
      const anime = await fastify.prisma.anime.findUnique({
        where: { id },
        include: {
          characters: true,
          episodes_: {
            orderBy: { number: "asc" },
          },
          watchlist: {
            select: {
              userId: true,
              status: true,
              rating: true,
            },
          },
          _count: {
            select: {
              watchlist: true,
            },
          },
        },
      })

      if (!anime) {
        return reply.code(404).send({ error: "Anime not found" })
      }

      return anime
    } catch (error) {
      fastify.log.error("Error fetching anime:", error)
      return reply.code(500).send({ error: "Failed to fetch anime" })
    }
  })

  // Add to watchlist
  fastify.post("/:id/watchlist", async (request, reply) => {
    const { userId } = getAuth(request)
    if (!userId) {
      return reply.code(401).send({ error: "Unauthorized" })
    }

    const { id: animeId } = request.params
    const { status = "watching", rating } = request.body

    try {
      const watchlistItem = await fastify.prisma.watchlist.upsert({
        where: {
          userId_animeId: {
            userId,
            animeId,
          },
        },
        update: {
          status,
          rating,
        },
        create: {
          userId,
          animeId,
          status,
          rating,
        },
      })

      return watchlistItem
    } catch (error) {
      fastify.log.error("Error adding to watchlist:", error)
      return reply.code(500).send({ error: "Failed to add to watchlist" })
    }
  })

  // Remove from watchlist
  fastify.delete("/:id/watchlist", async (request, reply) => {
    const { userId } = getAuth(request)
    if (!userId) {
      return reply.code(401).send({ error: "Unauthorized" })
    }

    const { id: animeId } = request.params

    try {
      await fastify.prisma.watchlist.delete({
        where: {
          userId_animeId: {
            userId,
            animeId,
          },
        },
      })

      return { success: true }
    } catch (error) {
      fastify.log.error("Error removing from watchlist:", error)
      return reply.code(500).send({ error: "Failed to remove from watchlist" })
    }
  })

  // Update progress
  fastify.post("/:id/progress", async (request, reply) => {
    const { userId } = getAuth(request)
    if (!userId) {
      return reply.code(401).send({ error: "Unauthorized" })
    }

    const { id: animeId } = request.params
    const { currentEpisode, totalEpisodes } = request.body

    try {
      const progressPercent = totalEpisodes ? (currentEpisode / totalEpisodes) * 100 : 0

      const progress = await fastify.prisma.progress.upsert({
        where: {
          userId_animeId: {
            userId,
            animeId,
          },
        },
        update: {
          currentEpisode,
          totalEpisodes,
          progressPercent,
          lastWatched: new Date(),
        },
        create: {
          userId,
          animeId,
          currentEpisode,
          totalEpisodes,
          progressPercent,
        },
      })

      // Check for achievements
      await checkProgressAchievements(userId, progress, fastify)

      return progress
    } catch (error) {
      fastify.log.error("Error updating progress:", error)
      return reply.code(500).send({ error: "Failed to update progress" })
    }
  })

  // Get trending anime
  fastify.get("/trending/now", async (request, reply) => {
    try {
      const trending = await fastify.prisma.anime.findMany({
        take: 10,
        orderBy: [{ rating: "desc" }, { createdAt: "desc" }],
        include: {
          _count: {
            select: {
              watchlist: true,
            },
          },
        },
      })

      return trending
    } catch (error) {
      fastify.log.error("Error fetching trending anime:", error)
      return reply.code(500).send({ error: "Failed to fetch trending anime" })
    }
  })
}

async function checkProgressAchievements(userId, progress, fastify) {
  try {
    const achievements = []

    // First anime completed
    if (progress.progressPercent === 100) {
      const completedCount = await fastify.prisma.progress.count({
        where: {
          userId,
          animeId: { not: null },
          progressPercent: 100,
        },
      })

      if (completedCount === 1) {
        achievements.push("first_anime_completed")
      }

      // Milestone achievements
      if ([10, 50, 100].includes(completedCount)) {
        achievements.push(`anime_completed_${completedCount}`)
      }
    }

    // Grant achievements
    for (const achievementName of achievements) {
      await grantAchievement(userId, achievementName, fastify)
    }
  } catch (error) {
    fastify.log.error("Error checking achievements:", error)
  }
}

async function grantAchievement(userId, achievementName, fastify) {
  try {
    const achievement = await fastify.prisma.achievement.findUnique({
      where: { name: achievementName },
    })

    if (!achievement) return

    await fastify.prisma.userAchievement.create({
      data: {
        userId,
        achievementId: achievement.id,
      },
    })

    // Send notification
    await fastify.prisma.notification.create({
      data: {
        userId,
        title: "Achievement Unlocked!",
        message: `You've unlocked: ${achievement.name}`,
        type: "achievement",
        data: { achievementId: achievement.id },
      },
    })

    // Send WebSocket notification
    fastify.websocket.sendToUser(userId, {
      type: "achievement_unlocked",
      achievement,
    })
  } catch (error) {
    fastify.log.error("Error granting achievement:", error)
  }
}
