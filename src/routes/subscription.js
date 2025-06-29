import pkg from '@clerk/fastify';
const { getAuth } = pkg;

export default async function subscriptionRoutes(fastify, options) {
  // Get current subscription status
  fastify.get("/status", async (request, reply) => {
    const { userId } = getAuth(request)
    if (!userId) {
      return reply.code(401).send({ error: "Unauthorized" })
    }

    try {
      const user = await fastify.prisma.user.findUnique({
        where: { clerkId: userId },
        include: {
          subscription: true,
        },
      })

      if (!user) {
        return reply.code(404).send({ error: "User not found" })
      }

      return {
        isPremium: user.isPremium,
        subscription: user.subscription,
      }
    } catch (error) {
      fastify.log.error("Error fetching subscription status:", error)
      return reply.code(500).send({ error: "Failed to fetch subscription status" })
    }
  })

  // Get subscription plans
  fastify.get("/plans", async (request, reply) => {
    const plans = [
      {
        id: "free",
        name: "Free",
        price: 0,
        interval: "month",
        features: [
          "Basic anime and manga browsing",
          "Community access",
          "Basic quizzes",
          "Limited chat with characters",
        ],
        limits: {
          chatMessages: 10,
          aiFeatures: 0,
        },
      },
      {
        id: "premium",
        name: "Premium",
        price: 9.99,
        interval: "month",
        features: [
          "Everything in Free",
          "Unlimited character chat",
          "AI voice narration",
          "Manga-to-anime previews",
          "Priority support",
          "Ad-free experience",
        ],
        limits: {
          chatMessages: -1, // Unlimited
          aiFeatures: 50, // 50 AI requests per month
        },
      },
      {
        id: "premium_plus",
        name: "Premium Plus",
        price: 19.99,
        interval: "month",
        features: [
          "Everything in Premium",
          "Unlimited AI features",
          "Early access to new content",
          "Custom character voices",
          "Advanced analytics",
          "Priority queue for AI processing",
        ],
        limits: {
          chatMessages: -1, // Unlimited
          aiFeatures: -1, // Unlimited
        },
      },
    ]

    return { plans }
  })

  // Create subscription (placeholder for Stripe integration)
  fastify.post("/create", async (request, reply) => {
    const { userId } = getAuth(request)
    if (!userId) {
      return reply.code(401).send({ error: "Unauthorized" })
    }

    const { planId } = request.body

    try {
      // In a real implementation, this would integrate with Stripe
      // For now, we'll create a mock subscription

      const user = await fastify.prisma.user.findUnique({
        where: { clerkId: userId },
      })

      if (!user) {
        return reply.code(404).send({ error: "User not found" })
      }

      const subscription = await fastify.prisma.subscription.upsert({
        where: { userId: user.id },
        update: {
          plan: planId,
          status: "active",
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        },
        create: {
          userId: user.id,
          plan: planId,
          status: "active",
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        },
      })

      // Update user premium status
      await fastify.prisma.user.update({
        where: { id: user.id },
        data: {
          isPremium: planId !== "free",
        },
      })

      return { subscription }
    } catch (error) {
      fastify.log.error("Error creating subscription:", error)
      return reply.code(500).send({ error: "Failed to create subscription" })
    }
  })

  // Cancel subscription
  fastify.post("/cancel", async (request, reply) => {
    const { userId } = getAuth(request)
    if (!userId) {
      return reply.code(401).send({ error: "Unauthorized" })
    }

    try {
      const user = await fastify.prisma.user.findUnique({
        where: { clerkId: userId },
        include: { subscription: true },
      })

      if (!user?.subscription) {
        return reply.code(404).send({ error: "No active subscription found" })
      }

      // Mark subscription for cancellation at period end
      await fastify.prisma.subscription.update({
        where: { id: user.subscription.id },
        data: {
          cancelAtPeriodEnd: true,
        },
      })

      return { success: true, message: "Subscription will be canceled at the end of the current period" }
    } catch (error) {
      fastify.log.error("Error canceling subscription:", error)
      return reply.code(500).send({ error: "Failed to cancel subscription" })
    }
  })
}
