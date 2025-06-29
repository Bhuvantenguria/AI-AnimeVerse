import pkg from '@clerk/fastify';
const { getAuth } = pkg;

export default async function notificationRoutes(fastify, options) {
  // Get user notifications
  fastify.get("/", async (request, reply) => {
    const { userId } = getAuth(request)
    if (!userId) {
      return reply.code(401).send({ error: "Unauthorized" })
    }

    const { page = 1, limit = 20, unreadOnly = false } = request.query

    try {
      const skip = (page - 1) * limit
      const where = { userId }

      if (unreadOnly === "true") {
        where.isRead = false
      }

      const [notifications, total, unreadCount] = await Promise.all([
        fastify.prisma.notification.findMany({
          where,
          skip,
          take: Number.parseInt(limit),
          orderBy: { createdAt: "desc" },
        }),
        fastify.prisma.notification.count({ where }),
        fastify.prisma.notification.count({
          where: { userId, isRead: false },
        }),
      ])

      return {
        notifications,
        unreadCount,
        pagination: {
          page: Number.parseInt(page),
          limit: Number.parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      }
    } catch (error) {
      fastify.log.error("Error fetching notifications:", error)
      return reply.code(500).send({ error: "Failed to fetch notifications" })
    }
  })

  // Mark notification as read
  fastify.patch("/:id/read", async (request, reply) => {
    const { userId } = getAuth(request)
    if (!userId) {
      return reply.code(401).send({ error: "Unauthorized" })
    }

    const { id } = request.params

    try {
      const notification = await fastify.prisma.notification.updateMany({
        where: {
          id,
          userId,
        },
        data: {
          isRead: true,
        },
      })

      if (notification.count === 0) {
        return reply.code(404).send({ error: "Notification not found" })
      }

      return { success: true }
    } catch (error) {
      fastify.log.error("Error marking notification as read:", error)
      return reply.code(500).send({ error: "Failed to mark notification as read" })
    }
  })

  // Mark all notifications as read
  fastify.patch("/read-all", async (request, reply) => {
    const { userId } = getAuth(request)
    if (!userId) {
      return reply.code(401).send({ error: "Unauthorized" })
    }

    try {
      await fastify.prisma.notification.updateMany({
        where: {
          userId,
          isRead: false,
        },
        data: {
          isRead: true,
        },
      })

      return { success: true }
    } catch (error) {
      fastify.log.error("Error marking all notifications as read:", error)
      return reply.code(500).send({ error: "Failed to mark all notifications as read" })
    }
  })

  // Delete notification
  fastify.delete("/:id", async (request, reply) => {
    const { userId } = getAuth(request)
    if (!userId) {
      return reply.code(401).send({ error: "Unauthorized" })
    }

    const { id } = request.params

    try {
      const notification = await fastify.prisma.notification.deleteMany({
        where: {
          id,
          userId,
        },
      })

      if (notification.count === 0) {
        return reply.code(404).send({ error: "Notification not found" })
      }

      return { success: true }
    } catch (error) {
      fastify.log.error("Error deleting notification:", error)
      return reply.code(500).send({ error: "Failed to delete notification" })
    }
  })
}
