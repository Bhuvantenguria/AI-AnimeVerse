import { getAuth } from "@clerk/fastify"

export default async function aiRoutes(fastify, options) {
  // Generate manga-to-anime preview
  fastify.post("/preview", async (request, reply) => {
    const { userId } = getAuth(request)
    if (!userId) {
      return reply.code(401).send({ error: "Unauthorized" })
    }

    const { mangaId, voiceType = "narrator", style = "anime" } = request.body

    try {
      // Check if user has premium access for AI features
      const user = await fastify.prisma.user.findUnique({
        where: { clerkId: userId },
        include: { subscription: true },
      })

      if (!user?.isPremium && !user?.subscription?.status === "active") {
        return reply.code(403).send({ error: "Premium subscription required for AI features" })
      }

      // Create preview request
      const previewRequest = await fastify.prisma.previewRequest.create({
        data: {
          userId,
          mangaId,
          voiceType,
          style,
        },
      })

      // Add to preview queue
      const job = await fastify.queues.preview.add("generate-preview", {
        requestId: previewRequest.id,
        userId,
        mangaId,
        voiceType,
        style,
      })

      // Update request with job ID
      await fastify.prisma.previewRequest.update({
        where: { id: previewRequest.id },
        data: { jobId: job.id },
      })

      return {
        requestId: previewRequest.id,
        jobId: job.id,
        status: "processing",
        estimatedTime: "2-5 minutes",
      }
    } catch (error) {
      fastify.log.error("Error requesting AI preview:", error)
      return reply.code(500).send({ error: "Failed to request AI preview" })
    }
  })

  // Get AI preview status
  fastify.get("/preview/:requestId", async (request, reply) => {
    const { userId } = getAuth(request)
    if (!userId) {
      return reply.code(401).send({ error: "Unauthorized" })
    }

    const { requestId } = request.params

    try {
      const request_ = await fastify.prisma.previewRequest.findFirst({
        where: {
          id: requestId,
          userId,
        },
        include: {
          manga: {
            select: {
              title: true,
              coverImage: true,
            },
          },
        },
      })

      if (!request_) {
        return reply.code(404).send({ error: "Preview request not found" })
      }

      return request_
    } catch (error) {
      fastify.log.error("Error getting preview status:", error)
      return reply.code(500).send({ error: "Failed to get preview status" })
    }
  })

  // Generate voice narration
  fastify.post("/narration", async (request, reply) => {
    const { userId } = getAuth(request)
    if (!userId) {
      return reply.code(401).send({ error: "Unauthorized" })
    }

    const { mangaId, chapterId, characterId, voiceType = "narrator" } = request.body

    try {
      // Check premium access
      const user = await fastify.prisma.user.findUnique({
        where: { clerkId: userId },
        include: { subscription: true },
      })

      if (!user?.isPremium && !user?.subscription?.status === "active") {
        return reply.code(403).send({ error: "Premium subscription required for AI features" })
      }

      // Create narration request
      const narrationRequest = await fastify.prisma.narrationRequest.create({
        data: {
          userId,
          mangaId,
          chapterId,
          voiceType,
        },
      })

      // Add to narration queue
      const job = await fastify.queues.narration.add("generate-narration", {
        requestId: narrationRequest.id,
        userId,
        mangaId,
        chapterId,
        characterId,
        voiceType,
      })

      // Update request with job ID
      await fastify.prisma.narrationRequest.update({
        where: { id: narrationRequest.id },
        data: { jobId: job.id },
      })

      return {
        requestId: narrationRequest.id,
        jobId: job.id,
        status: "processing",
        estimatedTime: "1-3 minutes",
      }
    } catch (error) {
      fastify.log.error("Error requesting narration:", error)
      return reply.code(500).send({ error: "Failed to request narration" })
    }
  })

  // Get narration status
  fastify.get("/narration/:requestId", async (request, reply) => {
    const { userId } = getAuth(request)
    if (!userId) {
      return reply.code(401).send({ error: "Unauthorized" })
    }

    const { requestId } = request.params

    try {
      const request_ = await fastify.prisma.narrationRequest.findFirst({
        where: {
          id: requestId,
          userId,
        },
        include: {
          manga: {
            select: {
              title: true,
              coverImage: true,
            },
          },
          chapter: {
            select: {
              number: true,
              title: true,
            },
          },
        },
      })

      if (!request_) {
        return reply.code(404).send({ error: "Narration request not found" })
      }

      return request_
    } catch (error) {
      fastify.log.error("Error getting narration status:", error)
      return reply.code(500).send({ error: "Failed to get narration status" })
    }
  })

  // Get user's AI request history
  fastify.get("/history", async (request, reply) => {
    const { userId } = getAuth(request)
    if (!userId) {
      return reply.code(401).send({ error: "Unauthorized" })
    }

    const { type, page = 1, limit = 20 } = request.query

    try {
      const skip = (page - 1) * limit

      if (type === "preview" || !type) {
        const [previews, total] = await Promise.all([
          fastify.prisma.previewRequest.findMany({
            where: { userId },
            skip: type === "preview" ? skip : 0,
            take: type === "preview" ? Number.parseInt(limit) : 10,
            include: {
              manga: {
                select: {
                  title: true,
                  coverImage: true,
                },
              },
            },
            orderBy: { createdAt: "desc" },
          }),
          type === "preview" ? fastify.prisma.previewRequest.count({ where: { userId } }) : 0,
        ])

        if (type === "preview") {
          return {
            requests: previews,
            pagination: {
              page: Number.parseInt(page),
              limit: Number.parseInt(limit),
              total,
              pages: Math.ceil(total / limit),
            },
          }
        }
      }

      if (type === "narration" || !type) {
        const [narrations, total] = await Promise.all([
          fastify.prisma.narrationRequest.findMany({
            where: { userId },
            skip: type === "narration" ? skip : 0,
            take: type === "narration" ? Number.parseInt(limit) : 10,
            include: {
              manga: {
                select: {
                  title: true,
                  coverImage: true,
                },
              },
              chapter: {
                select: {
                  number: true,
                  title: true,
                },
              },
            },
            orderBy: { createdAt: "desc" },
          }),
          type === "narration" ? fastify.prisma.narrationRequest.count({ where: { userId } }) : 0,
        ])

        if (type === "narration") {
          return {
            requests: narrations,
            pagination: {
              page: Number.parseInt(page),
              limit: Number.parseInt(limit),
              total,
              pages: Math.ceil(total / limit),
            },
          }
        }
      }

      // Return both if no specific type
      const [previews, narrations] = await Promise.all([
        fastify.prisma.previewRequest.findMany({
          where: { userId },
          take: 10,
          include: {
            manga: {
              select: {
                title: true,
                coverImage: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        }),
        fastify.prisma.narrationRequest.findMany({
          where: { userId },
          take: 10,
          include: {
            manga: {
              select: {
                title: true,
                coverImage: true,
              },
            },
            chapter: {
              select: {
                number: true,
                title: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        }),
      ])

      return {
        previews,
        narrations,
      }
    } catch (error) {
      fastify.log.error("Error fetching AI history:", error)
      return reply.code(500).send({ error: "Failed to fetch AI history" })
    }
  })
}
