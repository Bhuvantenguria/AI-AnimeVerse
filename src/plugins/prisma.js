import { PrismaClient } from "@prisma/client"
import fp from "fastify-plugin"

async function prismaPlugin(fastify, options) {
  const prisma = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "info", "warn", "error"] : ["error"],
  })

  await prisma.$connect()

  // Decorate fastify with prisma
  fastify.decorate("prisma", prisma)

  // Close connection on app shutdown
  fastify.addHook("onClose", async (fastify) => {
    await fastify.prisma.$disconnect()
    fastify.log.info("Prisma connection closed")
  })

  fastify.log.info("✅ Prisma connected")
}

export default fp(prismaPlugin, {
  name: "prisma",
})
