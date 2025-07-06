import Fastify from "fastify"
import cors from "@fastify/cors"
import jwt from "@fastify/jwt"
import websocket from "@fastify/websocket"
import staticFiles from "@fastify/static"
import path from "path"
import { config } from "./config/env.js"
import { gracefulShutdown } from "./utils/gracefulShutdown.js"

// Import plugins
import prismaPlugin from "./plugins/prisma.js"
import authPlugin from "./plugins/auth.js"
import apiServicesPlugin from "./plugins/apiServices.js"
import jobQueuePlugin from "./plugins/jobQueue.js"
import cloudinaryPlugin from "./plugins/cloudinary.js"
import websocketPlugin from "./plugins/websocket.js"
import loggerPlugin from "./plugins/logger.js"
import redisPlugin from "./plugins/redis.js"

// Import routes
import animeRoutes from "./routes/animeRoutes.js"
import mangaRoutes from "./routes/mangaRoutes.js"
import authRoutes from "./routes/authRoutes.js"
import userRoutes from "./routes/userRoutes.js"
import communityRoutes from "./routes/communityRoutes.js"
import aiRoutes from "./routes/aiRoutes.js"
import chatRoutes from "./routes/chatRoutes.js"
import quizRoutes from "./routes/quizRoutes.js"
import searchRoutes from "./routes/searchRoutes.js"
import notificationRoutes from "./routes/notificationRoutes.js"
import subscriptionRoutes from "./routes/subscriptionRoutes.js"
import narratorRoutes from "./routes/narratorRoutes.js"
import dashboardRoutes from "./routes/dashboardRoutes.js"

const fastify = Fastify({
  logger: {
    level: config.LOG_LEVEL || "info",
    transport: {
            target: "pino-pretty",
            options: {
        translateTime: "HH:MM:ss.l",
        ignore: "pid,hostname",
      },
    },
  },
})

// Register core plugins first
await fastify.register(cors, {
  origin: ["http://localhost:3000", config.FRONTEND_URL],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["Content-Range", "X-Content-Range"],
  maxAge: 86400,
})

// Register authentication plugins
await fastify.register(jwt, {
  secret: config.JWT_SECRET,
  sign: {
    expiresIn: config.JWT_EXPIRES_IN,
  },
})

// Register database and logger plugins
await fastify.register(prismaPlugin)
await fastify.register(loggerPlugin)
await fastify.register(redisPlugin) // Enable Redis plugin with fallback support

// Register service plugins
await fastify.register(apiServicesPlugin)
await fastify.register(jobQueuePlugin) // Enable job queue plugin
await fastify.register(cloudinaryPlugin)

// Register websocket plugins
await fastify.register(websocket, {
  options: {
    maxPayload: 1048576, // 1MB
    clientTracking: true,
  },
})
await fastify.register(websocketPlugin)

// Register static file serving for uploads
await fastify.register(staticFiles, {
  root: path.join(process.cwd(), 'uploads'),
  prefix: '/uploads/',
  setHeaders: (res, path, stat) => {
    // Set proper headers for audio files
    if (path.endsWith('.mp3') || path.endsWith('.wav') || path.endsWith('.m4a')) {
      res.setHeader('Content-Type', 'audio/mpeg')
      res.setHeader('Accept-Ranges', 'bytes')
      res.setHeader('Cache-Control', 'public, max-age=3600')
      // Add CORS headers for cross-origin audio access
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS')
      res.setHeader('Access-Control-Allow-Headers', 'Range')
    }
  }
})

// Register auth plugin after all dependencies
await fastify.register(authPlugin)

// Register routes under /api prefix
fastify.register(async function (fastify) {
  fastify.register(animeRoutes, { prefix: "/anime" })
  fastify.register(mangaRoutes, { prefix: "/manga" })
  fastify.register(authRoutes, { prefix: "/auth" })
  fastify.register(userRoutes, { prefix: "/user" })
  fastify.register(communityRoutes, { prefix: "/community" })
  fastify.register(aiRoutes, { prefix: "/ai" })
  fastify.register(chatRoutes, { prefix: "/chat" })
  fastify.register(quizRoutes, { prefix: "/quiz" })
  fastify.register(searchRoutes, { prefix: "/search" })
  fastify.register(notificationRoutes, { prefix: "/notifications" })
  fastify.register(subscriptionRoutes, { prefix: "/subscriptions" })
  fastify.register(narratorRoutes, { prefix: "/narrator" })
  fastify.register(dashboardRoutes, { prefix: "/dashboard" })
}, { prefix: "/api" })

// Health check route
fastify.get("/health", async () => ({ status: "ok" }))

// Ensure upload directories exist
import fs from "fs/promises"
const uploadDirs = [
  path.join(process.cwd(), 'uploads'),
  path.join(process.cwd(), 'uploads', 'narrations'),
  path.join(process.cwd(), 'uploads', 'images'),
  path.join(process.cwd(), 'uploads', 'temp')
]

for (const dir of uploadDirs) {
  await fs.mkdir(dir, { recursive: true })
}

// Start server
  try {
  await fastify.listen({ port: config.PORT || 3001, host: "0.0.0.0" })
  fastify.log.info(`≡🚀 MangaVerse API running on port ${config.PORT || 3001}`)
  fastify.log.info(`📁 Upload directories created`)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
}

// Handle graceful shutdown
gracefulShutdown(fastify)
