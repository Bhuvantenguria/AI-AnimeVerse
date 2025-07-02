import Fastify from "fastify"
import cors from "@fastify/cors"
import websocket from "@fastify/websocket"
import multipart from "@fastify/multipart"
import rateLimit from "@fastify/rate-limit"
import env from "@fastify/env"
import { envSchema } from "./config/env.js"
import { config } from "./config/env.js"

// Import plugins
import prismaPlugin from "./plugins/prisma.js"
import cloudinaryPlugin from "./plugins/cloudinary.js"
import websocketPlugin from "./plugins/websocket.js"
import loggerPlugin from "./plugins/logger.js"
import jobQueuePlugin from "./plugins/jobQueue.js"
import apiServicesPlugin from "./plugins/apiServices.js"
import authPlugin from "./plugins/auth.js"

// Import routes
import animeRoutes from "./routes/animeRoutes.js"
import mangaRoutes from "./routes/mangaRoutes.js"
import userRoutes from "./routes/userRoutes.js"
import authRoutes from "./routes/authRoutes.js"
import chatRoutes from "./routes/chatRoutes.js"
import quizRoutes from "./routes/quizRoutes.js"
import communityRoutes from "./routes/communityRoutes.js"
import aiRoutes from "./routes/aiRoutes.js"
import subscriptionRoutes from "./routes/subscriptionRoutes.js"
import notificationRoutes from "./routes/notificationRoutes.js"
import dashboardRoutes from "./routes/dashboardRoutes.js"
import searchRoutes from "./routes/searchRoutes.js"

export function createApp(options = {}) {
  const app = Fastify({
    logger: {
      level: config.LOG_LEVEL,
      transport:
        config.NODE_ENV === "development"
          ? {
              target: "pino-pretty",
              options: {
                colorize: true,
              },
            }
          : undefined,
    },
    ...options,
  })

  async function buildApp() {
    try {
      // Register environment variables
      await app.register(env, {
        schema: envSchema,
        dotenv: true,
      })

      // Register CORS
      await app.register(cors, {
        origin: ["http://localhost:3000", "https://mangaverse.vercel.app", app.config.FRONTEND_URL].filter(Boolean),
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
      })

      // Register rate limiting
      await app.register(rateLimit, {
        max: 100,
        timeWindow: "1 minute",
        errorResponseBuilder: (request, context) => ({
          code: 429,
          error: "Rate limit exceeded",
          message: `Rate limit exceeded, retry in ${Math.round(context.ttl / 1000)} seconds`,
        }),
      })

      // Register multipart for file uploads
      await app.register(multipart, {
        limits: {
          fileSize: 50 * 1024 * 1024, // 50MB
          files: 5,
        },
      })

      // Register WebSocket support
      await app.register(websocket)

      // Register custom plugins
      await app.register(loggerPlugin)
      await app.register(prismaPlugin)
      await app.register(cloudinaryPlugin)
      await app.register(websocketPlugin)
      await app.register(jobQueuePlugin)
      await app.register(apiServicesPlugin)
      await app.register(authPlugin)

      // Register routes with proper prefixes
      await app.register(animeRoutes, { prefix: "/api/anime" })
      await app.register(mangaRoutes, { prefix: "/api/manga" })
      await app.register(userRoutes, { prefix: "/api/users" })
      await app.register(authRoutes, { prefix: "/api/auth" })
      await app.register(chatRoutes, { prefix: "/api/chat" })
      await app.register(quizRoutes, { prefix: "/api/quiz" })
      await app.register(communityRoutes, { prefix: "/api/community" })
      await app.register(aiRoutes, { prefix: "/api/ai" })
      await app.register(subscriptionRoutes, { prefix: "/api/subscription" })
      await app.register(notificationRoutes, { prefix: "/api/notifications" })
      await app.register(dashboardRoutes, { prefix: "/api/dashboard" })
      await app.register(searchRoutes, { prefix: "/api/search" })

      // Health check endpoint
      app.get("/health", async (request, reply) => {
        try {
          // Check database connection
          await app.prisma.$queryRaw`SELECT 1`

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
      app.get("/api", async (request, reply) => {
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
      app.setErrorHandler(async (error, request, reply) => {
        app.log.error(error)

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
      app.setNotFoundHandler(async (request, reply) => {
        reply.code(404).send({
          error: "Not Found",
          message: `Route ${request.method} ${request.url} not found`,
        })
      })

      return app
    } catch (error) {
      app.log.error("Error building app:", error)
      throw error
    }
  }

  return buildApp()
}
