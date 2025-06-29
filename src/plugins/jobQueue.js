import { Queue, Worker } from "bullmq"
import fp from "fastify-plugin"

async function jobQueuePlugin(fastify, options) {
  const connection = {
    host: process.env.REDIS_HOST || "localhost",
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD,
  }

  // Create queues
  const narrationQueue = new Queue("narration", { connection })
  const previewQueue = new Queue("preview", { connection })
  const chatQueue = new Queue("chat", { connection })
  const emailQueue = new Queue("email", { connection })
  const syncQueue = new Queue("sync", { connection })

  // Create workers
  const narrationWorker = new Worker(
    "narration",
    async (job) => {
      const { processNarrationJob } = await import("../jobs/narrationJob.js")
      return await processNarrationJob(job.data, fastify)
    },
    { connection },
  )

  const previewWorker = new Worker(
    "preview",
    async (job) => {
      const { processPreviewJob } = await import("../jobs/previewJob.js")
      return await processPreviewJob(job.data, fastify)
    },
    { connection },
  )

  const chatWorker = new Worker(
    "chat",
    async (job) => {
      const { processChatJob } = await import("../jobs/chatJob.js")
      return await processChatJob(job.data, fastify)
    },
    { connection },
  )

  const emailWorker = new Worker(
    "email",
    async (job) => {
      const { processEmailJob } = await import("../jobs/emailJob.js")
      return await processEmailJob(job.data, fastify)
    },
    { connection },
  )

  const syncWorker = new Worker(
    "sync",
    async (job) => {
      const { processSyncJob } = await import("../jobs/syncJob.js")
      return await processSyncJob(job.data, fastify)
    },
    { connection },
  )

  // Add event listeners
  const workers = [narrationWorker, previewWorker, chatWorker, emailWorker, syncWorker]

  workers.forEach((worker) => {
    worker.on("completed", (job) => {
      fastify.log.info(`Job ${job.id} completed`)
    })

    worker.on("failed", (job, err) => {
      fastify.log.error(`Job ${job.id} failed:`, err)
    })
  })

  // Decorate fastify with queues
  fastify.decorate("queues", {
    narration: narrationQueue,
    preview: previewQueue,
    chat: chatQueue,
    email: emailQueue,
    sync: syncQueue,
  })

  // Graceful shutdown
  fastify.addHook("onClose", async () => {
    await Promise.all(workers.map((worker) => worker.close()))
    await Promise.all([
      narrationQueue.close(),
      previewQueue.close(),
      chatQueue.close(),
      emailQueue.close(),
      syncQueue.close(),
    ])
    fastify.log.info("Job queues closed")
  })

  fastify.log.info("✅ Job queues initialized")
}

export default fp(jobQueuePlugin, {
  name: "jobQueue",
})
