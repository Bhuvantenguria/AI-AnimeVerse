export default async function notificationRoutes(fastify, options) {
  // Get user notifications (authenticated)
  fastify.get(
    "/",
    {
      preHandler: fastify.authenticate,
    },
    async (request, reply) => {
      const { page = 1, limit = 20, unreadOnly = false } = request.query
      const userId = request.user.id

      try {
        const where = { userId }

        if (unreadOnly === "true") {
          where.isRead = false
        }

        const [notifications, total, unreadCount] = await Promise.all([
          fastify.prisma.notification.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * limit,
            take: Number.parseInt(limit),
          }),
          fastify.prisma.notification.count({ where }),
          fastify.prisma.notification.count({
            where: { userId, isRead: false },
          }),
        ])

        return {
          notifications,
          pagination: {
            page: Number.parseInt(page),
            limit: Number.parseInt(limit),
            total,
            pages: Math.ceil(total / limit),
          },
          unreadCount,
        }
      } catch (error) {
        fastify.log.error("Get notifications error:", error)
        return reply.code(500).send({ error: "Failed to fetch notifications" })
      }
    },
  )

  // Mark notification as read (authenticated)
  fastify.patch(
    "/:id/read",
    {
      preHandler: fastify.authenticate,
    },
    async (request, reply) => {
      const { id } = request.params
      const userId = request.user.id

      try {
        const notification = await fastify.prisma.notification.findFirst({
          where: { id, userId },
        })

        if (!notification) {
          return reply.code(404).send({ error: "Notification not found" })
        }

        await fastify.prisma.notification.update({
          where: { id },
          data: {
            isRead: true,
            readAt: new Date(),
          },
        })

        return { message: "Notification marked as read" }
      } catch (error) {
        fastify.log.error("Mark notification read error:", error)
        return reply.code(500).send({ error: "Failed to mark notification as read" })
      }
    },
  )

  // Mark all notifications as read (authenticated)
  fastify.patch(
    "/read-all",
    {
      preHandler: fastify.authenticate,
    },
    async (request, reply) => {
      const userId = request.user.id

      try {
        await fastify.prisma.notification.updateMany({
          where: { userId, isRead: false },
          data: {
            isRead: true,
            readAt: new Date(),
          },
        })

        return { message: "All notifications marked as read" }
      } catch (error) {
        fastify.log.error("Mark all notifications read error:", error)
        return reply.code(500).send({ error: "Failed to mark all notifications as read" })
      }
    },
  )

  // Delete notification (authenticated)
  fastify.delete(
    "/:id",
    {
      preHandler: fastify.authenticate,
    },
    async (request, reply) => {
      const { id } = request.params
      const userId = request.user.id

      try {
        const notification = await fastify.prisma.notification.findFirst({
          where: { id, userId },
        })

        if (!notification) {
          return reply.code(404).send({ error: "Notification not found" })
        }

        await fastify.prisma.notification.delete({
          where: { id },
        })

        return { message: "Notification deleted successfully" }
      } catch (error) {
        fastify.log.error("Delete notification error:", error)
        return reply.code(500).send({ error: "Failed to delete notification" })
      }
    },
  )

  // Get notification preferences (authenticated)
  fastify.get(
    "/preferences",
    {
      preHandler: fastify.authenticate,
    },
    async (request, reply) => {
      const userId = request.user.id

      try {
        let preferences = await fastify.prisma.notificationPreference.findUnique({
          where: { userId },
        })

        if (!preferences) {
          // Create default preferences
          preferences = await fastify.prisma.notificationPreference.create({
            data: {
              userId,
              emailNotifications: true,
              pushNotifications: true,
              chatMessages: true,
              communityUpdates: true,
              quizResults: true,
              subscriptionUpdates: true,
              newFeatures: true,
            },
          })
        }

        return { preferences }
      } catch (error) {
        fastify.log.error("Get notification preferences error:", error)
        return reply.code(500).send({ error: "Failed to fetch notification preferences" })
      }
    },
  )

  // Update notification preferences (authenticated)
  fastify.patch(
    "/preferences",
    {
      preHandler: fastify.authenticate,
      schema: {
        body: {
          type: "object",
          properties: {
            emailNotifications: { type: "boolean" },
            pushNotifications: { type: "boolean" },
            chatMessages: { type: "boolean" },
            communityUpdates: { type: "boolean" },
            quizResults: { type: "boolean" },
            subscriptionUpdates: { type: "boolean" },
            newFeatures: { type: "boolean" },
          },
        },
      },
    },
    async (request, reply) => {
      const userId = request.user.id
      const updates = request.body

      try {
        const preferences = await fastify.prisma.notificationPreference.upsert({
          where: { userId },
          update: updates,
          create: {
            userId,
            ...updates,
          },
        })

        return {
          message: "Notification preferences updated successfully",
          preferences,
        }
      } catch (error) {
        fastify.log.error("Update notification preferences error:", error)
        return reply.code(500).send({ error: "Failed to update notification preferences" })
      }
    },
  )

  // Send test notification (authenticated)
  fastify.post(
    "/test",
    {
      preHandler: fastify.authenticate,
    },
    async (request, reply) => {
      const userId = request.user.id

      try {
        await fastify.prisma.notification.create({
          data: {
            userId,
            type: "system",
            title: "Test Notification",
            message: "This is a test notification to verify your notification settings are working correctly.",
            isRead: false,
          },
        })

        return { message: "Test notification sent successfully" }
      } catch (error) {
        fastify.log.error("Send test notification error:", error)
        return reply.code(500).send({ error: "Failed to send test notification" })
      }
    },
  )
}
