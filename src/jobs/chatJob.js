import OpenAI from "openai"

export async function processChatJob(data, fastify) {
  const { sessionId, userId, characterId, message, context } = data

  try {
    // Get character and related knowledge
    const character = await fastify.prisma.character.findUnique({
      where: { id: characterId },
      include: {
        anime: true,
        manga: true,
      },
    })

    if (!character) {
      throw new Error("Character not found")
    }

    // Get knowledge base for this character
    const knowledgeEntries = await fastify.prisma.knowledgeBase.findMany({
      where: {
        OR: [{ characterId: characterId }, { animeId: character.animeId }, { mangaId: character.mangaId }],
      },
      take: 5, // Limit to most relevant entries
    })

    // Get recent quotes for character personality
    let characterQuotes = []
    try {
      const source = character.anime || character.manga
      if (source) {
        characterQuotes = await fastify.apiServices.animeChan.getQuotesByCharacter(character.name)
      }
    } catch (error) {
      // Quotes are optional, continue without them
      fastify.log.warn("Could not fetch character quotes:", error.message)
    }

    // Build context for AI
    const systemPrompt = buildCharacterSystemPrompt(character, knowledgeEntries, characterQuotes)

    // Generate AI response
    const aiResponse = await generateCharacterResponse(message, systemPrompt, context, fastify)

    // Update chat session
    const updatedContext = [...context, { role: "user", content: message }, { role: "assistant", content: aiResponse }]

    await fastify.prisma.chatSession.update({
      where: { id: sessionId },
      data: {
        context: updatedContext,
        lastMessage: new Date(),
      },
    })

    // Send response via WebSocket
    fastify.websocket.sendToUser(userId, {
      type: "chat_message",
      sessionId,
      characterId,
      message: aiResponse,
      timestamp: new Date().toISOString(),
    })

    return { success: true, message: aiResponse }
  } catch (error) {
    fastify.log.error("Chat job error:", error)

    // Send error via WebSocket
    fastify.websocket.sendToUser(userId, {
      type: "chat_error",
      sessionId,
      error: "Failed to generate response",
    })

    throw error
  }
}

function buildCharacterSystemPrompt(character, knowledgeEntries, quotes) {
  const source = character.anime || character.manga
  const sourceType = character.anime ? "anime" : "manga"

  const prompt = `You are ${character.name}, a character from the ${sourceType} "${source.title}".

Character Information:
- Name: ${character.name}
${character.nameJp ? `- Japanese Name: ${character.nameJp}` : ""}
${character.description ? `- Description: ${character.description}` : ""}
${character.personality?.length ? `- Personality Traits: ${character.personality.join(", ")}` : ""}

Source Information:
- Title: ${source.title}
- Synopsis: ${source.synopsis}
- Genres: ${source.genres?.join(", ") || ""}

Knowledge Base:
${knowledgeEntries.map((entry) => entry.content).join("\n\n")}

${
  quotes.length > 0
    ? `
Character Quotes (for personality reference):
${quotes
  .slice(0, 5)
  .map((quote) => `"${quote.quote}"`)
  .join("\n")}
`
    : ""
}

Instructions:
1. Stay in character as ${character.name} at all times
2. Use knowledge about your world, story, and relationships
3. Respond with the personality and speech patterns typical of your character
4. Reference events, other characters, and plot points from ${source.title} when relevant
5. If asked about things outside your world, relate them back to your experiences
6. Be helpful and engaging while maintaining your character's voice
7. Don't break character or mention that you're an AI

Remember: You ARE ${character.name}. Respond as they would, with their knowledge, personality, and perspective.`

  return prompt
}

async function generateCharacterResponse(message, systemPrompt, context, fastify) {
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    const messages = [
      { role: "system", content: systemPrompt },
      ...context.slice(-10), // Keep last 10 messages for context
      { role: "user", content: message },
    ]

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages,
      max_tokens: 300,
      temperature: 0.8, // More creative responses
      presence_penalty: 0.6, // Encourage varied responses
      frequency_penalty: 0.3,
    })

    return completion.choices[0].message.content
  } catch (error) {
    fastify.log.error("OpenAI API error:", error)

    // Fallback to simple response if OpenAI fails
    return generateFallbackResponse(message, fastify)
  }
}

function generateFallbackResponse(message, fastify) {
  const responses = [
    "That's an interesting question! Let me think about that...",
    "I understand what you're asking. From my perspective...",
    "That reminds me of something from my world...",
    "I'd be happy to share my thoughts on that!",
    "That's a great point! In my experience...",
  ]

  return responses[Math.floor(Math.random() * responses.length)]
}
