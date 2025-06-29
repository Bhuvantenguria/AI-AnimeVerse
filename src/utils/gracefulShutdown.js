export function setupGracefulShutdown(fastify) {
  const gracefulShutdown = async (signal) => {
    fastify.log.info(`Received ${signal}, shutting down gracefully...`)

    try {
      await fastify.close()
      fastify.log.info("Server closed successfully")
      process.exit(0)
    } catch (error) {
      fastify.log.error("Error during shutdown:", error)
      process.exit(1)
    }
  }

  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"))
  process.on("SIGINT", () => gracefulShutdown("SIGINT"))
}
