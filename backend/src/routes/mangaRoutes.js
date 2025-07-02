import createMangaService from '../services/mangaService.js'

export default async function mangaRoutes(fastify, options) {
  const mangaService = await createMangaService(fastify)

  // Get manga list (top or search)
  fastify.get("/", async (request, reply) => {
    try {
      const { 
        search = '', 
        page = 1, 
        limit = 20,
        genre = 'any',
        status = 'any',
        year = 'any'
      } = request.query

      // Only pass search if it's not empty
      const result = await mangaService.searchManga(
        search || undefined,
        parseInt(page),
        parseInt(limit)
      )

      return {
        data: result.data,
          pagination: {
          has_next_page: result.pagination.has_next_page,
          current_page: result.pagination.current_page,
          items: result.pagination.items
        }
      }
    } catch (error) {
      fastify.log.error("Manga route error:", error)
      return reply.code(500).send({ 
        error: "Failed to fetch manga",
        message: error.message || "An unexpected error occurred"
      })
    }
  })

  // Get manga by ID
  fastify.get("/:id", async (request, reply) => {
    try {
    const { id } = request.params
      const mangaData = await mangaService.getMangaById(id)
      
      if (!mangaData) {
        return reply.code(404).send({ error: "Manga not found" })
      }

      return mangaData
    } catch (error) {
      fastify.log.error("Failed to get manga by ID:", error)
      return reply.code(500).send({ 
        error: "Failed to fetch manga details",
        message: error.message || "An unexpected error occurred"
      })
    }
  })

  // Get manga chapters
  fastify.get("/:id/chapters", async (request, reply) => {
    const { id } = request.params
    const { page = 1, limit = 50 } = request.query

    try {
      const chaptersData = await mangaService.getMangaChapters(id, page, limit)
      return chaptersData
    } catch (error) {
      fastify.log.error("Failed to get manga chapters:", error)
      return reply.code(500).send({ error: "Failed to fetch manga chapters" })
    }
  })

  // Get chapter content
  fastify.get("/:id/chapters/:chapterNumber", async (request, reply) => {
    const { id, chapterNumber } = request.params

    try {
      const chapterData = await mangaService.getChapterContent(id, chapterNumber)
      return chapterData
    } catch (error) {
      fastify.log.error("Failed to get chapter content:", error)
      return reply.code(500).send({ error: "Failed to fetch chapter content" })
    }
  })

  // Add to reading list
  fastify.post(
    "/:id/reading-list",
    {
      preHandler: fastify.authenticate,
      schema: {
        body: {
          type: "object",
          required: ["status"],
          properties: {
            status: {
              type: "string",
              enum: ["reading", "completed", "on_hold", "dropped", "plan_to_read"],
            },
            rating: { type: "number", minimum: 1, maximum: 10 },
            notes: { type: "string", maxLength: 1000 },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params
      const { status, rating, notes } = request.body
      const userId = request.user.id

      try {
        // Get manga details
        let mangaData
        let malId = null

        if (id.startsWith("jikan-")) {
          malId = Number.parseInt(id.replace("jikan-", ""))
          mangaData = await fastify.apiServices.jikan.getMangaById(malId)
          mangaData = mangaData.manga
        } else {
          mangaData = await fastify.apiServices.jikan.getMangaById(id)
          mangaData = mangaData.manga
          malId = mangaData.mal_id
        }

        // Upsert manga in database
        const manga = await fastify.prisma.manga.upsert({
          where: malId ? { malId } : { title: mangaData.title },
          update: {
            title: mangaData.title,
            titleJp: mangaData.title_japanese,
            synopsis: mangaData.synopsis,
            coverImage: mangaData.images?.jpg?.large_image_url,
            chapters: mangaData.chapters,
            volumes: mangaData.volumes,
            status: mangaData.status,
            rating: mangaData.score,
            year: mangaData.year,
            genres: mangaData.genres?.map((g) => g.name) || [],
            authors: mangaData.authors?.map((a) => a.name) || [],
          },
          create: {
            malId,
            title: mangaData.title,
            titleJp: mangaData.title_japanese,
            synopsis: mangaData.synopsis,
            coverImage: mangaData.images?.jpg?.large_image_url,
            chapters: mangaData.chapters,
            volumes: mangaData.volumes,
            status: mangaData.status,
            rating: mangaData.score,
            year: mangaData.year,
            genres: mangaData.genres?.map((g) => g.name) || [],
            authors: mangaData.authors?.map((a) => a.name) || [],
          },
        })

        // Upsert reading list entry
        const readingListEntry = await fastify.prisma.readingList.upsert({
          where: {
            userId_mangaId: {
              userId,
              mangaId: manga.id,
            },
          },
          update: {
            status,
            rating,
            notes,
            updatedAt: new Date(),
          },
          create: {
            userId,
            mangaId: manga.id,
            status,
            rating,
            notes,
          },
        })

        // Add XP
        await fastify.prisma.user.update({
          where: { id: userId },
          data: { xp: { increment: 10 } },
        })

        return {
          message: "Added to reading list successfully",
          readingListEntry,
        }
      } catch (error) {
        fastify.log.error("Add to reading list error:", error)
        return reply.code(500).send({ error: "Failed to add to reading list" })
      }
    },
  )

  // Update manga progress (authenticated)
  fastify.post(
    "/:id/progress",
    {
      preHandler: fastify.authenticate,
      schema: {
        body: {
          type: "object",
          required: ["currentChapter"],
          properties: {
            currentChapter: { type: "integer", minimum: 0 },
            currentPage: { type: "integer", minimum: 0 },
            totalChapters: { type: "integer", minimum: 1 },
          },
        },
      },
    },
    async (request, reply) => {
      const { id: mangaId } = request.params
      const { currentChapter, currentPage = 0, totalChapters } = request.body
      const userId = request.user.id

      try {
        // Get manga record
        const mangaRecord = await fastify.prisma.manga.findUnique({
          where: { malId: Number.parseInt(mangaId) },
        })

        if (!mangaRecord) {
          return reply.code(404).send({ error: "Manga not found in database" })
        }

        // Upsert progress
        const progress = await fastify.prisma.mangaProgress.upsert({
          where: {
            userId_mangaId: {
              userId,
              mangaId: mangaRecord.id,
            },
          },
          update: {
            currentChapter,
            currentPage,
            totalChapters: totalChapters || mangaRecord.chapters,
            updatedAt: new Date(),
          },
          create: {
            userId,
            mangaId: mangaRecord.id,
            currentChapter,
            currentPage,
            totalChapters: totalChapters || mangaRecord.chapters,
          },
        })

        // Check if manga is completed
        const isCompleted = currentChapter >= (totalChapters || mangaRecord.chapters || 0)

        if (isCompleted) {
          // Update reading list status to completed
          await fastify.prisma.readingList.updateMany({
            where: {
              userId,
              mangaId: mangaRecord.id,
            },
            data: {
              status: "completed",
              updatedAt: new Date(),
            },
          })

          // Add completion XP
          await fastify.userService.addXP(userId, 50)
        } else {
          // Add progress XP
          await fastify.userService.addXP(userId, 5)
        }

        return {
          message: "Progress updated successfully",
          progress,
          completed: isCompleted,
        }
      } catch (error) {
        fastify.log.error("Update progress error:", error)
        return reply.code(500).send({ error: "Failed to update progress" })
      }
    },
  )

  // Remove from reading list (authenticated)
  fastify.delete(
    "/:id/reading-list",
    {
      preHandler: fastify.authenticate,
    },
    async (request, reply) => {
      const { id: mangaId } = request.params
      const userId = request.user.id

      try {
        const mangaRecord = await fastify.prisma.manga.findUnique({
          where: { malId: Number.parseInt(mangaId) },
        })

        if (!mangaRecord) {
          return reply.code(404).send({ error: "Manga not found" })
        }

        await fastify.prisma.readingList.deleteMany({
          where: {
            userId,
            mangaId: mangaRecord.id,
          },
        })

        return { message: "Removed from reading list successfully" }
      } catch (error) {
        fastify.log.error("Remove from reading list error:", error)
        return reply.code(500).send({ error: "Failed to remove from reading list" })
      }
    },
  )
}
