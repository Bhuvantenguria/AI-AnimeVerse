import fp from "fastify-plugin"
import { config } from "../config/env.js"

async function authPlugin(fastify, options) {
  fastify.decorate("authenticate", async (request, reply) => {
    try {
      await request.jwtVerify()

      // Get user from database
      const user = await fastify.prisma.user.findUnique({
        where: { id: request.user.id },
        select: {
          id: true,
          email: true,
          username: true,
          avatar: true,
          level: true,
          xp: true,
          isPremium: true,
          isAdmin: true,
        },
      })

      if (!user) {
        throw new Error("User not found")
      }

      // Update the JWT user data with database info
      request.user = {
        ...request.user,
        ...user
      }
    } catch (err) {
      reply.code(401).send({ error: "Unauthorized" })
    }
  })

  fastify.decorate("getUser", async (request) => {
    if (!request.user?.id) return null

    return await fastify.prisma.user.findUnique({
      where: { id: request.user.id },
      include: {
        subscription: true,
        achievements: {
          include: {
            achievement: true,
          },
        },
      },
    })
  })

  fastify.log.info("🔐 Auth plugin registered")
}

export default fp(authPlugin, {
  name: "auth",
  decorators: {
    fastify: ["jwt", "prisma"]
  }
})
