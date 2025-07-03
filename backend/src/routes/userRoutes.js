import { userController } from "../controllers/userController.js"

export default async function userRoutes(fastify, options) {
  // Get current user profile
  fastify.get(
    "/me",
    {
      preHandler: fastify.authenticate,
    },
    userController.getProfile,
  )

  // Update user profile
  fastify.patch(
    "/me",
    {
      preHandler: fastify.authenticate,
      schema: {
        body: {
          type: "object",
          properties: {
            username: { type: "string", minLength: 3, maxLength: 30 },
            bio: { type: "string", maxLength: 500 },
            avatar: { type: "string", format: "uri" },
          },
        },
      },
    },
    userController.updateProfile,
  )

  // Get user watchlist
  fastify.get(
    "/me/watchlist",
    {
      preHandler: fastify.authenticate,
      schema: {
        querystring: {
          type: "object",
          properties: {
            status: { type: "string", enum: ["watching", "completed", "on_hold", "dropped", "plan_to_watch"] },
            page: { type: "integer", minimum: 1, default: 1 },
            limit: { type: "integer", minimum: 1, maximum: 100, default: 20 },
          },
        },
      },
    },
    userController.getWatchlist,
  )

  // Add anime to watchlist
  fastify.post(
    "/me/watchlist/:animeId",
    {
      preHandler: fastify.authenticate,
      schema: {
        params: {
          type: "object",
          properties: {
            animeId: { type: "string" },
          },
          required: ["animeId"],
        },
        body: {
          type: "object",
          properties: {
            status: { type: "string", enum: ["watching", "completed", "on_hold", "dropped", "plan_to_watch"], default: "plan_to_watch" },
          },
        },
      },
    },
    userController.addToWatchlist,
  )

  // Update watchlist item
  fastify.patch(
    "/me/watchlist/:animeId",
    {
      preHandler: fastify.authenticate,
      schema: {
        params: {
          type: "object",
          properties: {
            animeId: { type: "string" },
          },
          required: ["animeId"],
        },
        body: {
          type: "object",
          properties: {
            status: { type: "string", enum: ["watching", "completed", "on_hold", "dropped", "plan_to_watch"] },
            rating: { type: "number", minimum: 0, maximum: 10 },
          },
        },
      },
    },
    userController.updateWatchlistItem,
  )

  // Remove anime from watchlist
  fastify.delete(
    "/me/watchlist/:animeId",
    {
      preHandler: fastify.authenticate,
      schema: {
        params: {
          type: "object",
          properties: {
            animeId: { type: "string" },
          },
          required: ["animeId"],
        },
      },
    },
    userController.removeFromWatchlist,
  )

  // Get user reading list
  fastify.get(
    "/me/reading-list",
    {
      preHandler: fastify.authenticate,
      schema: {
        querystring: {
          type: "object",
          properties: {
            status: { type: "string", enum: ["reading", "completed", "on_hold", "dropped", "plan_to_read"] },
            page: { type: "integer", minimum: 1, default: 1 },
            limit: { type: "integer", minimum: 1, maximum: 100, default: 20 },
          },
        },
      },
    },
    userController.getReadingList,
  )

  // Get user statistics
  fastify.get(
    "/me/stats",
    {
      preHandler: fastify.authenticate,
    },
    userController.getStats,
  )

  // Get user achievements
  fastify.get(
    "/me/achievements",
    {
      preHandler: fastify.authenticate,
    },
    userController.getAchievements,
  )

  // Get user progress
  fastify.get(
    "/me/progress",
    {
      preHandler: fastify.authenticate,
    },
    userController.getProgress,
  )
}
