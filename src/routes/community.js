import pkg from '@clerk/fastify';
const { getAuth } = pkg;

export default async function communityRoutes(fastify, options) {
  // Get all posts
  fastify.get("/posts", async (request, reply) => {
    const { page = 1, limit = 20, tag, sort = "recent" } = request.query

    try {
      const skip = (page - 1) * limit
      const where = {}

      if (tag) {
        where.tags = { has: tag }
      }

      let orderBy = { createdAt: "desc" }
      if (sort === "hot") {
        orderBy = { likes: "desc" }
      } else if (sort === "views") {
        orderBy = { views: "desc" }
      }

      const [posts, total] = await Promise.all([
        fastify.prisma.post.findMany({
          where,
          skip,
          take: Number.parseInt(limit),
          include: {
            user: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                avatar: true,
                level: true,
              },
            },
            _count: {
              select: {
                comments: true,
                likes_: true,
              },
            },
          },
          orderBy,
        }),
        fastify.prisma.post.count({ where }),
      ])

      return {
        posts,
        pagination: {
          page: Number.parseInt(page),
          limit: Number.parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      }
    } catch (error) {
      fastify.log.error("Error fetching posts:", error)
      return reply.code(500).send({ error: "Failed to fetch posts" })
    }
  })

  // Create new post
  fastify.post("/posts", async (request, reply) => {
    const { userId } = getAuth(request)
    if (!userId) {
      return reply.code(401).send({ error: "Unauthorized" })
    }

    const { title, content, tags = [], images = [] } = request.body

    try {
      const post = await fastify.prisma.post.create({
        data: {
          title,
          content,
          tags,
          images,
          userId,
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatar: true,
              level: true,
            },
          },
          _count: {
            select: {
              comments: true,
              likes_: true,
            },
          },
        },
      })

      return post
    } catch (error) {
      fastify.log.error("Error creating post:", error)
      return reply.code(500).send({ error: "Failed to create post" })
    }
  })

  // Get single post
  fastify.get("/posts/:id", async (request, reply) => {
    const { id } = request.params

    try {
      // Increment view count
      await fastify.prisma.post.update({
        where: { id },
        data: {
          views: {
            increment: 1,
          },
        },
      })

      const post = await fastify.prisma.post.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatar: true,
              level: true,
            },
          },
          comments: {
            where: {
              parentId: null, // Top-level comments only
            },
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  firstName: true,
                  lastName: true,
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
                      firstName: true,
                      lastName: true,
                      avatar: true,
                      level: true,
                    },
                  },
                  _count: {
                    select: {
                      likes_: true,
                    },
                  },
                },
                orderBy: { createdAt: "asc" },
              },
              _count: {
                select: {
                  likes_: true,
                  replies: true,
                },
              },
            },
            orderBy: { createdAt: "asc" },
          },
          _count: {
            select: {
              comments: true,
              likes_: true,
            },
          },
        },
      })

      if (!post) {
        return reply.code(404).send({ error: "Post not found" })
      }

      return post
    } catch (error) {
      fastify.log.error("Error fetching post:", error)
      return reply.code(500).send({ error: "Failed to fetch post" })
    }
  })

  // Like/unlike post
  fastify.post("/posts/:id/like", async (request, reply) => {
    const { userId } = getAuth(request)
    if (!userId) {
      return reply.code(401).send({ error: "Unauthorized" })
    }

    const { id: postId } = request.params

    try {
      const existingLike = await fastify.prisma.like.findUnique({
        where: {
          userId_postId: {
            userId,
            postId,
          },
        },
      })

      if (existingLike) {
        // Unlike
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

        return { liked: false }
      } else {
        // Like
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

        return { liked: true }
      }
    } catch (error) {
      fastify.log.error("Error toggling like:", error)
      return reply.code(500).send({ error: "Failed to toggle like" })
    }
  })

  // Add comment to post
  fastify.post("/posts/:id/comments", async (request, reply) => {
    const { userId } = getAuth(request)
    if (!userId) {
      return reply.code(401).send({ error: "Unauthorized" })
    }

    const { id: postId } = request.params
    const { content, parentId } = request.body

    try {
      const comment = await fastify.prisma.comment.create({
        data: {
          content,
          userId,
          postId,
          parentId,
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatar: true,
              level: true,
            },
          },
          _count: {
            select: {
              likes_: true,
              replies: true,
            },
          },
        },
      })

      return comment
    } catch (error) {
      fastify.log.error("Error creating comment:", error)
      return reply.code(500).send({ error: "Failed to create comment" })
    }
  })

  // Get trending tags
  fastify.get("/tags/trending", async (request, reply) => {
    try {
      // Get most used tags from recent posts
      const recentPosts = await fastify.prisma.post.findMany({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          },
        },
        select: {
          tags: true,
        },
      })

      const tagCounts = {}
      recentPosts.forEach((post) => {
        post.tags.forEach((tag) => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1
        })
      })

      const trendingTags = Object.entries(tagCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 20)
        .map(([tag, count]) => ({ tag, count }))

      return trendingTags
    } catch (error) {
      fastify.log.error("Error fetching trending tags:", error)
      return reply.code(500).send({ error: "Failed to fetch trending tags" })
    }
  })
}
