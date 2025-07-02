import fp from "fastify-plugin"

async function websocketPlugin(fastify, options) {
  const clients = new Map()

  fastify.register(async (fastify) => {
    fastify.get("/ws", { websocket: true }, (connection, req) => {
      const clientId = Date.now().toString()
      clients.set(clientId, connection)

      connection.socket.on("message", async (message) => {
        try {
          const data = JSON.parse(message.toString())

          switch (data.type) {
            case "auth":
              // Authenticate user and store user info
              try {
                const decoded = fastify.jwt.verify(data.token)
                connection.userId = decoded.id
                connection.send(JSON.stringify({ type: "auth_success" }))
              } catch (err) {
                connection.send(JSON.stringify({ type: "auth_error", message: "Invalid token" }))
              }
              break

            case "join_room":
              connection.room = data.room
              break

            case "chat_message":
              // Broadcast to room members
              clients.forEach((client, id) => {
                if (client.room === connection.room && id !== clientId) {
                  client.send(
                    JSON.stringify({
                      type: "chat_message",
                      message: data.message,
                      userId: connection.userId,
                      timestamp: new Date().toISOString(),
                    }),
                  )
                }
              })
              break
          }
        } catch (err) {
          fastify.log.error("WebSocket message error:", err)
        }
      })

      connection.socket.on("close", () => {
        clients.delete(clientId)
      })
    })
  })

  fastify.decorate("websocketClients", clients)
  fastify.log.info("🔌 WebSocket plugin registered")
}

export default fp(websocketPlugin, {
  name: "websocketHandler",
  decorators: {
    fastify: ["jwt"]
  },
  dependencies: ["@fastify/websocket"]
})
