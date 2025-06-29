import { ElevenLabsAPI } from "elevenlabs"

export async function processNarrationJob(data, fastify) {
  const { requestId, userId, mangaId, chapterId, characterId, voiceType } = data

  try {
    // Update status to processing
    await fastify.prisma.narrationRequest.update({
      where: { id: requestId },
      data: { status: "processing" },
    })

    // Get manga chapter content
    const chapter = await fastify.prisma.chapter.findUnique({
      where: { id: chapterId },
      include: {
        manga: {
          include: {
            characters: true,
          },
        },
      },
    })

    if (!chapter) {
      throw new Error("Chapter not found")
    }

    // Get character for voice
    const character = chapter.manga.characters.find((c) => c.id === characterId)
    if (!character) {
      throw new Error("Character not found")
    }

    // Extract text content (this would normally come from OCR or stored text)
    const textContent = await extractChapterText(chapter, fastify)

    // Generate voice narration
    const audioBuffer = await generateVoiceNarration(textContent, character, voiceType, fastify)

    // Upload to Cloudinary
    const uploadResult = await fastify.cloudinary.uploader.upload(
      `data:audio/mp3;base64,${audioBuffer.toString("base64")}`,
      {
        resource_type: "video", // Cloudinary treats audio as video
        folder: "narrations",
        public_id: `narration_${requestId}`,
      },
    )

    // Update request with audio URL
    await fastify.prisma.narrationRequest.update({
      where: { id: requestId },
      data: {
        status: "completed",
        audioUrl: uploadResult.secure_url,
      },
    })

    // Send WebSocket notification
    fastify.websocket.sendToUser(userId, {
      type: "narration_completed",
      requestId,
      audioUrl: uploadResult.secure_url,
    })

    return { success: true, audioUrl: uploadResult.secure_url }
  } catch (error) {
    fastify.log.error("Narration job error:", error)

    // Update status to failed
    await fastify.prisma.narrationRequest.update({
      where: { id: requestId },
      data: { status: "failed" },
    })

    // Send error notification
    fastify.websocket.sendToUser(userId, {
      type: "narration_failed",
      requestId,
      error: error.message,
    })

    throw error
  }
}

async function extractChapterText(chapter, fastify) {
  // This would normally extract text from manga pages using OCR
  // For demo purposes, return sample text
  return `Chapter ${chapter.number}: ${chapter.title || "Untitled"}. This is the beginning of an exciting adventure...`
}

async function generateVoiceNarration(text, character, voiceType, fastify) {
  try {
    const elevenlabs = new ElevenLabsAPI({
      apiKey: process.env.ELEVENLABS_API_KEY,
    })

    // Map character to voice ID (you'd have a database of voice mappings)
    const voiceId = getVoiceIdForCharacter(character, voiceType)

    const audio = await elevenlabs.generate({
      voice: voiceId,
      text: text,
      model_id: "eleven_multilingual_v2",
    })

    return Buffer.from(await audio.arrayBuffer())
  } catch (error) {
    fastify.log.error("ElevenLabs API error:", error)
    throw new Error("Failed to generate voice narration")
  }
}

function getVoiceIdForCharacter(character, voiceType) {
  // Map characters to ElevenLabs voice IDs
  const voiceMap = {
    default: "21m00Tcm4TlvDq8ikWAM", // Default voice
    narrator: "29vD33N1CtxCmqQRPOHJ", // Narrator voice
    // Add more character-specific voices
  }

  return voiceMap[voiceType] || voiceMap.default
}
