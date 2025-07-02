import { UserModel } from "../models/userModel.js"
import bcrypt from "bcryptjs"

export const userService = {
  // Get user by ID
  async getUserById(userId) {
    return await UserModel.findById(this.prisma, userId)
  },

  // Get user by email
  async getUserByEmail(email) {
    return await UserModel.findByEmail(this.prisma, email)
  },

  // Get user by username
  async getUserByUsername(username) {
    return await UserModel.findByUsername(this.prisma, username)
  },

  // Create new user
  async createUser(userData) {
    const { email, password, username } = userData

    // Check if user already exists
    const existingUser = await this.getUserByEmail(email)
    if (existingUser) {
      throw new Error("User with this email already exists")
    }

    const existingUsername = await this.getUserByUsername(username)
    if (existingUsername) {
      throw new Error("Username already taken")
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const user = await UserModel.create(this.prisma, {
      email,
      username,
      password: hashedPassword,
    })

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user
    return userWithoutPassword
  },

  // Update user
  async updateUser(userId, updateData) {
    // If username is being updated, check if it's available
    if (updateData.username) {
      const existingUser = await this.getUserByUsername(updateData.username)
      if (existingUser && existingUser.id !== userId) {
        throw new Error("Username already taken")
      }
    }

    const updatedUser = await UserModel.update(this.prisma, userId, updateData)
    const { password: _, ...userWithoutPassword } = updatedUser
    return userWithoutPassword
  },

  // Verify user password
  async verifyPassword(user, password) {
    return await bcrypt.compare(password, user.password)
  },

  // Get user watchlist
  async getUserWatchlist(userId, options) {
    return await UserModel.getWatchlist(this.prisma, userId, options)
  },

  // Get user reading list
  async getUserReadingList(userId, options) {
    return await UserModel.getReadingList(this.prisma, userId, options)
  },

  // Get user statistics
  async getUserStats(userId) {
    return await UserModel.getStats(this.prisma, userId)
  },

  // Get user achievements
  async getUserAchievements(userId) {
    return await UserModel.getAchievements(this.prisma, userId)
  },

  // Get user progress
  async getUserProgress(userId) {
    return await UserModel.getProgress(this.prisma, userId)
  },

  // Add XP to user
  async addXP(userId, xp) {
    const user = await this.getUserById(userId)
    if (!user) throw new Error("User not found")

    const newXP = user.xp + xp
    const newLevel = Math.floor(newXP / 1000) + 1 // 1000 XP per level

    const updatedUser = await this.updateUser(userId, {
      xp: newXP,
      level: newLevel,
    })

    // Check if user leveled up
    if (newLevel > user.level) {
      // Trigger level up achievement or notification
      return { ...updatedUser, leveledUp: true, previousLevel: user.level }
    }

    return updatedUser
  },

  // Update last active timestamp
  async updateLastActive(userId) {
    return await this.updateUser(userId, {
      lastActive: new Date(),
    })
  },
}

// Inject Prisma instance
export function createUserService(prisma) {
  return {
    ...userService,
    prisma,
  }
}
