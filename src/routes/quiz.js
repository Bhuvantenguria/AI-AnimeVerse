import pkg from '@clerk/fastify';
const { getAuth } = pkg;

export default async function quizRoutes(fastify, options) {
  // Get available quizzes
  fastify.get("/", async (request, reply) => {
    const { page = 1, limit = 20, difficulty, animeId, mangaId } = request.query

    try {
      const skip = (page - 1) * limit
      const where = { isActive: true }

      if (difficulty) {
        where.difficulty = difficulty
      }

      if (animeId) {
        where.animeId = animeId
      }

      if (mangaId) {
        where.mangaId = mangaId
      }

      const [quizzes, total] = await Promise.all([
        fastify.prisma.quiz.findMany({
          where,
          skip,
          take: Number.parseInt(limit),
          include: {
            anime: {
              select: {
                id: true,
                title: true,
                coverImage: true,
              },
            },
            manga: {
              select: {
                id: true,
                title: true,
                coverImage: true,
              },
            },
            _count: {
              select: {
                questions: true,
                answers: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        }),
        fastify.prisma.quiz.count({ where }),
      ])

      return {
        quizzes,
        pagination: {
          page: Number.parseInt(page),
          limit: Number.parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      }
    } catch (error) {
      fastify.log.error("Error fetching quizzes:", error)
      return reply.code(500).send({ error: "Failed to fetch quizzes" })
    }
  })

  // Start a quiz
  fastify.post("/:id/start", async (request, reply) => {
    const { userId } = getAuth(request)
    if (!userId) {
      return reply.code(401).send({ error: "Unauthorized" })
    }

    const { id: quizId } = request.params

    try {
      // Check if user already completed this quiz
      const existingAnswer = await fastify.prisma.quizAnswer.findUnique({
        where: {
          userId_quizId: {
            userId,
            quizId,
          },
        },
      })

      if (existingAnswer) {
        return reply.code(400).send({ error: "Quiz already completed" })
      }

      // Get quiz with questions
      const quiz = await fastify.prisma.quiz.findUnique({
        where: { id: quizId },
        include: {
          questions: {
            select: {
              id: true,
              question: true,
              options: true,
              points: true,
              order: true,
            },
            orderBy: { order: "asc" },
          },
        },
      })

      if (!quiz) {
        return reply.code(404).send({ error: "Quiz not found" })
      }

      return {
        quiz: {
          id: quiz.id,
          title: quiz.title,
          description: quiz.description,
          difficulty: quiz.difficulty,
          timeLimit: quiz.timeLimit,
        },
        questions: quiz.questions,
        startTime: new Date(),
      }
    } catch (error) {
      fastify.log.error("Error starting quiz:", error)
      return reply.code(500).send({ error: "Failed to start quiz" })
    }
  })

  // Submit quiz answers
  fastify.post("/:id/submit", async (request, reply) => {
    const { userId } = getAuth(request)
    if (!userId) {
      return reply.code(401).send({ error: "Unauthorized" })
    }

    const { id: quizId } = request.params
    const { answers, timeSpent } = request.body

    try {
      // Get quiz with questions and correct answers
      const quiz = await fastify.prisma.quiz.findUnique({
        where: { id: quizId },
        include: {
          questions: {
            orderBy: { order: "asc" },
          },
        },
      })

      if (!quiz) {
        return reply.code(404).send({ error: "Quiz not found" })
      }

      // Calculate score
      let score = 0
      let totalPoints = 0
      const results = []

      quiz.questions.forEach((question, index) => {
        const userAnswer = answers[index]
        const isCorrect = userAnswer === question.correctAnswer

        totalPoints += question.points
        if (isCorrect) {
          score += question.points
        }

        results.push({
          questionId: question.id,
          userAnswer,
          correctAnswer: question.correctAnswer,
          isCorrect,
          points: isCorrect ? question.points : 0,
        })
      })

      // Save quiz answer
      const quizAnswer = await fastify.prisma.quizAnswer.create({
        data: {
          userId,
          quizId,
          answers,
          score,
          totalPoints,
          timeSpent,
        },
      })

      // Update user XP
      const xpGained = Math.floor(score * 0.1) // 0.1 XP per point
      await fastify.prisma.user.update({
        where: { clerkId: userId },
        data: {
          xp: {
            increment: xpGained,
          },
        },
      })

      // Check for achievements
      await checkQuizAchievements(userId, score, totalPoints, fastify)

      return {
        score,
        totalPoints,
        percentage: Math.round((score / totalPoints) * 100),
        xpGained,
        results,
        quizAnswer: {
          id: quizAnswer.id,
          completedAt: quizAnswer.completedAt,
        },
      }
    } catch (error) {
      fastify.log.error("Error submitting quiz:", error)
      return reply.code(500).send({ error: "Failed to submit quiz" })
    }
  })

  // Get leaderboard
  fastify.get("/leaderboard", async (request, reply) => {
    const { period = "all", limit = 50 } = request.query

    try {
      let dateFilter = {}

      if (period === "week") {
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        dateFilter = { completedAt: { gte: weekAgo } }
      } else if (period === "month") {
        const monthAgo = new Date()
        monthAgo.setMonth(monthAgo.getMonth() - 1)
        dateFilter = { completedAt: { gte: monthAgo } }
      }

      const leaderboard = await fastify.prisma.quizAnswer.groupBy({
        by: ["userId"],
        where: dateFilter,
        _sum: {
          score: true,
        },
        _count: {
          id: true,
        },
        orderBy: {
          _sum: {
            score: "desc",
          },
        },
        take: Number.parseInt(limit),
      })

      // Get user details
      const userIds = leaderboard.map((entry) => entry.userId)
      const users = await fastify.prisma.user.findMany({
        where: {
          clerkId: {
            in: userIds,
          },
        },
        select: {
          clerkId: true,
          username: true,
          firstName: true,
          lastName: true,
          avatar: true,
          level: true,
        },
      })

      const userMap = new Map(users.map((user) => [user.clerkId, user]))

      const leaderboardWithUsers = leaderboard.map((entry, index) => ({
        rank: index + 1,
        user: userMap.get(entry.userId),
        totalScore: entry._sum.score,
        quizzesCompleted: entry._count.id,
        averageScore: Math.round(entry._sum.score / entry._count.id),
      }))

      return leaderboardWithUsers
    } catch (error) {
      fastify.log.error("Error fetching leaderboard:", error)
      return reply.code(500).send({ error: "Failed to fetch leaderboard" })
    }
  })

  // Get user's quiz history
  fastify.get("/history", async (request, reply) => {
    const { userId } = getAuth(request)
    if (!userId) {
      return reply.code(401).send({ error: "Unauthorized" })
    }

    const { page = 1, limit = 20 } = request.query

    try {
      const skip = (page - 1) * limit

      const [history, total] = await Promise.all([
        fastify.prisma.quizAnswer.findMany({
          where: { userId },
          skip,
          take: Number.parseInt(limit),
          include: {
            quiz: {
              include: {
                anime: {
                  select: {
                    title: true,
                    coverImage: true,
                  },
                },
                manga: {
                  select: {
                    title: true,
                    coverImage: true,
                  },
                },
              },
            },
          },
          orderBy: { completedAt: "desc" },
        }),
        fastify.prisma.quizAnswer.count({ where: { userId } }),
      ])

      return {
        history,
        pagination: {
          page: Number.parseInt(page),
          limit: Number.parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      }
    } catch (error) {
      fastify.log.error("Error fetching quiz history:", error)
      return reply.code(500).send({ error: "Failed to fetch quiz history" })
    }
  })
}

async function checkQuizAchievements(userId, score, totalPoints, fastify) {
  try {
    const achievements = []
    const percentage = (score / totalPoints) * 100

    // Perfect score achievement
    if (percentage === 100) {
      achievements.push("perfect_quiz")
    }

    // High score achievement
    if (percentage >= 90) {
      achievements.push("quiz_master")
    }

    // Quiz completion milestones
    const completedQuizzes = await fastify.prisma.quizAnswer.count({
      where: { userId },
    })

    if ([1, 10, 50, 100].includes(completedQuizzes)) {
      achievements.push(`quizzes_completed_${completedQuizzes}`)
    }

    // Grant achievements
    for (const achievementName of achievements) {
      await grantAchievement(userId, achievementName, fastify)
    }
  } catch (error) {
    fastify.log.error("Error checking quiz achievements:", error)
  }
}

async function grantAchievement(userId, achievementName, fastify) {
  try {
    const achievement = await fastify.prisma.achievement.findUnique({
      where: { name: achievementName },
    })

    if (!achievement) return

    // Check if user already has this achievement
    const existing = await fastify.prisma.userAchievement.findUnique({
      where: {
        userId_achievementId: {
          userId,
          achievementId: achievement.id,
        },
      },
    })

    if (existing) return

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
