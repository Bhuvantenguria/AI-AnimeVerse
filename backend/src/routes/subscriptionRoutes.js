export default async function subscriptionRoutes(fastify, options) {
  // Get subscription plans
  fastify.get("/plans", async (request, reply) => {
    try {
      const plans = [
        {
          id: "free",
          name: "Free",
          price: 0,
          interval: "month",
          features: [
            "Basic anime and manga browsing",
            "Limited chat with characters (10 messages/day)",
            "Basic quiz participation",
            "Community access",
          ],
          limits: {
            chatMessages: 10,
            aiFeatures: false,
            voiceNarration: false,
            premiumContent: false,
          },
        },
        {
          id: "premium",
          name: "Premium",
          price: 9.99,
          interval: "month",
          features: [
            "Unlimited anime and manga access",
            "Unlimited character chat",
            "AI-powered manga-to-anime previews",
            "Voice narration for manga",
            "Premium quizzes and content",
            "Ad-free experience",
            "Priority support",
          ],
          limits: {
            chatMessages: -1, // unlimited
            aiFeatures: true,
            voiceNarration: true,
            premiumContent: true,
          },
          popular: true,
        },
        {
          id: "premium-yearly",
          name: "Premium (Yearly)",
          price: 99.99,
          interval: "year",
          originalPrice: 119.88,
          savings: 19.89,
          features: [
            "All Premium features",
            "2 months free",
            "Exclusive yearly subscriber perks",
            "Early access to new features",
          ],
          limits: {
            chatMessages: -1,
            aiFeatures: true,
            voiceNarration: true,
            premiumContent: true,
          },
        },
      ]

      return { plans }
    } catch (error) {
      fastify.log.error("Get plans error:", error)
      return reply.code(500).send({ error: "Failed to fetch subscription plans" })
    }
  })

  // Get current user subscription (authenticated)
  fastify.get(
    "/current",
    {
      preHandler: fastify.authenticate,
    },
    async (request, reply) => {
      const userId = request.user.id

      try {
        const subscription = await fastify.prisma.subscription.findUnique({
          where: { userId },
        })

        if (!subscription) {
          return {
            plan: "free",
            status: "active",
            features: {
              chatMessages: 10,
              aiFeatures: false,
              voiceNarration: false,
              premiumContent: false,
            },
          }
        }

        return {
          subscription,
          features: getSubscriptionFeatures(subscription.plan),
        }
      } catch (error) {
        fastify.log.error("Get current subscription error:", error)
        return reply.code(500).send({ error: "Failed to fetch subscription" })
      }
    },
  )

  // Create subscription checkout session (authenticated)
  fastify.post(
    "/checkout",
    {
      preHandler: fastify.authenticate,
      schema: {
        body: {
          type: "object",
          required: ["planId"],
          properties: {
            planId: { type: "string", enum: ["premium", "premium-yearly"] },
            successUrl: { type: "string", format: "uri" },
            cancelUrl: { type: "string", format: "uri" },
          },
        },
      },
    },
    async (request, reply) => {
      const { planId, successUrl, cancelUrl } = request.body
      const userId = request.user.id

      try {
        // In a real implementation, this would create a Stripe checkout session
        // For now, simulate the checkout process
        const checkoutSession = {
          id: `cs_${Date.now()}`,
          url: `https://checkout.stripe.com/pay/cs_${Date.now()}`,
          planId,
          userId,
          status: "open",
          expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
        }

        // Store checkout session in database
        await fastify.prisma.checkoutSession.create({
          data: {
            id: checkoutSession.id,
            userId,
            planId,
            status: "pending",
            expiresAt: checkoutSession.expiresAt,
          },
        })

        return {
          checkoutUrl: checkoutSession.url,
          sessionId: checkoutSession.id,
        }
      } catch (error) {
        fastify.log.error("Create checkout error:", error)
        return reply.code(500).send({ error: "Failed to create checkout session" })
      }
    },
  )

  // Handle subscription webhook (for payment processing)
  fastify.post("/webhook", async (request, reply) => {
    try {
      // In a real implementation, this would handle Stripe webhooks
      const { type, data } = request.body

      switch (type) {
        case "checkout.session.completed":
          await handleCheckoutCompleted(data.object, fastify)
          break
        case "invoice.payment_succeeded":
          await handlePaymentSucceeded(data.object, fastify)
          break
        case "customer.subscription.deleted":
          await handleSubscriptionCanceled(data.object, fastify)
          break
        default:
          fastify.log.info(`Unhandled webhook event: ${type}`)
      }

      return { received: true }
    } catch (error) {
      fastify.log.error("Webhook error:", error)
      return reply.code(400).send({ error: "Webhook processing failed" })
    }
  })

  // Cancel subscription (authenticated)
  fastify.post(
    "/cancel",
    {
      preHandler: fastify.authenticate,
    },
    async (request, reply) => {
      const userId = request.user.id

      try {
        const subscription = await fastify.prisma.subscription.findUnique({
          where: { userId },
        })

        if (!subscription) {
          return reply.code(404).send({ error: "No active subscription found" })
        }

        // Update subscription to canceled
        await fastify.prisma.subscription.update({
          where: { userId },
          data: {
            status: "canceled",
            canceledAt: new Date(),
          },
        })

        // Update user premium status
        await fastify.prisma.user.update({
          where: { id: userId },
          data: { isPremium: false },
        })

        return {
          message: "Subscription canceled successfully",
          accessUntil: subscription.currentPeriodEnd,
        }
      } catch (error) {
        fastify.log.error("Cancel subscription error:", error)
        return reply.code(500).send({ error: "Failed to cancel subscription" })
      }
    },
  )

  // Get subscription usage stats (authenticated)
  fastify.get(
    "/usage",
    {
      preHandler: fastify.authenticate,
    },
    async (request, reply) => {
      const userId = request.user.id

      try {
        const now = new Date()
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

        const [chatCount, aiRequestCount, voiceRequestCount] = await Promise.all([
          // Chat messages this month
          fastify.prisma.chatMessage.count({
            where: {
              session: { userId },
              timestamp: { gte: startOfMonth },
              isFromCharacter: false, // Only count user messages
            },
          }),

          // AI requests this month (mock data)
          fastify.prisma.aiRequest
            .count({
              where: {
                userId,
                createdAt: { gte: startOfMonth },
              },
            })
            .catch(() => 0), // Table might not exist

          // Voice requests this month (mock data)
          fastify.prisma.voiceRequest
            .count({
              where: {
                userId,
                createdAt: { gte: startOfMonth },
              },
            })
            .catch(() => 0), // Table might not exist
        ])

        const user = await fastify.prisma.user.findUnique({
          where: { id: userId },
          include: { subscription: true },
        })

        const limits = getSubscriptionFeatures(user.subscription?.plan || "free")

        return {
          usage: {
            chatMessages: chatCount,
            aiRequests: aiRequestCount,
            voiceRequests: voiceRequestCount,
          },
          limits,
          resetDate: new Date(now.getFullYear(), now.getMonth() + 1, 1),
        }
      } catch (error) {
        fastify.log.error("Get usage error:", error)
        return reply.code(500).send({ error: "Failed to fetch usage stats" })
      }
    },
  )
}

// Helper functions
function getSubscriptionFeatures(plan) {
  const features = {
    free: {
      chatMessages: 10,
      aiFeatures: false,
      voiceNarration: false,
      premiumContent: false,
      adsEnabled: true,
    },
    premium: {
      chatMessages: -1, // unlimited
      aiFeatures: true,
      voiceNarration: true,
      premiumContent: true,
      adsEnabled: false,
    },
    "premium-yearly": {
      chatMessages: -1,
      aiFeatures: true,
      voiceNarration: true,
      premiumContent: true,
      adsEnabled: false,
    },
  }

  return features[plan] || features.free
}

async function handleCheckoutCompleted(session, fastify) {
  try {
    const checkoutSession = await fastify.prisma.checkoutSession.findUnique({
      where: { id: session.id },
    })

    if (!checkoutSession) {
      fastify.log.error("Checkout session not found:", session.id)
      return
    }

    // Create or update subscription
    const expiresAt = new Date()
    if (checkoutSession.planId === "premium-yearly") {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1)
    } else {
      expiresAt.setMonth(expiresAt.getMonth() + 1)
    }

    await fastify.prisma.subscription.upsert({
      where: { userId: checkoutSession.userId },
      update: {
        plan: checkoutSession.planId,
        status: "active",
        currentPeriodStart: new Date(),
        currentPeriodEnd: expiresAt,
      },
      create: {
        userId: checkoutSession.userId,
        plan: checkoutSession.planId,
        status: "active",
        currentPeriodStart: new Date(),
        currentPeriodEnd: expiresAt,
      },
    })

    // Update user premium status
    await fastify.prisma.user.update({
      where: { id: checkoutSession.userId },
      data: { isPremium: true },
    })

    // Update checkout session status
    await fastify.prisma.checkoutSession.update({
      where: { id: session.id },
      data: { status: "completed" },
    })

    fastify.log.info(`Subscription activated for user ${checkoutSession.userId}`)
  } catch (error) {
    fastify.log.error("Handle checkout completed error:", error)
  }
}

async function handlePaymentSucceeded(invoice, fastify) {
  try {
    // Handle recurring payment success
    fastify.log.info("Payment succeeded for invoice:", invoice.id)
  } catch (error) {
    fastify.log.error("Handle payment succeeded error:", error)
  }
}

async function handleSubscriptionCanceled(subscription, fastify) {
  try {
    // Handle subscription cancellation
    fastify.log.info("Subscription canceled:", subscription.id)
  } catch (error) {
    fastify.log.error("Handle subscription canceled error:", error)
  }
}
