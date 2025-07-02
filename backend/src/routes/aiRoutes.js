export default async function aiRoutes(fastify, options) {
  // Request manga-to-anime preview (authenticated)
  fastify.post(
    "/preview/generate",
    {
      preHandler: fastify.authenticate,
      schema: {
        body: {
          type: "object",
          required: ["mangaId", "chapterNumber"],
          properties: {
            mangaId: { type: "string" },
            chapterNumber: { type: "integer", minimum: 1 },
            voiceType: { type: "string", enum: ["narrator", "character"], default: "narrator" },
            style: { type: "string", enum: ["anime", "realistic", "cartoon"], default: "anime" },
            characterVoice: { type: "string" },
          },
        },
      },
    },
    async (request, reply) => {
      const { mangaId, chapterNumber, voiceType = "narrator", style = "anime", characterVoice } = request.body
      const userId = request.user.id

      try {
        // Check if user has premium access
        const user = await fastify.getUser(request)
        if (!user.isPremium) {
          return reply.code(403).send({
            error: "Premium subscription required for AI features",
            upgradeUrl: "/subscription",
          })
        }

        // Get manga details
        const manga = await fastify.prisma.manga.findUnique({
          where: { malId: Number.parseInt(mangaId) },
        })

        if (!manga) {
          return reply.code(404).send({ error: "Manga not found" })
        }

        // Create preview generation job
        const job = await fastify.jobQueue.add("generatePreview", {
          userId,
          mangaId,
          chapterNumber,
          voiceType,
          style,
          characterVoice,
        })

        return {
          jobId: job.id,
          status: "processing",
          message: "Preview generation started",
          estimatedTime: "2-5 minutes",
        }
      } catch (error) {
        fastify.log.error("Preview generation error:", error)
        return reply.code(500).send({ error: "Failed to start preview generation" })
      }
    },
  )

  // Get preview generation status
  fastify.get(
    "/preview/status/:jobId",
    {
      preHandler: fastify.authenticate,
    },
    async (request, reply) => {
      const { jobId } = request.params

      try {
        const job = await fastify.jobQueue.getJob(jobId)

        if (!job) {
          return reply.code(404).send({ error: "Job not found" })
        }

        const status = await job.getState()
        const progress = job.progress()

        return {
          jobId,
          status,
          progress,
          data: job.returnvalue,
          error: job.failedReason,
        }
      } catch (error) {
        fastify.log.error("Get preview status error:", error)
        return reply.code(500).send({ error: "Failed to get job status" })
      }
    },
  )

  // Generate voice narration for manga chapter
  fastify.post(
    "/narration/generate",
    {
      preHandler: fastify.authenticate,
      schema: {
        body: {
          type: "object",
          required: ["text", "voiceId"],
          properties: {
            text: { type: "string", minLength: 1, maxLength: 5000 },
            voiceId: { type: "string" },
            speed: { type: "number", minimum: 0.5, maximum: 2.0, default: 1.0 },
            pitch: { type: "number", minimum: -20, maximum: 20, default: 0 },
          },
        },
      },
    },
    async (request, reply) => {
      const { text, voiceId, speed = 1.0, pitch = 0 } = request.body
      const userId = request.user.id

      try {
        // Check if user has premium access
        const user = await fastify.getUser(request)
        if (!user.isPremium) {
          return reply.code(403).send({
            error: "Premium subscription required for voice features",
            upgradeUrl: "/subscription",
          })
        }

        // Create narration job
        const job = await fastify.jobQueue.add("generateNarration", {
          userId,
          text,
          voiceId,
          speed,
          pitch,
        })

        return {
          jobId: job.id,
          status: "processing",
          message: "Voice narration generation started",
        }
      } catch (error) {
        fastify.log.error("Narration generation error:", error)
        return reply.code(500).send({ error: "Failed to start narration generation" })
      }
    },
  )

  // Get available voices
  fastify.get("/voices", async (request, reply) => {
    try {
      // Mock voice data - in real implementation, fetch from ElevenLabs API
      const voices = [
        {
          id: "narrator-male-1",
          name: "Akira (Male Narrator)",
          gender: "male",
          language: "en",
          style: "narrator",
          preview: "/audio/preview-akira.mp3",
        },
        {
          id: "narrator-female-1",
          name: "Sakura (Female Narrator)",
          gender: "female",
          language: "en",
          style: "narrator",
          preview: "/audio/preview-sakura.mp3",
        },
        {
          id: "character-young-male",
          name: "Yuki (Young Male)",
          gender: "male",
          language: "en",
          style: "character",
          preview: "/audio/preview-yuki.mp3",
        },
        {
          id: "character-young-female",
          name: "Hana (Young Female)",
          gender: "female",
          language: "en",
          style: "character",
          preview: "/audio/preview-hana.mp3",
        },
        {
          id: "character-mature-male",
          name: "Takeshi (Mature Male)",
          gender: "male",
          language: "en",
          style: "character",
          preview: "/audio/preview-takeshi.mp3",
        },
      ]

      return { voices }
    } catch (error) {
      fastify.log.error("Get voices error:", error)
      return reply.code(500).send({ error: "Failed to fetch voices" })
    }
  })

  // Generate anime-style image from text description
  fastify.post(
    "/image/generate",
    {
      preHandler: fastify.authenticate,
      schema: {
        body: {
          type: "object",
          required: ["prompt"],
          properties: {
            prompt: { type: "string", minLength: 10, maxLength: 1000 },
            style: { type: "string", enum: ["anime", "manga", "realistic"], default: "anime" },
            aspectRatio: { type: "string", enum: ["1:1", "16:9", "9:16", "4:3"], default: "16:9" },
            quality: { type: "string", enum: ["standard", "hd"], default: "standard" },
          },
        },
      },
    },
    async (request, reply) => {
      const { prompt, style = "anime", aspectRatio = "16:9", quality = "standard" } = request.body
      const userId = request.user.id

      try {
        // Check if user has premium access
        const user = await fastify.getUser(request)
        if (!user.isPremium) {
          return reply.code(403).send({
            error: "Premium subscription required for AI image generation",
            upgradeUrl: "/subscription",
          })
        }

        // Create image generation job
        const job = await fastify.jobQueue.add("generateImage", {
          userId,
          prompt,
          style,
          aspectRatio,
          quality,
        })

        return {
          jobId: job.id,
          status: "processing",
          message: "Image generation started",
          estimatedTime: "30-60 seconds",
        }
      } catch (error) {
        fastify.log.error("Image generation error:", error)
        return reply.code(500).send({ error: "Failed to start image generation" })
      }
    },
  )

  // Generate character response for chat
  fastify.post(
    "/chat/generate",
    {
      preHandler: fastify.authenticate,
      schema: {
        body: {
          type: "object",
          required: ["characterId", "message", "context"],
          properties: {
            characterId: { type: "string" },
            message: { type: "string", minLength: 1, maxLength: 1000 },
            context: {
              type: "object",
              properties: {
                previousMessages: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      content: { type: "string" },
                      isFromCharacter: { type: "boolean" },
                    },
                  },
                },
                sessionId: { type: "string" },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { characterId, message, context } = request.body
      const userId = request.user.id

      try {
        // Get character details
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

        // Generate AI response using character context
        const response = await generateCharacterResponse(character, message, context, fastify)

        return {
          response,
          characterId,
          timestamp: new Date().toISOString(),
        }
      } catch (error) {
        fastify.log.error("AI chat generation error:", error)
        return reply.code(500).send({ error: "Failed to generate response" })
      }
    },
  )
}

// Helper function to generate character responses
async function generateCharacterResponse(character, userMessage, context, fastify) {
  try {
    // Build character context
    const characterContext = `
      Character: ${character.name}
      Personality: ${character.personality || "Friendly and helpful"}
      Background: ${character.background || ""}
      From: ${character.anime?.title || character.manga?.title || "Unknown series"}
      Description: ${character.description || ""}
    `

    // Build conversation history
    const conversationHistory =
      context.previousMessages
        ?.slice(-10) // Last 10 messages for context
        .map((msg) => `${msg.isFromCharacter ? character.name : "User"}: ${msg.content}`)
        .join("\n") || ""

    // Create prompt for AI
    const prompt = `
      ${characterContext}
      
      Previous conversation:
      ${conversationHistory}
      
      User: ${userMessage}
      
      Respond as ${character.name} would, staying in character. Keep responses natural and engaging, around 1-3 sentences.
      ${character.name}:
    `

    // In a real implementation, this would call OpenAI API
    // For now, return a contextual response
    const responses = [
      `That's really interesting! As ${character.name}, I've experienced something similar...`,
      `You know, from my perspective in ${character.anime?.title || character.manga?.title}, I think...`,
      `*${character.name} considers your words thoughtfully* I understand what you mean...`,
      `That reminds me of an adventure I had! Let me tell you about it...`,
      `I appreciate you sharing that with me. In my experience...`,
    ]

    let response = responses[Math.floor(Math.random() * responses.length)]

    // Add character-specific traits
    if (character.personality) {
      const traits = character.personality.split(",").map((t) => t.trim().toLowerCase())

      if (traits.includes("cheerful") || traits.includes("optimistic")) {
        response += " I always try to look on the bright side of things!"
      } else if (traits.includes("serious") || traits.includes("stoic")) {
        response += " This requires careful consideration."
      } else if (traits.includes("energetic") || traits.includes("enthusiastic")) {
        response += " This is so exciting to talk about!"
      }
    }

    return response
  } catch (error) {
    fastify.log.error("Generate character response error:", error)
    return `I'm sorry, I'm having trouble thinking of a response right now. Could you try asking me something else?`
  }
}
