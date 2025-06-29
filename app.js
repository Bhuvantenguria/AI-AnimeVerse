import Fastify from "fastify"
import cors from "@fastify/cors"
import websocket from "@fastify/websocket"
import multipart from "@fastify/multipart"
import rateLimit from "@fastify/rate-limit"
import env from "@fastify/env"
import { envSchema } from "./src/config/env.js"

// Import plugins
import prismaPlugin from "./src/plugins/prisma.js"
import cloudinaryPlugin from "./src/plugins/cloudinary.js"
import websocketPlugin from "./src/plugins/websocket.js"
import loggerPlugin from "./src/plugins/logger.js"
import jobQueuePlugin from "./src/plugins/jobQueue.js"
import apiServicesPlugin from "./src/plugins/apiServices.js"

// Import routes
import animeRoutes from "./src/routes/anime.js"
import mangaRoutes from "./src/routes/manga.js"
import userRoutes from "./src/routes/user.js"
import authRoutes from "./src/routes/auth.js"
import chatRoutes from "./src/routes/chat.js"
import quizRoutes from "./src/routes/quiz.js"
import communityRoutes from "./src/routes/community.js"
import aiRoutes from "./src/routes/ai.js"
import subscriptionRoutes from "./src/routes/subscription.js"
import notificationRoutes from "./src/routes/notification.js"

const fastify = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || "info",
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
      },
    },
  },
})

async function start() {
  try {
    // Register environment variables
    await fastify.register(env, {
      schema: envSchema,
      dotenv: true,
    })

    // Register CORS
    await fastify.register(cors, {
      origin: ["http://localhost:3000", "https://mangaverse.vercel.app", fastify.config.FRONTEND_URL],
      credentials: true,
    })

    // Register rate limiting
    await fastify.register(rateLimit, {
      max: 100,
      timeWindow: "1 minute",
    })

    // Register multipart for file uploads
    await fastify.register(multipart)

    // Register WebSocket support
    await fastify.register(websocket)

    // Register custom plugins
    await fastify.register(loggerPlugin)
    await fastify.register(prismaPlugin)
    await fastify.register(cloudinaryPlugin)
    await fastify.register(websocketPlugin)
    await fastify.register(jobQueuePlugin)
    await fastify.register(apiServicesPlugin)

    // Register routes
    await fastify.register(animeRoutes, { prefix: "/api/anime" })
    await fastify.register(mangaRoutes, { prefix: "/api/manga" })
    await fastify.register(userRoutes, { prefix: "/api/users" })
    await fastify.register(authRoutes, { prefix: "/api/auth" })
    await fastify.register(chatRoutes, { prefix: "/api/chat" })
    await fastify.register(quizRoutes, { prefix: "/api/quiz" })
    await fastify.register(communityRoutes, { prefix: "/api/community" })
    await fastify.register(aiRoutes, { prefix: "/api/ai" })
    await fastify.register(subscriptionRoutes, { prefix: "/api/subscription" })
    await fastify.register(notificationRoutes, { prefix: "/api/notifications" })

    // Health check endpoint
    fastify.get("/health", async (request, reply) => {
      return { status: "ok", timestamp: new Date().toISOString() }
    })

    // Start server
    const port = fastify.config.PORT || 3001
    const host = fastify.config.HOST || "192.168.178.215"

    await fastify.listen({ port, host })
    fastify.log.info(`🚀 Server running on http://${host}:${port}`)
  } catch (error) {
    fastify.log.error("Error starting server:", error)
    process.exit(1)
  }
}

// Graceful shutdown
process.on("SIGTERM", async () => {
  fastify.log.info("Received SIGTERM, shutting down gracefully...")
  await fastify.close()
  process.exit(0)
})

process.on("SIGINT", async () => {
  fastify.log.info("Received SIGINT, shutting down gracefully...")
  await fastify.close()
  process.exit(0)
})

start()
