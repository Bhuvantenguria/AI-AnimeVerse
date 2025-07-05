import fp from "fastify-plugin"
import { Queue, Worker } from "bullmq"
import redisClient from "../config/redisClient.js"

async function jobQueuePlugin(fastify, options) {
  if (!redisClient || redisClient.status !== "ready") {
    fastify.log.warn("⚠️ Redis not available, job queue disabled")
    return
  }

  const connection = {
    client: redisClient
  }

  // Create queues
  const chatQueue = new Queue("chat", { connection })
  const syncQueue = new Queue("sync", { connection })
  const emailQueue = new Queue("email", { connection })
  const narrationQueue = new Queue("narration", { connection })

  // Chat worker
  const chatWorker = new Worker("chat", async (job) => {
      const { sessionId, message, characterId } = job.data

      // Process AI chat response
      fastify.log.info(`Processing chat job: ${job.id}`)

      // Simulate AI processing
      await new Promise((resolve) => setTimeout(resolve, 1000))

      return { response: `AI response to: ${message}` }
  }, { connection })

  // Sync worker
  const syncWorker = new Worker("sync", async (job) => {
      const { type, externalId, source } = job.data

      fastify.log.info(`Processing sync job: ${job.id}`)

      if (type === "anime") {
        const animeData = await fastify.apiServices.jikan.getAnimeById(externalId)
        // Store in database
        await fastify.prisma.anime.upsert({
          where: { malId: Number.parseInt(externalId) },
          update: {
            title: animeData.anime.title,
            synopsis: animeData.anime.synopsis,
            coverImage: animeData.anime.images?.jpg?.large_image_url,
            episodes: animeData.anime.episodes,
            status: animeData.anime.status,
            rating: animeData.anime.score,
            year: animeData.anime.year,
            genres: animeData.anime.genres?.map((g) => g.name) || [],
          },
          create: {
            malId: Number.parseInt(externalId),
            title: animeData.anime.title,
            synopsis: animeData.anime.synopsis,
            coverImage: animeData.anime.images?.jpg?.large_image_url,
            episodes: animeData.anime.episodes,
            status: animeData.anime.status,
            rating: animeData.anime.score,
            year: animeData.anime.year,
            genres: animeData.anime.genres?.map((g) => g.name) || [],
          },
        })
      }

      return { success: true }
  }, { connection })

  // Email worker
  const emailWorker = new Worker("email", async (job) => {
      const { to, subject, template, data } = job.data

      fastify.log.info(`Processing email job: ${job.id}`)

      // Simulate email sending
      await new Promise((resolve) => setTimeout(resolve, 500))

      return { sent: true }
  }, { connection })

  // Narration worker
  const narrationWorker = new Worker("narration", async (job) => {
      const { requestId, userId, mangaId, chapterNumber, voiceType, language, speed, includeDialogue, includeNarration } = job.data

      fastify.log.info(`🎙️ Processing narration job: ${job.id} for request: ${requestId}`)

      try {
        // Import and execute narration job
        const { processNarrationJob } = await import("../../src/jobs/narrationJob.js")
        
        const result = await processNarrationJob({
          requestId,
          userId,
          mangaId,
          chapterNumber,
          voiceType,
          language,
          speed,
          includeDialogue,
          includeNarration
        }, fastify)

        fastify.log.info(`✅ Narration job completed: ${job.id}`)
        return result
      } catch (error) {
        fastify.log.error(`❌ Narration job failed: ${job.id}`, error)
        throw error
      }
  }, { 
    connection,
    concurrency: 2, // Process 2 narration jobs concurrently
    removeOnComplete: 10, // Keep 10 completed jobs
    removeOnFail: 50 // Keep 50 failed jobs for debugging
  })

  // Decorate fastify with queues
  fastify.decorate("jobQueue", {
    chat: chatQueue,
    sync: syncQueue,
    email: emailQueue,
    narration: narrationQueue,
  })

  // Also add as 'queues' for backward compatibility
  fastify.decorate("queues", {
    chat: chatQueue,
    sync: syncQueue,
    email: emailQueue,
    narration: narrationQueue,
  })

  // Graceful shutdown
  fastify.addHook("onClose", async () => {
    await chatWorker.close()
    await syncWorker.close()
    await emailWorker.close()
    await narrationWorker.close()
    await chatQueue.close()
    await syncQueue.close()
    await emailQueue.close()
    await narrationQueue.close()
  })

  fastify.log.info("📬 Job queue plugin registered")
}

export default fp(jobQueuePlugin)
