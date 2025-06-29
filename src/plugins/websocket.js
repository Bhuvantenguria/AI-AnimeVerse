import fp from "fastify-plugin"

async function websocketPlugin(fastify, options) {
  const connections = new Map()

  // WebSocket route
  fastify.get("/ws", { websocket: true }, (connection, request) => {
    const userId = request.query.userId

    if (userId) {
      connections.set(userId, connection)
      fastify.log.info(`WebSocket connected for user: ${userId}`)

      connection.on("close", () => {
        connections.delete(userId)
        fastify.log.info(`WebSocket disconnected for user: ${userId}`)
      })

      connection.on("message", (message) => {
        try {
          const data = JSON.parse(message.toString())
          handleWebSocketMessage(data, userId, connection, fastify)
        } catch (error) {
          fastify.log.error("WebSocket message error:", error)
        }
      })
    }
  })

  // Helper functions
  const sendToUser = (userId, data) => {
    const connection = connections.get(userId)
    if (connection && connection.readyState === 1) {
      connection.send(JSON.stringify(data))
    }
  }

  const broadcast = (data) => {
    connections.forEach((connection, userId) => {
      if (connection.readyState === 1) {
        connection.send(JSON.stringify(data))
      }
    })
  }

  // Decorate fastify
  fastify.decorate("websocket", {
    sendToUser,
    broadcast,
    connections,
  })

  fastify.log.info("✅ WebSocket plugin initialized")
}

async function handleWebSocketMessage(data, userId, connection, fastify) {
  switch (data.type) {
    case "ping":
      connection.send(JSON.stringify({ type: "pong", timestamp: Date.now() }))
      break

    case "join_room":
      // Handle room joining for real-time features
      break

    default:
      fastify.log.warn(`Unknown WebSocket message type: ${data.type}`)
  }
}

export default fp(websocketPlugin, {
  name: "websocket",
})
