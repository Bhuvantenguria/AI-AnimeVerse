import fp from "fastify-plugin"
import { PrismaClient } from "@prisma/client"

async function prismaPlugin(fastify, options) {
  const prisma = new PrismaClient({
    log: ["query", "info", "warn", "error"],
  })

  await prisma.$connect()

  // Graceful shutdown
  fastify.addHook("onClose", async (fastify) => {
    await prisma.$disconnect()
  })

  fastify.decorate("prisma", prisma)
  fastify.log.info("🗄️ Prisma connected")
}

export default fp(prismaPlugin)
