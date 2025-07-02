import { userService } from "../services/userService.js"

export const userController = {
  // Get current user profile
  async getProfile(request, reply) {
    try {
      const userId = request.user.id
      const user = await userService.getUserById(userId)

      if (!user) {
        return reply.code(404).send({ error: "User not found" })
      }

      return {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
          bio: user.bio,
          level: user.level,
          xp: user.xp,
          isPremium: user.isPremium,
          createdAt: user.createdAt,
          lastActive: user.lastActive,
        },
      }
    } catch (error) {
      request.log.error("Get profile error:", error)
      return reply.code(500).send({ error: "Failed to get user profile" })
    }
  },

  // Update user profile
  async updateProfile(request, reply) {
    try {
      const userId = request.user.id
      const { username, bio, avatar } = request.body

      const updatedUser = await userService.updateUser(userId, {
        username,
        bio,
        avatar,
      })

      return {
        user: {
          id: updatedUser.id,
          username: updatedUser.username,
          email: updatedUser.email,
          avatar: updatedUser.avatar,
          bio: updatedUser.bio,
          level: updatedUser.level,
          xp: updatedUser.xp,
          isPremium: updatedUser.isPremium,
        },
      }
    } catch (error) {
      request.log.error("Update profile error:", error)
      return reply.code(500).send({ error: "Failed to update profile" })
    }
  },

  // Get user watchlist
  async getWatchlist(request, reply) {
    try {
      const userId = request.user.id
      const { status, page = 1, limit = 20 } = request.query

      const watchlist = await userService.getUserWatchlist(userId, {
        status,
        page: Number.parseInt(page),
        limit: Number.parseInt(limit),
      })

      return watchlist
    } catch (error) {
      request.log.error("Get watchlist error:", error)
      return reply.code(500).send({ error: "Failed to get watchlist" })
    }
  },

  // Get user reading list
  async getReadingList(request, reply) {
    try {
      const userId = request.user.id
      const { status, page = 1, limit = 20 } = request.query

      const readingList = await userService.getUserReadingList(userId, {
        status,
        page: Number.parseInt(page),
        limit: Number.parseInt(limit),
      })

      return readingList
    } catch (error) {
      request.log.error("Get reading list error:", error)
      return reply.code(500).send({ error: "Failed to get reading list" })
    }
  },

  // Get user statistics
  async getStats(request, reply) {
    try {
      const userId = request.user.id
      const stats = await userService.getUserStats(userId)
      return stats
    } catch (error) {
      request.log.error("Get stats error:", error)
      return reply.code(500).send({ error: "Failed to get user stats" })
    }
  },

  // Get user achievements
  async getAchievements(request, reply) {
    try {
      const userId = request.user.id
      const achievements = await userService.getUserAchievements(userId)
      return achievements
    } catch (error) {
      request.log.error("Get achievements error:", error)
      return reply.code(500).send({ error: "Failed to get achievements" })
    }
  },

  // Get user progress
  async getProgress(request, reply) {
    try {
      const userId = request.user.id
      const progress = await userService.getUserProgress(userId)
      return progress
    } catch (error) {
      request.log.error("Get progress error:", error)
      return reply.code(500).send({ error: "Failed to get progress" })
    }
  },
}
