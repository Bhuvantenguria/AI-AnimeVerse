export function gracefulShutdown(fastify) {
  const signals = ["SIGINT", "SIGTERM"]

  signals.forEach((signal) => {
    process.on(signal, async () => {
      fastify.log.info(`Received ${signal}, shutting down gracefully...`)

      try {
        await fastify.close()
        fastify.log.info("Server closed successfully")
        process.exit(0)
      } catch (err) {
        fastify.log.error("Error during shutdown:", err)
        process.exit(1)
      }
    })
  })

  process.on("uncaughtException", (err) => {
    fastify.log.error("Uncaught Exception:", err)
    process.exit(1)
  })

  process.on("unhandledRejection", (reason, promise) => {
    fastify.log.error("Unhandled Rejection at:", promise, "reason:", reason)
    process.exit(1)
  })
}
