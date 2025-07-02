export default async function communityRoutes(fastify, options) {
  // Get community posts
  fastify.get("/posts", async (request, reply) => {
    const { page = 1, limit = 20, tag, sort = "recent" } = request.query

    try {
      const where = {}

      if (tag) {
        where.tags = {
          has: tag,
        }
      }

      let orderBy = { createdAt: "desc" }

      if (sort === "popular") {
        orderBy = { likes: "desc" }
      } else if (sort === "views") {
        orderBy = { views: "desc" }
      }

      const [posts, total] = await Promise.all([
        fastify.prisma.post.findMany({
          where,
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatar: true,
                level: true,
              },
            },
            _count: {
              select: {
                comments: true,
                likes: true,
              },
            },
          },
          orderBy,
          skip: (page - 1) * limit,
          take: Number.parseInt(limit),
        }),
        fastify.prisma.post.count({ where }),
      ])

      return {
        data: posts,
        pagination: {
          page: Number.parseInt(page),
          limit: Number.parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      }
    } catch (error) {
      fastify.log.error("Get posts error:", error)
      return reply.code(500).send({ error: "Failed to fetch posts" })
    }
  })

  // Create new post (authenticated)
  fastify.post(
    "/posts",
    {
      preHandler: fastify.authenticate,
      schema: {
        body: {
          type: "object",
          required: ["title", "content"],
          properties: {
            title: { type: "string", minLength: 5, maxLength: 200 },
            content: { type: "string", minLength: 10, maxLength: 10000 },
            tags: {
              type: "array",
              items: { type: "string" },
              maxItems: 10,
            },
            images: {
              type: "array",
              items: { type: "string", format: "uri" },
              maxItems: 5,
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { title, content, tags = [], images = [] } = request.body
      const userId = request.user.id

      try {
        const post = await fastify.prisma.post.create({
          data: {
            userId,
            title,
            content,
            tags,
            images,
            views: 0,
            likes: 0,
          },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatar: true,
                level: true,
              },
            },
          },
        })

        // Add XP for creating post
        await fastify.userService.addXP(userId, 15)

        return {
          message: "Post created successfully",
          post,
        }
      } catch (error) {
        fastify.log.error("Create post error:", error)
        return reply.code(500).send({ error: "Failed to create post" })
      }
    },
  )

  // Get single post
  fastify.get("/posts/:id", async (request, reply) => {
    const { id } = request.params

    try {
      const post = await fastify.prisma.post.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatar: true,
              level: true,
            },
          },
          comments: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  avatar: true,
                  level: true,
                },
              },
              replies: {
                include: {
                  user: {
                    select: {
                      id: true,
                      username: true,
                      avatar: true,
                      level: true,
                    },
                  },
                },
              },
            },
            orderBy: { createdAt: "desc" },
          },
          _count: {
            select: {
              likes: true,
            },
          },
        },
      })

      if (!post) {
        return reply.code(404).send({ error: "Post not found" })
      }

      // Increment view count
      await fastify.prisma.post.update({
        where: { id },
        data: {
          views: {
            increment: 1,
          },
        },
      })

      return { post }
    } catch (error) {
      fastify.log.error("Get post error:", error)
      return reply.code(500).send({ error: "Failed to fetch post" })
    }
  })

  // Like/unlike post (authenticated)
  fastify.post(
    "/posts/:id/like",
    {
      preHandler: fastify.authenticate,
    },
    async (request, reply) => {
      const { id: postId } = request.params
      const userId = request.user.id

      try {
        // Check if post exists
        const post = await fastify.prisma.post.findUnique({
          where: { id: postId },
        })

        if (!post) {
          return reply.code(404).send({ error: "Post not found" })
        }

        // Check if user already liked the post
        const existingLike = await fastify.prisma.like.findFirst({
          where: {
            userId,
            postId,
          },
        })

        if (existingLike) {
          // Unlike the post
          await fastify.prisma.like.delete({
            where: { id: existingLike.id },
          })

          await fastify.prisma.post.update({
            where: { id: postId },
            data: {
              likes: {
                decrement: 1,
              },
            },
          })

          return { message: "Post unliked", liked: false }
        } else {
          // Like the post
          await fastify.prisma.like.create({
            data: {
              userId,
              postId,
            },
          })

          await fastify.prisma.post.update({
            where: { id: postId },
            data: {
              likes: {
                increment: 1,
              },
            },
          })

          // Add XP for liking
          await fastify.userService.addXP(userId, 1)

          return { message: "Post liked", liked: true }
        }
      } catch (error) {
        fastify.log.error("Like post error:", error)
        return reply.code(500).send({ error: "Failed to like/unlike post" })
      }
    },
  )

  // Add comment to post (authenticated)
  fastify.post(
    "/posts/:id/comments",
    {
      preHandler: fastify.authenticate,
      schema: {
        body: {
          type: "object",
          required: ["content"],
          properties: {
            content: { type: "string", minLength: 1, maxLength: 1000 },
            parentId: { type: "string" },
          },
        },
      },
    },
    async (request, reply) => {
      const { id: postId } = request.params
      const { content, parentId } = request.body
      const userId = request.user.id

      try {
        // Check if post exists
        const post = await fastify.prisma.post.findUnique({
          where: { id: postId },
        })

        if (!post) {
          return reply.code(404).send({ error: "Post not found" })
        }

        // If parentId is provided, check if parent comment exists
        if (parentId) {
          const parentComment = await fastify.prisma.comment.findUnique({
            where: { id: parentId },
          })

          if (!parentComment || parentComment.postId !== postId) {
            return reply.code(404).send({ error: "Parent comment not found" })
          }
        }

        const comment = await fastify.prisma.comment.create({
          data: {
            userId,
            postId,
            parentId,
            content,
          },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatar: true,
                level: true,
              },
            },
          },
        })

        // Add XP for commenting
        await fastify.userService.addXP(userId, 5)

        return {
          message: "Comment added successfully",
          comment,
        }
      } catch (error) {
        fastify.log.error("Add comment error:", error)
        return reply.code(500).send({ error: "Failed to add comment" })
      }
    },
  )

  // Get trending tags
  fastify.get("/tags/trending", async (request, reply) => {
    try {
      // Get posts from last 7 days and count tag usage
      const recentPosts = await fastify.prisma.post.findMany({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
        select: {
          tags: true,
        },
      })

      // Count tag occurrences
      const tagCounts = {}
      recentPosts.forEach((post) => {
        post.tags.forEach((tag) => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1
        })
      })

      // Sort by count and return top 20
      const trendingTags = Object.entries(tagCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 20)
        .map(([tag, count]) => ({ tag, count }))

      return { trendingTags }
    } catch (error) {
      fastify.log.error("Get trending tags error:", error)
      return reply.code(500).send({ error: "Failed to fetch trending tags" })
    }
  })
}
