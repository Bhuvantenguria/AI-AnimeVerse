import pkg from '@clerk/fastify';
const { getAuth } = pkg;

export default async function authRoutes(fastify, options) {
  // Webhook to sync user data from Clerk
  fastify.post("/webhook", async (request, reply) => {
    const { type, data } = request.body

    try {
      switch (type) {
        case "user.created":
          await handleUserCreated(data, fastify)
          break
        case "user.updated":
          await handleUserUpdated(data, fastify)
          break
        case "user.deleted":
          await handleUserDeleted(data, fastify)
          break
        default:
          fastify.log.info(`Unhandled webhook type: ${type}`)
      }

      return { success: true }
    } catch (error) {
      fastify.log.error("Webhook error:", error)
      return reply.code(500).send({ error: "Webhook processing failed" })
    }
  })

  // Get current session info
  fastify.get("/session", async (request, reply) => {
    const { userId, sessionId } = getAuth(request)

    if (!userId) {
      return reply.code(401).send({ error: "Not authenticated" })
    }

    try {
      const user = await fastify.prisma.user.findUnique({
        where: { clerkId: userId },
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          avatar: true,
          level: true,
          xp: true,
          isPremium: true,
        },
      })

      return {
        userId,
        sessionId,
        user,
      }
    } catch (error) {
      fastify.log.error("Error fetching session:", error)
      return reply.code(500).send({ error: "Failed to fetch session" })
    }
  })
}

async function handleUserCreated(userData, fastify) {
  try {
    const user = await fastify.prisma.user.create({
      data: {
        clerkId: userData.id,
        email: userData.email_addresses[0]?.email_address,
        firstName: userData.first_name,
        lastName: userData.last_name,
        avatar: userData.image_url,
        username: userData.username,
      },
    })

    // Send welcome email
    await fastify.queues.email.add("send-email", {
      to: user.email,
      subject: "Welcome to MangaVerse!",
      template: "welcome",
      templateData: {
        name: user.firstName || user.username,
      },
    })

    fastify.log.info(`User created: ${user.id}`)
  } catch (error) {
    fastify.log.error("Error creating user:", error)
  }
}

async function handleUserUpdated(userData, fastify) {
  try {
    await fastify.prisma.user.update({
      where: { clerkId: userData.id },
      data: {
        email: userData.email_addresses[0]?.email_address,
        firstName: userData.first_name,
        lastName: userData.last_name,
        avatar: userData.image_url,
        username: userData.username,
      },
    })

    fastify.log.info(`User updated: ${userData.id}`)
  } catch (error) {
    fastify.log.error("Error updating user:", error)
  }
}

async function handleUserDeleted(userData, fastify) {
  try {
    await fastify.prisma.user.delete({
      where: { clerkId: userData.id },
    })

    fastify.log.info(`User deleted: ${userData.id}`)
  } catch (error) {
    fastify.log.error("Error deleting user:", error)
  }
}
