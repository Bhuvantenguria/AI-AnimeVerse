import pkg from '@clerk/fastify';
const { getAuth } = pkg;

export default async function mangaRoutes(fastify, options) {
  // Get all manga with pagination and filters
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

      const [manga, total] = await Promise.all([
        fastify.prisma.manga.findMany({
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
                readingList: true,
                chapters_: true,
              },
            },
          },
        }),
        fastify.prisma.manga.count({ where }),
      ])

      return {
        manga,
        pagination: {
          page: Number.parseInt(page),
          limit: Number.parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      }
    } catch (error) {
      fastify.log.error("Error fetching manga:", error)
      return reply.code(500).send({ error: "Failed to fetch manga" })
    }
  })

  // Get single manga by ID
  fastify.get("/:id", async (request, reply) => {
    const { id } = request.params

    try {
      const manga = await fastify.prisma.manga.findUnique({
        where: { id },
        include: {
          characters: true,
          chapters_: {
            orderBy: { number: "asc" },
          },
          readingList: {
            select: {
              userId: true,
              status: true,
              rating: true,
            },
          },
          _count: {
            select: {
              readingList: true,
            },
          },
        },
      })

      if (!manga) {
        return reply.code(404).send({ error: "Manga not found" })
      }

      return manga
    } catch (error) {
      fastify.log.error("Error fetching manga:", error)
      return reply.code(500).send({ error: "Failed to fetch manga" })
    }
  })

  // Add to reading list
  fastify.post("/:id/reading-list", async (request, reply) => {
    const { userId } = getAuth(request)
    if (!userId) {
      return reply.code(401).send({ error: "Unauthorized" })
    }

    const { id: mangaId } = request.params
    const { status = "reading", rating } = request.body

    try {
      const readingListItem = await fastify.prisma.readingList.upsert({
        where: {
          userId_mangaId: {
            userId,
            mangaId,
          },
        },
        update: {
          status,
          rating,
        },
        create: {
          userId,
          mangaId,
          status,
          rating,
        },
      })

      return readingListItem
    } catch (error) {
      fastify.log.error("Error adding to reading list:", error)
      return reply.code(500).send({ error: "Failed to add to reading list" })
    }
  })

  // Get manga chapters
  fastify.get("/:id/chapters", async (request, reply) => {
    const { id: mangaId } = request.params
    const { page = 1, limit = 50 } = request.query

    try {
      const skip = (page - 1) * limit

      const [chapters, total] = await Promise.all([
        fastify.prisma.chapter.findMany({
          where: { mangaId },
          skip,
          take: Number.parseInt(limit),
          orderBy: { number: "asc" },
        }),
        fastify.prisma.chapter.count({ where: { mangaId } }),
      ])

      return {
        chapters,
        pagination: {
          page: Number.parseInt(page),
          limit: Number.parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      }
    } catch (error) {
      fastify.log.error("Error fetching chapters:", error)
      return reply.code(500).send({ error: "Failed to fetch chapters" })
    }
  })

  // Get chapter content
  fastify.get("/:id/chapters/:chapterNumber", async (request, reply) => {
    const { id: mangaId, chapterNumber } = request.params

    try {
      const chapter = await fastify.prisma.chapter.findUnique({
        where: {
          mangaId_number: {
            mangaId,
            number: Number.parseFloat(chapterNumber),
          },
        },
        include: {
          manga: {
            include: {
              characters: true,
            },
          },
        },
      })

      if (!chapter) {
        return reply.code(404).send({ error: "Chapter not found" })
      }

      // Generate page URLs (in production, these would be actual manga page images)
      const pages = Array.from({ length: chapter.pages }, (_, i) => ({
        pageNumber: i + 1,
        imageUrl: `/placeholder.svg?height=800&width=600&text=Page ${i + 1}`,
      }))

      return {
        ...chapter,
        pages,
      }
    } catch (error) {
      fastify.log.error("Error fetching chapter:", error)
      return reply.code(500).send({ error: "Failed to fetch chapter" })
    }
  })

  // Update reading progress
  fastify.post("/:id/progress", async (request, reply) => {
    const { userId } = getAuth(request)
    if (!userId) {
      return reply.code(401).send({ error: "Unauthorized" })
    }

    const { id: mangaId } = request.params
    const { currentChapter, currentPage, totalChapters } = request.body

    try {
      const progressPercent = totalChapters ? (currentChapter / totalChapters) * 100 : 0

      const progress = await fastify.prisma.progress.upsert({
        where: {
          userId_mangaId: {
            userId,
            mangaId,
          },
        },
        update: {
          currentChapter,
          currentPage,
          totalChapters,
          progressPercent,
          lastWatched: new Date(),
        },
        create: {
          userId,
          mangaId,
          currentChapter,
          currentPage,
          totalChapters,
          progressPercent,
        },
      })

      return progress
    } catch (error) {
      fastify.log.error("Error updating progress:", error)
      return reply.code(500).send({ error: "Failed to update progress" })
    }
  })

  // Request manga-to-anime preview
  fastify.post("/:id/preview", async (request, reply) => {
    const { userId } = getAuth(request)
    if (!userId) {
      return reply.code(401).send({ error: "Unauthorized" })
    }

    const { id: mangaId } = request.params
    const { voiceType = "narrator", style = "anime" } = request.body

    try {
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
      }
    } catch (error) {
      fastify.log.error("Error requesting preview:", error)
      return reply.code(500).send({ error: "Failed to request preview" })
    }
  })

  // Get preview status
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
}
