import fp from "fastify-plugin"

async function loggerPlugin(fastify, options) {
  // Add custom logging methods
  fastify.decorate("logUserAction", (userId, action, details = {}) => {
    fastify.log.info({
      type: "user_action",
      userId,
      action,
      details,
      timestamp: new Date().toISOString(),
    })
  })

  fastify.decorate("logAPICall", (endpoint, method, userId, responseTime, statusCode) => {
    fastify.log.info({
      type: "api_call",
      endpoint,
      method,
      userId,
      responseTime,
      statusCode,
      timestamp: new Date().toISOString(),
    })
  })

  fastify.decorate("logError", (error, context = {}) => {
    fastify.log.error({
      type: "application_error",
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name,
      },
      context,
      timestamp: new Date().toISOString(),
    })
  })

  // Add request logging hook
  fastify.addHook("onRequest", async (request, reply) => {
    request.startTime = Date.now()
  })

  fastify.addHook("onResponse", async (request, reply) => {
    const responseTime = Date.now() - request.startTime
    const userId = request.user?.id || "anonymous"

    fastify.logAPICall(request.url, request.method, userId, responseTime, reply.statusCode)
  })

  fastify.log.info("📝 Logger plugin registered")
}

export default fp(loggerPlugin)
