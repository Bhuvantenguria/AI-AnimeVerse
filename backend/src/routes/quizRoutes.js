export default async function quizRoutes(fastify, options) {
  // Get available quizzes
  fastify.get("/", async (request, reply) => {
    const { page = 1, limit = 20, difficulty, animeId, mangaId } = request.query

    try {
      const where = {}

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
          include: {
            anime: {
              select: { title: true, coverImage: true },
            },
            manga: {
              select: { title: true, coverImage: true },
            },
            _count: {
              select: { questions: true },
            },
          },
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * limit,
          take: Number.parseInt(limit),
        }),
        fastify.prisma.quiz.count({ where }),
      ])

      return {
        data: quizzes,
        pagination: {
          page: Number.parseInt(page),
          limit: Number.parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      }
    } catch (error) {
      fastify.log.error("Get quizzes error:", error)
      return reply.code(500).send({ error: "Failed to fetch quizzes" })
    }
  })

  // Start quiz (authenticated)
  fastify.post(
    "/:id/start",
    {
      preHandler: fastify.authenticate,
    },
    async (request, reply) => {
      const { id: quizId } = request.params
      const userId = request.user.id

      try {
        // Get quiz with questions
        const quiz = await fastify.prisma.quiz.findUnique({
          where: { id: quizId },
          include: {
            questions: {
              include: {
                options: true,
              },
            },
          },
        })

        if (!quiz) {
          return reply.code(404).send({ error: "Quiz not found" })
        }

        // Create quiz attempt
        const attempt = await fastify.prisma.quizAttempt.create({
          data: {
            userId,
            quizId,
            startedAt: new Date(),
          },
        })

        // Return quiz without correct answers
        const quizData = {
          ...quiz,
          questions: quiz.questions.map((q) => ({
            ...q,
            options: q.options.map((opt) => ({
              id: opt.id,
              text: opt.text,
              // Don't include isCorrect
            })),
          })),
        }

        return {
          attempt: {
            id: attempt.id,
            startedAt: attempt.startedAt,
          },
          quiz: quizData,
        }
      } catch (error) {
        fastify.log.error("Start quiz error:", error)
        return reply.code(500).send({ error: "Failed to start quiz" })
      }
    },
  )

  // Submit quiz (authenticated)
  fastify.post(
    "/:id/submit",
    {
      preHandler: fastify.authenticate,
      schema: {
        body: {
          type: "object",
          required: ["answers", "timeSpent"],
          properties: {
            answers: {
              type: "array",
              items: {
                type: "object",
                required: ["questionId", "selectedOptionId"],
                properties: {
                  questionId: { type: "string" },
                  selectedOptionId: { type: "string" },
                },
              },
            },
            timeSpent: { type: "integer", minimum: 1 },
          },
        },
      },
    },
    async (request, reply) => {
      const { id: quizId } = request.params
      const { answers, timeSpent } = request.body
      const userId = request.user.id

      try {
        // Get quiz with correct answers
        const quiz = await fastify.prisma.quiz.findUnique({
          where: { id: quizId },
          include: {
            questions: {
              include: {
                options: true,
              },
            },
          },
        })

        if (!quiz) {
          return reply.code(404).send({ error: "Quiz not found" })
        }

        // Calculate score
        let correctAnswers = 0
        const results = []

        for (const answer of answers) {
          const question = quiz.questions.find((q) => q.id === answer.questionId)
          if (!question) continue

          const selectedOption = question.options.find((opt) => opt.id === answer.selectedOptionId)
          const correctOption = question.options.find((opt) => opt.isCorrect)

          const isCorrect = selectedOption && selectedOption.isCorrect
          if (isCorrect) correctAnswers++

          results.push({
            questionId: question.id,
            question: question.text,
            selectedOptionId: answer.selectedOptionId,
            selectedOption: selectedOption?.text,
            correctOptionId: correctOption?.id,
            correctOption: correctOption?.text,
            isCorrect,
          })
        }

        const score = Math.round((correctAnswers / quiz.questions.length) * 100)

        // Save quiz answer
        const quizAnswer = await fastify.prisma.quizAnswer.create({
          data: {
            userId,
            quizId,
            score,
            correctAnswers,
            totalQuestions: quiz.questions.length,
            timeSpent,
            answers: JSON.stringify(results),
            completedAt: new Date(),
          },
        })

        // Add XP based on score
        const xpGained = Math.floor(score / 10) * 5 // 5 XP per 10% score
        await fastify.userService.addXP(userId, xpGained)

        return {
          score,
          correctAnswers,
          totalQuestions: quiz.questions.length,
          percentage: score,
          timeSpent,
          xpGained,
          results,
        }
      } catch (error) {
        fastify.log.error("Submit quiz error:", error)
        return reply.code(500).send({ error: "Failed to submit quiz" })
      }
    },
  )

  // Get quiz leaderboard
  fastify.get("/leaderboard", async (request, reply) => {
    const { period = "all", limit = 50 } = request.query

    try {
      let dateFilter = {}

      if (period === "week") {
        dateFilter = {
          completedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        }
      } else if (period === "month") {
        dateFilter = {
          completedAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        }
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
        _avg: {
          score: true,
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
          id: { in: userIds },
        },
        select: {
          id: true,
          username: true,
          avatar: true,
          level: true,
        },
      })

      const leaderboardWithUsers = leaderboard.map((entry, index) => {
        const user = users.find((u) => u.id === entry.userId)
        return {
          rank: index + 1,
          user,
          totalScore: entry._sum.score,
          quizzesCompleted: entry._count.id,
          averageScore: Math.round(entry._avg.score),
        }
      })

      return {
        period,
        leaderboard: leaderboardWithUsers,
      }
    } catch (error) {
      fastify.log.error("Get leaderboard error:", error)
      return reply.code(500).send({ error: "Failed to fetch leaderboard" })
    }
  })

  // Get user quiz history (authenticated)
  fastify.get(
    "/history",
    {
      preHandler: fastify.authenticate,
    },
    async (request, reply) => {
      const { page = 1, limit = 20 } = request.query
      const userId = request.user.id

      try {
        const [history, total] = await Promise.all([
          fastify.prisma.quizAnswer.findMany({
            where: { userId },
            include: {
              quiz: {
                select: {
                  title: true,
                  difficulty: true,
                  anime: {
                    select: { title: true, coverImage: true },
                  },
                  manga: {
                    select: { title: true, coverImage: true },
                  },
                },
              },
            },
            orderBy: { completedAt: "desc" },
            skip: (page - 1) * limit,
            take: Number.parseInt(limit),
          }),
          fastify.prisma.quizAnswer.count({
            where: { userId },
          }),
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
        fastify.log.error("Get quiz history error:", error)
        return reply.code(500).send({ error: "Failed to fetch quiz history" })
      }
    },
  )
}
