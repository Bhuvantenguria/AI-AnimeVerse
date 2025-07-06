import fp from "fastify-plugin"
import { PrismaClient } from "@prisma/client"

// Create a single instance to be shared
const prisma = new PrismaClient({
  log: ["query", "info", "warn", "error"],
})

async function prismaPlugin(fastify, options) {
  await prisma.$connect()

  // Graceful shutdown
  fastify.addHook("onClose", async (fastify) => {
    await prisma.$disconnect()
  })

  fastify.decorate("prisma", prisma)
  fastify.log.info("🗄️ Prisma connected")
}

// Export the client for external use
export { prisma }

export default fp(prismaPlugin)
