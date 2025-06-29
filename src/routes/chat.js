import pkg from '@clerk/fastify';
const { getAuth } = pkg;

export default async function chatRoutes(fastify, options) {
  // Start chat session with character
  fastify.post("/start", async (request, reply) => {
    const { userId } = getAuth(request)
    if (!userId) {
      return reply.code(401).send({ error: "Unauthorized" })
    }

    const { characterId } = request.body

    try {
      // Get character details
      const character = await fastify.prisma.character.findUnique({
        where: { id: characterId },
        include: {
          anime: {
            select: { title: true, synopsis: true, genres: true },
          },
          manga: {
            select: { title: true, synopsis: true, genres: true },
          },
        },
      })

      if (!character) {
        return reply.code(404).send({ error: "Character not found" })
      }

      // Create or get existing chat session
      const session = await fastify.prisma.chatSession.upsert({
        where: {
          userId_characterId: {
            userId,
            characterId,
          },
        },
        update: {
          lastMessage: new Date(),
        },
        create: {
          userId,
          characterId,
          context: [],
        },
      })

      // Generate welcome message
      const source = character.anime || character.manga
      const welcomeMessage = `Hello! I'm ${character.name} from ${source.title}. It's great to meet you! What would you like to talk about?`

      return {
        sessionId: session.id,
        character: {
          id: character.id,
          name: character.name,
          avatar: character.avatar,
          source: source.title,
        },
        welcomeMessage,
      }
    } catch (error) {
      fastify.log.error("Error starting chat session:", error)
      return reply.code(500).send({ error: "Failed to start chat session" })
    }
  })

  // Send message to character
  fastify.post("/message", async (request, reply) => {
    const { userId } = getAuth(request)
    if (!userId) {
      return reply.code(401).send({ error: "Unauthorized" })
    }

    const { sessionId, message } = request.body

    try {
      // Get chat session
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

      // Check rate limits for free users
      const user = await fastify.prisma.user.findUnique({
        where: { clerkId: userId },
        include: { subscription: true },
      })

      if (!user.isPremium && !user.subscription?.status === "active") {
        // Count messages in last hour for free users
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
        const recentMessages = session.context.filter(
          (msg) => msg.timestamp && new Date(msg.timestamp) > oneHourAgo && msg.role === "user",
        )

        if (recentMessages.length >= 10) {
          return reply.code(429).send({
            error: "Message limit reached. Upgrade to Premium for unlimited chat.",
          })
        }
      }

      // Add to chat queue for processing
      const job = await fastify.queues.chat.add("process-message", {
        sessionId: session.id,
        userId,
        characterId: session.characterId,
        message,
        context: session.context || [],
      })

      return {
        jobId: job.id,
        status: "processing",
        message: "Message sent, generating response...",
      }
    } catch (error) {
      fastify.log.error("Error sending message:", error)
      return reply.code(500).send({ error: "Failed to send message" })
    }
  })

  // Get chat history
  fastify.get("/history/:sessionId", async (request, reply) => {
    const { userId } = getAuth(request)
    if (!userId) {
      return reply.code(401).send({ error: "Unauthorized" })
    }

    const { sessionId } = request.params

    try {
      const session = await fastify.prisma.chatSession.findFirst({
        where: {
          id: sessionId,
          userId,
        },
        include: {
          character: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
      })

      if (!session) {
        return reply.code(404).send({ error: "Chat session not found" })
      }

      return {
        sessionId: session.id,
        character: session.character,
        messages: session.context || [],
        lastMessage: session.lastMessage,
      }
    } catch (error) {
      fastify.log.error("Error fetching chat history:", error)
      return reply.code(500).send({ error: "Failed to fetch chat history" })
    }
  })

  // Get user's chat sessions
  fastify.get("/sessions", async (request, reply) => {
    const { userId } = getAuth(request)
    if (!userId) {
      return reply.code(401).send({ error: "Unauthorized" })
    }

    try {
      const sessions = await fastify.prisma.chatSession.findMany({
        where: { userId },
        include: {
          character: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
        orderBy: { lastMessage: "desc" },
        take: 20,
      })

      return sessions.map((session) => ({
        sessionId: session.id,
        character: session.character,
        lastMessage: session.lastMessage,
        messageCount: session.context?.length || 0,
      }))
    } catch (error) {
      fastify.log.error("Error fetching chat sessions:", error)
      return reply.code(500).send({ error: "Failed to fetch chat sessions" })
    }
  })

  // Delete chat session
  fastify.delete("/sessions/:sessionId", async (request, reply) => {
    const { userId } = getAuth(request)
    if (!userId) {
      return reply.code(401).send({ error: "Unauthorized" })
    }

    const { sessionId } = request.params

    try {
      await fastify.prisma.chatSession.deleteMany({
        where: {
          id: sessionId,
          userId,
        },
      })

      return { success: true }
    } catch (error) {
      fastify.log.error("Error deleting chat session:", error)
      return reply.code(500).send({ error: "Failed to delete chat session" })
    }
  })

  // Get available characters for chat
  fastify.get("/characters", async (request, reply) => {
    const { search, animeId, mangaId, page = 1, limit = 20 } = request.query

    try {
      const skip = (page - 1) * limit
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
          skip,
          take: Number.parseInt(limit),
          include: {
            anime: {
              select: {
                id: true,
                title: true,
                coverImage: true,
              },
            },
            manga: {
              select: {
                id: true,
                title: true,
                coverImage: true,
              },
            },
            _count: {
              select: {
                chatSessions: true,
              },
            },
          },
          orderBy: [{ chatSessions: { _count: "desc" } }, { name: "asc" }],
        }),
        fastify.prisma.character.count({ where }),
      ])

      return {
        characters: characters.map((char) => ({
          id: char.id,
          name: char.name,
          avatar: char.avatar,
          description: char.description,
          source: char.anime || char.manga,
          chatCount: char._count.chatSessions,
        })),
        pagination: {
          page: Number.parseInt(page),
          limit: Number.parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      }
    } catch (error) {
      fastify.log.error("Error fetching characters:", error)
      return reply.code(500).send({ error: "Failed to fetch characters" })
    }
  })

  // Get character details for chat
  fastify.get("/characters/:id", async (request, reply) => {
    const { id } = request.params

    try {
      const character = await fastify.prisma.character.findUnique({
        where: { id },
        include: {
          anime: {
            select: {
              id: true,
              title: true,
              synopsis: true,
              coverImage: true,
              genres: true,
            },
          },
          manga: {
            select: {
              id: true,
              title: true,
              synopsis: true,
              coverImage: true,
              genres: true,
            },
          },
          _count: {
            select: {
              chatSessions: true,
            },
          },
        },
      })

      if (!character) {
        return reply.code(404).send({ error: "Character not found" })
      }

      // Get sample quotes for character
      let quotes = []
      try {
        quotes = await fastify.apiServices.animeChan.getQuotesByCharacter(character.name)
        quotes = quotes.slice(0, 3) // Limit to 3 quotes
      } catch (error) {
        // Quotes are optional
      }

      return {
        id: character.id,
        name: character.name,
        nameJp: character.nameJp,
        avatar: character.avatar,
        description: character.description,
        personality: character.personality,
        source: character.anime || character.manga,
        chatCount: character._count.chatSessions,
        quotes,
      }
    } catch (error) {
      fastify.log.error("Error fetching character details:", error)
      return reply.code(500).send({ error: "Failed to fetch character details" })
    }
  })
}
