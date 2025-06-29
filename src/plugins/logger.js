import winston from "winston"
import fp from "fastify-plugin"

async function loggerPlugin(fastify, options) {
  const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || "info",
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json(),
    ),
    defaultMeta: { service: "mangaverse-backend" },
    transports: [
      new winston.transports.File({ filename: "logs/error.log", level: "error" }),
      new winston.transports.File({ filename: "logs/combined.log" }),
    ],
  })

  if (process.env.NODE_ENV !== "production") {
    logger.add(
      new winston.transports.Console({
        format: winston.format.simple(),
      }),
    )
  }

  // Add custom logging methods
  fastify.decorate("logActivity", (userId, action, details = {}) => {
    fastify.log.info({
      type: "user_activity",
      userId,
      action,
      details,
      timestamp: new Date().toISOString(),
    })
  })

  fastify.decorate("logError", (error, context = {}) => {
    fastify.log.error({
      type: "application_error",
      error: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
    })
  })

  fastify.log.info("✅ Logger plugin initialized")
  fastify.decorate("logger", logger)
}

export default fp(loggerPlugin, {
  name: "logger",
})
