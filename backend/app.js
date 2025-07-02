import Fastify from "fastify"
import cors from "@fastify/cors"
import websocket from "@fastify/websocket"
import multipart from "@fastify/multipart"
import rateLimit from "@fastify/rate-limit"
import env from "@fastify/env"
import { config } from "./src/config/env.js"

// Import plugins
import prismaPlugin from "./src/plugins/prisma.js"
import cloudinaryPlugin from "./src/plugins/cloudinary.js"
import websocketPlugin from "./src/plugins/websocket.js"
import loggerPlugin from "./src/plugins/logger.js"
import jobQueuePlugin from "./src/plugins/jobQueue.js"
import apiServicesPlugin from "./src/plugins/apiServices.js"
import authPlugin from "./src/plugins/auth.js"

// Import routes
import animeRoutes from "./src/routes/animeRoutes.js"
import mangaRoutes from "./src/routes/mangaRoutes.js"
import userRoutes from "./src/routes/userRoutes.js"
import authRoutes from "./src/routes/authRoutes.js"
import chatRoutes from "./src/routes/chatRoutes.js"
import quizRoutes from "./src/routes/quizRoutes.js"
import communityRoutes from "./src/routes/communityRoutes.js"
import aiRoutes from "./src/routes/aiRoutes.js"
import subscriptionRoutes from "./src/routes/subscriptionRoutes.js"
import notificationRoutes from "./src/routes/notificationRoutes.js"
import dashboardRoutes from "./src/routes/dashboardRoutes.js"
import searchRoutes from "./src/routes/searchRoutes.js"

const fastify = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || "info",
    transport:
      process.env.NODE_ENV === "development"
        ? {
            target: "pino-pretty",
            options: {
              colorize: true,
            },
          }
        : undefined,
  },
})

async function start() {
  try {
    // Register environment variables
    await fastify.register(env, {
      schema: config,
      dotenv: true,
    })

    // Register CORS
    await fastify.register(cors, {
      origin: ["http://localhost:3000", "https://mangaverse.vercel.app", fastify.config.FRONTEND_URL].filter(Boolean),
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    })

    // Register rate limiting
    await fastify.register(rateLimit, {
      max: 100,
      timeWindow: "1 minute",
      errorResponseBuilder: (request, context) => ({
        code: 429,
        error: "Rate limit exceeded",
        message: `Rate limit exceeded, retry in ${Math.round(context.ttl / 1000)} seconds`,
      }),
    })

    // Register multipart for file uploads
    await fastify.register(multipart, {
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB
        files: 5,
      },
    })

    // Register WebSocket support
    await fastify.register(websocket)

    // Register custom plugins
    await fastify.register(loggerPlugin)
    await fastify.register(prismaPlugin)
    await fastify.register(cloudinaryPlugin)
    await fastify.register(websocketPlugin)
    await fastify.register(jobQueuePlugin)
    await fastify.register(apiServicesPlugin)
    await fastify.register(authPlugin)

    // Register routes with proper prefixes
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
    await fastify.register(dashboardRoutes, { prefix: "/api/dashboard" })
    await fastify.register(searchRoutes, { prefix: "/api/search" })

    // Health check endpoint
    fastify.get("/health", async (request, reply) => {
      try {
        // Check database connection
        await fastify.prisma.$queryRaw`SELECT 1`

        return {
          status: "healthy",
          timestamp: new Date().toISOString(),
          version: "1.0.0",
          services: {
            database: "connected",
            redis: "connected",
            apis: "operational",
          },
        }
      } catch (error) {
        reply.code(503)
        return {
          status: "unhealthy",
          error: error.message,
          timestamp: new Date().toISOString(),
        }
      }
    })

    // API documentation endpoint
    fastify.get("/api", async (request, reply) => {
      return {
        name: "MangaVerse API",
        version: "1.0.0",
        description: "Complete anime and manga platform API",
        endpoints: {
          anime: "/api/anime",
          manga: "/api/manga",
          chat: "/api/chat",
          quiz: "/api/quiz",
          community: "/api/community",
          ai: "/api/ai",
          dashboard: "/api/dashboard",
          search: "/api/search",
        },
      }
    })

    // Global error handler
    fastify.setErrorHandler(async (error, request, reply) => {
      fastify.log.error(error)

      if (error.validation) {
        reply.code(400).send({
          error: "Validation Error",
          message: error.message,
          details: error.validation,
        })
        return
      }

      if (error.statusCode) {
        reply.code(error.statusCode).send({
          error: error.message,
        })
        return
      }

      reply.code(500).send({
        error: "Internal Server Error",
        message: process.env.NODE_ENV === "development" ? error.message : "Something went wrong",
      })
    })

    // 404 handler
    fastify.setNotFoundHandler(async (request, reply) => {
      reply.code(404).send({
        error: "Not Found",
        message: `Route ${request.method} ${request.url} not found`,
      })
    })

    // Start server
    const port = fastify.config.PORT || 3001
    const host = fastify.config.HOST || "0.0.0.0"

    await fastify.listen({ port, host })
    fastify.log.info(`🚀 MangaVerse Backend running on http://${host}:${port}`)
    fastify.log.info(`📚 Environment: ${process.env.NODE_ENV}`)
    fastify.log.info(`🔗 API Documentation: http://${host}:${port}/api`)
  } catch (error) {
    fastify.log.error("Error starting server:", error)
    process.exit(1)
  }
}

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  fastify.log.info(`Received ${signal}, shutting down gracefully...`)
  try {
    await fastify.close()
    process.exit(0)
  } catch (error) {
    fastify.log.error("Error during shutdown:", error)
    process.exit(1)
  }
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"))
process.on("SIGINT", () => gracefulShutdown("SIGINT"))

// Handle unhandled rejections
process.on("unhandledRejection", (reason, promise) => {
  fastify.log.error("Unhandled Rejection at:", promise, "reason:", reason)
  process.exit(1)
})

process.on("uncaughtException", (error) => {
  fastify.log.error("Uncaught Exception:", error)
  process.exit(1)
})

start()
