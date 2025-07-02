import bcrypt from "bcryptjs"

export default async function authRoutes(fastify, options) {
  // Register
  fastify.post(
    "/register",
    {
      schema: {
        body: {
          type: "object",
          required: ["email", "username", "password"],
          properties: {
            email: { type: "string", format: "email" },
            username: { type: "string", minLength: 3, maxLength: 20 },
            password: { type: "string", minLength: 6 },
          },
        },
      },
    },
    async (request, reply) => {
      const { email, username, password } = request.body

      try {
        // Check if user exists
        const existingUser = await fastify.prisma.user.findFirst({
          where: {
            OR: [{ email }, { username }],
          },
        })

        if (existingUser) {
          return reply.code(400).send({
            error: existingUser.email === email ? "Email already exists" : "Username already taken",
          })
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12)

        // Create user
        const user = await fastify.prisma.user.create({
          data: {
            email,
            username,
            password: hashedPassword,
          },
          select: {
            id: true,
            email: true,
            username: true,
            avatar: true,
            level: true,
            xp: true,
            isPremium: true,
            createdAt: true,
          },
        })

        // Generate JWT
        const token = fastify.jwt.sign({ id: user.id })

        return {
          message: "User registered successfully",
          user,
          token,
        }
      } catch (error) {
        fastify.log.error("Register error:", error)
        return reply.code(500).send({ error: "Registration failed" })
      }
    },
  )

  // Login
  fastify.post(
    "/login",
    {
      schema: {
        body: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", format: "email" },
            password: { type: "string" },
          },
        },
      },
    },
    async (request, reply) => {
      const { email, password } = request.body

      try {
        // Find user
        const user = await fastify.prisma.user.findUnique({
          where: { email },
        })

        if (!user) {
          return reply.code(401).send({ error: "Invalid credentials" })
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password)
        if (!isValidPassword) {
          return reply.code(401).send({ error: "Invalid credentials" })
        }

        // Update last active
        await fastify.prisma.user.update({
          where: { id: user.id },
          data: { lastActive: new Date() },
        })

        // Generate JWT
        const token = fastify.jwt.sign({ id: user.id })

        const { password: _, ...userWithoutPassword } = user

        return {
          message: "Login successful",
          user: userWithoutPassword,
          token,
        }
      } catch (error) {
        fastify.log.error("Login error:", error)
        return reply.code(500).send({ error: "Login failed" })
      }
    },
  )

  // Get current user
  fastify.get(
    "/me",
    {
      preHandler: fastify.authenticate,
    },
    async (request, reply) => {
      try {
        const user = await fastify.prisma.user.findUnique({
          where: { id: request.user.id },
          select: {
            id: true,
            email: true,
            username: true,
            avatar: true,
            bio: true,
            level: true,
            xp: true,
            isPremium: true,
            isAdmin: true,
            lastActive: true,
            createdAt: true,
          },
        })

        return { user }
      } catch (error) {
        fastify.log.error("Get user error:", error)
        return reply.code(500).send({ error: "Failed to get user" })
      }
    },
  )

  // Refresh token
  fastify.post(
    "/refresh",
    {
      preHandler: fastify.authenticate,
    },
    async (request, reply) => {
      try {
        const token = fastify.jwt.sign({ id: request.user.id })
        return { token }
      } catch (error) {
        fastify.log.error("Refresh token error:", error)
        return reply.code(500).send({ error: "Failed to refresh token" })
      }
    },
  )

  // Logout
  fastify.post(
    "/logout",
    {
      preHandler: fastify.authenticate,
    },
    async (request, reply) => {
      return { message: "Logged out successfully" }
    },
  )
}
