export default async function chatRoutes(fastify, options) {
  // Get available characters for chat
  fastify.get("/characters", async (request, reply) => {
    const { search, animeId, mangaId, page = 1, limit = 20 } = request.query

    try {
      const where = {}

      if (search) {
        where.name = {
          contains: search,
          mode: "insensitive",
        }
      }

      if (animeId) {
        where.animeId = animeId
      }

      if (mangaId) {
        where.mangaId = mangaId
      }

      const [characters, total] = await Promise.all([
        fastify.prisma.character.findMany({
          where,
          include: {
            anime: {
              select: { title: true, coverImage: true },
            },
            manga: {
              select: { title: true, coverImage: true },
            },
          },
          orderBy: { popularity: "desc" },
          skip: (page - 1) * limit,
          take: Number.parseInt(limit),
        }),
        fastify.prisma.character.count({ where }),
      ])

      return {
        data: characters,
        pagination: {
          page: Number.parseInt(page),
          limit: Number.parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      }
    } catch (error) {
      fastify.log.error("Get characters error:", error)
      return reply.code(500).send({ error: "Failed to fetch characters" })
    }
  })

  // Get character details
  fastify.get("/characters/:id", async (request, reply) => {
    const { id } = request.params

    try {
      const character = await fastify.prisma.character.findUnique({
        where: { id },
        include: {
          anime: {
            select: { title: true, coverImage: true, synopsis: true },
          },
          manga: {
            select: { title: true, coverImage: true, synopsis: true },
          },
        },
      })

      if (!character) {
        return reply.code(404).send({ error: "Character not found" })
      }

      return { character }
    } catch (error) {
      fastify.log.error("Get character error:", error)
      return reply.code(500).send({ error: "Failed to fetch character details" })
    }
  })

  // Start chat session (authenticated)
  fastify.post(
    "/start",
    {
      preHandler: fastify.authenticate,
      schema: {
        body: {
          type: "object",
          required: ["characterId"],
          properties: {
            characterId: { type: "string" },
          },
        },
      },
    },
    async (request, reply) => {
      const { characterId } = request.body
      const userId = request.user.id

      try {
        // Verify character exists
        const character = await fastify.prisma.character.findUnique({
          where: { id: characterId },
          include: {
            anime: true,
            manga: true,
          },
        })

        if (!character) {
          return reply.code(404).send({ error: "Character not found" })
        }

        // Create chat session
        const session = await fastify.prisma.chatSession.create({
          data: {
            userId,
            characterId,
            title: `Chat with ${character.name}`,
            lastMessage: new Date(),
          },
        })

        // Create initial greeting message
        const greetingMessage = await fastify.prisma.chatMessage.create({
          data: {
            sessionId: session.id,
            content: character.greeting || `Hello! I'm ${character.name}. How can I help you today?`,
            isFromCharacter: true,
            timestamp: new Date(),
          },
        })

        return {
          session: {
            ...session,
            character,
            messages: [greetingMessage],
          },
        }
      } catch (error) {
        fastify.log.error("Start chat error:", error)
        return reply.code(500).send({ error: "Failed to start chat session" })
      }
    },
  )

  // Send message (authenticated)
  fastify.post(
    "/message",
    {
      preHandler: fastify.authenticate,
      schema: {
        body: {
          type: "object",
          required: ["sessionId", "message"],
          properties: {
            sessionId: { type: "string" },
            message: { type: "string", minLength: 1, maxLength: 1000 },
          },
        },
      },
    },
    async (request, reply) => {
      const { sessionId, message } = request.body
      const userId = request.user.id

      try {
        // Verify session belongs to user
        const session = await fastify.prisma.chatSession.findFirst({
          where: {
            id: sessionId,
            userId,
          },
          include: {
            character: {
              include: {
                anime: true,
                manga: true,
              },
            },
          },
        })

        if (!session) {
          return reply.code(404).send({ error: "Chat session not found" })
        }

        // Save user message
        const userMessage = await fastify.prisma.chatMessage.create({
          data: {
            sessionId,
            content: message,
            isFromCharacter: false,
            timestamp: new Date(),
          },
        })

        // Generate AI response (simplified - in real implementation, use OpenAI)
        const aiResponse = await generateCharacterResponse(session.character, message, fastify)

        // Save character response
        const characterMessage = await fastify.prisma.chatMessage.create({
          data: {
            sessionId,
            content: aiResponse,
            isFromCharacter: true,
            timestamp: new Date(),
          },
        })

        // Update session last message time
        await fastify.prisma.chatSession.update({
          where: { id: sessionId },
          data: { lastMessage: new Date() },
        })

        // Add XP for chatting
        await fastify.userService.addXP(userId, 2)

        // Send real-time update via WebSocket
        fastify.websocketClients.forEach((client) => {
          if (client.userId === userId) {
            client.send(
              JSON.stringify({
                type: "chat_message",
                sessionId,
                messages: [userMessage, characterMessage],
              }),
            )
          }
        })

        return {
          userMessage,
          characterMessage,
        }
      } catch (error) {
        fastify.log.error("Send message error:", error)
        return reply.code(500).send({ error: "Failed to send message" })
      }
    },
  )

  // Get chat history (authenticated)
  fastify.get(
    "/history/:sessionId",
    {
      preHandler: fastify.authenticate,
    },
    async (request, reply) => {
      const { sessionId } = request.params
      const { page = 1, limit = 50 } = request.query
      const userId = request.user.id

      try {
        // Verify session belongs to user
        const session = await fastify.prisma.chatSession.findFirst({
          where: {
            id: sessionId,
            userId,
          },
          include: {
            character: true,
          },
        })

        if (!session) {
          return reply.code(404).send({ error: "Chat session not found" })
        }

        const messages = await fastify.prisma.chatMessage.findMany({
          where: { sessionId },
          orderBy: { timestamp: "asc" },
          skip: (page - 1) * limit,
          take: Number.parseInt(limit),
        })

        return {
          session,
          messages,
          pagination: {
            page: Number.parseInt(page),
            limit: Number.parseInt(limit),
          },
        }
      } catch (error) {
        fastify.log.error("Get chat history error:", error)
        return reply.code(500).send({ error: "Failed to get chat history" })
      }
    },
  )

  // Get user's chat sessions (authenticated)
  fastify.get(
    "/sessions",
    {
      preHandler: fastify.authenticate,
    },
    async (request, reply) => {
      const { page = 1, limit = 20 } = request.query
      const userId = request.user.id

      try {
        const [sessions, total] = await Promise.all([
          fastify.prisma.chatSession.findMany({
            where: { userId },
            include: {
              character: {
                select: {
                  id: true,
                  name: true,
                  avatar: true,
                },
              },
              _count: {
                select: { messages: true },
              },
            },
            orderBy: { lastMessage: "desc" },
            skip: (page - 1) * limit,
            take: Number.parseInt(limit),
          }),
          fastify.prisma.chatSession.count({
            where: { userId },
          }),
        ])

        return {
          sessions,
          pagination: {
            page: Number.parseInt(page),
            limit: Number.parseInt(limit),
            total,
            pages: Math.ceil(total / limit),
          },
        }
      } catch (error) {
        fastify.log.error("Get sessions error:", error)
        return reply.code(500).send({ error: "Failed to get chat sessions" })
      }
    },
  )

  // Delete chat session (authenticated)
  fastify.delete(
    "/sessions/:sessionId",
    {
      preHandler: fastify.authenticate,
    },
    async (request, reply) => {
      const { sessionId } = request.params
      const userId = request.user.id

      try {
        // Verify session belongs to user
        const session = await fastify.prisma.chatSession.findFirst({
          where: {
            id: sessionId,
            userId,
          },
        })

        if (!session) {
          return reply.code(404).send({ error: "Chat session not found" })
        }

        // Delete all messages first
        await fastify.prisma.chatMessage.deleteMany({
          where: { sessionId },
        })

        // Delete session
        await fastify.prisma.chatSession.delete({
          where: { id: sessionId },
        })

        return { message: "Chat session deleted successfully" }
      } catch (error) {
        fastify.log.error("Delete session error:", error)
        return reply.code(500).send({ error: "Failed to delete chat session" })
      }
    },
  )
}

// Helper function to generate character responses
async function generateCharacterResponse(character, userMessage, fastify) {
  try {
    // In a real implementation, this would use OpenAI API with character context
    // For now, return a simple response based on character personality

    const responses = [
      `That's interesting! As ${character.name}, I think about that differently...`,
      `From my experience in ${character.anime?.title || character.manga?.title}, I'd say...`,
      `You know, ${userMessage.toLowerCase().includes("what") ? "that's a great question" : "I understand what you mean"}. Let me tell you...`,
      `*${character.name} thinks for a moment* Well, based on what I've been through...`,
      `That reminds me of something that happened in my story. You see...`,
    ]

    const randomResponse = responses[Math.floor(Math.random() * responses.length)]

    // Add character-specific context
    let contextualResponse = randomResponse

    if (character.personality) {
      const traits = character.personality.split(",").map((t) => t.trim())
      const trait = traits[Math.floor(Math.random() * traits.length)]
      contextualResponse += ` Being ${trait}, I always try to approach things with that mindset.`
    }

    return contextualResponse
  } catch (error) {
    fastify.log.error("Generate response error:", error)
    return `I'm sorry, I'm having trouble thinking of a response right now. Could you try asking me something else?`
  }
}
